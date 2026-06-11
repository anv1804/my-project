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
    const period = searchParams.get('period') || '7'; // 7, 30, all

    const admin = createAdminClient();
    
    let query = admin
      .from('user_action_logs')
      .select('coins_delta, created_at')
      .eq('user_id', user.id)
      .eq('action', 'coin_topup')
      .not('coins_delta', 'is', null)
      .gt('coins_delta', 0)
      .order('created_at', { ascending: true });
      
    if (period !== 'all') {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error(logsError);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    // Aggregate by date (YYYY-MM-DD)
    const aggregated = {};
    
    // Initialize dates for the period so empty days show 0
    if (period !== 'all') {
      const days = parseInt(period);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        aggregated[dateStr] = 0;
      }
    }

    // Add actual data
    logs.forEach(log => {
      // created_at is UTC, convert properly if needed, but simple split is ok for now
      // To match VN time ideally:
      const dateStr = new Date(log.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      if (aggregated[dateStr] !== undefined) {
        aggregated[dateStr] += log.coins_delta;
      } else {
        aggregated[dateStr] = log.coins_delta;
      }
    });

    const result = Object.keys(aggregated).sort().map(date => {
      // Format date for display
      const [year, month, day] = date.split('-');
      return {
        date,
        displayDate: `${day}/${month}`,
        amount: aggregated[date]
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
