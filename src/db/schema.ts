import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// ────────────────────────── AUTH & USER TABLES ──────────────────────────

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // bcrypt hashed for credentials provider
  timezone: text('timezone').default('Europe/Rome').notNull(),
  notifyExpiring: boolean('notify_expiring').default(true).notNull(),
  notifyExpired: boolean('notify_expired').default(true).notNull(),
  notifyDailyReset: boolean('notify_daily_reset').default(false).notNull(),
  notifyDailyOverdue: boolean('notify_daily_overdue').default(true).notNull(),
  notifyMorningDigest: boolean('notify_morning_digest').default(true).notNull(),
  // Local date (YYYY-MM-DD, in user's timezone) of the last midnight reset of daily tasks
  lastDailyResetOn: text('last_daily_reset_on'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ────────────────────────── TASK TABLES ──────────────────────────

export const dailyTasks = pgTable('daily_task', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status', { enum: ['todo', 'in_progress', 'done'] })
    .default('todo')
    .notNull(),
  dueTime: text('due_time'), // "HH:mm" format (e.g. "14:30")
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0).notNull(),
  // Local date (YYYY-MM-DD) of the last day this task was left incomplete at reset time
  missedOn: text('missed_on'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const longTermTasks = pgTable('long_term_task', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status', { enum: ['todo', 'in_progress', 'done'] })
    .default('todo')
    .notNull(),
  dueDate: timestamp('due_date', { mode: 'date' }).notNull(),
  advanceNoticeDays: integer('advance_notice_days').default(0).notNull(),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ────────────────────────── PUSH NOTIFICATIONS ──────────────────────────

export const pushSubscriptions = pgTable(
  'push_subscription',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('push_subscription_endpoint_idx').on(t.endpoint), index('push_subscription_user_idx').on(t.userId)]
);

// Deduplication log: guarantees each notification is sent at most once
export const notificationLog = pgTable(
  'notification_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dedupKey: text('dedup_key').notNull(),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('notification_log_user_key_idx').on(t.userId, t.dedupKey)]
);

// ────────────────────────── RELATIONS ──────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  dailyTasks: many(dailyTasks),
  longTermTasks: many(longTermTasks),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  user: one(users, {
    fields: [dailyTasks.userId],
    references: [users.id],
  }),
}));

export const longTermTasksRelations = relations(longTermTasks, ({ one }) => ({
  user: one(users, {
    fields: [longTermTasks.userId],
    references: [users.id],
  }),
}));

// Export Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;
export type LongTermTask = typeof longTermTasks.$inferSelect;
export type NewLongTermTask = typeof longTermTasks.$inferInsert;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
