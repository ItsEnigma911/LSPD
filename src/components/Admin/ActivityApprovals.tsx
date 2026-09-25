import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { formatDateTime } from "../../utils/format";
import { DangerButton, Panel, Pill, PrimaryButton } from "../ui";

const ActivityApprovals: React.FC = () => {
  const { currentUser } = useAuth();
  const { data, reviewActivity } = useData();
  if (!currentUser) return null;

  const pending = data.activities
    .filter((a) => a.status === "PENDING")
    .sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt));

  const recent = data.activities
    .filter((a) => a.status !== "PENDING")
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <h3 className="font-display text-lg text-bone-100 mb-3 pb-2 border-b border-ink-600">
          Pending Review ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-bone-400">Nothing waiting on review.</p>
        ) : (
          <ul className="divide-y divide-ink-600">
            {pending.map((a) => {
              const user = data.users.find((u) => u.id === a.userId);
              const type = data.activityTypes.find((t) => t.id === a.activityTypeId);
              return (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm text-bone-100">
                      {user?.name ?? "Unknown"} — {type?.label} × {a.quantity}
                    </p>
                    <p className="text-xs text-bone-400">
                      {a.description || "No description"} · {formatDateTime(a.submittedAt)}
                    </p>
                    {a.proofUrl && (
                      <img src={a.proofUrl} alt="Proof" className="mt-2 max-h-24 rounded-sm border border-ink-600" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <DangerButton onClick={() => reviewActivity(a.id, "REJECTED", currentUser.id)}>
                      Reject
                    </DangerButton>
                    <PrimaryButton onClick={() => reviewActivity(a.id, "APPROVED", currentUser.id)}>
                      Approve
                    </PrimaryButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel className="p-5">
        <h3 className="font-display text-lg text-bone-100 mb-3 pb-2 border-b border-ink-600">
          Recently Reviewed
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-bone-400">No history yet.</p>
        ) : (
          <ul className="divide-y divide-ink-600">
            {recent.map((a) => {
              const user = data.users.find((u) => u.id === a.userId);
              const type = data.activityTypes.find((t) => t.id === a.activityTypeId);
              return (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <p className="text-sm text-bone-100">
                    {user?.name} — {type?.label}
                  </p>
                  <Pill color={a.status === "APPROVED" ? "#5B8C5A" : "#A6332F"}>{a.status}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default ActivityApprovals;
