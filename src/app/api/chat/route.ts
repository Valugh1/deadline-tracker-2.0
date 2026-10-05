import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { auth } from '@/auth';
import { getDailyTasks, createDailyTask, updateDailyTask, deleteDailyTask, updateDailyTaskStatus } from '@/actions/daily-tasks';
import { getLongTermTasks, createLongTermTask, updateLongTermTask, deleteLongTermTask, updateLongTermTaskStatus } from '@/actions/longterm-tasks';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Configurazione del provider LLM Locale via Tailscale
const localOpenAI = createOpenAI({
  name: 'llama-local',
  baseURL: 'https://desktop-kqja2f1.tail239392.ts.net/v1',
  apiKey: 'Andrea1234.', // Bearer token
});

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();

  // Recupera le attività dell'utente per l'iniezione nel contesto
  const dailyTasks = await getDailyTasks();
  const longTermTasks = await getLongTermTasks();

  const userName = session.user.name || session.user.email?.split('@')[0] || 'Utente';

  // Formatta le attività in stringhe per il prompt
  const formattedDailyTasks = dailyTasks.map(t => 
    `[ID: ${t.id} | Tipo: Giornaliera | Titolo: ${t.title} | Stato: ${t.status}${t.dueTime ? ` | Orario: ${t.dueTime}` : ''}]`
  ).join('\n');

  const formattedLongTermTasks = longTermTasks.map(t => 
    `[ID: ${t.id} | Tipo: Lungo Termine | Titolo: ${t.title} | Stato: ${t.status} | Scadenza: ${new Date(t.dueDate).toLocaleDateString()} | Giorni rimanenti: ${t.daysRemaining}]`
  ).join('\n');

  const systemPrompt = `Sei Kairon, un assistente virtuale per la gestione del tempo. 
Stai parlando con: ${userName}.
Sei connesso al database dell'utente e puoi visualizzare, creare, modificare ed eliminare le sue attività.
Devi essere rapido, conciso e aiutare l'utente a gestire le sue attività nel modo più efficiente possibile.

### TASK APERTI CORRENTI DELL'UTENTE:

--- ATTIVITÀ GIORNALIERE ---
${formattedDailyTasks || 'Nessuna attività giornaliera.'}

--- ATTIVITÀ A LUNGO TERMINE ---
${formattedLongTermTasks || 'Nessuna attività a lungo termine.'}

Usa gli strumenti a tua disposizione per modificare, creare o eliminare i task se l'utente te lo chiede. 
Usa gli ID dei task forniti qui sopra per le operazioni di modifica e cancellazione.`;

  const result = await generateText({
    model: localOpenAI('gemma-4-e4b'), // Specifica il nome del modello qui, oppure usa quello di default del server
    system: systemPrompt,
    messages,
    stopWhen: stepCountIs(5),
    tools: {
      createTask: tool({
        description: 'Crea una nuova attività (giornaliera o a lungo termine)',
        parameters: z.object({
          type: z.enum(['daily', 'longterm']).describe('Il tipo di attività da creare'),
          title: z.string().describe('Il titolo dell\'attività'),
          dueTime: z.string().optional().describe('L\'orario dell\'attività giornaliera (es. 14:30)'),
          dueDate: z.string().optional().describe('La data di scadenza per l\'attività a lungo termine (Formato ISO, es. 2026-10-15)'),
          advanceNoticeDays: z.number().optional().describe('Giorni di preavviso per l\'attività a lungo termine'),
          notes: z.string().optional().describe('Eventuali note aggiuntive'),
        }),
        // @ts-ignore
        execute: async (args: { type: 'daily' | 'longterm'; title: string; dueTime?: string; dueDate?: string; advanceNoticeDays?: number; notes?: string }) => {
          const { type, title, dueTime, dueDate, advanceNoticeDays, notes } = args;
          if (type === 'daily') {
            const res = await createDailyTask({ title, dueTime, notes });
            if (res.error) return { error: res.error };
            return { success: true, message: 'Attività giornaliera creata con successo' };
          } else {
            if (!dueDate) return { error: 'La data di scadenza è obbligatoria per le attività a lungo termine' };
            const res = await createLongTermTask({ title, dueDate, advanceNoticeDays, notes });
            if (res.error) return { error: res.error };
            return { success: true, message: 'Attività a lungo termine creata con successo' };
          }
        },
      }),
      updateTask: tool({
        description: 'Modifica un\'attività esistente. Usa questo tool per aggiornare il titolo, la data, l\'orario o lo stato (es. da todo a in_progress o done) di un task.',
        parameters: z.object({
          id: z.string().describe('L\'ID univoco dell\'attività'),
          type: z.enum(['daily', 'longterm']).describe('Il tipo di attività'),
          title: z.string().optional().describe('Il nuovo titolo'),
          status: z.enum(['todo', 'in_progress', 'done']).optional().describe('Il nuovo stato dell\'attività'),
          dueTime: z.string().optional().describe('Il nuovo orario (solo per daily)'),
          dueDate: z.string().optional().describe('La nuova data di scadenza (solo per longterm, ISO format)'),
          advanceNoticeDays: z.number().optional().describe('I nuovi giorni di preavviso (solo per longterm)'),
          notes: z.string().optional().describe('Le nuove note'),
        }),
        // @ts-ignore
        execute: async (args: { id: string; type: 'daily' | 'longterm'; title?: string; status?: 'todo' | 'in_progress' | 'done'; dueTime?: string; dueDate?: string; advanceNoticeDays?: number; notes?: string }) => {
          const { id, type, title, status, dueTime, dueDate, advanceNoticeDays, notes } = args;
          if (type === 'daily') {
            const res = await updateDailyTask(id, { title, status, dueTime, notes });
            if (res.error) return { error: res.error };
            return { success: true, message: 'Attività giornaliera modificata con successo' };
          } else {
            const res = await updateLongTermTask(id, { title, status, dueDate, advanceNoticeDays, notes });
            if (res.error) return { error: res.error };
            return { success: true, message: 'Attività a lungo termine modificata con successo' };
          }
        },
      }),
      deleteTask: tool({
        description: 'Elimina un\'attività',
        parameters: z.object({
          id: z.string().describe('L\'ID univoco dell\'attività'),
          type: z.enum(['daily', 'longterm']).describe('Il tipo di attività'),
        }),
        // @ts-ignore
        execute: async (args: { id: string; type: 'daily' | 'longterm' }) => {
          const { id, type } = args;
          if (type === 'daily') {
            const res = await deleteDailyTask(id);
            if (res.error) return { error: res.error };
            return { success: true, message: 'Attività giornaliera eliminata' };
          } else {
            const res = await deleteLongTermTask(id);
            if (res.error) return { error: res.error };
            return { success: true, message: 'Attività a lungo termine eliminata' };
          }
        },
      })
    },
  });

  return Response.json({ text: result.text, toolCalls: result.toolCalls });
}
