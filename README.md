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

### 6. Progressive Web App (PWA)
- Installabile su desktop, Android e iOS come app nativa.
- Web App Manifest (`/manifest.webmanifest`) e Service Worker offline (`/sw.js`).

### 7. Reset Automatico a Mezzanotte (Vercel Cron)
- Endpoint protetto `GET /api/cron/reset-daily` configurato in `vercel.json` (`0 22 * * *` UTC).
- Resetta tutte le attività giornaliere a *To Do* ogni notte.

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
```

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
   - `CRON_SECRET`: stringa per autenticare le chiamate cron di Vercel
4. Il file `vercel.json` configurerà automaticamente il cron job `reset-daily` a mezzanotte.
