import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/serverUtils';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError || !authData?.session?.user) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = authData.session.user;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const action = searchParams.get('action');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    
    // We only care about logs that have a coin delta
    let query = admin
      .from('user_action_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .not('coins_delta', 'is', null)
      .neq('coins_delta', 0);
      
    if (action && action !== 'all') {
      query = query.eq('action', action);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
    }

    if (search) {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(search);
      if (isUUID) {
        query = query.or(`id.eq.${search},ref_id.ilike.%${search}%`);
      } else {
        query = query.or(`ref_id.ilike.%${search}%`);
      }
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[coins/history] query error:', error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (err) {
    console.error('[coins/history] unexpected error:', err);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}
