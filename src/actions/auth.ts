'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve contenere almeno 6 caratteri'),
});

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const validated = registerSchema.parse({
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    });

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existing) {
      return { error: 'Questa email è già registrata. Prova ad accedere.' };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
      })
      .returning({ id: users.id, email: users.email });

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Dati non validi' };
    }
    return { error: error?.message || 'Si è verificato un errore durante la registrazione. Riprova.' };
  }
}

export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      timezone: users.timezone,
      notifyExpiring: users.notifyExpiring,
      notifyExpired: users.notifyExpired,
      notifyDailyReset: users.notifyDailyReset,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return user || null;
}

export async function updateUserProfile(data: {
  name: string;
  email: string;
  timezone?: string;
  notifyExpiring?: boolean;
  notifyExpired?: boolean;
  notifyDailyReset?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    const normalizedEmail = data.email.toLowerCase().trim();
    
    // Check if email changed and is taken
    if (normalizedEmail !== session.user.email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing && existing.id !== session.user.id) {
        return { error: 'Questa email è già associata a un altro account.' };
      }
    }

    await db
      .update(users)
      .set({
        name: data.name.trim(),
        email: normalizedEmail,
        timezone: data.timezone || 'Europe/Rome',
        notifyExpiring: data.notifyExpiring ?? true,
        notifyExpired: data.notifyExpired ?? true,
        notifyDailyReset: data.notifyDailyReset ?? false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Impossibile salvare le modifiche del profilo.' };
  }
}

export async function updateUserPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  if (data.newPassword.length < 6) {
    return { error: 'La nuova password deve contenere almeno 6 caratteri.' };
  }

  try {
    const [user] = await db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !user.password) {
      return { error: 'Utente non trovato.' };
    }

    const passwordsMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!passwordsMatch) {
      return { error: 'La password attuale non è corretta.' };
    }

    const hashedNew = await bcrypt.hash(data.newPassword, 10);
    await db
      .update(users)
      .set({
        password: hashedNew,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    return { error: 'Impossibile aggiornare la password.' };
  }
}

export async function deleteUserAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    await db.delete(users).where(eq(users.id, session.user.id));
    return { success: true };
  } catch (error) {
    console.error('Account deletion error:', error);
    return { error: 'Impossibile eliminare l account.' };
  }
}
