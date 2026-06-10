import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseServer } from '@/lib/supabase';
import { checkSpamBan, recordSpamAction } from '@/utils/serverUtils';

// GET /api/forum — Lấy danh sách bài viết (có phân trang)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseServer
    .from('forum_posts')
    .select('*, profiles(display_name, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}

// POST /api/forum — Đăng bài mới (cookie-based auth, không cần Bearer token)
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Kiểm tra spam ban
  const banInfo = await checkSpamBan(request, user.id);
  if (banInfo.banned) {
    return NextResponse.json({ success: false, spam_ban: banInfo }, { status: 403 });
  }

  const body = await request.json();
  const { title, content } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Tiêu đề và nội dung không được để trống' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ title: title.trim(), content: content.trim(), author_id: user.id })
    .select('*, profiles(display_name, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ghi nhận để chống spam bài viết
  recordSpamAction(request, user.id, 'forum_post').catch(() => {});

  return NextResponse.json({ data }, { status: 201 });
}
