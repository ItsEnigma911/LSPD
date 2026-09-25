import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { formatDateTime } from "../../utils/format";
import { Input, Panel, PrimaryButton, SectionLabel, Select } from "../ui";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const SubmitActivity: React.FC = () => {
  const { currentUser } = useAuth();
  const { data, submitActivity } = useData();
  const [activityTypeId, setActivityTypeId] = useState(data.activityTypes[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [proofUrl, setProofUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setProofUrl(await fileToDataUrl(file));
    } catch {
      setError("Couldn't upload that screenshot.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTypeId) return;
    setSubmitting(true);
    setError(null);
    const result = await submitActivity({
      userId: currentUser.id,
      activityTypeId,
      description,
      quantity,
      proofUrl,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't submit that activity.");
      return;
    }
    setDescription("");
    setQuantity(1);
    setProofUrl(undefined);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const myActivities = data.activities
    .filter((a) => a.userId === currentUser.id)
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">ACTIVITY LOG</p>
        <h1 className="font-display text-3xl text-bone-100">Submit Activity</h1>
      </div>

      <Panel className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Activity type</label>
            <Select value={activityTypeId} onChange={(e) => setActivityTypeId(e.target.value)}>
              {data.activityTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.points} pts each)
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Quantity / hours</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Proof screenshot (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                disabled={uploading}
                className="text-xs text-bone-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-ink-600 file:bg-ink-900 file:text-bone-100 file:text-xs"
              />
              {uploading && <p className="text-xs text-bone-400 mt-1">Uploading…</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What did you do? Include relevant details for review."
              className="w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 text-sm text-bone-100 placeholder:text-bone-400 focus:outline-none focus:border-brass-500"
            />
          </div>

          {proofUrl && (
            <img src={proofUrl} alt="Proof preview" className="max-h-40 rounded-sm border border-ink-600" />
          )}

          {error && <p className="text-sm text-alert-500">{error}</p>}

          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={submitting || uploading}>
              {submitting ? "Submitting…" : "Submit for Review"}
            </PrimaryButton>
            {submitted && <span className="text-sm text-brass-400">Submitted — pending review.</span>}
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>My Submissions</SectionLabel>
        {myActivities.length === 0 ? (
          <p className="text-sm text-bone-400">Nothing submitted yet.</p>
        ) : (
          <ul className="divide-y divide-ink-600">
            {myActivities.map((a) => {
              const type = data.activityTypes.find((t) => t.id === a.activityTypeId);
              return (
                <li key={a.id} className="py-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-bone-100">{type?.label}</span>
                    <span className="text-bone-400">{formatDateTime(a.submittedAt)}</span>
                  </div>
                  <p className="text-xs text-bone-400 mt-0.5">
                    Qty {a.quantity} · {a.status}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default SubmitActivity;
