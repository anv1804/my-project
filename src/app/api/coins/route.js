import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAction, getClientIp, checkRateLimit } from '@/utils/serverUtils';

export async function POST(request) {
  const ip = getClientIp(request);

  // Rate limit: tối đa 20 deduct/phút mỗi IP
  if (!checkRateLimit(`coins_${ip}`, 20, 60000)) {
    return NextResponse.json({ success: false, message: 'Quá nhiều yêu cầu, vui lòng chờ.' }, { status: 429 });
  }

  const supabase = await createClient();
  const ua = request.headers.get('user-agent') || '';

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Body không hợp lệ' }, { status: 400 });
  }

  const { action, amount, ref_id } = body;

  // Chỉ cho phép action 'deduct' — refund được xử lý server-side trong /api/otp-rental
  if (action !== 'deduct') {
    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  }

  if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ success: false, message: 'Số coin không hợp lệ' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('coins')
    .eq('id', user.id)
    .single();
  const coinsBefore = profile?.coins ?? 0;

  const { data, error } = await supabase.rpc('deduct_coins', {
    p_user_id: user.id,
    p_amount: amount,
  });
  if (error) {
    console.error('deduct_coins rpc error:', error);
    logAction({ userId: user.id, action: 'coin_deduct', status: 'failed', coinsBefore, coinsDelta: -amount, refId: ref_id, metadata: { error: error.message }, ip, ua });
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }
  logAction({ userId: user.id, action: 'coin_deduct', coinsBefore, coinsAfter: data?.coins, coinsDelta: -amount, refId: ref_id, ip, ua });
  return NextResponse.json(data);
}
