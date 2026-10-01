import { NextResponse } from 'next/server';
import { resetAndInitializeDatabase } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET() {
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

export async function POST() {
  return GET();
}
