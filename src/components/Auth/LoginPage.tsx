import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Input, Panel, PrimaryButton } from "../ui";

const LoginPage: React.FC = () => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed.");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">LSPD</p>
          <h1 className="font-display text-2xl text-bone-100">Member Login</h1>
        </div>

        <Panel className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="badge.callsign"
                autoFocus
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>
            {error && <p className="text-sm text-alert-500">{error}</p>}
            <PrimaryButton type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Logging In…" : "Log In"}
            </PrimaryButton>
          </form>
        </Panel>

        <p className="mt-4 text-xs text-bone-400 text-center">
          Only command staff have accounts by default — ask the Chief of Police or Deputy Chief to
          create one for you from Admin Panel → Personnel.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
