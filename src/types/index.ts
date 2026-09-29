import { DailyTask, LongTermTask, User } from '@/db/schema';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type ViewType = 'daily' | 'longterm';

export type DeadlineState = 'on_track' | 'warning' | 'expired';

export interface EnrichedLongTermTask extends LongTermTask {
  daysRemaining: number;
  deadlineState: DeadlineState;
  deadlineLabel: string;
}

export type TaskItem =
  | ({ type: 'daily' } & DailyTask)
  | ({ type: 'longterm' } & EnrichedLongTermTask);

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  notifyExpiring: boolean;
  notifyExpired: boolean;
  notifyDailyReset: boolean;
}
