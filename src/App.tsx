import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./components/Auth/LoginPage";
import DashboardLayout from "./components/Layout/DashboardLayout";
import RequireCommand from "./components/Layout/RequireCommand";
import RequireDivision from "./components/Layout/RequireDivision";
import RequirePermission from "./components/Layout/RequirePermission";
import Landing from "./components/Landing/Landing";
import DashboardHome from "./components/Dashboard/DashboardHome";
import Profile from "./components/Dashboard/Profile";
import AccountSettings from "./components/Dashboard/AccountSettings";
import SubmitActivity from "./components/Dashboard/SubmitActivity";
import ChatRoom from "./components/Chat/ChatRoom";
import DivisionPage from "./components/Divisions/DivisionPage";
import Archives from "./components/CID/Archives";
import CaseEditor from "./components/CID/CaseEditor";
import CaseView from "./components/CID/CaseView";
import AdminPanel from "./components/Admin/AdminPanel";
import AssignCallsigns from "./components/Admin/AssignCallsigns";
import TicketList from "./components/Tickets/TicketList";
import NewTicket from "./components/Tickets/NewTicket";
import TicketDetail from "./components/Tickets/TicketDetail";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<AccountSettings />} />
        <Route path="activity" element={<SubmitActivity />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:ticketId" element={<TicketDetail />} />
        <Route path="chat/:roomId" element={<ChatRoom />} />
        <Route path="division/:key" element={<DivisionPage />} />

        {/* CID tools — gated to CID members (and command staff) */}
        <Route
          path="cid/archives"
          element={
            <RequireDivision division="CID">
              <Archives />
            </RequireDivision>
          }
        />
        <Route
          path="cid/case/new"
          element={
            <RequireDivision division="CID">
              <CaseEditor />
            </RequireDivision>
          }
        />
        <Route
          path="cid/case/:caseId"
          element={
            <RequireDivision division="CID">
              <CaseView />
            </RequireDivision>
          }
        />
        <Route
          path="cid/case/:caseId/edit"
          element={
            <RequireDivision division="CID">
              <CaseEditor />
            </RequireDivision>
          }
        />

        {/* HR / Dispatch callsign tool (command staff can also reach it) */}
        <Route
          path="callsigns"
          element={
            <RequirePermission check="canAssignCallsign">
              <AssignCallsigns />
            </RequirePermission>
          }
        />

        {/* Command-only admin panel */}
        <Route
          path="admin"
          element={
            <RequireCommand>
              <AdminPanel />
            </RequireCommand>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
