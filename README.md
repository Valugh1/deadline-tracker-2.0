# 🗓️ Kairon — Progressive Web App per Task e Scadenze

**Kairon** è una Progressive Web App (PWA) moderna, veloce e reattiva progettata per tracciare e organizzare le tue attività, con sistema di login, Kanban board drag & drop, gestione scadenze con preavviso, database Neon PostgreSQL e hosting su Vercel.

---

## ✨ Funzionalità Principali

### 1. Due Viste Specializzate con Colori Invertiti
- **☀️ Attività Giornaliere** (tema caldo ambra/arancione): attività che si ripetono e vengono resettate allo stato *To Do* a mezzanotte tramite cron job.
- **📅 Attività a Lungo Termine** (tema profondo indaco/viola): attività con data di scadenza definita che rimangono nello stato completato una volta concluse.

### 2. Kanban Board Interattiva (Drag & Drop)
- Tre colonne: **To Do**, **In Progress**, **Done** con conteggio attività in tempo reale.
- Supporto completo al **Drag & Drop** tra le colonne con transizioni fluide.
- Pulsante rapido sullo status (`To Do →`, `In Progress →`, `Done →`) per avanzare rapidamente lo stato della card.
- Selettore di vista **centrato** sullo schermo.

### 3. Sistema di Scadenze e Preavviso Intelligente
- Per le attività a Lungo Termine:
  - **🟢 In orario**: la scadenza è ancora lontana rispetto al periodo di preavviso configurato.
  - **🟡 In scadenza**: mancano $N$ giorni o meno alla scadenza (in base ai giorni di preavviso impostati dall'utente).
  - **🔴 Scaduto**: la scadenza è stata superata.
  - Indicatore giorni rimanenti con formattazione naturale: se superata, indica **"Scaduto da $X$ giorni"** (senza numeri negativi).

### 4. Dettagli e Modali
- Cliccando su una card si apre una maschera dettagliata per consultare o modificare lo stato, orari, date e note.
- Eliminazione sicura con dialog di conferma dedicato: *"Vuoi eliminare definitivamente l'attività?"*.

### 5. Impostazioni Utente Complete (Neon DB)
- Menu a discesa dall'avatar utente:
  - **Modifica Profilo**: aggiornamento di nome ed email.
  - **Sicurezza & Password**: cambio password cifrata con bcrypt e cancellazione account (con eliminazione a cascata di tutte le attività).
  - **Preferenze**: impostazione del fuso orario (Europa/Roma), notifiche in-app e lingua.
  - **Logout**.

### 6. Progressive Web App (PWA) & Notifiche Push (Android & iOS)
- Installabile su desktop, Android e iOS come app nativa.
- Web App Manifest (`/manifest.webmanifest`) e Service Worker offline (`/sw.js`).
- **Sistema di Notifiche Web Push (VAPID)** per Android e iOS (da iOS 16.4+ aggiungendo l'app alla Home):
  - **Preavviso scadenza a lungo termine**: inviato quando un'attività entra nella finestra di preavviso configurata.
  - **Scadenza superata**: inviato quando la data di scadenza a lungo termine è trascorsa.
  - **Orario giornaliero superato ("entro le...")**: inviato appena l'orario indicato per un task giornaliero viene oltrepassato.
  - **Riepilogo del Buongiorno (ore 09:00)**: inviato alle 9:00 locali con saluto personalizzato, le attività giornaliere e a lungo termine non svolte il giorno precedente e quelle in scadenza.
  - **Resistente a lunghi periodi di inutilizzo**: gestione automatica di `pushsubscriptionchange` nel Service Worker e rinnovo silenzioso della sottoscrizione ad ogni apertura dell'app.
  - Preferenze notifiche configurabili e pulsante per inviare una notifica di prova in Impostazioni.

### 7. Reset Automatico a Mezzanotte e Scheduler Notifiche
- **Reset Giornaliero**: endpoint protetto `GET /api/cron/reset-daily` configurato in `vercel.json` (`0 23 * * *` UTC) con snapshot delle attività non completate ieri (`missed_on`).
- **Motore Notifiche**: endpoint protetto `GET /api/cron/notifications` (autorizzato con `Authorization: Bearer <CRON_SECRET>`), pensato per essere richiamato ogni 5 minuti da uno scheduler esterno (es. [cron-job.org](https://cron-job.org)). Idempotente e sicuro grazie alla tabella di deduplica `notification_log`.

---

## 🛠️ Stack Tecnologico

- **Framework**: Next.js 16 (App Router, Turbopack, Server Actions)
- **Database**: Neon PostgreSQL Serverless
- **ORM**: Drizzle ORM + Drizzle Kit
- **Autenticazione**: Auth.js (NextAuth v5 beta) con Credenziali Email/Password + Bcrypt
- **Drag & Drop**: `@hello-pangea/dnd`
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Hosting**: Vercel + Vercel Cron Jobs

---

## 🚀 Guida all'Installazione Locale

### 1. Clona il repository e installa le dipendenze
```bash
git clone https://github.com/Valugh1/deadline-tracker-2.0.git
cd deadline-tracker-2.0
npm install
```

### 2. Configura le variabili d'ambiente
Copia il file `.env.example` in `.env.local`:
```bash
cp .env.example .env.local
```

Configura la stringa di connessione Neon del tuo database:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"
CRON_SECRET="your-generated-cron-secret"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@kairon.app"
```

> **Generazione chiavi VAPID**: puoi generare una nuova coppia di chiavi in qualunque momento con il comando `npx web-push generate-vapid-keys`.

### 3. Esegui la migrazione del database su Neon
```bash
npm run db:push
```

### 4. Avvia il server di sviluppo
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## 🌐 Deploy su Vercel

1. Collega il repository GitHub `Valugh1/deadline-tracker-2.0` al tuo progetto Vercel **kairon**.
2. Vercel inietta automaticamente `DATABASE_URL` dall'integrazione Neon.
3. Aggiungi nelle Environment Variables di Vercel:
   - `AUTH_SECRET`: stringa generata casualmente (o quella in `.env.local`)
   - `CRON_SECRET`: stringa per autenticare le chiamate cron di Vercel e dello scheduler notifiche
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: chiave VAPID pubblica
   - `VAPID_PRIVATE_KEY`: chiave VAPID privata
   - `VAPID_SUBJECT`: indirizzo di contatto (es. `mailto:tuo@email.com`)
4. Configura uno scheduler (es. [cron-job.org](https://cron-job.org) ogni 5 minuti) verso `https://tuo-dominio.vercel.app/api/cron/notifications` con header `Authorization: Bearer <CRON_SECRET>`.
5. Il file `vercel.json` configurerà inoltre il reset di sicurezza notturno a `0 23 * * *` UTC.

---

## 📌 Prossimi Step e Roadmap (Future Implementazioni)

Di seguito sono documentati i requisiti approvati per le prossime iterazioni di sviluppo:

1. **Eliminazione dello stato "In Progress"**
   - Mantenere esclusivamente due stati: **To Do** e **Done**.
   - Aggiornamento della Kanban board a due colonne e adattamento di tutte le azioni di avanzamento rapido, drag & drop e schema DB.
2. **Notifica giornaliera scadenze odierne ("Oggi scadono le seguenti attività...")**
   - Integrare esplicitamente nel flusso delle notifiche giornaliere per le attività a lungo termine la dicitura e l'elenco dedicato: *"Oggi scadono le seguenti attività: ..."*.
3. **Deep Linking delle Notifiche su Attività Specifica**
   - Al tocco/click su una notifica push, aprire direttamente la schermata/modale di dettaglio del task di riferimento.
   - *Nota di design*: definire il piano d'azione (es. parametro URL `?taskId=<id>`, gestione stato di apertura automatica della modale via `SearchProvider` o `TaskDetailModal`).
4. **Nuova Icona dell'App e delle Notifiche**
   - Creazione e sostituzione delle icone PWA (`/public/icons/icon-192x192.png`, `512x512`, `icon.svg`) e badge monocromatico dedicato per la barra delle notifiche Android/iOS.
5. **Restyling e Aggiornamento Stile dell'App**
   - Refresh del design visuale, componenti UI, animazioni, palette colori e rifiniture grafiche per migliorare ulteriormente l'esperienza utente.

