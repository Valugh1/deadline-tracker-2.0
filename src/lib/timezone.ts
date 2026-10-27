/**
 * Timezone helpers based on Intl (no external deps).
 * All "local dates" are expressed as YYYY-MM-DD strings in the user's timezone.
 */

const FALLBACK_TZ = 'Europe/Rome';

export interface ZonedNow {
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  /** Minutes elapsed since local midnight (0..1439) */
  minutes: number;
}

export function getZonedNow(timeZone: string, now: Date = new Date()): ZonedNow {
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    return getZonedNow(FALLBACK_TZ, now);
  }

  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute),
  };
}

function toUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Adds (or subtracts) days to a YYYY-MM-DD string */
export function addDays(dateStr: string, days: number): string {
  return new Date(toUtcMs(dateStr) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Calendar-day difference: a - b */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtcMs(a) - toUtcMs(b)) / 86_400_000);
}

/**
 * Long-term due dates are stored as UTC midnight of the chosen calendar day
 * (created via `new Date('YYYY-MM-DD')`), so the UTC date is the intended day.
 */
export function dueDateToDay(dueDate: Date): string {
  return dueDate.toISOString().slice(0, 10);
}

/** "HH:mm" -> minutes since midnight, or null if invalid */
export function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}
