import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { User } from "../../types";
import { Avatar, Input, Panel } from "../ui";

/** Lightweight tool for HR / Dispatch members (who are not necessarily
 * command staff) to assign callsigns without exposing the rest of the
 * Admin Panel. Command staff can also reach this same permission via
 * Admin Panel → Personnel. */
const AssignCallsigns: React.FC = () => {
  const { data } = useData();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">HR / DISPATCH</p>
        <h1 className="font-display text-3xl text-bone-100">Assign Callsigns</h1>
        <p className="text-sm text-bone-400 mt-2">
          Ranks, division tags, and badge numbers are managed by command staff — this tool only
          covers callsigns.
        </p>
      </div>

      <Panel className="divide-y divide-ink-600/40">
        {data.users.map((user) => (
          <CallsignRow key={user.id} user={user} />
        ))}
      </Panel>
    </div>
  );
};

/** Committed on blur, not on every keystroke — see the same pattern in
 * ManageUsers/ManageRanks/ManageDivisions. */
const CallsignRow: React.FC<{ user: User }> = ({ user }) => {
  const { updateUser } = useData();
  const [callsign, setCallsign] = useState(user.callsign ?? "");

  return (
    <div className="p-4 flex items-center gap-3">
      <Avatar name={user.name} color={user.avatarColor} size={32} />
      <div className="flex-1">
        <p className="text-sm text-bone-100">{user.name}</p>
        <p className="text-xs text-bone-400">Badge {user.badgeNumber ?? "—"}</p>
      </div>
      <Input
        value={callsign}
        onChange={(e) => setCallsign(e.target.value)}
        onBlur={() => {
          if (callsign !== (user.callsign ?? "")) updateUser(user.id, { callsign: callsign || null });
        }}
        placeholder="e.g. D-14"
        className="w-32"
      />
    </div>
  );
};

export default AssignCallsigns;
