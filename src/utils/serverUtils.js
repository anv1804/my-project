// ─── Admin client (service_role — bypasses RLS) ──────────────────────────────

let _adminClient = null;
export function createAdminClient() {
  if (!_adminClient) {
    const { createClient } = require('@supabase/supabase-js');
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return _adminClient;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/**
 * Lấy IP thực của request (hỗ trợ proxy/Vercel)
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Ghi log hành động người dùng vào bảng user_action_logs
 * actions: 'coin_deduct' | 'coin_refund' | 'coin_topup' | 'otp_rent' | 'otp_received' | 'otp_expired'
 */
export async function logAction({
  userId, action, status = 'success',
  coinsBefore, coinsAfter, coinsDelta,
  refId, metadata, ip, ua,
}) {
  try {
    const admin = createAdminClient();
    await admin.from('user_action_logs').insert({
      user_id:      userId || null,
      action,
      status,
      coins_before: coinsBefore ?? null,
      coins_after:  coinsAfter ?? null,
      coins_delta:  coinsDelta ?? null,
      ref_id:       refId || null,
      metadata:     metadata || null,
      ip:           ip || null,
      ua:           ua ? ua.slice(0, 300) : null,
    });
  } catch (err) {
    console.error('[logAction] failed:', err.message);
  }
}

// ─── Rate limit & Cache ───────────────────────────────────────────────────────

// Lõi In-memory xử lý Caching và Rate Limit
// Lưu ý: Trong môi trường Production (như Vercel Serverless), memory này sẽ bị reset khi server sleep.
// Giải pháp thực tế dài hạn là dùng Upstash Redis.

const requestLog = new Map();
const apiCache = new Map();

/**
 * Hàm kiểm tra Rate Limit chống Spam
 * @param {string} ip Địa chỉ IP người dùng
 * @param {number} limit Số lượng request tối đa (VD: 5)
 * @param {number} windowMs Cửa sổ thời gian tính bằng mili-giây (VD: 60000 = 1 phút)
 * @returns {boolean} true nếu hợp lệ, false nếu bị block
 */
export function checkRateLimit(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const userRecord = requestLog.get(ip) || { count: 0, startTime: now };

  if (now - userRecord.startTime > windowMs) {
    // Nếu đã qua cửa sổ thời gian, reset đếm
    userRecord.count = 1;
    userRecord.startTime = now;
    requestLog.set(ip, userRecord);
    return true;
  }

  if (userRecord.count >= limit) {
    // Nếu vượt quá số lần cho phép
    return false;
  }

  // Nếu hợp lệ
  userRecord.count += 1;
  requestLog.set(ip, userRecord);
  return true;
}

/**
 * Đọc dữ liệu từ Cache
 * @param {string} key Từ khóa (VD: url video TikTok)
 */
export function getCache(key) {
  const cached = apiCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    apiCache.delete(key);
    return null; // Cache hết hạn
  }
  
  return cached.data;
}

/**
 * Ghi dữ liệu vào Cache
 * @param {string} key Từ khóa
 * @param {any} data Dữ liệu cần lưu
 * @param {number} ttlMs Thời gian sống (Time to live) bằng mili-giây
 */
export function setCache(key, data, ttlMs = 300000) { // Mặc định 5 phút
  apiCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
}

// ─── Anti-Spam System ─────────────────────────────────────────────────────────

/**
 * Ngưỡng spam theo từng action type.
 * limit: số lần tối đa trong windowMs, banMs: thời gian bị khoá.
 */
const SPAM_RULES = {
  smm_order:   { limit: 10, windowMs: 60_000,  banMs: 15 * 60_000 },
  otp_rent:    { limit: 5,  windowMs: 60_000,  banMs: 30 * 60_000 },
  download:    { limit: 20, windowMs: 60_000,  banMs: 10 * 60_000 },
  tts:         { limit: 15, windowMs: 60_000,  banMs: 10 * 60_000 },
  forum_post:  { limit: 5,  windowMs: 120_000, banMs: 20 * 60_000 },
  payment:     { limit: 8,  windowMs: 60_000,  banMs: 30 * 60_000 },
  any:         { limit: 50, windowMs: 60_000,  banMs: 60 * 60_000 },
};

// In-memory action counter: key → [timestamp, ...]
const _actionLog = new Map();

function _recordLocal(key, action) {
  const now = Date.now();
  const mapKey = `${key}:${action}`;
  const times = (_actionLog.get(mapKey) || []).filter(t => now - t < 3_600_000); // giữ tối đa 1h
  times.push(now);
  _actionLog.set(mapKey, times);

  const anyKey = `${key}:any`;
  const anyTimes = (_actionLog.get(anyKey) || []).filter(t => now - t < 3_600_000);
  anyTimes.push(now);
  _actionLog.set(anyKey, anyTimes);

  return { times, anyTimes };
}

function _countInWindow(times, windowMs) {
  const now = Date.now();
  return times.filter(t => now - t <= windowMs).length;
}

/**
 * Kiểm tra xem user/IP/fingerprint hiện tại có đang bị ban không.
 * @returns {{ banned: boolean, bannedUntil?: Date, reason?: string }}
 */
export async function checkSpamBan(request, userId = null) {
  try {
    const admin = createAdminClient();
    const ip = getClientIp(request);
    const fingerprint = request.headers.get('x-device-fp') || null;
    const now = new Date().toISOString();

    // Xây conditions để OR check
    let query = admin
      .from('spam_bans')
      .select('banned_until, reason')
      .gt('banned_until', now);

    if (userId) {
      query = query.or(`user_id.eq.${userId},ip.eq.${ip}${fingerprint ? `,fingerprint.eq.${fingerprint}` : ''}`);
    } else {
      query = query.or(`ip.eq.${ip}${fingerprint ? `,fingerprint.eq.${fingerprint}` : ''}`);
    }

    const { data } = await query.limit(1).single();

    if (data) {
      return {
        banned: true,
        bannedUntil: data.banned_until,
        reason: data.reason || 'Hành vi đáng ngờ',
      };
    }
  } catch {
    // Nếu lỗi DB (vd bảng chưa tạo) → không block người dùng
  }
  return { banned: false };
}

/**
 * Phát ban: ghi vào bảng spam_bans.
 */
export async function issueBan(userId, ip, fingerprint, ua, banMs, reason) {
  try {
    const admin = createAdminClient();
    const bannedUntil = new Date(Date.now() + banMs).toISOString();
    await admin.from('spam_bans').insert({
      user_id: userId || null,
      ip: ip || null,
      fingerprint: fingerprint || null,
      browser_ua: ua ? ua.slice(0, 300) : null,
      banned_until: bannedUntil,
      reason,
    });
    console.warn(`[AntiSpam] BAN issued → user:${userId} ip:${ip} fp:${fingerprint} until:${bannedUntil} reason:${reason}`);
    return bannedUntil;
  } catch (err) {
    console.error('[AntiSpam] issueBan error:', err.message);
    return null;
  }
}

/**
 * Ghi nhận hành động và tự động ban nếu vượt ngưỡng.
 * Gọi cuối mỗi API handler sau khi xử lý thành công.
 *
 * @param {Request} request
 * @param {string|null} userId
 * @param {string} action - 'smm_order' | 'otp_rent' | 'download' | 'tts' | 'forum_post' | 'payment'
 * @returns {{ banned: boolean, bannedUntil?: string }} — nếu vừa bị ban
 */
export async function recordSpamAction(request, userId, action) {
  try {
    const ip = getClientIp(request);
    const fingerprint = request.headers.get('x-device-fp') || null;
    const ua = request.headers.get('user-agent') || '';

    // Dùng nhiều keys để check tất cả chiều
    const keys = [
      userId ? `user:${userId}` : null,
      `ip:${ip}`,
      fingerprint ? `fp:${fingerprint}` : null,
    ].filter(Boolean);

    const ruleAction = SPAM_RULES[action] || null;
    const ruleAny   = SPAM_RULES['any'];

    for (const key of keys) {
      const { times, anyTimes } = _recordLocal(key, action);

      // Kiểm tra ngưỡng cho action cụ thể
      if (ruleAction && _countInWindow(times, ruleAction.windowMs) >= ruleAction.limit) {
        const reason = `Spam ${action}: vượt ${ruleAction.limit} lần/${ruleAction.windowMs / 1000}s`;
        const bannedUntil = await issueBan(userId, ip, fingerprint, ua, ruleAction.banMs, reason);
        return { banned: true, bannedUntil, reason };
      }

      // Kiểm tra ngưỡng tổng (any)
      if (_countInWindow(anyTimes, ruleAny.windowMs) >= ruleAny.limit) {
        const reason = `Spam tổng: vượt ${ruleAny.limit} request/${ruleAny.windowMs / 1000}s`;
        const bannedUntil = await issueBan(userId, ip, fingerprint, ua, ruleAny.banMs, reason);
        return { banned: true, bannedUntil, reason };
      }
    }
  } catch (err) {
    console.error('[AntiSpam] recordSpamAction error:', err.message);
  }
  return { banned: false };
}
