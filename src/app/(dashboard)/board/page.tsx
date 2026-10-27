import { getDailyTasks } from '@/actions/daily-tasks';
import { getLongTermTasks } from '@/actions/longterm-tasks';
import KanbanBoard from '@/components/board/kanban-board';

export const metadata = {
  title: 'Board — Kairon',
  description: 'Gestisci le tue attività giornaliere e a lungo termine con la Kanban board',
};

// Revalidate on demand
export const dynamic = 'force-dynamic';

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [dailyTasks, longTermTasks, params] = await Promise.all([
    getDailyTasks(),
    getLongTermTasks(),
    searchParams,
  ]);

  return (
    <KanbanBoard
      initialDailyTasks={dailyTasks}
      initialLongTermTasks={longTermTasks}
      initialView={params.view === 'longterm' ? 'longterm' : 'daily'}
    />
  );
}
