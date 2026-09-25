import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { CASE_TEMPLATES } from "../../data/seed";
import { CaseStatus } from "../../types";
import { formatDate } from "../../utils/format";
import { Input, Panel, Pill, PrimaryButton, Select } from "../ui";

const STATUS_COLORS: Record<CaseStatus, string> = {
  OPEN: "#4B7BB5",
  UNDER_INVESTIGATION: "#B8934A",
  CLOSED: "#5B8C5A",
  COLD: "#8B93A7",
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: "Open",
  UNDER_INVESTIGATION: "Under Investigation",
  CLOSED: "Closed",
  COLD: "Cold",
};

const Archives: React.FC = () => {
  const { data } = useData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    return data.cases
      .filter((c) => (statusFilter === "ALL" ? true : c.status === statusFilter))
      .filter((c) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.involvedOfficers.some((o) => o.toLowerCase().includes(q)) ||
          c.wanteds.some((w) => w.name.toLowerCase().includes(q) || w.charges.toLowerCase().includes(q)) ||
          c.bolos.some((b) => b.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [data.cases, query, statusFilter]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">CID</p>
          <h1 className="font-display text-3xl text-bone-100">Archives</h1>
        </div>
        <Link to="/dashboard/cid/case/new">
          <PrimaryButton>+ New Case</PrimaryButton>
        </Link>
      </div>

      <Panel className="p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, wanted person, officer, location…"
          />
        </div>
        <div className="w-56">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "ALL")}>
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      <Panel className="divide-y divide-ink-600/40">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-bone-400 text-center">
            No cases match your filters yet.
          </p>
        ) : (
          filtered.map((c) => {
            const creator = data.users.find((u) => u.id === c.creatorId);
            return (
              <Link
                key={c.id}
                to={`/dashboard/cid/case/${c.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-ink-700/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-bone-100 font-medium truncate">{c.title}</p>
                  <p className="text-xs text-bone-400 mt-0.5">
                    {CASE_TEMPLATES[c.templateKey].label} · Filed by {creator?.name ?? "Unknown"} ·{" "}
                    {formatDate(c.createdAt)}
                  </p>
                </div>
                <Pill color={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Pill>
              </Link>
            );
          })
        )}
      </Panel>
    </div>
  );
};

export default Archives;
