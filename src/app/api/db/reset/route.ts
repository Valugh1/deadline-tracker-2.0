import { NextRequest, NextResponse } from 'next/server';
import { resetAndInitializeDatabase } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  // Protect endpoint with CRON_SECRET if configured
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const res = await resetAndInitializeDatabase();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: error?.message || 'Errore durante la pulizia del database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
