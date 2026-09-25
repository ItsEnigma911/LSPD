import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { DivisionKey } from "../../types";
import { GhostButton, Input, Panel, PrimaryButton, Select, TextArea } from "../ui";

const CATEGORIES = ["General", "Complaint", "Bug / Website Issue", "Personnel", "Other"];

const NewTicket: React.FC = () => {
  const { data, createTicket } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [division, setDivision] = useState<DivisionKey | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await createTicket({
      title: title.trim(),
      description: description.trim(),
      category,
      division: division || null,
      creatorId: currentUser.id,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't submit that ticket.");
      return;
    }
    navigate("/dashboard/tickets");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">SUPPORT</p>
        <h1 className="font-display text-3xl text-bone-100">New Ticket</h1>
      </div>

      <Panel className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Route to a division (optional)</label>
              <Select value={division} onChange={(e) => setDivision(e.target.value as DivisionKey | "")}>
                <option value="">Command staff only</option>
                {data.divisions.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Description</label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What's going on? Include as much detail as helps."
            />
          </div>

          {error && <p className="text-sm text-alert-500">{error}</p>}

          <div className="flex gap-2 pt-2 border-t border-ink-600/40">
            <GhostButton type="button" onClick={() => navigate(-1)}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Ticket"}
            </PrimaryButton>
          </div>
        </form>
      </Panel>
    </div>
  );
};

export default NewTicket;
