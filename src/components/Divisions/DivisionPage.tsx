import React, { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { usePermissions } from "../../hooks/usePermissions";
import { DivisionKey } from "../../types";
import { formatDate } from "../../utils/format";
import { Avatar, Input, Panel, Pill, PrimaryButton, SectionLabel } from "../ui";

const DivisionPage: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const { currentUser } = useAuth();
  const { data, uploadDivisionDocument, deleteDivisionDocument } = useData();
  const { hasDivision, isCommand } = usePermissions();

  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const divisionKey = key as DivisionKey;
  const division = data.divisions.find((d) => d.key === divisionKey);
  const allowed = hasDivision(divisionKey) || isCommand;

  if (!division) return <Navigate to="/dashboard" replace />;
  if (!allowed) return <Navigate to="/dashboard" replace />;

  const roster = data.users.filter((u) => u.divisions.includes(divisionKey));
  const documents = data.documents
    .filter((d) => d.divisionKey === divisionKey)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docFile) return;
    setUploading(true);
    setUploadError(null);
    if (!currentUser) return;
    const result = await uploadDivisionDocument(divisionKey, docTitle.trim(), docFile, currentUser.id);
    setUploading(false);
    if (!result.ok) {
      setUploadError(result.error ?? "Couldn't upload that file.");
      return;
    }
    setDocTitle("");
    setDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl border"
          style={{ backgroundColor: `${division.color}22`, borderColor: `${division.color}55` }}
        >
          {division.icon}
        </div>
        <div>
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs">DIVISION</p>
          <h1 className="font-display text-3xl text-bone-100">{division.name}</h1>
        </div>
      </div>

      <Panel className="p-5">
        <p className="text-sm text-bone-100/90">{division.description}</p>
        <div className="mt-4 flex gap-3">
          <Link
            to={`/dashboard/chat/${division.key}`}
            className="text-sm text-brass-400 hover:underline"
          >
            Open {division.shortName} Chat →
          </Link>
          {division.key === "CID" && (
            <Link to="/dashboard/cid/archives" className="text-sm text-brass-400 hover:underline">
              Open CID Archives →
            </Link>
          )}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Handbook & Documents ({documents.length})</SectionLabel>
        {documents.length === 0 ? (
          <p className="text-sm text-bone-400 mb-4">
            Nothing uploaded yet — add the division handbook, SOPs, or training material below.
          </p>
        ) : (
          <ul className="divide-y divide-ink-600/40 mb-4">
            {documents.map((doc) => {
              const uploader = data.users.find((u) => u.id === doc.uploadedById);
              const canDelete = currentUser?.id === doc.uploadedById || isCommand;
              return (
                <li key={doc.id} className="py-2.5 flex items-center justify-between gap-3">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-bone-100 hover:text-brass-400 flex items-center gap-2 min-w-0"
                  >
                    <span>📄</span>
                    <span className="truncate">{doc.title}</span>
                  </a>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-bone-400">
                      {uploader?.name ?? "Unknown"} · {formatDate(doc.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => deleteDivisionDocument(divisionKey, doc.id)}
                        className="text-xs text-bone-400 hover:text-alert-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-2 pt-3 border-t border-ink-600/40">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-bone-400 mb-1.5">Document title</label>
            <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. CID Handbook v2" />
          </div>
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="text-xs text-bone-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border file:border-ink-600 file:bg-ink-900 file:text-bone-100 file:text-xs"
            />
          </div>
          <PrimaryButton type="submit" disabled={uploading || !docTitle.trim() || !docFile}>
            {uploading ? "Uploading…" : "Upload"}
          </PrimaryButton>
        </form>
        {uploadError && <p className="text-sm text-alert-500 mt-2">{uploadError}</p>}
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Roster ({roster.length})</SectionLabel>
        <ul className="divide-y divide-ink-600/40">
          {roster.map((u) => (
            <li key={u.id} className="py-2.5 flex items-center gap-3">
              <Avatar name={u.name} color={u.avatarColor} size={32} />
              <div className="flex-1">
                <p className="text-sm text-bone-100">{u.name}</p>
                <p className="text-xs text-bone-400">
                  Badge {u.badgeNumber ?? "—"} · Callsign {u.callsign ?? "—"}
                </p>
              </div>
              <Pill color={division.color}>{division.shortName}</Pill>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
};

export default DivisionPage;
