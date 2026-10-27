import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

/** Sends a test notification to all of the current user's devices. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const delivered = await sendToUser(session.user.id, {
    title: '🔔 Notifiche attive',
    body: 'Perfetto! Riceverai qui gli avvisi di Kairon.',
    tag: 'test',
    url: '/board',
  });

  if (!delivered) {
    return NextResponse.json(
      { error: 'Nessun dispositivo raggiungibile. Riattiva le notifiche.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, delivered });
}
