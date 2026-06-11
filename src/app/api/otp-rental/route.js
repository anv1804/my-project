import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAction, getClientIp, createAdminClient, checkSpamBan, recordSpamAction } from '@/utils/serverUtils';

const VIOTP_TOKEN = process.env.VIOTP_API_TOKEN;
const RERENT_WINDOW_MS = 30 * 60 * 1000;

// Cache giá dịch vụ server-side 5 phút — tránh bị client giả mạo price
const _priceCache = new Map();
async function getServicePrice(serviceId, country) {
  const key = `${serviceId}_${country}`;
  const cached = _priceCache.get(key);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.price;
  try {
    const res = await fetch(
      `https://api.viotp.com/service/getv2?country=${country}&token=${VIOTP_TOKEN}`,
      { next: { revalidate: 0 } }
    );
    const data = await res.json();
    if (data?.data) {
      for (const svc of data.data) {
        _priceCache.set(`${svc.id}_${country}`, { price: svc.price, ts: Date.now() });
      }
    }
  } catch {}
  return _priceCache.get(key)?.price ?? null;
}

async function checkPhoneEligibility(supabase, userId, phoneNumber) {
  const { data: rentals } = await supabase
    .from('otp_rentals')
    .select('request_id, status, created_at, completed_at, service_name')
    .eq('user_id', userId)
    .eq('phone_number', phoneNumber)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!rentals?.length) return { allowed: true };
  const last = rentals[0];

  if (last.status === 0) {
    return {
      allowed: false,
      reason: `Số ${phoneNumber} đang trong phiên thuê hiện tại. Chờ hết hạn mới thuê lại được.`,
    };
  }

  if (last.status === 1 || last.status === 2) {
    const endTime = new Date(last.completed_at || last.created_at).getTime();
    const elapsed = Date.now() - endTime;
    if (elapsed > RERENT_WINDOW_MS) {
      return {
        allowed: false,
        reason: `Số ${phoneNumber} đã quá 30 phút từ phiên trước. Không thể thuê lại.`,
      };
    }
    return { allowed: true, rerentWindow: Math.ceil((RERENT_WINDOW_MS - elapsed) / 60000) };
  }

  return { allowed: true };
}

// Hoàn coin server-side qua admin client — không qua RLS
async function refundForUser(userId, amount, refId, ip = '', ua = '') {
  try {
    const admin = createAdminClient();
    const { data } = await admin.rpc('add_coins', { p_user_id: userId, p_amount: amount });
    logAction({ userId, action: 'coin_refund', coinsAfter: data?.coins, coinsDelta: amount, refId, ip, ua });
    return data;
  } catch (err) {
    console.error('CRITICAL: refundForUser failed', { userId, amount, refId, err: err.message });
    return null;
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ success: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, message: 'Body không hợp lệ' }, { status: 400 });

  const { action } = body;

  // ─── action: check — kiểm tra trước khi deduct (UI preview) ─────────────────
  if (action === 'check') {
    const { phone_number } = body;
    if (!phone_number) return NextResponse.json({ allowed: true });
    const result = await checkPhoneEligibility(supabase, user.id, phone_number);
    return NextResponse.json(result);
  }

  // ─── action: rent — toàn bộ flow thuê số server-side ──────────────────────
  if (action === 'rent') {
    // Kiểm tra spam ban
    const banInfo = await checkSpamBan(request, user.id);
    if (banInfo.banned) {
      return NextResponse.json({ success: false, spam_ban: banInfo }, { status: 403 });
    }

    const { service_id, service_name, country = 'vn', networks, prefix, except_prefix, custom_number } = body;

    if (!service_id || !service_name) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin dịch vụ' }, { status: 400 });
    }

    // Lấy giá thực từ ViOTP — không tin client
    const actualPrice = await getServicePrice(service_id, country);
    if (actualPrice == null) {
      return NextResponse.json({ success: false, message: 'Không thể xác thực giá dịch vụ. Thử lại sau.' }, { status: 503 });
    }
    const coinCost = Math.round(actualPrice * 2);
    if (coinCost <= 0) {
      return NextResponse.json({ success: false, message: 'Giá dịch vụ không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra số chỉ định trước khi trừ coin
    if (custom_number?.trim()) {
      const eligibility = await checkPhoneEligibility(supabase, user.id, custom_number.trim());
      if (!eligibility.allowed) {
        return NextResponse.json({ success: false, blocked: true, message: eligibility.reason }, { status: 409 });
      }
    }

    // Trừ coin
    const { data: profile } = await supabase.from('users').select('coins').eq('id', user.id).single();
    const coinsBefore = profile?.coins ?? 0;

    const { data: deductData, error: deductError } = await supabase.rpc('deduct_coins', {
      p_user_id: user.id,
      p_amount: coinCost,
    });

    if (deductError || !deductData?.success) {
      logAction({ userId: user.id, action: 'coin_deduct', status: 'failed', coinsBefore, coinsDelta: -coinCost, metadata: { error: deductData?.message || deductError?.message, service_id }, ip, ua });
      return NextResponse.json({
        success: false,
        message: deductData?.message || deductError?.message || 'Không đủ coin',
      }, { status: 400 });
    }

    // Gọi ViOTP API
    let otpData;
    try {
      let path = `request/getv2?serviceId=${service_id}&country=${country}`;
      if (networks?.length) path += `&network=${encodeURIComponent(networks.join('|'))}`;
      if (prefix?.trim()) path += `&prefix=${encodeURIComponent(prefix.trim())}`;
      if (except_prefix?.trim()) path += `&exceptPrefix=${encodeURIComponent(except_prefix.trim())}`;
      if (custom_number?.trim()) path += `&number=${encodeURIComponent(custom_number.trim())}`;

      const otpRes = await fetch(`https://api.viotp.com/${path}&token=${VIOTP_TOKEN}`);
      if (!otpRes.ok) throw new Error(`ViOTP HTTP ${otpRes.status}`);
      otpData = await otpRes.json();
    } catch (err) {
      await refundForUser(user.id, coinCost, `otp_error_${service_id}`, ip, ua);
      return NextResponse.json({ success: false, message: 'Lỗi kết nối ViOTP. Coin đã hoàn.' }, { status: 500 });
    }

    if (!(otpData.status_code === 200 && otpData.success)) {
      await refundForUser(user.id, coinCost, `otp_fail_${service_id}`, ip, ua);
      let msg = otpData.message || 'Không thể thuê số. Coin đã hoàn.';
      if (otpData.status_code === -2) msg = 'Hệ thống OTP không đủ số dư. Coin đã hoàn.';
      if (otpData.status_code === -3) msg = 'Kho số dịch vụ này đang tạm hết. Coin đã hoàn.';
      if (otpData.status_code === -4) msg = 'Ứng dụng này không tồn tại hoặc tạm dừng. Coin đã hoàn.';
      if (otpData.status_code === 429) msg = 'Vượt quá giới hạn chờ OTP. Coin đã hoàn.';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    const item = otpData.data;

    // Kiểm tra số thực tế trả về (có thể khác custom_number)
    const eligibility = await checkPhoneEligibility(supabase, user.id, item.phone_number);
    if (!eligibility.allowed) {
      await refundForUser(user.id, coinCost, `otp_blocked_${item.request_id}`, ip, ua);
      return NextResponse.json({ success: false, blocked: true, message: eligibility.reason }, { status: 409 });
    }

    // Lưu vào DB
    const { error: insertError } = await supabase.from('otp_rentals').insert({
      user_id: user.id,
      request_id: String(item.request_id),
      phone_number: item.phone_number,
      service_id: String(service_id),
      service_name,
      country,
      coin_cost: coinCost,
      status: 0,
      ip,
    });
    if (insertError) console.error('otp_rentals insert error:', insertError);

    logAction({
      userId: user.id, action: 'otp_rent', coinsBefore, coinsAfter: deductData.coins, coinsDelta: -coinCost,
      refId: String(item.request_id),
      metadata: { phone_number: item.phone_number, service_name, service_id, country },
      ip, ua,
    });

    const rentResponse = NextResponse.json({
      success: true,
      data: item,
      coinCost,
      coinsNow: deductData.coins,
      rerentWindow: eligibility.rerentWindow,
    });

    // Ghi nhận để chống spam thuê số
    recordSpamAction(request, user.id, 'otp_rent').catch(() => {});

    return rentResponse;
  }

  // ─── action: update — cập nhật trạng thái + hoàn coin nếu hết hạn ────────
  if (action === 'update') {
    const { request_id, status, code, sms_content } = body;

    const { data: rental } = await supabase
      .from('otp_rentals')
      .select('id, coin_cost, refunded, service_name, phone_number')
      .eq('request_id', String(request_id))
      .eq('user_id', user.id)
      .single();

    if (!rental) return NextResponse.json({ success: false, message: 'Không tìm thấy rental' }, { status: 404 });

    const shouldRefund = status === 2 && !code && !rental.refunded && (rental.coin_cost ?? 0) > 0;

    const updateFields = {
      status,
      ...(code && { code }),
      ...(sms_content && { sms_content }),
      ...(status !== 0 && { completed_at: new Date().toISOString() }),
    };

    let coinRefunded = 0;
    let coinsNow = null;

    if (shouldRefund) {
      // Atomic: chỉ update nếu refunded = false — tránh double-refund
      const { data: claimed } = await supabase
        .from('otp_rentals')
        .update({ ...updateFields, refunded: true })
        .eq('request_id', String(request_id))
        .eq('user_id', user.id)
        .eq('refunded', false)
        .select('id')
        .maybeSingle();

      if (claimed) {
        const refundData = await refundForUser(user.id, rental.coin_cost, String(request_id), ip, ua);
        if (refundData?.success) {
          coinRefunded = rental.coin_cost;
          coinsNow = refundData.coins;
        } else {
          // Hoàn coin thất bại — revert refunded flag để có thể retry
          await supabase.from('otp_rentals').update({ refunded: false })
            .eq('request_id', String(request_id)).eq('user_id', user.id);
          console.error('CRITICAL: refund coin failed, reverting', { request_id, user_id: user.id });
        }
      }
    } else {
      await supabase
        .from('otp_rentals')
        .update(updateFields)
        .eq('request_id', String(request_id))
        .eq('user_id', user.id);
    }

    const actionName = status === 1 ? 'otp_received' : status === 2 ? 'otp_expired' : 'otp_update';
    logAction({
      userId: user.id, action: actionName,
      refId: String(request_id),
      metadata: { phone_number: rental.phone_number, service_name: rental.service_name, code: code || null, refunded: coinRefunded > 0 },
      ip, ua,
    });

    return NextResponse.json({ success: true, coinRefunded, coinsNow });
  }

  return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
}
