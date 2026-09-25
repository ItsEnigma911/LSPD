import { CaseTemplate, CaseTemplateKey } from "../types";

// Static display metadata for the CID case editor's template picker. This is
// the only thing left in this file — actual data (ranks, divisions, users,
// activity types, seed accounts) now lives on the backend (see
// server/seed-data.js), synced into the app via the API.
export const CASE_TEMPLATES: Record<CaseTemplateKey, CaseTemplate> = {
  ARREST: {
    key: "ARREST",
    label: "Arrest Report",
    description: "Documents an arrest, charges, and circumstances.",
    fields: ["Summary of incident", "Charges filed", "Statement of probable cause", "Evidence collected"],
  },
  INVESTIGATION: {
    key: "INVESTIGATION",
    label: "Investigation Report",
    description: "Ongoing or closed investigation into a case or person of interest.",
    fields: ["Background", "Persons of interest", "Timeline of events", "Findings / next steps"],
  },
  EVIDENCE_LOG: {
    key: "EVIDENCE_LOG",
    label: "Evidence Log",
    description: "Chain-of-custody log for physical or digital evidence.",
    fields: ["Item description", "Location recovered", "Chain of custody", "Storage location"],
  },
};
