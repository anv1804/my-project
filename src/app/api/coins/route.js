import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Body không hợp lệ' }, { status: 400 });
  }

  const { action, amount } = body;

  if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ success: false, message: 'Số coin không hợp lệ' }, { status: 400 });
  }

  if (action === 'deduct') {
    const { data, error } = await supabase.rpc('deduct_coins', {
      p_user_id: user.id,
      p_amount: amount,
    });
    if (error) {
      console.error('deduct_coins rpc error:', error);
      return NextResponse.json({ success: false, message: 'Lỗi hệ thống' }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  if (action === 'refund') {
    const { data, error } = await supabase.rpc('add_coins', {
      p_user_id: user.id,
      p_amount: amount,
    });
    if (error) {
      console.error('add_coins rpc error:', error);
      return NextResponse.json({ success: false, message: 'Lỗi hoàn coin' }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
}
