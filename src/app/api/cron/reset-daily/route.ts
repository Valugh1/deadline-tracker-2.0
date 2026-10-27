import { NextRequest, NextResponse } from 'next/server';
import { runDailyResets } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Daily safety-net reset (Vercel Cron). The reset is timezone-aware and idempotent:
 * each user's daily tasks are reset only once their local date has changed, and
 * incomplete tasks are stamped as "missed" for the 9:00 digest. The same logic also
 * runs inside /api/cron/notifications, so whichever fires first after midnight wins.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify authorization if CRON_SECRET is configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resetCount = await runDailyResets();

    return NextResponse.json({
      success: true,
      message: 'Daily tasks reset check completed',
      resetCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during daily tasks cron reset:', error);
    return NextResponse.json(
      { error: 'Failed to reset daily tasks' },
      { status: 500 }
    );
  }
}
