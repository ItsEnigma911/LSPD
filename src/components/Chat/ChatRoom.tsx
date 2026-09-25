import React, { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { usePermissions } from "../../hooks/usePermissions";
import { DivisionKey } from "../../types";
import { formatDateTime, rankOf } from "../../utils/format";
import { Avatar, Input, Panel, Pill, PrimaryButton, SectionLabel } from "../ui";

const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const { data, sendMessage, deleteMessage } = useData();
  const { hasDivision, isCommand, canModerateAnyChat } = usePermissions();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const room = roomId ?? "GLOBAL";
  const isDivisionRoom = room !== "GLOBAL";
  const allowed = !isDivisionRoom || hasDivision(room as DivisionKey) || isCommand;

  const messages = data.messages
    .filter((m) => m.roomId === room)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  // Who has access to this room: everyone for the global room, division
  // members (plus command staff, who can reach every room) for a division room.
  const membersWithAccess = isDivisionRoom
    ? data.users.filter((u) => u.divisions.includes(room as DivisionKey) || isCommandUser(u))
    : data.users;

  function isCommandUser(u: (typeof data.users)[number]) {
    return !!data.ranks.find((r) => r.id === u.rankId)?.isCommand;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, room]);

  if (!currentUser) return null;
  if (!allowed) return <Navigate to="/dashboard" replace />;

  const roomDivision = isDivisionRoom ? data.divisions.find((d) => d.key === room) : undefined;
  const title = isDivisionRoom ? `${roomDivision?.name ?? room} Chat` : "LSPD — All Units";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    sendMessage(room, currentUser.id, content);
    setDraft("");
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">CHAT ROOM</p>
        <h1 className="font-display text-3xl text-bone-100">{title}</h1>
      </div>

      <div className="flex gap-5 items-start">
        {/* Centered conversation */}
        <Panel className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-11rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-bone-400">No messages yet. Say hello.</p>
            )}
            {messages.map((m) => {
              const sender = data.users.find((u) => u.id === m.senderId);
              const canDelete = m.senderId === currentUser.id || canModerateAnyChat;
              return (
                <div key={m.id} className="flex gap-3 group">
                  <Avatar name={sender?.name ?? "?"} color={sender?.avatarColor ?? "#8B93A7"} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-bone-100 font-medium">{sender?.name ?? "Unknown"}</span>
                      <span className="text-xs text-bone-400">{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="text-sm text-bone-100/90 break-words">{m.content}</p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-bone-400 hover:text-alert-500 transition-opacity"
                      title="Delete message"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="border-t border-ink-600/40 p-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message this room…"
            />
            <PrimaryButton type="submit">Send</PrimaryButton>
          </form>
        </Panel>

        {/* Who has access to this room */}
        <Panel className="w-64 shrink-0 p-4 h-[calc(100vh-11rem)] overflow-y-auto hidden lg:block">
          <SectionLabel>Has Access ({membersWithAccess.length})</SectionLabel>
          <ul className="space-y-2.5">
            {membersWithAccess.map((u) => {
              const rank = rankOf(u, data);
              return (
                <li key={u.id} className="flex items-center gap-2.5">
                  <Avatar name={u.name} color={u.avatarColor} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-bone-100 truncate">{u.name}</p>
                    <p className="text-[11px] text-bone-400 truncate">{rank?.name ?? "Unranked"}</p>
                  </div>
                  {rank?.isCommand && <Pill color="#B8934A">Cmd</Pill>}
                </li>
              );
            })}
          </ul>
          {isDivisionRoom && (
            <p className="text-[11px] text-bone-400 mt-4 pt-3 border-t border-ink-600/40">
              Division members and command staff can see and post in this room.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default ChatRoom;
