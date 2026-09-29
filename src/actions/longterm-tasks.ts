'use server';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { longTermTasks, LongTermTask } from '@/db/schema';
import { auth } from '@/auth';
import { TaskStatus, EnrichedLongTermTask } from '@/types';
import { getDeadlineInfo } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getLongTermTasks(): Promise<EnrichedLongTermTask[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    const list = await db
      .select()
      .from(longTermTasks)
      .where(eq(longTermTasks.userId, session.user.id))
      .orderBy(asc(longTermTasks.sortOrder), asc(longTermTasks.createdAt));

    return list.map((task) => {
      const deadlineInfo = getDeadlineInfo(task.dueDate, task.advanceNoticeDays);
      return {
        ...task,
        daysRemaining: deadlineInfo.daysRemaining,
        deadlineState: deadlineInfo.state,
        deadlineLabel: deadlineInfo.label,
      };
    });
  } catch (error) {
    console.error('Error fetching long-term tasks:', error);
    return [];
  }
}

export async function createLongTermTask(data: {
  title: string;
  dueDate: string; // ISO string e.g. "2026-10-15"
  advanceNoticeDays?: number;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  if (!data.title?.trim()) {
    return { error: 'Il titolo è obbligatorio' };
  }

  if (!data.dueDate) {
    return { error: 'La data di scadenza è obbligatoria' };
  }

  try {
    const dueDateParsed = new Date(data.dueDate);

    const [newTask] = await db
      .insert(longTermTasks)
      .values({
        userId: session.user.id,
        title: data.title.trim(),
        dueDate: dueDateParsed,
        advanceNoticeDays: Math.max(0, Number(data.advanceNoticeDays) || 0),
        notes: data.notes?.trim() || null,
        status: 'todo',
        sortOrder: 0,
      })
      .returning();

    revalidatePath('/board');
    return { success: true, task: newTask };
  } catch (error) {
    console.error('Error creating long-term task:', error);
    return { error: 'Impossibile creare l attività a lungo termine' };
  }
}

export async function updateLongTermTaskStatus(id: string, status: TaskStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    await db
      .update(longTermTasks)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(longTermTasks.id, id), eq(longTermTasks.userId, session.user.id)));

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error updating long-term task status:', error);
    return { error: 'Impossibile aggiornare lo stato' };
  }
}

export async function updateLongTermTask(
  id: string,
  data: {
    title?: string;
    dueDate?: string;
    advanceNoticeDays?: number;
    notes?: string;
    status?: TaskStatus;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    const updateValues: Partial<LongTermTask> = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updateValues.title = data.title.trim();
    if (data.dueDate !== undefined) updateValues.dueDate = new Date(data.dueDate);
    if (data.advanceNoticeDays !== undefined) {
      updateValues.advanceNoticeDays = Math.max(0, Number(data.advanceNoticeDays) || 0);
    }
    if (data.notes !== undefined) updateValues.notes = data.notes.trim() || null;
    if (data.status !== undefined) updateValues.status = data.status;

    await db
      .update(longTermTasks)
      .set(updateValues)
      .where(and(eq(longTermTasks.id, id), eq(longTermTasks.userId, session.user.id)));

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error updating long-term task:', error);
    return { error: 'Impossibile aggiornare l attività' };
  }
}

export async function deleteLongTermTask(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  try {
    await db
      .delete(longTermTasks)
      .where(and(eq(longTermTasks.id, id), eq(longTermTasks.userId, session.user.id)));

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error deleting long-term task:', error);
    return { error: 'Impossibile eliminare l attività' };
  }
}

export async function reorderLongTermTasks(orderedIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorizzato' };
  }

  const userId = session.user.id;

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(longTermTasks)
          .set({ sortOrder: index })
          .where(and(eq(longTermTasks.id, id), eq(longTermTasks.userId, userId)))
      )
    );
    return { success: true };
  } catch (error) {
    console.error('Error reordering long-term tasks:', error);
    return { error: 'Impossibile riordinare le attività' };
  }
}
