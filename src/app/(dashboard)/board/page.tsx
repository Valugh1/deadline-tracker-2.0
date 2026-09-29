import { getDailyTasks } from '@/actions/daily-tasks';
import { getLongTermTasks } from '@/actions/longterm-tasks';
import KanbanBoard from '@/components/board/kanban-board';

export const metadata = {
  title: 'Board — Kairon',
  description: 'Gestisci le tue attività giornaliere e a lungo termine con la Kanban board',
};

// Revalidate on demand
export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const [dailyTasks, longTermTasks] = await Promise.all([
    getDailyTasks(),
    getLongTermTasks(),
  ]);

  return (
    <KanbanBoard
      initialDailyTasks={dailyTasks}
      initialLongTermTasks={longTermTasks}
    />
  );
}
