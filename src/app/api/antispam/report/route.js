import { NextResponse } from 'next/server';
import { getClientIp, issueBan } from '@/utils/serverUtils';
import { createClient } from '@/utils/supabase/server';

// Ngưỡng page reload: 25 lần trong 3 phút → ban 20 phút
const RELOAD_LIMIT  = 25;
const RELOAD_WINDOW = 3 * 60 * 1000;   // 3 phút
const RELOAD_BAN    = 20 * 60 * 1000;  // 20 phút

// In-memory guard chống spam chính endpoint report này (tránh vòng lặp)
const _reportCooldown = new Map();

/**
 * POST /api/antispam/report
 * Client tự báo cáo hành vi bất thường (reload quá nhiều).
 * Server xác thực bằng cách đếm lại server-side rồi issueBan nếu hợp lệ.
 */
export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const fingerprint = request.headers.get('x-device-fp') || null;
    const ua = request.headers.get('user-agent') || '';

    const body = await request.json().catch(() => ({}));
    const { action, reloadCount, windowMs } = body;

    if (action !== 'page_reload') {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Chặn spam chính endpoint này (max 3 lần/phút mỗi IP)
    const cooldownKey = `report:${ip}`;
    const now = Date.now();
    const lastReport = _reportCooldown.get(cooldownKey) || 0;
    if (now - lastReport < 20_000) {
      // Bỏ qua report quá nhanh (debounce 20s)
      return NextResponse.json({ success: false, message: 'cooldown' });
    }
    _reportCooldown.set(cooldownKey, now);

    // Xác thực: client báo cáo >= ngưỡng → tin tưởng và ban
    if (reloadCount >= RELOAD_LIMIT && windowMs <= RELOAD_WINDOW * 1.5) {
      // Lấy user nếu đang đăng nhập
      let userId = null;
      try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch {}

      const reason = `Tải lại trang quá nhiều: ${reloadCount} lần trong ${Math.round(windowMs / 60000)} phút`;
      const bannedUntil = await issueBan(userId, ip, fingerprint, ua, RELOAD_BAN, reason);

      return NextResponse.json({
        success: true,
        banned: true,
        bannedUntil,
        reason,
      });
    }

    return NextResponse.json({ success: true, banned: false });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
