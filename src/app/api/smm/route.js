import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAction, getClientIp, createAdminClient, checkSpamBan, recordSpamAction } from '@/utils/serverUtils';

const SMM_API_KEY = process.env.SMM_API_KEY || 'abdfcbbcce545ccd4d8fa1211ac62ca6';
const SMM_API_URL = 'https://trumlike.vip/api/v2';
const PROFIT_MULTIPLIER = 4.0; // Multiplier to calculate cost in coins (e.g. rate * 4.0)

// In-memory cache for SMM services list
let _servicesCache = null;
let _servicesCacheTime = 0;

async function fetchSmmServices() {
  if (_servicesCache && Date.now() - _servicesCacheTime < 5 * 60 * 1000) {
    return _servicesCache;
  }

  try {
    const params = new URLSearchParams();
    params.append('key', SMM_API_KEY);
    params.append('action', 'services');

    const res = await fetch(SMM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) throw new Error(`SMM API HTTP ${res.status}`);
    const data = await res.json();
    
    if (Array.isArray(data)) {
      _servicesCache = data;
      _servicesCacheTime = Date.now();
      return data;
    }
  } catch (err) {
    console.error('Error fetching SMM services:', err);
  }
  return _servicesCache || [];
}

export async function GET(request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'balance') {
    try {
      const params = new URLSearchParams();
      params.append('key', SMM_API_KEY);
      params.append('action', 'balance');

      const res = await fetch(SMM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) throw new Error(`SMM API HTTP ${res.status}`);
      const data = await res.json();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Không thể kiểm tra số dư SMM' }, { status: 500 });
    }
  }

  if (action === 'services') {
    const services = await fetchSmmServices();
    return NextResponse.json({ success: true, data: services });
  }

  return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const ip = getClientIp(request);
    const ua = request.headers.get('user-agent') || '';

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, message: 'Body không hợp lệ' }, { status: 400 });

    const { action } = body;

  // ─── action: add — Tạo đơn hàng SMM mới ──────────────────────────────────────
  if (action === 'add') {
    // Kiểm tra spam ban trước khi xử lý
    const banInfo = await checkSpamBan(request, user.id);
    if (banInfo.banned) {
      return NextResponse.json({ success: false, spam_ban: banInfo }, { status: 403 });
    }

    const { service_id, link, quantity, duration } = body;

    if (!service_id || !link || !quantity) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin đơn hàng (service_id, link, quantity)' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, message: 'Số lượng không hợp lệ' }, { status: 400 });
    }

    // Lấy thông tin dịch vụ từ cache/API để xác thực và lấy giá
    const services = await fetchSmmServices();
    const service = services.find(s => String(s.service) === String(service_id));

    if (!service) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy dịch vụ SMM này' }, { status: 400 });
    }

    // Helper to get minimum quantity
    const getMinQuantity = (svc) => {
      const apiMin = parseInt(svc.min, 10) || 1;
      if (apiMin < 30) return 30;
      return apiMin;
    };

    const minQty = getMinQuantity(service);
    if (qty < minQty || qty > service.max) {
      return NextResponse.json({
        success: false,
        message: `Số lượng phải từ ${minQty} đến ${service.max}`
      }, { status: 400 });
    }

    // Helper to get fixed duration from service name
    const getFixedDuration = (name) => {
      const lowercaseName = (name || "").toLowerCase();
      const match = lowercaseName.match(/\[?(\d+)\s*phút\]?/);
      return match ? parseInt(match[1], 10) : null;
    };

    const isLivestream = (service.category || "").toLowerCase().includes("livestream") || 
                         (service.category || "").toLowerCase().includes("mắt live") || 
                         (service.name || "").toLowerCase().includes("livestream") || 
                         (service.name || "").toLowerCase().includes("mắt live");

    const fixedDuration = getFixedDuration(service.name);

    // API rates are in USD, convert to VND/Coin (1 USD = 25000 VND, 1 coin = 1 VND)
    const USD_TO_VND = 25000;
    const rateInVnd = parseFloat(service.rate) * USD_TO_VND;

    // Tính chi phí bằng Coin (rate là tiền cho 1000 items, nhân hệ số profit)
    let coinCost;
    if (isLivestream) {
      if (fixedDuration !== null) {
        // Fixed duration service: rate covers the entire duration
        coinCost = Math.ceil((qty / 1000) * rateInVnd * PROFIT_MULTIPLIER);
      } else {
        // Custom duration service: rate is per minute
        const minutes = parseInt(duration, 10) || 30;
        coinCost = Math.ceil(((qty * minutes) / 1000) * rateInVnd * PROFIT_MULTIPLIER);
      }
    } else {
      // Normal SMM service
      coinCost = Math.ceil((qty / 1000) * rateInVnd * PROFIT_MULTIPLIER);
    }

    if (coinCost <= 0) {
      return NextResponse.json({ success: false, message: 'Giá dịch vụ không hợp lệ' }, { status: 400 });
    }

    // Đọc số dư của người dùng trước
    const { data: profile } = await supabase.from('users').select('coins').eq('id', user.id).single();
    const coinsBefore = profile?.coins ?? 0;

    if (coinsBefore < coinCost) {
      return NextResponse.json({
        success: false,
        message: `Không đủ coin! Giao dịch cần ${new Intl.NumberFormat('vi-VN').format(coinCost)} coin.`
      }, { status: 400 });
    }

    // Trừ coin người dùng
    const { data: deductData, error: deductError } = await supabase.rpc('deduct_coins', {
      p_user_id: user.id,
      p_amount: coinCost,
    });

    if (deductError || !deductData?.success) {
      return NextResponse.json({
        success: false,
        message: deductData?.message || deductError?.message || 'Lỗi trừ coin thất bại'
      }, { status: 400 });
    }

    // Gọi Trùm Like API tạo đơn hàng
    let smmOrderResult;
    try {
      const params = new URLSearchParams();
      params.append('key', SMM_API_KEY);
      params.append('action', 'add');
      params.append('service', String(service_id));
      params.append('link', link);
      params.append('quantity', String(qty));
      if (isLivestream && fixedDuration === null) {
        params.append('duration', String(parseInt(duration, 10) || 30));
      }

      const res = await fetch(SMM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) throw new Error(`SMM API HTTP ${res.status}`);
      smmOrderResult = await res.json();
    } catch (err) {
      // Hoàn coin cho người dùng nếu API lỗi
      const admin = createAdminClient();
      await admin.rpc('add_coins', { p_user_id: user.id, p_amount: coinCost });
      
      logAction({
        userId: user.id,
        action: 'smm_order_error',
        status: 'failed',
        coinsBefore,
        coinsDelta: 0,
        metadata: { error: err.message, service_id, link, quantity: qty },
        ip, ua
      });

      return NextResponse.json({ success: false, message: 'Lỗi kết nối đối tác SMM. Đã hoàn coin.' }, { status: 500 });
    }

    // Kiểm tra kết quả đơn hàng từ Trùm Like
    if (!smmOrderResult || smmOrderResult.error || !smmOrderResult.order) {
      // Hoàn coin cho người dùng
      const admin = createAdminClient();
      await admin.rpc('add_coins', { p_user_id: user.id, p_amount: coinCost });

      logAction({
        userId: user.id,
        action: 'smm_order_failed',
        status: 'failed',
        coinsBefore,
        coinsDelta: 0,
        metadata: { error: smmOrderResult?.error || 'Unknown API error', service_id, link, quantity: qty },
        ip, ua
      });

      return NextResponse.json({
        success: false,
        message: smmOrderResult?.error || 'Đại lý từ chối tạo đơn. Đã hoàn coin.'
      }, { status: 400 });
    }

    // Lưu vào DB bằng admin client (vượt qua RLS trong trường hợp bảng mới tạo chưa phân quyền hoàn toàn)
    const admin = createAdminClient();
    const { error: insertError } = await admin.from('smm_orders').insert({
      user_id: user.id,
      order_id: smmOrderResult.order,
      service_id: parseInt(service_id, 10),
      service_name: service.name,
      platform: service.platform || null,
      category: service.category || null,
      link,
      quantity: qty,
      coin_cost: coinCost,
      charge: String((qty / 1000) * parseFloat(service.rate)), // giá gốc đại lý lấy từ tài khoản
      status: 'Pending',
    });

    if (insertError) {
      console.error('Lỗi lưu đơn hàng SMM vào database:', insertError.message);
    }

    // Ghi nhận log
    logAction({
      userId: user.id,
      action: 'smm_order_success',
      coinsBefore,
      coinsAfter: deductData.coins,
      coinsDelta: -coinCost,
      refId: String(smmOrderResult.order),
      metadata: { service_name: service.name, service_id, link, quantity: qty },
      ip, ua
    });

    return NextResponse.json({
      success: true,
      order_id: smmOrderResult.order,
      coinsNow: deductData.coins,
      message: 'Đặt đơn hàng thành công!'
    });

    // Ghi nhận hành động để đếm spam (sau khi trả response)
    recordSpamAction(request, user.id, 'smm_order').catch(() => {});
  }

  // ─── action: status — Lấy chi tiết trạng thái đơn từ Trùm Like ──────────────
  if (action === 'status') {
    const { order_id } = body;
    if (!order_id) return NextResponse.json({ success: false, message: 'Thiếu order_id' }, { status: 400 });

    try {
      const params = new URLSearchParams();
      params.append('key', SMM_API_KEY);
      params.append('action', 'status');
      params.append('order', String(order_id));

      const res = await fetch(SMM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) throw new Error(`SMM API HTTP ${res.status}`);
      const data = await res.json();

      if (data && !data.error) {
        // Cập nhật trạng thái mới nhất vào DB
        const admin = createAdminClient();
        await admin.from('smm_orders').update({
          status: data.status,
          start_count: parseInt(data.start_count, 10) || 0,
          remains: parseInt(data.remains, 10) || 0,
          ...(data.status === 'Completed' && { completed_at: new Date().toISOString() })
        }).eq('order_id', order_id);
      }

      return NextResponse.json({ success: true, data });
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Lỗi truy xuất trạng thái đơn' }, { status: 500 });
    }
  }

  // ─── action: history — Lấy danh sách đơn hàng đã mua của User ────────────────
  if (action === 'history') {
    try {
      const { data, error } = await supabase
        .from('smm_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } catch (err) {
      // Fallback dùng admin client nếu RLS chưa sync xong
      try {
        const admin = createAdminClient();
        const { data, error } = await admin
          .from('smm_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      } catch (dbErr) {
        return NextResponse.json({ success: false, message: 'Lỗi tải lịch sử đơn hàng', error: dbErr.message }, { status: 500 });
      }
    }
  }

    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  } catch (err) {
    console.error("POST /api/smm crash:", err);
    return NextResponse.json({ success: false, message: 'Lỗi hệ thống: ' + err.message }, { status: 500 });
  }
}
