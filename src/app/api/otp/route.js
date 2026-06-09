import { NextResponse } from 'next/server';

const VIOTP_TOKEN = process.env.VIOTP_API_TOKEN;

export async function GET(request) {
  if (!VIOTP_TOKEN) {
    return NextResponse.json({ success: false, message: 'Server chưa được cấu hình API Token' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ success: false, message: 'Thiếu tham số path' }, { status: 400 });
  }

  const targetUrl = new URL(`https://api.viotp.com/${path}`);

  // Forward all params except 'path' and 'token' — token is injected server-side
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'path' && key !== 'token') {
      targetUrl.searchParams.set(key, value);
    }
  }

  // Always inject server-side token (client cannot override)
  targetUrl.searchParams.set('token', VIOTP_TOKEN);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `ViOTP API phản hồi với mã trạng thái ${response.status}`,
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Lỗi kết nối ViOTP Proxy:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
