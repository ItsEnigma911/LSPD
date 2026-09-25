// Initial data written to data.json the first time the server runs (if
// data.json doesn't exist yet). After that, data.json is the source of
// truth — editing this file again won't change anything already saved.

const DEFAULT_RANKS = [
  { id: "r1", name: "Cadet", level: 1, pointThreshold: 0, isCommand: false },
  { id: "r2", name: "Officer", level: 2, pointThreshold: 50, isCommand: false },
  { id: "r3", name: "Corporal", level: 3, pointThreshold: 150, isCommand: false },
  { id: "r4", name: "Sergeant", level: 4, pointThreshold: 300, isCommand: false },
  { id: "r5", name: "Lieutenant", level: 5, pointThreshold: 500, isCommand: false },
  { id: "r6", name: "Captain", level: 6, pointThreshold: 750, isCommand: false },
  { id: "r7", name: "Assistant Chief", level: 7, pointThreshold: 1000, isCommand: true },
  { id: "r8", name: "Deputy Chief", level: 8, pointThreshold: 1250, isCommand: true },
  { id: "r9", name: "Chief of Police", level: 9, pointThreshold: 1500, isCommand: true },
];

const DEFAULT_DIVISIONS = [
  { key: "CID", name: "Criminal Investigation Division", shortName: "CID", description: "Case building, evidence, and follow-up investigations.", color: "#B8934A", icon: "🔍", builtIn: true },
  { key: "SWAT", name: "Special Weapons and Tactics", shortName: "SWAT", description: "High-risk entries, barricades, and tactical response.", color: "#6B7280", icon: "🛡️", builtIn: true },
  { key: "HR", name: "Human Resources", shortName: "HR", description: "Recruitment, callsigns, and internal personnel affairs.", color: "#5B8C5A", icon: "🗂️", builtIn: true },
  { key: "DISPATCH", name: "Dispatch", shortName: "Dispatch", description: "Call routing, unit coordination, and callsign assignment.", color: "#4B7BB5", icon: "📡", builtIn: true },
  { key: "XRAY", name: "X-Ray Division", shortName: "X-Ray", description: "Undercover and specialized covert operations.", color: "#7B4B8A", icon: "🕶️", builtIn: true },
  { key: "STATE_TROOPER", name: "State Trooper Division", shortName: "State Trooper", description: "Highway patrol and state-wide traffic enforcement.", color: "#A6332F", icon: "🚓", builtIn: true },
];

const DEFAULT_ACTIVITY_TYPES = [
  { id: "a1", label: "Pacific Bank Robbery", points: 15 },
  { id: "a2", label: "Life Insurance Robbery (Bime)", points: 10 },
  { id: "a3", label: "Maze Bank Robbery", points: 10 },
  { id: "a4", label: "Jewelry Robbery", points: 10 },
  { id: "a5", label: "Flat Jewelry", points: 10 },
  { id: "a6", label: "Airport Robbery", points: 10 },
  { id: "a7", label: "Art Gallery Robbery", points: 10 },
  { id: "a8", label: "Museum Robbery", points: 10 },
  { id: "a9", label: "Fleeca Robbery", points: 5 },
  { id: "a10", label: "Shop Robbery", points: 5 },
  { id: "a11", label: "Code 1", points: 5 },
  { id: "a12", label: "Dispatch Active Time (per hour)", points: 10 },
  { id: "a13", label: "Interrogated Victims/Suspects", points: 2 },
  { id: "a14", label: "Arrested Suspects", points: 5 },
  { id: "a15", label: "Patrol Active Time", points: 10 },
  { id: "a16", label: "Overall Activity (per hour)", points: 1 },
];

// Change these passwords immediately after first login (Account Settings).
const DEFAULT_USERS = [
  {
    id: "u1",
    username: "chief.hale",
    password: "chief123",
    name: "R. Hale",
    badgeNumber: "0001",
    callsign: "L-1",
    rankId: "r9",
    divisions: ["CID", "SWAT", "HR", "DISPATCH", "XRAY", "STATE_TROOPER"],
    points: 0,
    avatarColor: "#B8934A",
    joinedAt: "2023-01-10",
  },
  {
    id: "u2",
    username: "dchief.moreno",
    password: "deputy123",
    name: "A. Moreno",
    badgeNumber: "0002",
    callsign: "L-2",
    rankId: "r8",
    divisions: ["CID", "SWAT"],
    points: 0,
    avatarColor: "#4B7BB5",
    joinedAt: "2023-02-14",
  },
];

function buildSeedData() {
  return {
    users: DEFAULT_USERS,
    ranks: DEFAULT_RANKS,
    divisions: DEFAULT_DIVISIONS,
    activityTypes: DEFAULT_ACTIVITY_TYPES,
    activities: [],
    cases: [],
    messages: [
      {
        id: "m1",
        roomId: "GLOBAL",
        senderId: "u1",
        content: "Welcome to the LSPD department-wide channel. Keep it professional.",
        createdAt: new Date().toISOString(),
      },
    ],
    tickets: [],
    documents: [],
    pointAdjustments: [],
  };
}

module.exports = { buildSeedData, DEFAULT_RANKS };
