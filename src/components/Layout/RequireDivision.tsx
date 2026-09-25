import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { DivisionKey } from "../../types";

/** Gate for a division-only page: renders children only if the current user
 * holds the given division tag (or is command staff). */
const RequireDivision: React.FC<{ division: DivisionKey; children: React.ReactNode }> = ({
  division,
  children,
}) => {
  const { hasDivision, isCommand } = usePermissions();
  if (!hasDivision(division) && !isCommand) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default RequireDivision;
