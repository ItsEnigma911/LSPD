import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { Input, Panel, PrimaryButton, SectionLabel } from "../ui";

/** Lets any logged-in user update their own display name and password.
 * Everything else (rank, badge, callsign, division tags) stays locked to
 * command / HR / Dispatch — see the Admin Panel and Assign Callsigns tool. */
const AccountSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const { updateUser, changeOwnPassword } = useData();

  const [name, setName] = useState(currentUser?.name ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!currentUser) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    setNameError(null);
    const result = await updateUser(currentUser.id, { name: name.trim() });
    setSavingName(false);
    if (!result.ok) {
      setNameError(result.error ?? "Couldn't save your name.");
      return;
    }
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return;
    setSavingUsername(true);
    setUsernameError(null);
    const result = await updateUser(currentUser.id, { username: trimmed });
    setSavingUsername(false);
    if (!result.ok) {
      setUsernameError(result.error ?? "Couldn't save your username.");
      return;
    }
    setUsername(trimmed);
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2500);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 4) {
      setPasswordError("New password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setSavingPassword(true);
    const result = await changeOwnPassword(currentUser.id, currentPassword, newPassword);
    setSavingPassword(false);

    if (!result.ok) {
      setPasswordError(result.error ?? "Couldn't update your password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="font-display text-brass-400 tracking-[0.15em] text-xs mb-1">MY ACCOUNT</p>
        <h1 className="font-display text-3xl text-bone-100">Account Settings</h1>
        <p className="text-sm text-bone-400 mt-2">
          Update your own display name, username, and password. Rank, badge number, callsign, and
          division tags are managed by command staff (or HR/Dispatch for callsigns).
        </p>
      </div>

      <Panel className="p-5">
        <SectionLabel>Display Name</SectionLabel>
        <form onSubmit={handleSaveName} className="space-y-3">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          {nameError && <p className="text-sm text-alert-500">{nameError}</p>}
          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={savingName}>
              {savingName ? "Saving…" : "Save Name"}
            </PrimaryButton>
            {nameSaved && <span className="text-sm text-brass-400">Saved.</span>}
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Username</SectionLabel>
        <form onSubmit={handleSaveUsername} className="space-y-3">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. officer.smith"
            />
            <p className="text-xs text-bone-400 mt-1.5">This is what you log in with — pick something you'll remember.</p>
          </div>
          {usernameError && <p className="text-sm text-alert-500">{usernameError}</p>}
          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={savingUsername}>
              {savingUsername ? "Saving…" : "Save Username"}
            </PrimaryButton>
            {usernameSaved && <span className="text-sm text-brass-400">Saved.</span>}
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Change Password</SectionLabel>
        <form onSubmit={handleSavePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-bone-400 mb-1.5">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">New password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-bone-400 mb-1.5">Confirm new password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          {passwordError && <p className="text-sm text-alert-500">{passwordError}</p>}
          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating…" : "Update Password"}
            </PrimaryButton>
            {passwordSaved && <span className="text-sm text-brass-400">Password updated.</span>}
          </div>
        </form>
      </Panel>
    </div>
  );
};

export default AccountSettings;
