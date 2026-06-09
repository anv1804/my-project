import { NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

export async function middleware(request) {
  // 1. Cập nhật session cho Supabase
  const supabaseResponse = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isAuthRoute = path === '/admin/login';
  const isAdminRoute = path.startsWith('/admin');

  if (!isAdminRoute) return supabaseResponse;

  const token = request.cookies.get('admin_token')?.value;
  const isAuthenticated = token === 'hardcoded_admin_token_xyz';

  // Nếu truy cập trang admin mà chưa có token -> Đá về login
  if (isAdminRoute && !isAuthRoute && !isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
    // Copy cookies từ supabaseResponse sang để không mất session
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Nếu đã login mà cố tình vào lại trang login -> Đá vào dashboard
  if (isAuthRoute && isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match tất cả các route ngoại trừ static files, images...
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
