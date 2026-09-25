import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { formatDateTime, nextRankOf, rankOf, startOfWeek } from "../../utils/format";
import { Avatar, Panel, Pill, ProgressBar, SectionLabel } from "../ui";

const DashboardHome: React.FC = () => {
  const { currentUser } = useAuth();
  const { data } = useData();
  if (!currentUser) return null;

  const rank = rankOf(currentUser, data);
  const nextRank = nextRankOf(currentUser, data);

  const myActivities = data.activities
    .filter((a) => a.userId === currentUser.id)
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));

  const weekStart = startOfWeek();
  const thisWeek = myActivities.filter((a) => new Date(a.submittedAt) >= weekStart);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeek = myActivities.filter(
    (a) => new Date(a.submittedAt) >= lastWeekStart && new Date(a.submittedAt) < weekStart
  );

  const pointsThisWeek = thisWeek
    .filter((a) => a.status === "APPROVED")
    .reduce((sum, a) => {
      const t = data.activityTypes.find((t) => t.id === a.activityTypeId);
      return sum + (t ? t.points * a.quantity : 0);
    }, 0);
  const pointsLastWeek = lastWeek
    .filter((a) => a.status === "APPROVED")
    .reduce((sum, a) => {
      const t = data.activityTypes.find((t) => t.id === a.activityTypeId);
      return sum + (t ? t.points * a.quantity : 0);
    }, 0);

  const weeklyMax = Math.max(pointsThisWeek, pointsLastWeek, 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">DASHBOARD</p>
        <h1 className="font-display text-3xl text-bone-100">
          Welcome back, {currentUser.name}
        </h1>
      </div>

      {/* Identity strip */}
      <Panel className="p-5 flex flex-wrap items-center gap-5">
        <Avatar name={currentUser.name} color={currentUser.avatarColor} size={52} />
        <div className="flex-1 min-w-[220px]">
          <p className="font-display text-lg text-bone-100">{currentUser.name}</p>
          <p className="text-sm text-bone-400">{rank?.name ?? "Unranked"}</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-bone-400 text-xs">Badge</p>
            <p className="text-bone-100 font-mono">{currentUser.badgeNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-bone-400 text-xs">Callsign</p>
            <p className="text-bone-100 font-mono">{currentUser.callsign ?? "—"}</p>
          </div>
          <div>
            <p className="text-bone-400 text-xs">Points</p>
            <p className="text-bone-100 font-mono">{currentUser.points}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {currentUser.divisions.map((key) => {
            const division = data.divisions.find((d) => d.key === key);
            if (!division) return null;
            return (
              <Pill key={key} color={division.color}>
                {division.icon} {division.shortName}
              </Pill>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rank progress */}
        <Panel className="p-5 lg:col-span-1">
          <SectionLabel>Rank Progress</SectionLabel>
          {nextRank ? (
            <>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-bone-100">{rank?.name}</span>
                <span className="text-bone-400">{nextRank.name}</span>
              </div>
              <ProgressBar value={currentUser.points} max={nextRank.pointThreshold} />
              <p className="text-xs text-bone-400 mt-2">
                {currentUser.points} / {nextRank.pointThreshold} pts toward eligibility.
                Promotions are granted manually by command staff.
              </p>
            </>
          ) : (
            <p className="text-sm text-bone-400">You hold the department's highest rank.</p>
          )}
        </Panel>

        {/* Weekly activity */}
        <Panel className="p-5 lg:col-span-2">
          <SectionLabel>Weekly Activity (approved points)</SectionLabel>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-bone-400 mb-1">
                <span>This week</span>
                <span>{pointsThisWeek} pts</span>
              </div>
              <ProgressBar value={pointsThisWeek} max={weeklyMax} color="#B8934A" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-bone-400 mb-1">
                <span>Last week</span>
                <span>{pointsLastWeek} pts</span>
              </div>
              <ProgressBar value={pointsLastWeek} max={weeklyMax} color="#2B3A55" />
            </div>
          </div>
        </Panel>
      </div>

      {/* Recent activity feed */}
      <Panel className="p-5">
        <SectionLabel>Recent Activity</SectionLabel>
        {myActivities.length === 0 ? (
          <p className="text-sm text-bone-400">
            No activity submitted yet. Use "Submit Activity" in the sidebar to log your first entry.
          </p>
        ) : (
          <ul className="divide-y divide-ink-600">
            {myActivities.slice(0, 8).map((a) => {
              const type = data.activityTypes.find((t) => t.id === a.activityTypeId);
              return (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-bone-100">{type?.label ?? "Activity"}</p>
                    <p className="text-xs text-bone-400">
                      {a.description || "No description"} · {formatDateTime(a.submittedAt)}
                    </p>
                  </div>
                  <StatusPill status={a.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};

const StatusPill: React.FC<{ status: "PENDING" | "APPROVED" | "REJECTED" }> = ({ status }) => {
  const map = {
    PENDING: { label: "Pending", color: "#B8934A" },
    APPROVED: { label: "Approved", color: "#5B8C5A" },
    REJECTED: { label: "Rejected", color: "#A6332F" },
  } as const;
  const { label, color } = map[status];
  return <Pill color={color}>{label}</Pill>;
};

export default DashboardHome;
