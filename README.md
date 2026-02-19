# SmartMarks — Smart Bookmark App

A real-time bookmark manager built with **Next.js 15 (App Router)**, **Supabase**, and **Tailwind CSS**. Google OAuth only, private per-user bookmarks, and live sync across browser tabs.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime (postgres_changes) |
| Styling | Tailwind CSS |
| Deploy | Vercel |

---

## Project Structure

```
smart-bookmarks/
├── app/
│   ├── layout.js                  # Root layout with fonts
│   ├── globals.css                # Tailwind + custom animations
│   ├── page.js                    # Login page (server component)
│   ├── bookmarks/
│   │   └── page.js                # Bookmarks page (server, protected)
│   └── auth/
│       └── callback/
│           └── route.js           # OAuth callback handler
├── components/
│   ├── LoginButton.js             # Google OAuth button (client)
│   └── BookmarksClient.js         # Main bookmarks UI + realtime (client)
├── lib/
│   ├── supabase-browser.js        # Browser Supabase client
│   └── supabase-server.js         # Server Supabase client (async, Next.js 15)
├── middleware.js                  # Auth route protection + session refresh
├── supabase-migration.sql         # DB schema + RLS + Realtime setup
├── .env.local.example             # Environment variable template
└── vercel.json                    # Vercel deployment config
```

---

## Setup Guide

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**.
2. Paste and run the contents of `supabase-migration.sql`.

This creates:
- `bookmarks` table with `user_id`, `url`, `title`, `created_at`
- Row Level Security (RLS) policies so users only see their own data
- Realtime enabled on the table

### Step 3 — Enable Realtime for the Table

1. In Supabase, go to **Database → Replication**.
2. Find the `bookmarks` table and toggle it **on**.
3. Then go to **Database → Publications → supabase_realtime** and confirm `bookmarks` is listed.

> Without this step, bookmarks will still save correctly (with optimistic UI), but cross-tab realtime sync won't work.

### Step 4 — Enable Google OAuth

1. Go to **Authentication → Providers → Google**.
2. Enable Google OAuth.
3. In [Google Cloud Console](https://console.cloud.google.com):
   - Create a new project (or use an existing one).
   - Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**.
   - Set **Authorized JavaScript Origins**: `https://your-supabase-project.supabase.co`
   - Set **Authorized redirect URIs**: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** back into Supabase Google provider settings.

### Step 5 — Local Development

```cmd
cd smart-bookmarks

npm install

copy .env.local.example .env.local

notepad .env.local
```

Fill in your values and save:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Then run:
```cmd
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Step 6 — Deploy to Vercel

#### Option A: Vercel CLI
```cmd
npm install -g vercel
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

#### Option B: GitHub + Vercel Dashboard
1. Push the project to a GitHub repository.
2. Go to [https://vercel.com](https://vercel.com), click **New Project**, and import the repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

### Step 7 — Update Supabase URLs for Production

After deploying, go to Supabase → **Authentication → URL Configuration**:
- Set **Site URL** to your Vercel production URL: `https://your-app.vercel.app`
- Add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## Known Issues & Fixes

### `cookies()` must be awaited (Next.js 15)
Next.js 15 made `cookies()` async. The `createClient()` function in `lib/supabase-server.js` must be `async` and use `await cookies()`. All callers (`app/bookmarks/page.js`, `app/auth/callback/route.js`) must also `await createClient()`.

```js
// lib/supabase-server.js
export async function createClient() {
  const cookieStore = await cookies()  // await is required
  ...
}

// app/bookmarks/page.js and app/auth/callback/route.js
const supabase = await createClient()  // await is required
```

### Hydration warning from browser extensions
If you see a React hydration mismatch warning mentioning `data-gr-ext-installed`, it's caused by the **Grammarly browser extension** modifying the `<body>` tag. Fix it by adding `suppressHydrationWarning` to `<body>` in `app/layout.js`:

```jsx
<body
  className="bg-[#0a0a0a] text-[#e8e8e0] min-h-screen font-mono antialiased"
  suppressHydrationWarning
>
```

### Bookmarks don't appear without a page refresh
The insert call must use `.select().single()` to return the saved row and update state immediately (optimistic UI). Realtime handles cross-tab sync, but the inserting tab should not rely on it alone. Update `handleAdd` in `BookmarksClient.js`:

```js
const { data, error: insertError } = await supabase
  .from('bookmarks')
  .insert({ user_id: user.id, url: finalUrl, title: finalTitle })
  .select()   // returns the inserted row
  .single()

// on success, add to local state immediately:
if (!insertError) {
  setBookmarks((prev) => {
    if (prev.find((b) => b.id === data.id)) return prev
    return [data, ...prev]
  })
}
```

---

## How Realtime Works

```js
supabase
  .channel('bookmarks-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${user.id}`,  // server-side filter for privacy
  }, (payload) => {
    // INSERT → add to list, DELETE → remove from list
  })
  .subscribe()
```

The `filter` ensures each user's realtime channel only receives their own bookmark changes. Combined with optimistic UI on insert, the app feels instant in the active tab and syncs automatically across any other open tabs.