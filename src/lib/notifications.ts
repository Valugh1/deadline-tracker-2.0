import { and, eq, inArray, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  dailyTasks,
  longTermTasks,
  pushSubscriptions,
  notificationLog,
  PushSubscriptionRow,
  DailyTask,
  LongTermTask,
} from '@/db/schema';
import { sendToSubscriptions, PushPayload } from '@/lib/push';
import {
  getZonedNow,
  addDays,
  diffDays,
  dueDateToDay,
  parseTimeToMinutes,
} from '@/lib/timezone';

/** Local hour at which the morning digest is sent */
const DIGEST_HOUR = 9;
/** If the scheduler was down, the digest is still sent until this local hour */
const DIGEST_LATEST_HOUR = 12;
/** Deadline notifications (pre-notice / expired) are only delivered in this local window */
const DEADLINE_WINDOW_START_HOUR = 8;
const DEADLINE_WINDOW_END_HOUR = 22;

type UserRow = Pick<
  typeof users.$inferSelect,
  | 'id'
  | 'name'
  | 'email'
  | 'timezone'
  | 'notifyExpiring'
  | 'notifyExpired'
  | 'notifyDailyOverdue'
  | 'notifyMorningDigest'
  | 'lastDailyResetOn'
>;

export interface CycleReport {
  usersProcessed: number;
  dailyResets: number;
  notificationsSent: number;
  timestamp: string;
}

// ────────────────────────── HELPERS ──────────────────────────

/**
 * Atomically claims a notification slot. Returns true only the first time a given
 * (user, key) pair is claimed, so every notification is sent at most once even if
 * the scheduler fires twice or overlaps.
 */
async function claim(userId: string, dedupKey: string): Promise<boolean> {
  const rows = await db
    .insert(notificationLog)
    .values({ userId, dedupKey })
    .onConflictDoNothing()
    .returning({ id: notificationLog.id });
  return rows.length > 0;
}

function listTitles(titles: string[], max = 3): string {
  const shown = titles.slice(0, max).join(', ');
  return titles.length > max ? `${shown} e altre ${titles.length - max}` : shown;
}

function firstName(user: UserRow): string {
  return user.name?.trim().split(/\s+/)[0] || user.email.split('@')[0];
}

// ────────────────────────── DAILY RESET (per timezone) ──────────────────────────

/**
 * Resets the user's daily tasks once their local date changes. Before resetting,
 * tasks left incomplete are stamped with `missedOn = yesterday` so the morning
 * digest can report them.
 */
async function runDailyResetForUser(user: UserRow, today: string): Promise<boolean> {
  if (user.lastDailyResetOn === today) return false;

  // First run after deploy: just record today, never reset mid-day
  if (!user.lastDailyResetOn) {
    await db.update(users).set({ lastDailyResetOn: today }).where(eq(users.id, user.id));
    user.lastDailyResetOn = today;
    return false;
  }

  const yesterday = addDays(today, -1);
  const now = new Date();

  await db.batch([
    db
      .update(dailyTasks)
      .set({ missedOn: yesterday })
      .where(and(eq(dailyTasks.userId, user.id), ne(dailyTasks.status, 'done'))),
    db
      .update(dailyTasks)
      .set({ status: 'todo', updatedAt: now })
      .where(and(eq(dailyTasks.userId, user.id), ne(dailyTasks.status, 'todo'))),
    db.update(users).set({ lastDailyResetOn: today }).where(eq(users.id, user.id)),
  ]);

  user.lastDailyResetOn = today;
  return true;
}

/** Runs the timezone-aware daily reset for every user (idempotent). */
export async function runDailyResets(): Promise<number> {
  const allUsers = await selectUsers();
  let count = 0;
  for (const user of allUsers) {
    const { date } = getZonedNow(user.timezone);
    if (await runDailyResetForUser(user, date)) count++;
  }
  return count;
}

// ────────────────────────── NOTIFICATION BUILDERS ──────────────────────────

interface PendingNotification {
  key: string;
  payload: PushPayload;
}

function buildDeadlineNotifications(
  user: UserRow,
  tasks: LongTermTask[],
  today: string,
  minutes: number
): PendingNotification[] {
  const inWindow =
    minutes >= DEADLINE_WINDOW_START_HOUR * 60 && minutes < DEADLINE_WINDOW_END_HOUR * 60;
  if (!inWindow) return [];

  const out: PendingNotification[] = [];

  for (const task of tasks) {
    if (task.status === 'done') continue;
    const dueDay = dueDateToDay(task.dueDate);
    const days = diffDays(dueDay, today);

    // 1. Pre-notice: entered the advance notice window (due day included)
    if (user.notifyExpiring && days >= 0 && days <= task.advanceNoticeDays) {
      const when = days === 0 ? 'scade oggi' : days === 1 ? 'scade domani' : `scade tra ${days} giorni`;
      out.push({
        key: `lt-warning:${task.id}:${dueDay}`,
        payload: {
          title: '🟡 Attività in scadenza',
          body: `"${task.title}" ${when}.`,
          tag: `lt-${task.id}`,
          url: '/board?view=longterm',
        },
      });
    }

    // 2. Expired: the due day has passed
    if (user.notifyExpired && days < 0) {
      out.push({
        key: `lt-expired:${task.id}:${dueDay}`,
        payload: {
          title: '🔴 Attività scaduta',
          body:
            days === -1
              ? `"${task.title}" è scaduta ieri.`
              : `"${task.title}" è scaduta da ${Math.abs(days)} giorni.`,
          tag: `lt-${task.id}`,
          url: '/board?view=longterm',
        },
      });
    }
  }

  return out;
}

function buildDailyOverdueNotifications(
  user: UserRow,
  tasks: DailyTask[],
  today: string,
  minutes: number
): PendingNotification[] {
  if (!user.notifyDailyOverdue) return [];
  const out: PendingNotification[] = [];

  for (const task of tasks) {
    if (task.status === 'done') continue;
    const dueMinutes = parseTimeToMinutes(task.dueTime);
    if (dueMinutes === null || minutes < dueMinutes) continue;

    out.push({
      key: `daily-overdue:${task.id}:${today}`,
      payload: {
        title: '⏰ Orario superato',
        body: `"${task.title}" andava completata entro le ${task.dueTime}.`,
        tag: `daily-${task.id}`,
        url: '/board?view=daily',
      },
    });
  }

  return out;
}

function buildMorningDigest(
  user: UserRow,
  daily: DailyTask[],
  longTerm: LongTermTask[],
  today: string,
  minutes: number
): PendingNotification | null {
  if (!user.notifyMorningDigest) return null;
  if (minutes < DIGEST_HOUR * 60 || minutes >= DIGEST_LATEST_HOUR * 60) return null;

  const yesterday = addDays(today, -1);

  const missedDaily = daily.filter((t) => t.missedOn === yesterday).map((t) => t.title);

  const pendingLongTerm = longTerm.filter((t) => t.status !== 'done');
  const expiredYesterday = pendingLongTerm
    .filter((t) => dueDateToDay(t.dueDate) === yesterday)
    .map((t) => t.title);
  const expiring = pendingLongTerm
    .map((t) => ({ t, days: diffDays(dueDateToDay(t.dueDate), today) }))
    .filter(({ t, days }) => days >= 0 && days <= t.advanceNoticeDays)
    .sort((a, b) => a.days - b.days)
    .map(({ t, days }) => (days === 0 ? `${t.title} (oggi)` : `${t.title} (${days} gg)`));

  const lines: string[] = [];
  if (missedDaily.length) {
    lines.push(`☀️ Giornaliere non svolte ieri: ${listTitles(missedDaily)}`);
  }
  if (expiredYesterday.length) {
    lines.push(`🔴 Scadute ieri: ${listTitles(expiredYesterday)}`);
  }
  if (expiring.length) {
    lines.push(`🟡 In scadenza: ${listTitles(expiring)}`);
  }
  if (!lines.length) {
    lines.push('Nessuna attività in sospeso. Buona giornata! ✨');
  }

  return {
    key: `digest:${today}`,
    payload: {
      title: `Buongiorno, ${firstName(user)}! ☕`,
      body: lines.join('\n'),
      tag: 'morning-digest',
      url: '/board',
    },
  };
}

// ────────────────────────── MAIN CYCLE ──────────────────────────

function selectUsers(): Promise<UserRow[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      timezone: users.timezone,
      notifyExpiring: users.notifyExpiring,
      notifyExpired: users.notifyExpired,
      notifyDailyOverdue: users.notifyDailyOverdue,
      notifyMorningDigest: users.notifyMorningDigest,
      lastDailyResetOn: users.lastDailyResetOn,
    })
    .from(users);
}

function groupBy<T, K extends keyof T>(rows: T[], key: K): Map<T[K], T[]> {
  const map = new Map<T[K], T[]>();
  for (const row of rows) {
    const list = map.get(row[key]);
    if (list) list.push(row);
    else map.set(row[key], [row]);
  }
  return map;
}

/**
 * Executes one full notification cycle. Designed to be called every ~5 minutes by an
 * external scheduler; it is idempotent thanks to the notification log.
 */
export async function runNotificationCycle(): Promise<CycleReport> {
  const allUsers = await selectUsers();

  // 1. Timezone-aware midnight reset (for every user, subscribed or not)
  let dailyResets = 0;
  for (const user of allUsers) {
    const { date } = getZonedNow(user.timezone);
    if (await runDailyResetForUser(user, date)) dailyResets++;
  }

  // 2. Only users with at least one push subscription can receive notifications
  const subs = await db.select().from(pushSubscriptions);
  const subsByUser = groupBy(subs, 'userId');
  const targetUsers = allUsers.filter((u) => subsByUser.has(u.id));

  if (!targetUsers.length) {
    return {
      usersProcessed: 0,
      dailyResets,
      notificationsSent: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const userIds = targetUsers.map((u) => u.id);
  const [daily, longTerm] = await Promise.all([
    db.select().from(dailyTasks).where(inArray(dailyTasks.userId, userIds)),
    db.select().from(longTermTasks).where(inArray(longTermTasks.userId, userIds)),
  ]);
  const dailyByUser = groupBy(daily, 'userId');
  const longTermByUser = groupBy(longTerm, 'userId');

  let notificationsSent = 0;

  await Promise.all(
    targetUsers.map(async (user) => {
      const { date: today, minutes } = getZonedNow(user.timezone);
      const userDaily = dailyByUser.get(user.id) ?? [];
      const userLongTerm = longTermByUser.get(user.id) ?? [];
      const userSubs: PushSubscriptionRow[] = subsByUser.get(user.id) ?? [];

      const pending: PendingNotification[] = [];
      const digest = buildMorningDigest(user, userDaily, userLongTerm, today, minutes);
      if (digest) pending.push(digest);
      pending.push(...buildDeadlineNotifications(user, userLongTerm, today, minutes));
      pending.push(...buildDailyOverdueNotifications(user, userDaily, today, minutes));

      for (const notification of pending) {
        try {
          if (!(await claim(user.id, notification.key))) continue;
          const delivered = await sendToSubscriptions(userSubs, notification.payload);
          if (delivered > 0) notificationsSent++;
        } catch (error) {
          console.error(`[notifications] Failed for user ${user.id}:`, error);
        }
      }
    })
  );

  return {
    usersProcessed: targetUsers.length,
    dailyResets,
    notificationsSent,
    timestamp: new Date().toISOString(),
  };
}
