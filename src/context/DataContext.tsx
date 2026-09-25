import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api";
import {
  ActivityStatus,
  AppData,
  CaseRecord,
  Division,
  DivisionKey,
  Rank,
  TicketStatus,
  User,
} from "../types";

const EMPTY_DATA: AppData = {
  users: [],
  ranks: [],
  divisions: [],
  activityTypes: [],
  activities: [],
  cases: [],
  messages: [],
  tickets: [],
  documents: [],
  pointAdjustments: [],
};

// How often to re-fetch in the background so this browser picks up changes
// made from other browsers/devices. A plain interval instead of WebSockets —
// less "instant," much simpler to run and host.
const POLL_INTERVAL_MS = 5000;

type Result = { ok: boolean; error?: string };
const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface DataContextValue {
  data: AppData;
  connectionError: string | null;

  updateUser: (userId: string, patch: Partial<User>) => Promise<Result>;
  setUserDivisions: (userId: string, divisions: DivisionKey[]) => Promise<Result>;
  changeOwnPassword: (userId: string, currentPassword: string, newPassword: string) => Promise<Result>;
  createUser: (input: { username: string; password: string; name: string }) => Promise<Result>;
  deleteUser: (userId: string) => Promise<Result>;

  addRank: (rank: Omit<Rank, "id">) => Promise<Result>;
  updateRank: (rankId: string, patch: Partial<Rank>) => Promise<Result>;
  deleteRank: (rankId: string) => Promise<Result>;
  restoreDefaultRanks: () => Promise<void>;

  addDivision: (division: Omit<Division, "key" | "builtIn">) => Promise<{ ok: boolean; key?: string; error?: string }>;
  updateDivision: (key: DivisionKey, patch: Partial<Division>) => Promise<Result>;
  deleteDivision: (key: DivisionKey) => Promise<Result>;

  submitActivity: (entry: { userId: string; activityTypeId: string; description: string; quantity: number; proofUrl?: string }) => Promise<Result>;
  reviewActivity: (activityId: string, status: ActivityStatus, reviewerId: string) => Promise<Result>;

  addCase: (record: Omit<CaseRecord, "id" | "createdAt" | "updatedAt">) => Promise<{ ok: boolean; id?: string; error?: string }>;
  updateCase: (caseId: string, patch: Partial<CaseRecord>) => Promise<Result>;
  deleteCase: (caseId: string) => Promise<Result>;

  sendMessage: (roomId: string, senderId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;

  createTicket: (input: { title: string; description: string; category: string; division: DivisionKey | null; creatorId: string }) => Promise<Result>;
  replyToTicket: (ticketId: string, authorId: string, content: string) => Promise<Result>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<Result>;
  assignTicket: (ticketId: string, assignedToId: string | null) => Promise<Result>;

  uploadDivisionDocument: (divisionKey: DivisionKey, title: string, file: File, uploadedById: string) => Promise<Result>;
  deleteDivisionDocument: (divisionKey: DivisionKey, docId: string) => Promise<Result>;

  adjustPoints: (userId: string, delta: number, reason: string, adjustedById: string) => Promise<Result>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

function errorFrom(err: unknown): string {
  return err instanceof ApiError ? err.message : "Couldn't reach the server — is it running?";
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    try {
      const res = await api.get<AppData>("/data");
      setData(res);
      setConnectionError(null);
    } catch (err) {
      setConnectionError(errorFrom(err));
    }
  };

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutate = async (fn: () => Promise<void>): Promise<Result> => {
    try {
      await fn();
      await refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorFrom(err) };
    }
  };

  const updateUser: DataContextValue["updateUser"] = (userId, patch) =>
    mutate(() => api.patch(`/users/${userId}`, patch));

  const setUserDivisions: DataContextValue["setUserDivisions"] = (userId, divisions) =>
    mutate(() => api.put(`/users/${userId}/divisions`, { divisions }));

  const changeOwnPassword: DataContextValue["changeOwnPassword"] = (userId, currentPassword, newPassword) =>
    mutate(() => api.patch(`/users/${userId}`, { currentPassword, newPassword }));

  const createUser: DataContextValue["createUser"] = (input) => mutate(() => api.post("/users", input));

  const deleteUser: DataContextValue["deleteUser"] = (userId) => mutate(() => api.delete(`/users/${userId}`));

  const addRank: DataContextValue["addRank"] = (rank) => mutate(() => api.post("/ranks", rank));

  const updateRank: DataContextValue["updateRank"] = (rankId, patch) =>
    mutate(() => api.patch(`/ranks/${rankId}`, patch));

  const deleteRank: DataContextValue["deleteRank"] = (rankId) => mutate(() => api.delete(`/ranks/${rankId}`));

  const restoreDefaultRanks: DataContextValue["restoreDefaultRanks"] = async () => {
    try {
      await api.post("/ranks/restore-defaults");
    } finally {
      await refresh();
    }
  };

  const addDivision: DataContextValue["addDivision"] = async (division) => {
    try {
      const res = await api.post<{ division: Division }>("/divisions", division);
      await refresh();
      return { ok: true, key: res.division.key };
    } catch (err) {
      return { ok: false, error: errorFrom(err) };
    }
  };

  const updateDivision: DataContextValue["updateDivision"] = (key, patch) =>
    mutate(() => api.patch(`/divisions/${key}`, patch));

  const deleteDivision: DataContextValue["deleteDivision"] = (key) => mutate(() => api.delete(`/divisions/${key}`));

  const submitActivity: DataContextValue["submitActivity"] = (entry) => mutate(() => api.post("/activities", entry));

  const reviewActivity: DataContextValue["reviewActivity"] = (activityId, status, reviewerId) =>
    mutate(() => api.patch(`/activities/${activityId}/review`, { status, reviewerId }));

  const addCase: DataContextValue["addCase"] = async (record) => {
    try {
      const res = await api.post<{ id: string }>("/cases", record);
      await refresh();
      return { ok: true, id: res.id };
    } catch (err) {
      return { ok: false, error: errorFrom(err) };
    }
  };

  const updateCase: DataContextValue["updateCase"] = (caseId, patch) =>
    mutate(() => api.patch(`/cases/${caseId}`, patch));

  const deleteCase: DataContextValue["deleteCase"] = (caseId) => mutate(() => api.delete(`/cases/${caseId}`));

  const sendMessage: DataContextValue["sendMessage"] = (roomId, senderId, content) => {
    // Optimistic: the message shows immediately in this browser; the next
    // poll (or other browsers' polls) will pick it up everywhere else.
    api.post("/messages", { roomId, senderId, content }).then(refresh).catch((err) => setConnectionError(errorFrom(err)));
  };

  const deleteMessage: DataContextValue["deleteMessage"] = (messageId) => {
    api.delete(`/messages/${messageId}`).then(refresh).catch((err) => setConnectionError(errorFrom(err)));
  };

  const createTicket: DataContextValue["createTicket"] = (input) => mutate(() => api.post("/tickets", input));

  const replyToTicket: DataContextValue["replyToTicket"] = (ticketId, authorId, content) =>
    mutate(() => api.post(`/tickets/${ticketId}/replies`, { authorId, content }));

  const updateTicketStatus: DataContextValue["updateTicketStatus"] = (ticketId, status) =>
    mutate(() => api.patch(`/tickets/${ticketId}`, { status }));

  const assignTicket: DataContextValue["assignTicket"] = (ticketId, assignedToId) =>
    mutate(() => api.patch(`/tickets/${ticketId}`, { assignedToId }));

  const uploadDivisionDocument: DataContextValue["uploadDivisionDocument"] = async (
    divisionKey,
    title,
    file,
    uploadedById
  ) => {
    try {
      const fileUrl = await readFileAsDataUrl(file);
      await api.post(`/divisions/${divisionKey}/documents`, { title, fileUrl, uploadedById });
      await refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorFrom(err) };
    }
  };

  const deleteDivisionDocument: DataContextValue["deleteDivisionDocument"] = (divisionKey, docId) =>
    mutate(() => api.delete(`/divisions/${divisionKey}/documents/${docId}`));

  const adjustPoints: DataContextValue["adjustPoints"] = (userId, delta, reason, adjustedById) =>
    mutate(() => api.post(`/users/${userId}/points`, { delta, reason, adjustedById }));

  return (
    <DataContext.Provider
      value={{
        data,
        connectionError,
        updateUser,
        setUserDivisions,
        changeOwnPassword,
        createUser,
        deleteUser,
        addRank,
        updateRank,
        deleteRank,
        restoreDefaultRanks,
        addDivision,
        updateDivision,
        deleteDivision,
        submitActivity,
        reviewActivity,
        addCase,
        updateCase,
        deleteCase,
        sendMessage,
        deleteMessage,
        createTicket,
        replyToTicket,
        updateTicketStatus,
        assignTicket,
        uploadDivisionDocument,
        deleteDivisionDocument,
        adjustPoints,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
