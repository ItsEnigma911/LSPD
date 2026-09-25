// ---------------------------------------------------------------------------
// Core domain types for the LSPD server website
// ---------------------------------------------------------------------------

// DivisionKey used to be a fixed union of the six starting divisions. It's now
// a plain string so command staff can create new divisions ("channels") from
// the dashboard without touching code — see DataContext.addDivision.
export type DivisionKey = string;

export interface Division {
  key: DivisionKey;
  name: string;
  shortName: string;
  description: string;
  color: string; // hex accent used for badges/tags/chat room
  icon: string; // emoji used for the rounded division logo
  /** True for the seeded starting divisions; custom ones created from the
   * dashboard are false. Informational only — doesn't restrict anything. */
  builtIn?: boolean;
}

export interface Rank {
  id: string;
  name: string;
  level: number; // higher = more senior
  pointThreshold: number; // points suggested before eligible for this rank
  /** The three command ranks that can manage ranks / division tags / badges */
  isCommand: boolean;
}

export type Permission =
  | "MANAGE_RANKS"
  | "MANAGE_DIVISIONS"
  | "ASSIGN_BADGE"
  | "ASSIGN_CALLSIGN"
  | "REVIEW_ACTIVITY"
  | "MODERATE_CHAT";

export interface User {
  id: string;
  username: string;
  password: string; // stored locally for this no-backend version — see AuthContext
  name: string;
  badgeNumber: string | null;
  callsign: string | null;
  rankId: string;
  divisions: DivisionKey[];
  points: number;
  avatarColor: string;
  joinedAt: string; // ISO date
}

export type ActivityStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ActivityType {
  id: string;
  label: string;
  points: number;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  activityTypeId: string;
  description: string;
  quantity: number; // e.g. hours, or count
  proofUrl?: string; // base64 image, demo only
  status: ActivityStatus;
  submittedAt: string; // ISO date
  reviewedBy?: string;
}

export type CaseStatus = "OPEN" | "UNDER_INVESTIGATION" | "CLOSED" | "COLD";

export type CaseTemplateKey = "ARREST" | "INVESTIGATION" | "EVIDENCE_LOG";

export interface CaseTemplate {
  key: CaseTemplateKey;
  label: string;
  description: string;
  fields: string[]; // suggested narrative sections for this template
}

export interface WantedEntry {
  id: string;
  name: string;
  charges: string;
}

export interface BoloEntry {
  id: string;
  description: string;
}

export interface CaseRecord {
  id: string;
  division: DivisionKey; // currently only "CID" produces cases
  templateKey: CaseTemplateKey;
  title: string;
  creatorId: string;
  status: CaseStatus;
  location: string;
  involvedOfficers: string[]; // officer names / badge numbers on the case
  wanteds: WantedEntry[]; // wanted persons tied to this case
  bolos: BoloEntry[]; // active BOLOs tied to this case
  narrativeHtml: string; // rich text HTML from the case editor
  images: string[]; // base64 data URLs, demo only
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string; // "GLOBAL" or a DivisionKey
  senderId: string;
  content: string;
  createdAt: string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface TicketReply {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  division: DivisionKey | null; // optional routing to a division's staff (e.g. "HR")
  status: TicketStatus;
  creatorId: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

export interface DivisionDocument {
  id: string;
  divisionKey: DivisionKey;
  title: string;
  fileUrl: string;
  uploadedById: string;
  createdAt: string;
}

export interface PointAdjustment {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  adjustedById: string;
  createdAt: string;
}

export interface AppData {
  users: User[];
  ranks: Rank[];
  divisions: Division[];
  activityTypes: ActivityType[];
  activities: ActivityEntry[];
  cases: CaseRecord[];
  messages: ChatMessage[];
  tickets: Ticket[];
  documents: DivisionDocument[];
  pointAdjustments: PointAdjustment[];
}
