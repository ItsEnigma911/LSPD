import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { formatDateTime, formatDate, rankOf } from "../../utils/format";
import { Avatar, Panel, Pill, SectionLabel } from "../ui";

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { data } = useData();
  if (!currentUser) return null;

  const rank = rankOf(currentUser, data);
  const myAdjustments = data.pointAdjustments
    .filter((a) => a.userId === currentUser.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
      <p className="text-xs text-bone-400">{label}</p>
      <p className="text-sm text-bone-100 mt-0.5">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">MY PROFILE</p>
        <h1 className="font-display text-3xl text-bone-100">{currentUser.name}</h1>
      </div>

      <Panel className="p-5 flex items-center gap-4">
        <Avatar name={currentUser.name} color={currentUser.avatarColor} size={56} />
        <div>
          <p className="font-display text-lg text-bone-100">{currentUser.name}</p>
          <p className="text-sm text-bone-400">@{currentUser.username}</p>
        </div>
      </Panel>

      <Panel className="p-5 grid grid-cols-2 md:grid-cols-3 gap-5">
        <Field label="Rank" value={rank?.name ?? "Unranked"} />
        <Field label="Badge Number" value={currentUser.badgeNumber ?? "Not assigned"} />
        <Field label="Callsign" value={currentUser.callsign ?? "Not assigned"} />
        <Field label="Points" value={currentUser.points} />
        <Field label="Joined" value={formatDate(currentUser.joinedAt)} />
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Division Tags</SectionLabel>
        {currentUser.divisions.length === 0 ? (
          <p className="text-sm text-bone-400">
            No division tags assigned. Command staff can assign these from the Admin Panel.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentUser.divisions.map((key) => {
              const division = data.divisions.find((d) => d.key === key);
              if (!division) return null;
              return (
                <Pill key={key} color={division.color}>
                  {division.icon} {division.name}
                </Pill>
              );
            })}
          </div>
        )}
      </Panel>

      {myAdjustments.length > 0 && (
        <Panel className="p-5">
          <SectionLabel>Manual Point Adjustments</SectionLabel>
          <ul className="divide-y divide-ink-600/40">
            {myAdjustments.map((a) => {
              const by = data.users.find((u) => u.id === a.adjustedById);
              return (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-bone-100">{a.reason || "No reason given"}</p>
                    <p className="text-xs text-bone-400">
                      By {by?.name ?? "Unknown"} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                  <span className={`text-sm font-mono ${a.delta >= 0 ? "text-brass-400" : "text-alert-500"}`}>
                    {a.delta >= 0 ? "+" : ""}
                    {a.delta}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
};

export default Profile;
