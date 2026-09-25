import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";

/** Gate for command-only pages (Assistant Chief / Deputy Chief / Chief of Police). */
const RequireCommand: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCommand } = usePermissions();
  if (!isCommand) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default RequireCommand;
