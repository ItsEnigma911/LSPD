import React, { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { usePermissions } from "../../hooks/usePermissions";
import { TicketStatus } from "../../types";
import { formatDateTime } from "../../utils/format";
import { Avatar, GhostButton, Input, Panel, Pill, PrimaryButton, Select, SectionLabel } from "../ui";

const STATUS_OPTIONS: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "#4B7BB5",
  IN_PROGRESS: "#B8934A",
  RESOLVED: "#5B8C5A",
  CLOSED: "#8B93A7",
};

const TicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { currentUser } = useAuth();
  const { data, replyToTicket, updateTicketStatus, assignTicket } = useData();
  const { isCommand, hasDivision } = usePermissions();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const ticket = data.tickets.find((t) => t.id === ticketId);
  if (!ticket || !currentUser) return <Navigate to="/dashboard/tickets" replace />;

  const creator = data.users.find((u) => u.id === ticket.creatorId);
  const division = ticket.division ? data.divisions.find((d) => d.key === ticket.division) : null;
  const canManage = isCommand || (ticket.division ? hasDivision(ticket.division) : false);
  const isCreator = ticket.creatorId === currentUser.id;

  // Who can be assigned: command staff, plus the routed division's members.
  const assignablePool = canManage
    ? data.users.filter(
        (u) => u.id === currentUser.id || isCommand || (ticket.division && u.divisions.includes(ticket.division))
      )
    : [];

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    await replyToTicket(ticket.id, currentUser.id, draft.trim());
    setSending(false);
    setDraft("");
  };

  const handleToggleClose = async () => {
    setClosing(true);
    await updateTicketStatus(ticket.id, ticket.status === "CLOSED" ? "OPEN" : "CLOSED");
    setClosing(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">
            TICKET · {ticket.category}
          </p>
          <h1 className="font-display text-3xl text-bone-100">{ticket.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {division && <Pill color={division.color}>{division.shortName}</Pill>}
          <Pill color={STATUS_COLORS[ticket.status]}>{ticket.status.replace("_", " ")}</Pill>
        </div>
      </div>

      <Panel className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={creator?.name ?? "?"} color={creator?.avatarColor ?? "#8B93A7"} size={32} />
          <div>
            <p className="text-sm text-bone-100">{creator?.name ?? "Unknown"}</p>
            <p className="text-xs text-bone-400">{formatDateTime(ticket.createdAt)}</p>
          </div>
        </div>
        <p className="text-sm text-bone-100/90 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
      </Panel>

      {canManage && (
        <Panel className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-bone-400">Status</span>
            <Select
              value={ticket.status}
              onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
              className="w-40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-bone-400">Assigned to</span>
            <Select
              value={ticket.assignedToId ?? ""}
              onChange={(e) => assignTicket(ticket.id, e.target.value || null)}
              className="w-48"
            >
              <option value="">Unassigned</option>
              {assignablePool.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </Panel>
      )}

      {!canManage && isCreator && (
        <Panel className="p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-bone-400">
            {ticket.status === "CLOSED"
              ? "You closed this ticket."
              : "Got what you needed? You can close this ticket yourself."}
          </p>
          <GhostButton onClick={handleToggleClose} disabled={closing}>
            {closing ? "Saving…" : ticket.status === "CLOSED" ? "Reopen Ticket" : "Close Ticket"}
          </GhostButton>
        </Panel>
      )}

      <Panel className="p-5">
        <SectionLabel>Replies ({ticket.replies.length})</SectionLabel>
        {ticket.replies.length === 0 ? (
          <p className="text-sm text-bone-400">No replies yet.</p>
        ) : (
          <ul className="space-y-4">
            {ticket.replies.map((r) => {
              const author = data.users.find((u) => u.id === r.authorId);
              return (
                <li key={r.id} className="flex gap-3">
                  <Avatar name={author?.name ?? "?"} color={author?.avatarColor ?? "#8B93A7"} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-bone-100 font-medium">{author?.name ?? "Unknown"}</span>
                      <span className="text-xs text-bone-400">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-bone-100/90 whitespace-pre-wrap">{r.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleReply} className="flex gap-2 mt-5 pt-4 border-t border-ink-600/40">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a reply…" />
          <PrimaryButton type="submit" disabled={sending}>
            {sending ? "Sending…" : "Reply"}
          </PrimaryButton>
        </form>
      </Panel>
    </div>
  );
};

export default TicketDetail;
