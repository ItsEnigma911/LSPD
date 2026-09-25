import { AppData, Rank, User } from "../types";

export function rankOf(user: User, data: AppData): Rank | undefined {
  return data.ranks.find((r) => r.id === user.rankId);
}

/** Returns the next rank up by level, or undefined if already at the top. */
export function nextRankOf(user: User, data: AppData): Rank | undefined {
  const current = rankOf(user, data);
  if (!current) return undefined;
  return [...data.ranks]
    .filter((r) => r.level > current.level)
    .sort((a, b) => a.level - b.level)[0];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as first day
  d.setHours(0, 0, 0, 0);
  return new Date(d.setDate(diff));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
