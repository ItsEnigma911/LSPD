import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { CASE_TEMPLATES } from "../../data/seed";
import { BoloEntry, CaseStatus, CaseTemplateKey, WantedEntry } from "../../types";
import {
  DangerButton,
  GhostButton,
  Input,
  Panel,
  PrimaryButton,
  Select,
} from "../ui";
import RichTextEditor from "./RichTextEditor";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { value: "CLOSED", label: "Closed" },
  { value: "COLD", label: "Cold" },
];

type Tab = "DETAILS" | "OFFICERS" | "WANTEDS" | "BOLOS" | "NARRATIVE" | "EVIDENCE";

const TABS: { key: Tab; label: string; badgeFrom?: "officers" | "wanteds" | "bolos" | "images" }[] = [
  { key: "DETAILS", label: "Case Details" },
  { key: "OFFICERS", label: "Involved Officers", badgeFrom: "officers" },
  { key: "WANTEDS", label: "Wanted Persons", badgeFrom: "wanteds" },
  { key: "BOLOS", label: "BOLOs", badgeFrom: "bolos" },
  { key: "NARRATIVE", label: "Narrative" },
  { key: "EVIDENCE", label: "Evidence", badgeFrom: "images" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

/** Handles both "new case" (no :caseId param) and "edit case" (with :caseId). */
const CaseEditor: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const isEditing = !!caseId;
  const { currentUser } = useAuth();
  const { data, addCase, updateCase, deleteCase } = useData();
  const navigate = useNavigate();

  const existing = isEditing ? data.cases.find((c) => c.id === caseId) : undefined;

  const [tab, setTab] = useState<Tab>("DETAILS");
  const [templateKey, setTemplateKey] = useState<CaseTemplateKey>(existing?.templateKey ?? "ARREST");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [status, setStatus] = useState<CaseStatus>(existing?.status ?? "OPEN");
  const [officers, setOfficers] = useState<string[]>(existing?.involvedOfficers ?? []);
  const [wanteds, setWanteds] = useState<WantedEntry[]>(existing?.wanteds ?? []);
  const [bolos, setBolos] = useState<BoloEntry[]>(existing?.bolos ?? []);
  const [narrativeHtml, setNarrativeHtml] = useState(existing?.narrativeHtml ?? "");
  const [images, setImages] = useState<string[]>(existing?.images ?? []);

  const [officerDraft, setOfficerDraft] = useState("");
  const [wantedName, setWantedName] = useState("");
  const [wantedCharges, setWantedCharges] = useState("");
  const [boloDraft, setBoloDraft] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setTemplateKey(existing.templateKey);
      setTitle(existing.title);
      setLocation(existing.location);
      setStatus(existing.status);
      setOfficers(existing.involvedOfficers);
      setWanteds(existing.wanteds);
      setBolos(existing.bolos);
      setNarrativeHtml(existing.narrativeHtml);
      setImages(existing.images);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!currentUser) return null;
  if (isEditing && !existing) return <Navigate to="/dashboard/cid/archives" replace />;

  const isCreator = existing ? existing.creatorId === currentUser.id : true;

  const addOfficer = () => {
    if (!officerDraft.trim()) return;
    setOfficers((prev) => [...prev, officerDraft.trim()]);
    setOfficerDraft("");
  };
  const removeOfficer = (idx: number) => setOfficers((prev) => prev.filter((_, i) => i !== idx));

  const addWanted = () => {
    if (!wantedName.trim()) return;
    setWanteds((prev) => [...prev, { id: uid(), name: wantedName.trim(), charges: wantedCharges.trim() }]);
    setWantedName("");
    setWantedCharges("");
  };
  const removeWanted = (id: string) => setWanteds((prev) => prev.filter((w) => w.id !== id));

  const addBolo = () => {
    if (!boloDraft.trim()) return;
    setBolos((prev) => [...prev, { id: uid(), description: boloDraft.trim() }]);
    setBoloDraft("");
  };
  const removeBolo = (id: string) => setBolos((prev) => prev.filter((b) => b.id !== id));

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImages(true);
    setSaveError(null);
    try {
      const urls = await Promise.all(files.map(fileToDataUrl));
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setSaveError("Couldn't upload one or more evidence images.");
    } finally {
      setUploadingImages(false);
    }
  };
  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) {
      setTab("DETAILS");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const payload = {
      division: "CID" as const,
      templateKey,
      title,
      status,
      location,
      involvedOfficers: officers,
      wanteds,
      bolos,
      narrativeHtml,
      images,
    };
    if (isEditing && existing) {
      const result = await updateCase(existing.id, payload);
      setSaving(false);
      if (!result.ok) {
        setSaveError(result.error ?? "Couldn't save this case.");
        return;
      }
      navigate(`/dashboard/cid/case/${existing.id}`);
    } else {
      const result = await addCase({ ...payload, creatorId: currentUser.id });
      setSaving(false);
      if (!result.ok || !result.id) {
        setSaveError(result.error ?? "Couldn't create this case.");
        return;
      }
      navigate(`/dashboard/cid/case/${result.id}`);
    }
  };

  const handleDelete = async () => {
    if (existing && window.confirm("Delete this case permanently?")) {
      const result = await deleteCase(existing.id);
      if (!result.ok) {
        setSaveError(result.error ?? "Couldn't delete this case.");
        return;
      }
      navigate("/dashboard/cid/archives");
    }
  };

  const template = CASE_TEMPLATES[templateKey];
  const counts = { officers: officers.length, wanteds: wanteds.length, bolos: bolos.length, images: images.length };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">
          CID · {isEditing ? "EDIT CASE" : "NEW CASE"}
        </p>
        <h1 className="font-display text-3xl text-bone-100">
          {isEditing ? existing?.title || "Untitled case" : "New Case File"}
        </h1>
      </div>

      {/* Top tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-ink-600/40">
        {TABS.map((t) => {
          const count = t.badgeFrom ? counts[t.badgeFrom] : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 text-sm font-display tracking-wide border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? "border-brass-500 text-brass-400"
                  : "border-transparent text-bone-400 hover:text-bone-100"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink-700 text-bone-100">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Panel className="p-5 space-y-4">
        {tab === "DETAILS" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bone-400 mb-1.5">Case template</label>
                <Select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value as CaseTemplateKey)}
                  disabled={isEditing}
                >
                  {Object.values(CASE_TEMPLATES).map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-bone-400 mb-1.5">Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CaseStatus)}
                  disabled={!isCreator}
                  title={!isCreator ? "Only the case creator can change its status" : undefined}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <p className="text-xs text-bone-400 -mt-2">{template.description}</p>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Case title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grand theft auto — Vinewood Blvd"
              />
            </div>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where it occurred" />
            </div>
            <p className="text-xs text-bone-400 pt-2 border-t border-ink-600/40">
              Suggested narrative sections for this template: {template.fields.join(" · ")}
            </p>
          </>
        )}

        {tab === "OFFICERS" && (
          <div className="space-y-3">
            <p className="text-xs text-bone-400">Officers involved in this case (name or badge number).</p>
            <div className="flex gap-2">
              <Input
                value={officerDraft}
                onChange={(e) => setOfficerDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOfficer())}
                placeholder="e.g. M. Reyes (Badge 1042)"
              />
              <GhostButton onClick={addOfficer}>Add</GhostButton>
            </div>
            {officers.length === 0 ? (
              <p className="text-sm text-bone-400">No officers added yet.</p>
            ) : (
              <ul className="divide-y divide-ink-600/40">
                {officers.map((o, idx) => (
                  <li key={idx} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-bone-100">{o}</span>
                    <button onClick={() => removeOfficer(idx)} className="text-xs text-bone-400 hover:text-alert-500">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "WANTEDS" && (
          <div className="space-y-3">
            <p className="text-xs text-bone-400">Persons wanted in connection with this case.</p>
            <div className="grid grid-cols-2 gap-2">
              <Input value={wantedName} onChange={(e) => setWantedName(e.target.value)} placeholder="Name / alias" />
              <Input
                value={wantedCharges}
                onChange={(e) => setWantedCharges(e.target.value)}
                placeholder="Charges"
              />
            </div>
            <GhostButton onClick={addWanted}>Add Wanted Person</GhostButton>
            {wanteds.length === 0 ? (
              <p className="text-sm text-bone-400">No wanted persons added yet.</p>
            ) : (
              <ul className="divide-y divide-ink-600/40">
                {wanteds.map((w) => (
                  <li key={w.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-bone-100">{w.name}</p>
                      <p className="text-xs text-bone-400">{w.charges || "No charges listed"}</p>
                    </div>
                    <button onClick={() => removeWanted(w.id)} className="text-xs text-bone-400 hover:text-alert-500">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "BOLOS" && (
          <div className="space-y-3">
            <p className="text-xs text-bone-400">Active "be on the lookout" alerts tied to this case.</p>
            <div className="flex gap-2">
              <Input
                value={boloDraft}
                onChange={(e) => setBoloDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBolo())}
                placeholder="e.g. Red Sultan, plate ABC123, last seen on Vinewood Blvd"
              />
              <GhostButton onClick={addBolo}>Add</GhostButton>
            </div>
            {bolos.length === 0 ? (
              <p className="text-sm text-bone-400">No BOLOs added yet.</p>
            ) : (
              <ul className="divide-y divide-ink-600/40">
                {bolos.map((b) => (
                  <li key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                    <p className="text-sm text-bone-100">{b.description}</p>
                    <button onClick={() => removeBolo(b.id)} className="text-xs text-bone-400 hover:text-alert-500">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "NARRATIVE" && (
          <RichTextEditor
            value={narrativeHtml}
            onChange={setNarrativeHtml}
            placeholder="Write the full case narrative here…"
          />
        )}

        {tab === "EVIDENCE" && (
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Evidence images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImages}
              disabled={uploadingImages}
              className="text-xs text-bone-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-ink-600 file:bg-ink-900 file:text-bone-100 file:text-xs"
            />
            {uploadingImages && <p className="text-xs text-bone-400 mt-1">Uploading…</p>}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`Evidence ${idx + 1}`} className="w-full h-20 object-cover rounded-sm border border-ink-600" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink-950/80 text-bone-100 text-xs opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-ink-600/40">
          <div className="flex gap-2">
            <GhostButton onClick={() => navigate(-1)}>Cancel</GhostButton>
            {isEditing && isCreator && <DangerButton onClick={handleDelete}>Delete Case</DangerButton>}
          </div>
          <PrimaryButton onClick={handleSave} disabled={saving || uploadingImages}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Case"}
          </PrimaryButton>
        </div>
        {saveError && <p className="text-sm text-alert-500">{saveError}</p>}
        {isEditing && !isCreator && (
          <p className="text-xs text-bone-400">
            Only the case's creator can change its status or delete it — the status field is locked
            for everyone else.
          </p>
        )}
      </Panel>
    </div>
  );
};

export default CaseEditor;
