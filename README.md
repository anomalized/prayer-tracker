# 🌸 Salah Tracker

A beautiful, secure, mobile-first prayer tracking web app built with Next.js + Supabase.

---
<img width="836" height="900" alt="image" src="https://github.com/user-attachments/assets/7d7b7bb6-9ec7-45ac-a7f3-9debc7521ee4" />
<img width="912" height="839" alt="image" src="https://github.com/user-attachments/assets/0a56c130-e340-436e-ada9-548ce5afbf3d" />


## 🚀 Sprint 1 — Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/prayer-tracker.git
cd prayer-tracker
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"** — give it a name like `prayer-tracker`
3. Wait for it to provision (~1 min)
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon / public` key
   - `service_role` key (keep this secret!)
5. Go to **SQL Editor** and paste the entire contents of `lib/schema.sql` — click **Run**   > **Note for existing projects:** a new boolean column `onboarding_complete` was added to `user_stats`.
   > If you're upgrading from an older schema, execute:
   > ```sql
   > ALTER TABLE user_stats ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;
   > ```6. Go to **Authentication → Settings** and make sure **"Enable Email Confirmations"** is turned OFF (so login is instant)

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the login screen!

---

## 🌍 Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add the same 4 variables from your `.env.local`
4. Click **Deploy** — done! Your app is live at `yourapp.vercel.app`
5. Share the link with friends — they can sign up and use it immediately

---

## 📁 Project Structure

```
prayer-tracker/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx       ← Login screen
│   │   └── signup/page.tsx      ← Sign up screen
│   ├── dashboard/
│   │   ├── today/page.tsx       ← Daily prayer logging (Sprint 3)
│   │   ├── stats/page.tsx       ← Heatmap & analytics (Sprint 6)
│   │   ├── rewards/page.tsx     ← Badges & rank (Sprint 7)
│   │   └── friends/page.tsx     ← Friend dashboard (Sprint 5)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   └── BottomNav.tsx        ← Bottom navigation bar
│   ├── prayers/                 ← Prayer cards (Sprint 3)
│   ├── stats/                   ← Charts & heatmap (Sprint 6)
│   ├── rewards/                 ← Badge components (Sprint 7)
│   └── friends/                 ← Friend components (Sprint 5)
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← Browser Supabase client
│   │   └── server.ts            ← Server Supabase client
│   ├── schema.sql               ← Run this in Supabase SQL editor
│   └── utils.ts                 ← Shared helpers
├── hooks/                       ← Custom React hooks (future sprints)
├── types/index.ts               ← All TypeScript types
├── middleware.ts                ← Auth session refresh + route protection
└── public/
    └── manifest.json            ← PWA manifest
```

---

## 🗺️ Sprint Roadmap

| Sprint | Focus                        | Status      |
|--------|------------------------------|-------------|
| 1      | Setup, routing, deployment   | ✅ Done      |
| 2      | Auth (login, signup, session)| ✅ Done      |
| 3      | Prayer logging core          | 🔜 Next      |
| 4      | Points & streaks             | ⏳ Upcoming  |
| 5      | Friend dashboard             | ⏳ Upcoming  |
| 6      | Stats & heatmap              | ⏳ Upcoming  |
| 7      | Badges & rewards             | ⏳ Upcoming  |
| 8      | Polish, PWA, notifications   | ⏳ Upcoming  |

---


