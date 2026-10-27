import webpush from 'web-push';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pushSubscriptions, PushSubscriptionRow } from '@/db/schema';

export interface PushPayload {
  title: string;
  body: string;
  /** Notifications with the same tag replace each other on the device */
  tag?: string;
  /** URL opened when the notification is tapped */
  url?: string;
}

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys missing: push notifications disabled.');
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@kairon.app',
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

/**
 * Sends a payload to every given subscription. Subscriptions rejected by the push
 * service as gone (404/410) are deleted so they are not retried forever.
 * Returns the number of successful deliveries.
 */
export async function sendToSubscriptions(
  subs: PushSubscriptionRow[],
  payload: PushPayload,
  options: { ttlSeconds?: number } = {}
): Promise<number> {
  if (!subs.length || !ensureVapid()) return 0;

  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: options.ttlSeconds ?? 60 * 60 * 12, urgency: 'high' }
        );
        delivered++;
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expired.push(sub.id);
        } else {
          console.error('[push] Delivery failed:', statusCode, (error as Error)?.message);
        }
      }
    })
  );

  if (expired.length) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired));
  }

  return delivered;
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return sendToSubscriptions(subs, payload);
}
