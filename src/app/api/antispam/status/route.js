import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getClientIp, createAdminClient } from '@/utils/serverUtils';

/**
 * GET /api/antispam/status
 * Client gọi khi mount để kiểm tra ban status.
 * Không yêu cầu đăng nhập — check cả IP và fingerprint.
 */
export async function GET(request) {
  try {
    const ip = getClientIp(request);
    const fingerprint = request.headers.get('x-device-fp') || null;
    const now = new Date().toISOString();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const admin = createAdminClient();

    let query = admin
      .from('spam_bans')
      .select('banned_until, reason, created_at')
      .gt('banned_until', now);

    if (userId) {
      query = query.or(
        `user_id.eq.${userId},ip.eq.${ip}${fingerprint ? `,fingerprint.eq.${fingerprint}` : ''}`
      );
    } else {
      query = query.or(
        `ip.eq.${ip}${fingerprint ? `,fingerprint.eq.${fingerprint}` : ''}`
      );
    }

    const { data } = await query.limit(1).single();

    if (data) {
      return NextResponse.json({
        banned: true,
        bannedUntil: data.banned_until,
        reason: data.reason || 'Hành vi đáng ngờ',
      });
    }

    return NextResponse.json({ banned: false });
  } catch {
    // Lỗi DB hoặc bảng chưa tạo → trả về không bị ban để không block user
    return NextResponse.json({ banned: false });
  }
}
