import { NextRequest, NextResponse } from 'next/server';
import { runNotificationCycle } from '@/lib/notifications';

// Must never be cached/prerendered: it is triggered by an external scheduler
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const header = request.headers.get('authorization');
  const query = request.nextUrl.searchParams.get('secret');
  return header === `Bearer ${cronSecret}` || query === cronSecret;
}

/**
 * Notification scheduler endpoint. Call it every 5 minutes (e.g. from cron-job.org):
 *   GET /api/cron/notifications  with header  Authorization: Bearer <CRON_SECRET>
 * It handles: per-timezone midnight reset, 9:00 digest, deadline pre-notice,
 * expired deadlines and overdue daily tasks. Safe to call any number of times.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await runNotificationCycle();
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error('Error during notification cycle:', error);
    return NextResponse.json({ error: 'Notification cycle failed' }, { status: 500 });
  }
}
