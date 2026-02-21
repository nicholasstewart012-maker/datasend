# DataBridge 🔗

Transfer files and text snippets between your computers through a private web app hosted on Vercel.

---

## Troubleshooting the 500 Errors

### Problem 1: `/api/files` and `/api/text` returning 500
**Cause:** Supabase environment variables aren't set in Vercel.

**Fix:**
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these two variables:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon/public key
3. Go to **Deployments** → click the `...` on your latest deploy → **Redeploy**

---

### Problem 2: Upload returning 405 Method Not Allowed
**Cause:** The Supabase storage bucket is missing an RLS (Row Level Security) policy that allows uploads.

**Fix — run this SQL in Supabase → SQL Editor:**

```sql
-- Allow anyone to upload to the data-bridge bucket
create policy "Public uploads"
on storage.objects for insert
to anon
with check (bucket_id = 'data-bridge');

-- Allow anyone to read files
create policy "Public reads"
on storage.objects for select
to anon
using (bucket_id = 'data-bridge');

-- Allow anyone to delete files
create policy "Public deletes"
on storage.objects for delete
to anon
using (bucket_id = 'data-bridge');
```

Then redeploy on Vercel.

---

## Fresh Setup Guide

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → create a free account
2. Click **New Project** → name it `data-bridge`
3. Go to **Storage** → **New Bucket** → name it `data-bridge` → toggle **Public** ON → Create
4. Go to **SQL Editor** and run this:

```sql
-- Text clips table
create table text_clips (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  label text,
  created_at timestamptz default now()
);

-- Storage policies (REQUIRED for uploads to work)
create policy "Public uploads"
on storage.objects for insert
to anon
with check (bucket_id = 'data-bridge');

create policy "Public reads"
on storage.objects for select
to anon
using (bucket_id = 'data-bridge');

create policy "Public deletes"
on storage.objects for delete
to anon
using (bucket_id = 'data-bridge');
```

5. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 2 — Push to GitHub

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

1. [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. Under **Environment Variables** add both Supabase keys
3. Click **Deploy**

---

### Step 4 — Use it

Open your Vercel URL on both computers.

- **Files tab**: Drag & drop to upload → click **↓ Get** to download on the other machine
- **Text tab**: Paste anything → click **⎘ Copy** on the other machine

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials

npm install
npm run dev
# http://localhost:3000
```
