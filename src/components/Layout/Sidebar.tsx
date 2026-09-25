import React from "react";
import { NavLink } from "react-router-dom";
import lspdLogo from "../../assets/lspd-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { usePermissions } from "../../hooks/usePermissions";

const linkBase =
  "flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-colors";
const linkInactive = "text-bone-400 hover:text-bone-100 hover:bg-ink-700";
const linkActive = "bg-brass-500/15 text-brass-400 border-l-2 border-brass-500";

const NavItem: React.FC<{ to: string; icon: string; children: React.ReactNode }> = ({
  to,
  icon,
  children,
}) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
  >
    <span className="w-4 text-center">{icon}</span>
    <span>{children}</span>
  </NavLink>
);

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-3 mt-5 mb-1.5 text-[11px] tracking-[0.12em] text-bone-400/70 font-display">
    {children}
  </p>
);

const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { data } = useData();
  const { isCommand, hasDivision, canAssignCallsign } = usePermissions();

  if (!currentUser) return null;

  const myDivisions = currentUser.divisions
    .map((key) => data.divisions.find((d) => d.key === key))
    .filter((d): d is NonNullable<typeof d> => !!d);

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-ink-800/40 backdrop-blur-xl border-r border-ink-600/40 flex flex-col">
      <div className="px-4 py-4 border-b border-ink-600/40 flex items-center gap-2.5">
        <img src={lspdLogo} alt="LSPD crest" className="w-8 h-8 object-contain shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs">LSPD</p>
          <p className="text-sm text-bone-100 mt-0.5 truncate">{currentUser.name}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SectionHeading>Overview</SectionHeading>
        <NavItem to="/dashboard" icon="🏠">Dashboard</NavItem>
        <NavItem to="/dashboard/profile" icon="🪪">My Profile</NavItem>
        <NavItem to="/dashboard/settings" icon="⚙️">Account Settings</NavItem>
        <NavItem to="/dashboard/activity" icon="📋">Submit Activity</NavItem>
        <NavItem to="/dashboard/tickets" icon="🎫">Tickets</NavItem>

        <SectionHeading>Chat Rooms</SectionHeading>
        <NavItem to="/dashboard/chat/GLOBAL" icon="💬">LSPD — All Units</NavItem>
        {myDivisions.map((division) => (
          <NavItem key={division.key} to={`/dashboard/chat/${division.key}`} icon={division.icon}>
            {division.shortName} Chat
          </NavItem>
        ))}

        {myDivisions.length > 0 && <SectionHeading>Divisions</SectionHeading>}
        {myDivisions.map((division) => (
          <NavItem key={division.key} to={`/dashboard/division/${division.key}`} icon={division.icon}>
            {division.shortName}
          </NavItem>
        ))}
        {hasDivision("CID") && (
          <NavItem to="/dashboard/cid/archives" icon="🗃️">CID Archives</NavItem>
        )}
        {canAssignCallsign && (
          <NavItem to="/dashboard/callsigns" icon="🎙️">Assign Callsigns</NavItem>
        )}

        {isCommand && (
          <>
            <SectionHeading>Command</SectionHeading>
            <NavItem to="/dashboard/admin" icon="⭐">Admin Panel</NavItem>
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-ink-600/40">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-sm text-sm text-bone-400 hover:text-alert-500 hover:bg-alert-500/10 transition-colors"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
