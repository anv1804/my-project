import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BANK_ID = process.env.BANK_ID;
const BANK_ACCOUNT_NO = process.env.BANK_ACCOUNT_NO;
const BANK_VA_NO = process.env.BANK_VA_NO;
const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME;
const BANK_NAME = process.env.BANK_NAME || BANK_ID;

function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(8);
  globalThis.crypto.getRandomValues(array);
  let ref = 'COIN';
  for (const byte of array) {
    ref += chars[byte % chars.length];
  }
  return ref;
}

export async function POST(request) {
  try {
    if (!BANK_ID || !BANK_ACCOUNT_NO || !BANK_ACCOUNT_NAME) {
      return NextResponse.json(
        { success: false, message: 'Hệ thống thanh toán chưa được cấu hình (thiếu env BANK_*)' },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const user = authData.user;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Request body không hợp lệ' }, { status: 400 });
    }

    const amount = parseInt(body?.amount);
    if (!amount || isNaN(amount) || amount < 10000 || amount > 50000000) {
      return NextResponse.json(
        { success: false, message: 'Số tiền không hợp lệ (10.000 – 50.000.000 VND)' },
        { status: 400 }
      );
    }

    // Ensure user profile exists in public.users (handles cases where trigger didn't fire)
    await supabase.rpc('ensure_user_profile');

    // Cancel previous pending orders for clean UX
    const { error: cancelError } = await supabase
      .from('coin_transactions')
      .update({ status: 'expired' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (cancelError) {
      const isTableMissing = cancelError.code === '42P01';
      console.error('[payment/create] cancelError:', cancelError.code, cancelError.message);
      return NextResponse.json(
        {
          success: false,
          message: isTableMissing
            ? 'Bảng coin_transactions chưa tồn tại. Hãy chạy SQL migration trong Supabase Dashboard.'
            : `Lỗi database: ${cancelError.message}`,
        },
        { status: 500 }
      );
    }

    const reference = generateReference();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount,
      reference,
      status: 'pending',
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('[payment/create] insertError:', insertError.code, insertError.message);
      return NextResponse.json(
        { success: false, message: `Không thể tạo giao dịch: ${insertError.message}` },
        { status: 500 }
      );
    }

    const qrAcc = BANK_VA_NO || BANK_ACCOUNT_NO;
    const qrUrl =
      `https://qr.sepay.vn/img?acc=${qrAcc}&bank=${BANK_ID}` +
      `&amount=${amount}&des=${encodeURIComponent(reference)}`;

    return NextResponse.json({
      success: true,
      order: {
        reference,
        qrUrl,
        amount,
        bankId: BANK_ID,
        bankName: BANK_NAME,
        accountNo: BANK_ACCOUNT_NO,
        accountName: BANK_ACCOUNT_NAME,
        expiresAt,
      },
    });
  } catch (err) {
    console.error('[payment/create] unexpected error:', err);
    return NextResponse.json(
      { success: false, message: `Lỗi server: ${err.message}` },
      { status: 500 }
    );
  }
}
