import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function resetAndInitializeDatabase() {
  // 1. Drop existing tables completely to clean old data
  const dropStatements = [
    'DROP TABLE IF EXISTS "verificationToken" CASCADE;',
    'DROP TABLE IF EXISTS "account" CASCADE;',
    'DROP TABLE IF EXISTS "daily_task" CASCADE;',
    'DROP TABLE IF EXISTS "long_term_task" CASCADE;',
    'DROP TABLE IF EXISTS "user" CASCADE;',
    'DROP TABLE IF EXISTS "users" CASCADE;',
    'DROP TABLE IF EXISTS "tasks" CASCADE;',
    'DROP TABLE IF EXISTS "todos" CASCADE;',
    'DROP TABLE IF EXISTS "deadlines" CASCADE;',
    'DROP TABLE IF EXISTS "sessions" CASCADE;',
  ];

  for (const stmt of dropStatements) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (e) {
      console.warn('Drop warning:', e);
    }
  }

  // 2. Create fresh tables
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text,
      "email" text NOT NULL UNIQUE,
      "emailVerified" timestamp,
      "image" text,
      "password" text,
      "timezone" text DEFAULT 'Europe/Rome' NOT NULL,
      "notify_expiring" boolean DEFAULT true NOT NULL,
      "notify_expired" boolean DEFAULT true NOT NULL,
      "notify_daily_reset" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "account" (
      "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "type" text NOT NULL,
      "provider" text NOT NULL,
      "providerAccountId" text NOT NULL,
      "refresh_token" text,
      "access_token" text,
      "expires_at" integer,
      "token_type" text,
      "scope" text,
      "id_token" text,
      "session_state" text,
      CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
    );`,

    `CREATE TABLE IF NOT EXISTS "verificationToken" (
      "identifier" text NOT NULL,
      "token" text NOT NULL,
      "expires" timestamp NOT NULL,
      CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
    );`,

    `CREATE TABLE IF NOT EXISTS "daily_task" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "title" text NOT NULL,
      "status" text DEFAULT 'todo' NOT NULL,
      "due_time" text,
      "notes" text,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "long_term_task" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "title" text NOT NULL,
      "status" text DEFAULT 'todo' NOT NULL,
      "due_date" timestamp NOT NULL,
      "advance_notice_days" integer DEFAULT 0 NOT NULL,
      "notes" text,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
  ];

  for (const stmt of createStatements) {
    await db.execute(sql.raw(stmt));
  }

  return { success: true, message: 'Database completamente pulito e inizializzato con successo.' };
}
