import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { Division, DivisionKey, Rank, User } from "../../types";
import { Avatar, GhostButton, Input, Panel, PrimaryButton, SectionLabel, Select } from "../ui";

/** Full personnel admin: rank, division tags, badge number, callsign,
 * manual point adjustments, and account creation/removal. This view is
 * command-only (Chief / Deputy Chief / Assistant Chief). HR and Dispatch
 * members use the lighter-weight "Assign Callsigns" tool instead. */
const ManageUsers: React.FC = () => {
  const { data } = useData();
  const sortedRanks = [...data.ranks].sort((a, b) => a.level - b.level);

  return (
    <div className="space-y-4">
      <CreateAccountPanel />
      {data.users.map((user) => (
        <UserRow key={user.id} user={user} ranks={sortedRanks} divisions={data.divisions} />
      ))}
    </div>
  );
};

const CreateAccountPanel: React.FC = () => {
  const { createUser } = useData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreate = async () => {
    if (!username.trim() || !password || !name.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createUser({ username, password, name });
    setCreating(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't create that account.");
      return;
    }
    setUsername("");
    setPassword("");
    setName("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <Panel className="p-4">
      <SectionLabel>Create Account</SectionLabel>
      <p className="text-xs text-bone-400 mb-3">
        New accounts start as the department's lowest rank with no division tags — assign those
        below once they're created.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-bone-400 mb-1.5">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="block text-xs text-bone-400 mb-1.5">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. officer.smith" />
        </div>
        <div>
          <label className="block text-xs text-bone-400 mb-1.5">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <PrimaryButton onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "Create Account"}
        </PrimaryButton>
        {success && <span className="text-sm text-brass-400">Created.</span>}
      </div>
      {error && <p className="text-sm text-alert-500 mt-2">{error}</p>}
    </Panel>
  );
};

/** Text fields (badge/callsign) are edited locally and only saved on blur —
 * committing on every keystroke would fire a network request per character
 * and fight the cursor as the async response comes back. Rank and division
 * changes are discrete clicks, so those still save immediately. */
const UserRow: React.FC<{ user: User; ranks: Rank[]; divisions: Division[] }> = ({ user, ranks, divisions }) => {
  const { updateUser, setUserDivisions, adjustPoints, deleteUser } = useData();
  const { currentUser } = useAuth();
  const [badgeNumber, setBadgeNumber] = useState(user.badgeNumber ?? "");
  const [callsign, setCallsign] = useState(user.callsign ?? "");
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pointsAmount, setPointsAmount] = useState(10);
  const [pointsReason, setPointsReason] = useState("");
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const rank = ranks.find((r) => r.id === user.rankId);

  const toggleDivision = (key: DivisionKey) => {
    const next = user.divisions.includes(key)
      ? user.divisions.filter((d) => d !== key)
      : [...user.divisions, key];
    setUserDivisions(user.id, next);
  };

  const applyPoints = async (sign: 1 | -1) => {
    if (!pointsAmount) return;
    setApplying(true);
    setPointsError(null);
    const result = await adjustPoints(user.id, sign * Math.abs(pointsAmount), pointsReason, currentUser?.id ?? "");
    setApplying(false);
    if (!result.ok) {
      setPointsError(result.error ?? "Couldn't adjust points.");
      return;
    }
    setPointsReason("");
    setPointsOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${user.name}'s account? This can't be undone.`)) return;
    const result = await deleteUser(user.id);
    setDeleteError(result.ok ? null : result.error ?? "Couldn't remove that account.");
  };

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.avatarColor} size={36} />
          <div>
            <p className="text-sm text-bone-100 font-medium">{user.name}</p>
            <p className="text-xs text-bone-400">
              @{user.username} · {rank?.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-bone-100 font-mono">{user.points} pts</p>
          <div className="flex items-center gap-3 mt-0.5">
            <button
              onClick={() => setPointsOpen((v) => !v)}
              className="text-xs text-brass-400 hover:underline"
            >
              {pointsOpen ? "Cancel" : "Add / Remove Points"}
            </button>
            <button onClick={handleDelete} className="text-xs text-bone-400 hover:text-alert-500">
              Remove Account
            </button>
          </div>
        </div>
      </div>
      {deleteError && (
        <p className="text-sm text-alert-500 mb-3 bg-alert-500/10 border border-alert-500/30 rounded-sm px-3 py-2">
          {deleteError}
        </p>
      )}

      {pointsOpen && (
        <div className="mb-4 p-3 bg-ink-900/40 border border-ink-600/40 rounded-md">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Amount</label>
              <Input
                type="number"
                min={1}
                value={pointsAmount}
                onChange={(e) => setPointsAmount(Math.abs(Number(e.target.value)))}
                className="w-24"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-bone-400 mb-1.5">Reason (optional)</label>
              <Input
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="e.g. Event bonus, correction, penalty"
              />
            </div>
            <GhostButton onClick={() => applyPoints(-1)} disabled={applying}>
              − Remove
            </GhostButton>
            <PrimaryButton onClick={() => applyPoints(1)} disabled={applying}>
              + Add
            </PrimaryButton>
          </div>
          {pointsError && <p className="text-sm text-alert-500 mt-2">{pointsError}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-bone-400 mb-1.5">Rank</label>
          <Select value={user.rankId} onChange={(e) => updateUser(user.id, { rankId: e.target.value })}>
            {ranks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-bone-400 mb-1.5">Badge number</label>
          <Input
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            onBlur={() => {
              if (badgeNumber !== (user.badgeNumber ?? "")) updateUser(user.id, { badgeNumber: badgeNumber || null });
            }}
            placeholder="e.g. 4021"
          />
        </div>
        <div>
          <label className="block text-xs text-bone-400 mb-1.5">Callsign</label>
          <Input
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            onBlur={() => {
              if (callsign !== (user.callsign ?? "")) updateUser(user.id, { callsign: callsign || null });
            }}
            placeholder="e.g. D-14"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-bone-400 mb-1.5">Division tags</label>
        <div className="flex flex-wrap gap-2">
          {divisions.map((division) => {
            const active = user.divisions.includes(division.key);
            return (
              <button
                key={division.key}
                onClick={() => toggleDivision(division.key)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  active ? "text-ink-950" : "text-bone-100 border-ink-600 hover:border-brass-500"
                }`}
                style={active ? { backgroundColor: division.color, borderColor: division.color } : undefined}
              >
                {division.icon} {division.shortName}
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};

export default ManageUsers;
