import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET;

// SePay sends: POST with Authorization: Apikey <secret>
// Body: { id, gateway, transactionDate, accountNumber, subAccount, content,
//         transferType, transferAmount, referenceCode, accumulated, ... }

export async function POST(request) {
  // Verify webhook authenticity
  const authHeader = request.headers.get('Authorization');
  if (!WEBHOOK_SECRET || authHeader !== `Apikey ${WEBHOOK_SECRET}`) {
    console.warn('Webhook: unauthorized request');
    return NextResponse.json({ success: false }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  // Only process incoming transfers
  if (body.transferType !== 'in') {
    return NextResponse.json({ success: true, message: 'Ignored: outgoing transfer' });
  }

  const content = (body.content || '').toUpperCase();
  const transferAmount = parseInt(body.transferAmount || 0);

  if (!transferAmount || transferAmount < 10000) {
    return NextResponse.json({ success: true, message: 'Ignored: amount too small' });
  }

  // Extract COIN reference from transfer content (e.g. "COINABCD1234")
  const match = content.match(/COIN[A-Z0-9]{8}/);
  if (!match) {
    console.log('Webhook: no COIN reference in content:', content);
    return NextResponse.json({ success: true, message: 'No matching reference found' });
  }

  const reference = match[0];
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('complete_coin_transaction', {
    p_reference: reference,
    p_transfer_amount: transferAmount,
  });

  if (error) {
    console.error('Webhook RPC error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  console.log('Webhook: completed transaction', reference, data);
  return NextResponse.json({ success: true, data });
}
