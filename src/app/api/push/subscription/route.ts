import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/db/schema';

export const dynamic = 'force-dynamic';

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  /** Sent by the service worker when the browser rotates the subscription */
  oldEndpoint: z.string().optional(),
});

/** Registers (or refreshes) the current device's push subscription. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Sottoscrizione non valida' }, { status: 400 });
  }

  const { subscription, oldEndpoint } = parsed.data;
  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null;
  const now = new Date();

  if (oldEndpoint && oldEndpoint !== subscription.endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, oldEndpoint));
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: session.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        lastSeenAt: now,
      },
    });

  return NextResponse.json({ success: true });
}

/** Removes the current device's push subscription. */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: 'Endpoint mancante' }, { status: 400 });
  }

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint));
  return NextResponse.json({ success: true });
}
