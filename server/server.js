// A deliberately simple backend: one Express app, one Postgres row as the
// "database" (table app_data, id=1, one JSONB column). No ORM, no
// migrations framework, no Docker — just Express + the Neon serverless
// Postgres driver.
//
// Every route reads the whole blob, changes one thing, and writes it back —
// same shape as the original local-JSON-file version, just persisted
// properly so it survives redeploys and works on serverless hosts (Vercel)
// where there's no writable local disk.
//
// NOTE ON CONCURRENCY: the original file-based version relied on Node's
// synchronous fs calls to guarantee one request's read-modify-write never
// interleaved with another's. That guarantee does NOT carry over here —
// on a serverless host, two requests can genuinely run at the same time in
// different instances, and if both load the blob, change different things,
// and save, the second save can overwrite the first's change (a "lost
// update"). For a small RP community's traffic this is a low-probability
// edge case, not a guaranteed bug — but if you outgrow that assumption,
// look at adding an optimistic-concurrency version column (UPDATE ...
// WHERE version = $1) or splitting hot paths (chat, activities) into their
// own tables with row-level writes instead of whole-blob writes.
//
// Auth is intentionally minimal: POST /api/login checks a username/password
// against the stored data and returns the matching user's data. There are
// no sessions/tokens; each browser just remembers who it logged in as. If
// you expose this on the public internet, set API_KEY (see .env.example)
// so random visitors can't call the API directly and edit your data
// without going through the site.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");
const { buildSeedData, DEFAULT_RANKS } = require("./seed-data");

const PORT = Number(process.env.PORT || 4000);
const API_KEY = process.env.API_KEY || ""; // empty = no key required (fine for local-only use)
const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env locally (or set DATABASE_URL in your host's environment variables) before starting the server."
  );
}

const sql = neon(DATABASE_URL);

// ---------------------------------------------------------------------------
// Storage: read/write the whole JSON blob, stored in one Postgres row.
// ---------------------------------------------------------------------------
async function loadData() {
  const rows = await sql`SELECT data FROM app_data WHERE id = 1`;
  if (rows.length === 0) {
    const seed = buildSeedData();
    await sql`INSERT INTO app_data (id, data) VALUES (1, ${JSON.stringify(seed)}::jsonb)`;
    return seed;
  }
  const parsed = rows[0].data;

  // Light self-healing, same idea as the old version: never let the app
  // get stuck with zero ranks or zero command ranks.
  if (!parsed.ranks || parsed.ranks.length === 0) parsed.ranks = DEFAULT_RANKS;
  if (!parsed.ranks.some((r) => r.isCommand)) {
    const maxLevel = Math.max(0, ...parsed.ranks.map((r) => r.level));
    const commandDefaults = DEFAULT_RANKS.filter((r) => r.isCommand);
    parsed.ranks = [...parsed.ranks, ...commandDefaults.map((r, i) => ({ ...r, level: maxLevel + i + 1 }))];
  }
  for (const key of ["users", "divisions", "activityTypes", "activities", "cases", "messages", "tickets", "documents", "pointAdjustments"]) {
    if (!parsed[key]) parsed[key] = [];
  }
  return parsed;
}

async function saveData(data) {
  await sql`UPDATE app_data SET data = ${JSON.stringify(data)}::jsonb WHERE id = 1`;
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Strips passwords before sending user records to the browser — the login
 * endpoint is the only place a password is ever checked or returned. */
function publicUsers(users) {
  return users.map(({ password, ...rest }) => rest);
}

function publicData(data) {
  return { ...data, users: publicUsers(data.users) };
}

/** Wraps an async route handler so a thrown/rejected error becomes a 500
 * instead of hanging the request (Express doesn't auto-catch async errors). */
function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" })); // generous — evidence/handbook files are stored as base64 in the JSON

if (API_KEY) {
  app.use("/api", (req, res, next) => {
    if (req.path === "/health") return next();
    if (req.header("x-api-key") !== API_KEY) return res.status(401).json({ error: "Missing or invalid API key." });
    next();
  });
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---- Bootstrap ----
app.get("/api/data", ah(async (_req, res) => {
  res.json(publicData(await loadData()));
}));

// ---- Login (the only place passwords are checked) ----
app.post("/api/login", ah(async (req, res) => {
  const { username, password } = req.body || {};
  const data = await loadData();
  const match = data.users.find((u) => u.username.toLowerCase() === String(username || "").trim().toLowerCase());
  if (!match) return res.status(401).json({ error: "No account found with that username." });
  if (match.password !== password) return res.status(401).json({ error: "Incorrect password." });
  const { password: _pw, ...publicUser } = match;
  res.json({ user: publicUser });
}));

// ---- Users ----
app.post("/api/users", ah(async (req, res) => {
  const { username, password, name } = req.body || {};
  const data = await loadData();
  const uname = String(username || "").trim().toLowerCase();
  if (!uname || !password || !name?.trim()) {
    return res.status(400).json({ error: "Username, password, and name are all required." });
  }
  if (data.users.some((u) => u.username.toLowerCase() === uname)) {
    return res.status(400).json({ error: "That username is already taken." });
  }
  const lowestRank = [...data.ranks].sort((a, b) => a.level - b.level)[0];
  const palette = ["#B8934A", "#6B7280", "#5B8C5A", "#4B7BB5", "#7B4B8A", "#A6332F", "#8B93A7"];
  const user = {
    id: uid("u"),
    username: uname,
    password,
    name: name.trim(),
    badgeNumber: null,
    callsign: null,
    rankId: lowestRank ? lowestRank.id : data.ranks[0]?.id,
    divisions: [],
    points: 0,
    avatarColor: palette[Math.floor(Math.random() * palette.length)],
    joinedAt: new Date().toISOString().slice(0, 10),
  };
  data.users.push(user);
  await saveData(data);
  const { password: _pw, ...publicUser } = user;
  res.status(201).json({ user: publicUser });
}));

app.patch("/api/users/:id", ah(async (req, res) => {
  const data = await loadData();
  const user = data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  const body = req.body || {};

  if (typeof body.newPassword === "string" && body.newPassword) {
    if (user.password !== body.currentPassword) return res.status(400).json({ error: "Current password is incorrect." });
    if (body.newPassword.length < 4) return res.status(400).json({ error: "New password must be at least 4 characters." });
    user.password = body.newPassword;
  }
  if (typeof body.username === "string") {
    const newUsername = body.username.trim().toLowerCase();
    if (!newUsername) return res.status(400).json({ error: "Username can't be empty." });
    const taken = data.users.some((u) => u.id !== user.id && u.username.toLowerCase() === newUsername);
    if (taken) return res.status(400).json({ error: "That username is already taken." });
    user.username = newUsername;
  }
  for (const field of ["name", "badgeNumber", "callsign", "rankId"]) {
    if (field in body) user[field] = body[field];
  }
  await saveData(data);
  const { password: _pw, ...publicUser } = user;
  res.json({ user: publicUser });
}));

app.put("/api/users/:id/divisions", ah(async (req, res) => {
  const data = await loadData();
  const user = data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  if (!Array.isArray(req.body?.divisions)) return res.status(400).json({ error: "divisions must be an array." });
  user.divisions = req.body.divisions;
  await saveData(data);
  const { password: _pw, ...publicUser } = user;
  res.json({ user: publicUser });
}));

app.delete("/api/users/:id", ah(async (req, res) => {
  const data = await loadData();
  const target = data.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "User not found." });
  const isCommandUser = (u) => data.ranks.find((r) => r.id === u.rankId)?.isCommand;
  if (isCommandUser(target)) {
    const otherCommand = data.users.filter((u) => u.id !== target.id && isCommandUser(u));
    if (otherCommand.length === 0) return res.status(400).json({ error: "At least one command staff account must always exist." });
  }
  data.users = data.users.filter((u) => u.id !== target.id);
  await saveData(data);
  res.json({ ok: true });
}));

app.post("/api/users/:id/points", ah(async (req, res) => {
  const { delta, reason, adjustedById } = req.body || {};
  if (!Number.isInteger(delta) || delta === 0) return res.status(400).json({ error: "Amount must be a non-zero whole number." });
  const data = await loadData();
  const user = data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.points += delta;
  data.pointAdjustments.unshift({
    id: uid("adj"),
    userId: user.id,
    delta,
    reason: reason || "",
    adjustedById: adjustedById || "",
    createdAt: new Date().toISOString(),
  });
  await saveData(data);
  res.status(201).json({ ok: true });
}));

// ---- Ranks ----
app.post("/api/ranks", ah(async (req, res) => {
  const { name, level, pointThreshold, isCommand } = req.body || {};
  if (!name || typeof level !== "number" || typeof pointThreshold !== "number") {
    return res.status(400).json({ error: "name, level, and pointThreshold are required." });
  }
  const data = await loadData();
  data.ranks.push({ id: uid("r"), name, level, pointThreshold, isCommand: !!isCommand });
  await saveData(data);
  res.status(201).json({ ok: true });
}));

app.patch("/api/ranks/:id", ah(async (req, res) => {
  const data = await loadData();
  const rank = data.ranks.find((r) => r.id === req.params.id);
  if (!rank) return res.status(404).json({ error: "Rank not found." });
  if (req.body?.isCommand === false && rank.isCommand) {
    const others = data.ranks.filter((r) => r.id !== rank.id && r.isCommand);
    if (others.length === 0) return res.status(400).json({ error: "At least one rank must stay marked as a command rank." });
  }
  Object.assign(rank, req.body || {});
  await saveData(data);
  res.json({ ok: true });
}));

app.delete("/api/ranks/:id", ah(async (req, res) => {
  const data = await loadData();
  const target = data.ranks.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Rank not found." });
  if (data.ranks.length <= 1) return res.status(400).json({ error: "You need at least one rank — add a replacement before deleting this one." });
  const holders = data.users.filter((u) => u.rankId === target.id);
  if (holders.length > 0) return res.status(400).json({ error: `${holders.length} member(s) currently hold this rank — reassign them first.` });
  if (target.isCommand) {
    const others = data.ranks.filter((r) => r.id !== target.id && r.isCommand);
    if (others.length === 0) return res.status(400).json({ error: "At least one command rank must always exist." });
  }
  data.ranks = data.ranks.filter((r) => r.id !== target.id);
  await saveData(data);
  res.json({ ok: true });
}));

app.post("/api/ranks/restore-defaults", ah(async (_req, res) => {
  const data = await loadData();
  const existingNames = new Set(data.ranks.map((r) => r.name.toLowerCase()));
  const maxLevel = Math.max(0, ...data.ranks.map((r) => r.level));
  const missing = DEFAULT_RANKS.filter((r) => !existingNames.has(r.name.toLowerCase()));
  data.ranks.push(...missing.map((r, i) => ({ ...r, level: maxLevel + i + 1 })));
  await saveData(data);
  res.json({ ok: true });
}));

// ---- Divisions ----
function slugifyDivisionKey(name, existingKeys) {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "DIVISION";
  if (!existingKeys.includes(base)) return base;
  let n = 2;
  while (existingKeys.includes(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

app.post("/api/divisions", ah(async (req, res) => {
  const { name, shortName, description, icon, color } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required." });
  const data = await loadData();
  const key = slugifyDivisionKey(name, data.divisions.map((d) => d.key));
  const division = { key, name, shortName: shortName || name, description: description || "No description yet.", icon: icon || "🚔", color: color || "#B8934A", builtIn: false };
  data.divisions.push(division);
  await saveData(data);
  res.status(201).json({ division });
}));

app.patch("/api/divisions/:key", ah(async (req, res) => {
  const data = await loadData();
  const division = data.divisions.find((d) => d.key === req.params.key);
  if (!division) return res.status(404).json({ error: "Division not found." });
  Object.assign(division, req.body || {});
  await saveData(data);
  res.json({ ok: true });
}));

app.delete("/api/divisions/:key", ah(async (req, res) => {
  const data = await loadData();
  if (data.divisions.length <= 1) return res.status(400).json({ error: "At least one division must always exist." });
  const key = req.params.key;
  data.divisions = data.divisions.filter((d) => d.key !== key);
  data.users.forEach((u) => { u.divisions = u.divisions.filter((d) => d !== key); });
  data.messages = data.messages.filter((m) => m.roomId !== key);
  data.documents = data.documents.filter((d) => d.divisionKey !== key);
  await saveData(data);
  res.json({ ok: true });
}));

// ---- Activities ----
app.post("/api/activities", ah(async (req, res) => {
  const data = await loadData();
  const entry = { ...req.body, id: uid("act"), status: "PENDING", submittedAt: new Date().toISOString() };
  data.activities.unshift(entry);
  await saveData(data);
  res.status(201).json({ ok: true });
}));

app.patch("/api/activities/:id/review", ah(async (req, res) => {
  const { status, reviewerId } = req.body || {};
  const data = await loadData();
  const entry = data.activities.find((a) => a.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Activity not found." });
  const type = data.activityTypes.find((t) => t.id === entry.activityTypeId);
  const pointsToAward = type ? type.points * entry.quantity : 0;
  const wasApproved = entry.status === "APPROVED";
  const willBeApproved = status === "APPROVED";
  let delta = 0;
  if (!wasApproved && willBeApproved) delta = pointsToAward;
  if (wasApproved && !willBeApproved) delta = -pointsToAward;
  const user = data.users.find((u) => u.id === entry.userId);
  if (user) user.points += delta;
  entry.status = status;
  entry.reviewedBy = reviewerId;
  await saveData(data);
  res.json({ ok: true });
}));

// ---- CID Cases ----
app.post("/api/cases", ah(async (req, res) => {
  const data = await loadData();
  const now = new Date().toISOString();
  const record = { ...req.body, id: uid("case"), createdAt: now, updatedAt: now };
  data.cases.unshift(record);
  await saveData(data);
  res.status(201).json({ id: record.id });
}));

app.patch("/api/cases/:id", ah(async (req, res) => {
  const data = await loadData();
  const record = data.cases.find((c) => c.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Case not found." });
  Object.assign(record, req.body || {}, { updatedAt: new Date().toISOString() });
  await saveData(data);
  res.json({ ok: true });
}));

app.delete("/api/cases/:id", ah(async (req, res) => {
  const data = await loadData();
  data.cases = data.cases.filter((c) => c.id !== req.params.id);
  await saveData(data);
  res.json({ ok: true });
}));

// ---- Chat ----
app.post("/api/messages", ah(async (req, res) => {
  const { roomId, senderId, content } = req.body || {};
  if (!roomId || !senderId || !content?.trim()) return res.status(400).json({ error: "roomId, senderId, and content are required." });
  const data = await loadData();
  const message = { id: uid("msg"), roomId, senderId, content: content.trim(), createdAt: new Date().toISOString() };
  data.messages.push(message);
  await saveData(data);
  res.status(201).json({ ok: true });
}));

app.delete("/api/messages/:id", ah(async (req, res) => {
  const data = await loadData();
  data.messages = data.messages.filter((m) => m.id !== req.params.id);
  await saveData(data);
  res.json({ ok: true });
}));

// ---- Tickets ----
app.post("/api/tickets", ah(async (req, res) => {
  const data = await loadData();
  const now = new Date().toISOString();
  const ticket = { ...req.body, id: uid("ticket"), status: "OPEN", assignedToId: null, createdAt: now, updatedAt: now, replies: [] };
  data.tickets.unshift(ticket);
  await saveData(data);
  res.status(201).json({ ok: true });
}));

app.post("/api/tickets/:id/replies", ah(async (req, res) => {
  const { authorId, content } = req.body || {};
  if (!authorId || !content?.trim()) return res.status(400).json({ error: "authorId and content are required." });
  const data = await loadData();
  const ticket = data.tickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  ticket.replies.push({ id: uid("reply"), ticketId: ticket.id, authorId, content: content.trim(), createdAt: new Date().toISOString() });
  ticket.updatedAt = new Date().toISOString();
  await saveData(data);
  res.status(201).json({ ok: true });
}));

app.patch("/api/tickets/:id", ah(async (req, res) => {
  const data = await loadData();
  const ticket = data.tickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  Object.assign(ticket, req.body || {}, { updatedAt: new Date().toISOString() });
  await saveData(data);
  res.json({ ok: true });
}));

// ---- Division handbook documents ----
app.post("/api/divisions/:key/documents", ah(async (req, res) => {
  const { title, fileUrl, uploadedById } = req.body || {};
  if (!title?.trim() || !fileUrl) return res.status(400).json({ error: "title and fileUrl are required." });
  const data = await loadData();
  const doc = { id: uid("doc"), divisionKey: req.params.key, title: title.trim(), fileUrl, uploadedById, createdAt: new Date().toISOString() };
  data.documents.unshift(doc);
  await saveData(data);
  res.status(201).json({ ok: true });
}));

app.delete("/api/divisions/:key/documents/:docId", ah(async (req, res) => {
  const data = await loadData();
  data.documents = data.documents.filter((d) => d.id !== req.params.docId);
  await saveData(data);
  res.json({ ok: true });
}));

// Generic error handler — catches anything ah() forwarded (e.g. a database
// hiccup) so callers get a JSON 500 instead of a hung connection.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

// Only start a standalone listener when run directly (`node server.js`) —
// on Vercel, api/index.js imports `app` and Vercel handles the listening.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LSPD backend running at http://localhost:${PORT}`);
    console.log(DATABASE_URL ? "Connected to Postgres via DATABASE_URL." : "WARNING: DATABASE_URL not set.");
    if (!API_KEY) console.log("No API_KEY set — anyone who finds this server's URL can read/write its data. Fine for local use; set API_KEY before exposing this publicly.");
  });
}

module.exports = app;
