import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { Division } from "../../types";
import { DangerButton, Input, Panel, Pill, PrimaryButton, SectionLabel, TextArea } from "../ui";

const COLOR_PRESETS = ["#B8934A", "#6B7280", "#5B8C5A", "#4B7BB5", "#7B4B8A", "#A6332F", "#C2588A", "#3F9C8C"];

const ManageDivisions: React.FC = () => {
  const { data, addDivision } = useData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🚔");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const result = await addDivision({
      name: name.trim(),
      shortName: name.trim(),
      description: description.trim() || "No description yet.",
      icon,
      color,
    });
    if (!result.ok) {
      setError(result.error ?? "Couldn't create that division.");
      return;
    }
    setName("");
    setDescription("");
    setIcon("🚔");
    setColor(COLOR_PRESETS[0]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionLabel>Existing Divisions</SectionLabel>
        {error && (
          <p className="text-sm text-alert-500 mb-3 bg-alert-500/10 border border-alert-500/30 rounded-sm px-3 py-2">
            {error}
          </p>
        )}
        <div className="space-y-3">
          {data.divisions.map((division) => {
            const memberCount = data.users.filter((u) => u.divisions.includes(division.key)).length;
            return (
              <DivisionRow key={division.key} division={division} memberCount={memberCount} onError={setError} />
            );
          })}
        </div>
        <p className="text-xs text-bone-400 mt-3">
          At least one division must always exist. Deleting a division removes the tag from every
          member who had it and clears that division's chat history.
        </p>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Create a Division</SectionLabel>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Air Support Unit" />
          </div>
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Description</label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this division does"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Icon (emoji)</label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
            </div>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Color</label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-bone-100" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
          <PrimaryButton onClick={handleAdd}>Create Division</PrimaryButton>
        </div>
      </Panel>
    </div>
  );
};

/** Name and description are edited locally and committed on blur, not on
 * every keystroke — same reasoning as RankRow in ManageRanks. */
const DivisionRow: React.FC<{ division: Division; memberCount: number; onError: (msg: string | null) => void }> = ({
  division,
  memberCount,
  onError,
}) => {
  const { updateDivision, deleteDivision } = useData();
  const [name, setName] = useState(division.name);
  const [description, setDescription] = useState(division.description);

  const commitName = async () => {
    if (name === division.name) return;
    const result = await updateDivision(division.key, { name, shortName: name });
    onError(result.ok ? null : result.error ?? "Couldn't rename that division.");
  };

  const commitDescription = async () => {
    if (description === division.description) return;
    const result = await updateDivision(division.key, { description });
    onError(result.ok ? null : result.error ?? "Couldn't update that division's description.");
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this division? Members lose the tag and its chat history is cleared.")) return;
    const result = await deleteDivision(division.key);
    onError(result.ok ? null : result.error ?? "Couldn't delete that division.");
  };

  return (
    <div className="flex items-center gap-3 bg-ink-900/40 border border-ink-600/40 rounded-md p-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 border"
        style={{ backgroundColor: `${division.color}22`, borderColor: `${division.color}55` }}
      >
        {division.icon}
      </div>
      <div className="flex-1 min-w-0">
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName} className="mb-1.5" />
        <Input value={description} onChange={(e) => setDescription(e.target.value)} onBlur={commitDescription} />
      </div>
      <Pill color={division.color}>
        {memberCount} member{memberCount === 1 ? "" : "s"}
      </Pill>
      {division.builtIn && <Pill>Starting division</Pill>}
      <DangerButton onClick={handleDelete}>Delete</DangerButton>
    </div>
  );
};

export default ManageDivisions;
