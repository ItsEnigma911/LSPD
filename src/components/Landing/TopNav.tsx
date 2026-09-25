import React from "react";
import { Link } from "react-router-dom";
import lspdLogo from "../../assets/lspd-logo.png";
import { useAuth } from "../../context/AuthContext";

/** Floating, glassy pill navbar for the public landing page. Shows a Login
 * button when logged out, or a Dashboard link + Log Out button when logged in. */
const TopNav: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="sticky top-4 z-50 px-4 md:px-10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4 rounded-full bg-ink-800/40 backdrop-blur-xl border border-ink-600/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <img src={lspdLogo} alt="LSPD crest" className="w-9 h-9 object-contain shrink-0" />
          <span className="font-display tracking-wide text-bone-100 text-sm md:text-base truncate">
            Los Santos Police Department
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-1.5 text-sm text-bone-100 hover:text-brass-400 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-1.5 rounded-full border border-ink-600/60 text-sm text-bone-100 hover:border-alert-500/60 hover:text-alert-500 transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full bg-brass-500 hover:bg-brass-400 text-ink-950 font-display font-medium text-sm transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default TopNav;
