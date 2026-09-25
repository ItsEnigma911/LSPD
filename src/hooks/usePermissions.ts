import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { DivisionKey } from "../types";

/**
 * Central permission logic for the whole site.
 *
 * Command ranks (Chief of Police, Deputy Chief, Assistant Chief) can manage
 * ranks, division tags, and badge numbers. HR and Dispatch division members
 * can additionally assign callsigns. Everything else (chat posting, activity
 * submission, viewing your own division tools) just requires being logged in
 * / holding the relevant division tag.
 */
export function usePermissions() {
  const { currentUser } = useAuth();
  const { data } = useData();

  const rank = currentUser ? data.ranks.find((r) => r.id === currentUser.rankId) : undefined;
  const isCommand = !!rank?.isCommand;

  const hasDivision = (key: DivisionKey) => !!currentUser?.divisions.includes(key);

  const canManageRanks = isCommand;
  const canManageDivisionTags = isCommand;
  const canAssignBadge = isCommand;
  const canAssignCallsign = isCommand || hasDivision("HR") || hasDivision("DISPATCH");
  const canReviewActivity = isCommand;
  const canModerateAnyChat = isCommand;

  return {
    currentUser,
    rank,
    isCommand,
    hasDivision,
    canManageRanks,
    canManageDivisionTags,
    canAssignBadge,
    canAssignCallsign,
    canReviewActivity,
    canModerateAnyChat,
  };
}
