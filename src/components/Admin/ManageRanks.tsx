import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { Rank } from "../../types";
import {
  DangerButton,
  GhostButton,
  Input,
  Panel,
  PrimaryButton,
  SectionLabel,
} from "../ui";

const ManageRanks: React.FC = () => {
  const { data, addRank, restoreDefaultRanks } = useData();
  const [newName, setNewName] = useState("");
  const [newThreshold, setNewThreshold] = useState(0);
  const [newIsCommand, setNewIsCommand] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedRanks = [...data.ranks].sort((a, b) => a.level - b.level);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxLevel = Math.max(0, ...data.ranks.map((r) => r.level));
    const result = await addRank({
      name: newName.trim(),
      level: maxLevel + 1,
      pointThreshold: newThreshold,
      isCommand: newIsCommand,
    });
    if (!result.ok) {
      setError(result.error ?? "Couldn't add that rank.");
      return;
    }
    setNewName("");
    setNewThreshold(0);
    setNewIsCommand(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-ink-600/40">
          <h3 className="font-display text-lg text-bone-100">Existing Ranks</h3>
          <GhostButton
            onClick={restoreDefaultRanks}
            title="Adds back any of the six default ranks that are missing, without touching your custom ones"
          >
            Restore Default Ranks
          </GhostButton>
        </div>
        {error && (
          <p className="text-sm text-alert-500 mb-3 bg-alert-500/10 border border-alert-500/30 rounded-sm px-3 py-2">
            {error}
          </p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-bone-400 border-b border-ink-600/40">
              <th className="pb-2 font-normal">Level</th>
              <th className="pb-2 font-normal">Name</th>
              <th className="pb-2 font-normal">Point threshold</th>
              <th className="pb-2 font-normal">Command rank?</th>
              <th className="pb-2 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-600/40">
            {sortedRanks.map((rank) => (
              <RankRow key={rank.id} rank={rank} onError={setError} />
            ))}
          </tbody>
        </table>
        <p className="text-xs text-bone-400 mt-3">
          "Command rank" ranks can manage ranks, divisions, and badge numbers site-wide (Chief of
          Police, Deputy Chief, Assistant Chief). At least one rank must always exist, at least one
          must stay a command rank, and a rank can't be deleted while someone still holds it —
          reassign their rank first.
        </p>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Add New Rank</SectionLabel>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Senior Officer" />
          </div>
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Point threshold</label>
            <Input
              type="number"
              value={newThreshold}
              onChange={(e) => setNewThreshold(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-bone-100 pb-2">
            <input
              type="checkbox"
              checked={newIsCommand}
              onChange={(e) => setNewIsCommand(e.target.checked)}
              className="accent-[#B8934A] w-4 h-4"
            />
            Command rank
          </label>
          <PrimaryButton onClick={handleAdd}>Add Rank</PrimaryButton>
        </div>
      </Panel>
    </div>
  );
};

/** Name and point threshold are edited locally and committed on blur — not
 * on every keystroke, which would otherwise fire a network request (and a
 * full data refresh) per character typed. Rank level isn't editable here;
 * add a new rank and reorder by editing thresholds instead. */
const RankRow: React.FC<{ rank: Rank; onError: (msg: string | null) => void }> = ({ rank, onError }) => {
  const { updateRank, deleteRank } = useData();
  const [name, setName] = useState(rank.name);
  const [threshold, setThreshold] = useState(rank.pointThreshold);

  const commitName = async () => {
    if (name === rank.name) return;
    const result = await updateRank(rank.id, { name });
    onError(result.ok ? null : result.error ?? "Couldn't rename that rank.");
  };

  const commitThreshold = async () => {
    if (threshold === rank.pointThreshold) return;
    const result = await updateRank(rank.id, { pointThreshold: threshold });
    onError(result.ok ? null : result.error ?? "Couldn't update that rank's threshold.");
  };

  const handleToggleCommand = async (checked: boolean) => {
    const result = await updateRank(rank.id, { isCommand: checked });
    onError(result.ok ? null : result.error ?? "Couldn't update that rank.");
  };

  const handleDelete = async () => {
    const result = await deleteRank(rank.id);
    onError(result.ok ? null : result.error ?? "Couldn't delete that rank.");
  };

  return (
    <tr>
      <td className="py-2 pr-3 text-bone-400">{rank.level}</td>
      <td className="py-2 pr-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          className="max-w-[180px]"
        />
      </td>
      <td className="py-2 pr-3">
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          onBlur={commitThreshold}
          className="max-w-[120px]"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="checkbox"
          checked={rank.isCommand}
          onChange={(e) => handleToggleCommand(e.target.checked)}
          className="accent-[#B8934A] w-4 h-4"
        />
      </td>
      <td className="py-2 text-right">
        <DangerButton onClick={handleDelete}>Delete</DangerButton>
      </td>
    </tr>
  );
};

export default ManageRanks;
