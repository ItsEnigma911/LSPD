import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { usePermissions } from "../../hooks/usePermissions";
import { GhostButton, Input, Panel, PrimaryButton, TextArea } from "../ui";

const COLOR_PRESETS = ["#B8934A", "#6B7280", "#5B8C5A", "#4B7BB5", "#7B4B8A", "#A6332F", "#C2588A", "#3F9C8C"];
const ICON_PRESETS = ["🚔", "🚁", "🐕", "🚤", "🏍️", "📚", "🎯", "🧯"];

/** Slim bar pinned to the top of every dashboard page. Command staff get a
 * "+" to spin up a brand new division ("channel") — name, icon, color — from
 * anywhere in the dashboard, without digging into the Admin Panel. */
const DashboardTopBar: React.FC = () => {
  const { canManageDivisionTags } = usePermissions();
  const { addDivision } = useData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(ICON_PRESETS[0]);
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  if (!canManageDivisionTags) return null;

  const reset = () => {
    setName("");
    setDescription("");
    setIcon(ICON_PRESETS[0]);
    setColor(COLOR_PRESETS[0]);
  };

  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await addDivision({
      name: name.trim(),
      shortName: name.trim(),
      description: description.trim() || "No description yet.",
      icon,
      color,
    });
    if (!result.ok || !result.key) {
      setError(result.error ?? "Couldn't create that division.");
      return;
    }
    setError(null);
    reset();
    setOpen(false);
    navigate(`/dashboard/division/${result.key}`);
  };

  return (
    <div className="sticky top-0 z-40 -mx-6 md:-mx-10 px-6 md:px-10 py-2.5 mb-6 bg-ink-900/60 backdrop-blur-xl border-b border-ink-600/40 flex items-center justify-between">
      <p className="text-xs text-bone-400 tracking-wide">
        Command tools — create a new division whenever you need one.
      </p>
      <div className="relative">
        <GhostButton onClick={() => setOpen((v) => !v)}>+ New Division</GhostButton>
        {open && (
          <Panel className="absolute right-0 top-11 w-80 p-4 z-50 shadow-xl">
            <p className="text-sm text-bone-100 font-medium mb-3">Create a division</p>
            <div className="space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Division name" />
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What does this division do?"
              />
              <div>
                <p className="text-xs text-bone-400 mb-1.5">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_PRESETS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-8 h-8 rounded-md border flex items-center justify-center text-sm ${
                        icon === i ? "border-brass-500 bg-brass-500/10" : "border-ink-600/60"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-bone-400 mb-1.5">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-bone-100" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
                <PrimaryButton onClick={handleCreate}>Create</PrimaryButton>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default DashboardTopBar;
