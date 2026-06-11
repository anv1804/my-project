import { NextResponse } from 'next/server';
import { createAdminClient, logAction, getClientIp } from '@/utils/serverUtils';

const WEBHOOK_SECRET  = process.env.SEPAY_WEBHOOK_SECRET;
const BANK_ACCOUNT_NO = process.env.BANK_ACCOUNT_NO;
const BANK_VA_NO      = process.env.BANK_VA_NO;

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

  // Only process transfers to our configured bank account or VA
  const allowedAccounts = [BANK_ACCOUNT_NO, BANK_VA_NO].filter(Boolean);
  if (allowedAccounts.length > 0 && body.accountNumber && !allowedAccounts.includes(body.accountNumber)) {
    console.warn('Webhook: wrong account number', body.accountNumber);
    return NextResponse.json({ success: true, message: 'Ignored: wrong account' });
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
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('complete_coin_transaction', {
    p_reference: reference,
    p_transfer_amount: transferAmount,
  });

  if (error) {
    console.error('Webhook RPC error:', error);
    logAction({
      action: 'coin_topup', status: 'failed',
      refId: reference,
      metadata: { transferAmount, content: body.content, error: error.message, gateway: body.gateway },
      ip: getClientIp(request),
    });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  if (data?.success && data?.user_id) {
    logAction({
      userId: data.user_id, action: 'coin_topup',
      coinsAfter: data.coins,
      coinsDelta: data.coins_added || transferAmount,
      refId: reference,
      metadata: { transferAmount, bank_account: body.accountNumber, gateway: body.gateway, content: body.content },
      ip: getClientIp(request),
    });
  }

  console.log('Webhook: completed transaction', reference, data);
  return NextResponse.json({ success: true, data });
}
