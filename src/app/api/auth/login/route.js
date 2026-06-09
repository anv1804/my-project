import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (username === "admin" && password === "admin123") {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'admin_token',
        value: 'hardcoded_admin_token_xyz',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      });
      return response;
    }

    return NextResponse.json({ error: "Tài khoản hoặc mật khẩu không đúng!" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi Server!" }, { status: 500 });
  }
}
