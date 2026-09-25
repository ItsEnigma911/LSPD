import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { TicketStatus } from "../../types";
import { formatDateTime } from "../../utils/format";
import { Panel, Pill, PrimaryButton, Select } from "../ui";

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "#4B7BB5",
  IN_PROGRESS: "#B8934A",
  RESOLVED: "#5B8C5A",
  CLOSED: "#8B93A7",
};

const TicketList: React.FC = () => {
  const { currentUser } = useAuth();
  const { data } = useData();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [scope, setScope] = useState<"MINE" | "ALL">("MINE");

  if (!currentUser) return null;

  const visible = data.tickets
    .filter((t) => (scope === "MINE" ? t.creatorId === currentUser.id : true))
    .filter((t) => (statusFilter === "ALL" ? true : t.status === statusFilter))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">SUPPORT</p>
          <h1 className="font-display text-3xl text-bone-100">Tickets</h1>
        </div>
        <Link to="/dashboard/tickets/new">
          <PrimaryButton>+ New Ticket</PrimaryButton>
        </Link>
      </div>

      <Panel className="p-4 flex flex-wrap gap-3">
        <div className="w-44">
          <Select value={scope} onChange={(e) => setScope(e.target.value as "MINE" | "ALL")}>
            <option value="MINE">My Tickets</option>
            <option value="ALL">All Visible To Me</option>
          </Select>
        </div>
        <div className="w-56">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "ALL")}>
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
      </Panel>

      <Panel className="divide-y divide-ink-600/40">
        {visible.length === 0 ? (
          <p className="p-6 text-sm text-bone-400 text-center">No tickets match your filters.</p>
        ) : (
          visible.map((t) => {
            const creator = data.users.find((u) => u.id === t.creatorId);
            const division = t.division ? data.divisions.find((d) => d.key === t.division) : null;
            return (
              <Link
                key={t.id}
                to={`/dashboard/tickets/${t.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-ink-700/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-bone-100 font-medium truncate">{t.title}</p>
                  <p className="text-xs text-bone-400 mt-0.5">
                    {t.category} · Filed by {creator?.name ?? "Unknown"} · {formatDateTime(t.updatedAt)}
                    {t.replies.length > 0 && ` · ${t.replies.length} repl${t.replies.length === 1 ? "y" : "ies"}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {division && <Pill color={division.color}>{division.shortName}</Pill>}
                  <Pill color={STATUS_COLORS[t.status]}>{t.status.replace("_", " ")}</Pill>
                </div>
              </Link>
            );
          })
        )}
      </Panel>
    </div>
  );
};

export default TicketList;
