# DataBridge 🔗

Transfer files and text snippets between your computers through a private web app hosted on Vercel.

---

## Setup Guide (Step by Step)

### Step 1 — Set up Supabase (free storage)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → give it a name like `data-bridge`
3. Once your project loads, go to **Storage** in the left sidebar
4. Click **New Bucket** → name it `data-bridge` → set it to **Public** → click Create
5. Go to **SQL Editor** and run this to create the text clips table:

```sql
create table text_clips (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  label text,
  created_at timestamptz default now()
);
```

6. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 2 — Push this code to your GitHub repo

```bash
cd data-bridge
git init
git add .
git commit -m "Initial DataBridge app"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → Import your `data-bridge` repo
3. Before deploying, click **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → paste your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste your Supabase anon key
4. Click **Deploy**

That's it! Vercel gives you a live URL like `https://data-bridge-xyz.vercel.app`

---

### Step 4 — Use it!

Open the URL on **both** your personal and work computers.

- **Files tab**: Drag and drop files to upload. Click **↓ Get** to download on the other machine.
- **Text tab**: Paste commands, URLs, env vars, code snippets — anything. Click **⎘ Copy** to grab it on the other machine.

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local

npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Notes

- Files are stored in Supabase Storage (free tier: 1 GB)
- Text clips are stored in Supabase Postgres (free tier: 500 MB)
- No login required — keep your URL private
- Every `git push` auto-redeploys to Vercel
