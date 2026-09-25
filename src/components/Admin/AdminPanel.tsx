import React, { useState } from "react";
import ActivityApprovals from "./ActivityApprovals";
import ManageDivisions from "./ManageDivisions";
import ManageRanks from "./ManageRanks";
import ManageUsers from "./ManageUsers";

type Tab = "users" | "ranks" | "divisions" | "activity";

const TABS: { key: Tab; label: string }[] = [
  { key: "users", label: "Personnel" },
  { key: "ranks", label: "Ranks" },
  { key: "divisions", label: "Divisions" },
  { key: "activity", label: "Activity Approvals" },
];

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">COMMAND</p>
        <h1 className="font-display text-3xl text-bone-100">Admin Panel</h1>
      </div>

      <div className="flex gap-1 border-b border-ink-600">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-display tracking-wide border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-brass-500 text-brass-400"
                : "border-transparent text-bone-400 hover:text-bone-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <ManageUsers />}
      {tab === "ranks" && <ManageRanks />}
      {tab === "divisions" && <ManageDivisions />}
      {tab === "activity" && <ActivityApprovals />}
    </div>
  );
};

export default AdminPanel;
