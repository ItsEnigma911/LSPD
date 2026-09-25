# LSPD simple backend

The smallest reasonable backend to make data (roster, chat, cases, etc.)
sync across every browser/device instead of staying stuck on one — one
Express app, one Postgres table.

## Run it locally

```bash
cd server
npm install
cp .env.example .env   # then fill in DATABASE_URL (see below)
npm start
```

That's it. It prints `LSPD backend running at http://localhost:4000`.

## How it works

- Everything (users, ranks, divisions, activities, cases, chat messages,
  tickets, handbook documents) lives as **one JSON blob in one Postgres
  row** (table `app_data`, id `1`). Every action from the website calls a
  small API route here, which reads that row, changes one thing, and
  writes it back — the same simple mental model as the old local-file
  version, just persisted properly.
- There's no separate login/session system — the site checks a
  username/password against that row via `POST /api/login`, and each
  browser just remembers who it's logged in as locally. Passwords are
  never sent back to the browser except at that one login check.

## Deploying on Vercel

This folder is set up to deploy as its own Vercel project:

1. In Vercel, create a **new project** from the same GitHub repo, but set
   its **Root Directory** to `server`. (Your existing `lspd-nu` project
   should keep its root directory as `.` / the repo root — that one stays
   the frontend.)
2. In that new project's **Settings → Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `API_KEY` — a random string (recommended once this is public — see
     "Security note" below)
3. Deploy. Vercel will pick up `vercel.json` and `api/index.js`
   automatically — no other config needed.
4. Note the URL Vercel gives this project (e.g.
   `https://lspd-backend.vercel.app`).
5. Back in your **frontend** Vercel project's environment variables, set
   `VITE_API_URL` to that URL, then redeploy the frontend so it's baked
   into the build (Vite env vars are read at build time, not runtime).

## A note on concurrency

The original file-based version relied on Node's synchronous file I/O to
guarantee one request's read-modify-write never overlapped another's.
That guarantee doesn't carry over to a normal SQL `UPDATE` the way it's
used here — on a serverless host, two requests can genuinely run at the
same time, and if both load the blob, change different things, and save,
the second write can silently overwrite the first's change. For a small
RP community's traffic this is unlikely to bite you, but if activity picks
up and you notice things reverting, that's the mechanism — ask for help
adding optimistic-concurrency locking or splitting hot paths (chat,
activities) into their own tables.

## Security note

This is intentionally simple, not enterprise-grade: passwords are stored
as plain text, and there's no rate-limiting or account lockout on login
attempts. Fine for a small private RP community; don't reuse a password
here that matters anywhere else. **Set `API_KEY`** once this is reachable
on the public internet — otherwise anyone who finds the URL can read or
edit all your data directly, bypassing the website.
