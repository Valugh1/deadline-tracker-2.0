import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { DeadlineState } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateDaysRemaining(dueDate: Date | string): number {
  const targetDate = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  return differenceInCalendarDays(targetDate, now);
}

export function getDeadlineInfo(
  dueDate: Date | string,
  advanceNoticeDays: number
): {
  daysRemaining: number;
  state: DeadlineState;
  label: string;
} {
  const days = calculateDaysRemaining(dueDate);

  if (days <= 0) {
    return {
      daysRemaining: days,
      state: 'expired',
      label: 'Scaduto',
    };
  }

  if (days <= advanceNoticeDays) {
    return {
      daysRemaining: days,
      state: 'warning',
      label: 'In scadenza',
    };
  }

  return {
    daysRemaining: days,
    state: 'on_track',
    label: 'In orario',
  };
}

export function formatDeadlineText(daysRemaining: number): string {
  if (daysRemaining > 0) {
    return `${daysRemaining} ${daysRemaining === 1 ? 'giorno rimanente' : 'giorni rimanenti'}`;
  }
  if (daysRemaining === 0) {
    return 'Scade oggi';
  }
  const positiveDays = Math.abs(daysRemaining);
  return `Scaduto da ${positiveDays} ${positiveDays === 1 ? 'giorno' : 'giorni'}`;
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM yyyy', { locale: it });
}
