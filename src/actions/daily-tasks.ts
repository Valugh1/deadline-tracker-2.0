'use server';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dailyTasks, DailyTask } from '@/db/schema';
import { auth } from '@/auth';
import { TaskStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getDailyTasks(): Promise<DailyTask[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    const list = await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.userId, session.user.id))
      .orderBy(asc(dailyTasks.sortOrder), asc(dailyTasks.createdAt));

    return list;
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return [];
  }
}

export async function createDailyTask(data: {
  title: string;
  dueTime?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  if (!data.title?.trim()) {
    return { error: 'Il titolo è obbligatorio' };
  }

  try {
    const [newTask] = await db
      .insert(dailyTasks)
      .values({
        userId: session.user.id,
        title: data.title.trim(),
        dueTime: data.dueTime?.trim() || null,
        notes: data.notes?.trim() || null,
        status: 'todo',
        sortOrder: 0,
      })
      .returning();

    revalidatePath('/board');
    return { success: true, task: newTask };
  } catch (error) {
    console.error('Error creating daily task:', error);
    return { error: 'Impossibile creare l attività giornaliera' };
  }
}

export async function updateDailyTaskStatus(id: string, status: TaskStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    await db
      .update(dailyTasks)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(dailyTasks.id, id), eq(dailyTasks.userId, session.user.id)));

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error updating daily task status:', error);
    return { error: 'Impossibile aggiornare lo stato' };
  }
}

export async function updateDailyTask(
  id: string,
  data: {
    title?: string;
    dueTime?: string;
    notes?: string;
    status?: TaskStatus;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    const updateValues: Partial<DailyTask> = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updateValues.title = data.title.trim();
    if (data.dueTime !== undefined) updateValues.dueTime = data.dueTime.trim() || null;
    if (data.notes !== undefined) updateValues.notes = data.notes.trim() || null;
    if (data.status !== undefined) updateValues.status = data.status;

    await db
      .update(dailyTasks)
      .set(updateValues)
      .where(and(eq(dailyTasks.id, id), eq(dailyTasks.userId, session.user.id)));

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error updating daily task:', error);
    return { error: 'Impossibile aggiornare l attività' };
  }
}

export async function deleteDailyTask(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    await db
      .delete(dailyTasks)
      .where(and(eq(dailyTasks.id, id), eq(dailyTasks.userId, session.user.id)));

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error deleting daily task:', error);
    return { error: 'Impossibile eliminare l attività' };
  }
}

export async function reorderDailyTasks(orderedIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  const userId = session.user.id;

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(dailyTasks)
          .set({ sortOrder: index })
          .where(and(eq(dailyTasks.id, id), eq(dailyTasks.userId, userId)))
      )
    );
    return { success: true };
  } catch (error) {
    console.error('Error reordering daily tasks:', error);
    return { error: 'Impossibile riordinare le attività' };
  }
}
