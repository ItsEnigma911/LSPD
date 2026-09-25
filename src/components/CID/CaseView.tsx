import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { CASE_TEMPLATES } from "../../data/seed";
import { formatDateTime } from "../../utils/format";
import { GhostButton, Panel, Pill, SectionLabel } from "../ui";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#4B7BB5",
  UNDER_INVESTIGATION: "#B8934A",
  CLOSED: "#5B8C5A",
  COLD: "#8B93A7",
};

const CaseView: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { currentUser } = useAuth();
  const { data } = useData();

  const record = data.cases.find((c) => c.id === caseId);
  if (!record) return <Navigate to="/dashboard/cid/archives" replace />;

  const creator = data.users.find((u) => u.id === record.creatorId);
  const isCreator = currentUser?.id === record.creatorId;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">
            CID · {CASE_TEMPLATES[record.templateKey].label}
          </p>
          <h1 className="font-display text-3xl text-bone-100">{record.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Pill color={STATUS_COLORS[record.status]}>{record.status.replace("_", " ")}</Pill>
          <Link to={`/dashboard/cid/case/${record.id}/edit`}>
            <GhostButton>{isCreator ? "Edit Case" : "View / Edit"}</GhostButton>
          </Link>
        </div>
      </div>

      <Panel className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-bone-400">Filed by</p>
          <p className="text-bone-100 mt-0.5">{creator?.name ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs text-bone-400">Location</p>
          <p className="text-bone-100 mt-0.5">{record.location || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-bone-400">Last updated</p>
          <p className="text-bone-100 mt-0.5">{formatDateTime(record.updatedAt)}</p>
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-5">
        <Panel className="p-5">
          <SectionLabel>Involved Officers ({record.involvedOfficers.length})</SectionLabel>
          {record.involvedOfficers.length === 0 ? (
            <p className="text-sm text-bone-400">None listed.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-bone-100">
              {record.involvedOfficers.map((o, idx) => (
                <li key={idx}>{o}</li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-5">
          <SectionLabel>Wanted Persons ({record.wanteds.length})</SectionLabel>
          {record.wanteds.length === 0 ? (
            <p className="text-sm text-bone-400">None listed.</p>
          ) : (
            <ul className="divide-y divide-ink-600/40">
              {record.wanteds.map((w) => (
                <li key={w.id} className="py-2 first:pt-0">
                  <p className="text-sm text-bone-100">{w.name}</p>
                  <p className="text-xs text-bone-400">{w.charges || "No charges listed"}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionLabel>BOLOs ({record.bolos.length})</SectionLabel>
        {record.bolos.length === 0 ? (
          <p className="text-sm text-bone-400">No active BOLOs on this case.</p>
        ) : (
          <ul className="space-y-2">
            {record.bolos.map((b) => (
              <li key={b.id} className="text-sm text-bone-100 flex items-start gap-2">
                <span className="text-alert-500">●</span>
                {b.description}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Narrative</SectionLabel>
        <div
          className="text-sm text-bone-100/90 leading-relaxed prose-invert"
          dangerouslySetInnerHTML={{
            __html: record.narrativeHtml || "<p class='text-bone-400'>No narrative written.</p>",
          }}
        />
      </Panel>

      {record.images.length > 0 && (
        <Panel className="p-5">
          <SectionLabel>Evidence</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {record.images.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Evidence ${idx + 1}`}
                className="w-full h-32 object-cover rounded-sm border border-ink-600"
              />
            ))}
          </div>
        </Panel>
      )}

      <p className="text-xs text-bone-400">
        Created {formatDateTime(record.createdAt)} · Last updated {formatDateTime(record.updatedAt)}
      </p>
    </div>
  );
};

export default CaseView;
