import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyTasks } from '@/db/schema';
import { ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify authorization if CRON_SECRET is configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Reset all daily tasks that are not 'todo' back to 'todo'
    const result = await db
      .update(dailyTasks)
      .set({
        status: 'todo',
        updatedAt: new Date(),
      })
      .where(ne(dailyTasks.status, 'todo'))
      .returning({ id: dailyTasks.id });

    return NextResponse.json({
      success: true,
      message: 'Daily tasks successfully reset to "todo"',
      resetCount: result.length,
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
