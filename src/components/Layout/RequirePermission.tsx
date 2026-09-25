import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";

/** Generic gate driven by a boolean field from usePermissions(), e.g.
 * "canAssignCallsign" — used for tools that aren't strictly command-only. */
const RequirePermission: React.FC<{
  check: keyof ReturnType<typeof usePermissions>;
  children: React.ReactNode;
}> = ({ check, children }) => {
  const perms = usePermissions();
  const allowed = Boolean(perms[check]);
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default RequirePermission;
