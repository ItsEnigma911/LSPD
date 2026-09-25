import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import DashboardTopBar from "./DashboardTopBar";
import Sidebar from "./Sidebar";

/** Wraps every /dashboard/* route: requires auth, renders the sidebar + page. */
const DashboardLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { connectionError } = useData();

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 px-6 md:px-10 py-8">
        {connectionError && (
          <div className="mb-4 px-4 py-2.5 rounded-md bg-alert-500/10 border border-alert-500/30 text-sm text-alert-500">
            Can't reach the backend ({connectionError}) — changes won't save or sync until it's
            back. Is the server running?
          </div>
        )}
        <DashboardTopBar />
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
