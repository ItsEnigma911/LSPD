# LSPD Server Website

A website for a GTA RP server's Los Santos Police Department: a public
landing page, and a login-gated member dashboard with role/division-based
access control, an activity/points system, department + per-division chat
rooms, CID case management, a support ticket system, and per-division
handbook uploads.

**Two pieces, both deliberately simple:** a React frontend (`/`), and a
small backend (`/server`) that stores everything in one JSON file — no
database software to install, no Docker, no build step for the backend.
The backend exists for exactly one reason: **so data actually syncs between
different browsers/devices**, instead of everyone having their own separate
local copy.

## Running it locally

**1. Start the backend** (in one terminal):
```bash
cd server
npm install
npm start
```
Leave this running — it prints `LSPD backend running at http://localhost:4000`.

**2. Start the frontend** (in a second terminal, from the repo root):
```bash
npm install
npm run dev
```
Open the printed URL (usually `http://localhost:5173`).

The frontend talks to the backend at `http://localhost:4000` by default —
see `.env.example` if you need to point it somewhere else.

## Starter accounts

| Username        | Password  | Rank            |
|-----------------|-----------|-----------------|
| chief.hale      | chief123  | Chief of Police |
| dchief.moreno   | deputy123 | Deputy Chief    |

**Change both passwords immediately** from Account Settings. To add more
officers, log in as either of these and use Admin Panel → Personnel →
Create Account.

## What's implemented

- **Landing page** — LSPD header + a narrow, explained list of every
  division.
- **Login** — checked against the shared backend, so the same accounts
  work from any browser/device.
- **Dashboard home** — officer identity strip, rank-progress bar, a
  this-week-vs-last-week activity comparison, and a recent activity feed.
- **Activity & points** — submit an activity with an attached screenshot →
  "Pending" → command staff approve/reject in Admin Panel → approved points
  add to the user's total. Activity types and their point values:

  | Activity | Points |
  |---|---|
  | Pacific Bank Robbery | 15 |
  | Life Insurance Robbery (Bime) | 10 |
  | Maze Bank Robbery | 10 |
  | Jewelry Robbery | 10 |
  | Flat Jewelry | 10 |
  | Airport Robbery | 10 |
  | Art Gallery Robbery | 10 |
  | Museum Robbery | 10 |
  | Fleeca Robbery | 5 |
  | Shop Robbery | 5 |
  | Code 1 | 5 |
  | Dispatch Active Time | 10 / hour |
  | Interrogated Victims/Suspects | 2 |
  | Arrested Suspects | 5 |
  | Patrol Active Time | 10 |
  | Overall Activity | 1 / hour |

  Edit this list in `server/seed-data.js` — it only affects a fresh
  install (see that file's top comment).
- **Manual point adjustments** — Admin Panel → Personnel → "Add / Remove
  Points" per officer, with a reason and a visible audit trail.
- **Chat rooms** — one global room, one per division. Updates appear for
  everyone within a few seconds (polling, not instant push — see
  `server/README.md` for why that trade-off was made).
- **CID case management** — case templates, a tabbed editor (Details,
  Involved Officers, Wanted Persons, BOLOs, Narrative, Evidence), a
  rich-text narrative editor, multi-image evidence upload, and an Archives
  view with search + filters. Only the case's creator can change its status
  or delete it.
- **Support tickets** — anyone can file a ticket, optionally routed to a
  specific division's staff; command staff (or that division's members) can
  reply, assign a handler, and change status.
- **Division handbooks** — each division page has a document section for
  uploading/downloading a handbook, SOPs, or training material.
- **Divisions are fully dynamic** — command staff can create new ones from
  a "+ New Division" button pinned to the dashboard, or manage existing ones
  from Admin Panel → Divisions.
- **Account management** — command staff can create new accounts, remove
  ones no longer needed, and adjust rank/badge/callsign/division tags.
- **Safeguards** — at least one rank/division/command-staff account must
  always exist, and a rank can't be deleted while a member still holds it.

## Project structure

```
src/                     Frontend (React + TypeScript + Vite)
  types/                 Shared TypeScript interfaces
  api.ts                 fetch wrapper for talking to /server
  context/               AuthContext (login) and DataContext (all app data, polled from the backend)
  hooks/                 usePermissions
  components/            Same structure as before — Landing, Auth, Layout, Dashboard, Chat, Divisions, CID, Admin, Tickets

server/                  Backend — one file, no database engine
  server.js              All API routes; reads/writes data.json
  seed-data.js           Initial ranks/divisions/activity types/accounts (fresh installs only)
  data.json              Created automatically on first run — this IS the database. Back it up.
  README.md              More detail on how it works and hosting it
```

## Hosting it for real

The frontend builds to static files (`npm run build` → `dist/`) and can go
on Vercel, Cloudflare Pages, or Netlify. The backend (`/server`) stores
its data in Postgres (Neon) rather than a local file, so it deploys as its
own Vercel project too — see `server/README.md` for the exact steps
(create a second Vercel project rooted at `server`, set `DATABASE_URL` and
`API_KEY`, then point the frontend's `VITE_API_URL` at it and redeploy).
