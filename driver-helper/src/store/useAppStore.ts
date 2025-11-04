"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { all, getDatabase, transaction } from "@/lib/sqlite";
import { formatISO, startOfDay } from "date-fns";

export type TransactionType = "income" | "expense";

export interface TransactionRecord {
  id: number;
  type: TransactionType;
  amount: number;
  category?: string | null;
  notes?: string | null;
  date: string;
  synced: number;
}

export interface ReminderRecord {
  id: number;
  title: string;
  remind_at: string;
  completed: number;
  synced: number;
}

export interface HealthMetricRecord {
  id: number;
  metric: string;
  value: number;
  unit?: string | null;
  recorded_at: string;
  notes?: string | null;
  synced: number;
}

export interface NoteRecord {
  id: number;
  title?: string | null;
  content: string;
  tags?: string | null;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface CommunityPostRecord {
  id: number;
  author: string;
  body: string;
  created_at: string;
  reactions: number;
  synced: number;
}

export interface SosLogRecord {
  id: number;
  triggered_at: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  message?: string | null;
  status: string;
  synced: number;
}

export interface NearbyDriverRecord {
  id: number;
  name: string;
  vehicle?: string | null;
  distance_km?: number | null;
  phone?: string | null;
}

interface AppStoreData {
  initialized: boolean;
  online: boolean;
  syncing: boolean;
  lastSyncedAt?: string;
  userName: string;
  transactions: TransactionRecord[];
  reminders: ReminderRecord[];
  notes: NoteRecord[];
  healthMetrics: HealthMetricRecord[];
  communityPosts: CommunityPostRecord[];
  sosLogs: SosLogRecord[];
  nearbyDrivers: NearbyDriverRecord[];
}

interface AppStoreActions {
  initialize: () => Promise<void>;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSynced: (iso?: string) => void;
  saveUserName: (name: string) => Promise<void>;
  addTransaction: (entry: Omit<TransactionRecord, "id" | "synced">) => Promise<void>;
  addReminder: (entry: Pick<ReminderRecord, "title" | "remind_at">) => Promise<void>;
  toggleReminderComplete: (id: number, complete: boolean) => Promise<void>;
  addNote: (payload: Pick<NoteRecord, "title" | "content" | "tags">) => Promise<number>;
  updateNote: (
    id: number,
    payload: Partial<Pick<NoteRecord, "title" | "content" | "tags">>,
  ) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  addHealthMetric: (
    payload: Pick<HealthMetricRecord, "metric" | "value" | "unit" | "notes">,
  ) => Promise<void>;
  addCommunityPost: (payload: Pick<CommunityPostRecord, "author" | "body">) => Promise<void>;
  addSosLog: (
    payload: Pick<
      SosLogRecord,
      "latitude" | "longitude" | "address" | "message" | "status"
    >,
  ) => Promise<number>;
  refreshFromDb: () => Promise<void>;
}

type AppStoreState = AppStoreData & AppStoreActions;

async function loadStateSnapshot(): Promise<AppStoreData> {
  const [user] = await all<{ id: number; name: string }>(
    "SELECT id, name FROM user_profile ORDER BY id DESC LIMIT 1",
  );
  const transactions = await all<TransactionRecord>(
    "SELECT * FROM earnings ORDER BY date DESC",
  );
  const reminders = await all<ReminderRecord>(
    "SELECT * FROM reminders ORDER BY remind_at ASC",
  );
  const notes = await all<NoteRecord>("SELECT * FROM notes ORDER BY updated_at DESC");
  const healthMetrics = await all<HealthMetricRecord>(
    "SELECT * FROM health_metrics ORDER BY recorded_at DESC",
  );
  const communityPosts = await all<CommunityPostRecord>(
    "SELECT * FROM community_posts ORDER BY created_at DESC",
  );
  const sosLogs = await all<SosLogRecord>(
    "SELECT * FROM sos_logs ORDER BY triggered_at DESC",
  );
  const nearbyDrivers = await all<NearbyDriverRecord>(
    "SELECT * FROM nearby_drivers ORDER BY distance_km ASC",
  );

  return {
    initialized: true,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    syncing: false,
    lastSyncedAt: undefined,
    userName: user?.name ?? "",
    transactions,
    reminders,
    notes,
    healthMetrics,
    communityPosts,
    sosLogs,
    nearbyDrivers,
  };
}

export const useAppStore = create<AppStoreState, [["zustand/immer", never]]>(
  immer<AppStoreState>((set, get) => ({
    initialized: false,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    syncing: false,
    lastSyncedAt: undefined,
    userName: "",
    transactions: [],
    reminders: [],
    notes: [],
    healthMetrics: [],
    communityPosts: [],
    sosLogs: [],
    nearbyDrivers: [],
    async initialize() {
      if (get().initialized) return;
      const snapshot = await loadStateSnapshot();
      set(snapshot);
    },
    setOnline(online: boolean) {
      set((state) => {
        state.online = online;
      });
    },
    setSyncing(syncing: boolean) {
      set((state) => {
        state.syncing = syncing;
      });
    },
    setLastSynced(iso?: string) {
      set((state) => {
        state.lastSyncedAt = iso;
      });
    },
    async saveUserName(name: string) {
      await transaction((db) => {
        let existingId: number | null = null;
        const findStmt = db.prepare("SELECT id FROM user_profile LIMIT 1");
        try {
          if (findStmt.step()) {
            const row = findStmt.get({}) as { id?: unknown };
            existingId = row?.id ? Number(row.id) : null;
          }
        } finally {
          findStmt.finalize();
        }

        if (existingId) {
          const updateStmt = db.prepare(
            "UPDATE user_profile SET name = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
          );
          try {
            updateStmt.bind([name, existingId]);
            updateStmt.step();
          } finally {
            updateStmt.finalize();
          }
        } else {
          const insertStmt = db.prepare("INSERT INTO user_profile (name) VALUES (?)");
          try {
            insertStmt.bind([name]);
            insertStmt.step();
          } finally {
            insertStmt.finalize();
          }
        }

        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES (?, ?, ?, ?)",
        );
        try {
          queueStmt.bind([
            "user_profile",
            existingId ?? null,
            existingId ? "update" : "insert",
            JSON.stringify({ name }),
          ]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });

      set((state) => {
        state.userName = name;
      });
    },
    async addTransaction(entry) {
      await transaction((db) => {
        const stmt = db.prepare(
          "INSERT INTO earnings (type, amount, category, notes, date, synced) VALUES (?, ?, ?, ?, ?, 0)",
        );
        try {
          stmt.bind([
            entry.type,
            entry.amount,
            entry.category ?? null,
            entry.notes ?? null,
            entry.date ?? formatISO(new Date()),
          ]);
          stmt.step();
        } finally {
          stmt.finalize();
        }

        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES (?, NULL, 'insert', ?)",
        );
        try {
          queueStmt.bind(["earnings", JSON.stringify(entry)]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async addReminder(entry) {
      await transaction((db) => {
        const stmt = db.prepare(
          "INSERT INTO reminders (title, remind_at, completed, synced) VALUES (?, ?, 0, 0)",
        );
        try {
          stmt.bind([entry.title, entry.remind_at]);
          stmt.step();
        } finally {
          stmt.finalize();
        }
        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('reminders', NULL, 'insert', ?)",
        );
        try {
          queueStmt.bind([JSON.stringify(entry)]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async toggleReminderComplete(id, complete) {
      await transaction((db) => {
        const stmt = db.prepare(
          "UPDATE reminders SET completed = ?, synced = 0 WHERE id = ?",
        );
        try {
          stmt.bind([complete ? 1 : 0, id]);
          stmt.step();
        } finally {
          stmt.finalize();
        }
        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('reminders', ?, 'update', ?)",
        );
        try {
          queueStmt.bind([id, JSON.stringify({ id, completed: complete })]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async addNote(payload) {
      let noteId = 0;
      await transaction((db) => {
        const stmt = db.prepare(
          "INSERT INTO notes (title, content, tags, created_at, updated_at, synced) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)",
        );
        try {
          stmt.bind([
            payload.title ?? null,
            payload.content,
            payload.tags ?? null,
          ]);
          stmt.step();
        } finally {
          stmt.finalize();
        }

        const idStmt = db.prepare("SELECT last_insert_rowid() as id");
        try {
          if (idStmt.step()) {
            const row = idStmt.get({}) as { id?: unknown };
            noteId = row?.id ? Number(row.id) : 0;
          }
        } finally {
          idStmt.finalize();
        }

        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('notes', ?, 'insert', ?)",
        );
        try {
          queueStmt.bind([noteId, JSON.stringify({ id: noteId, ...payload })]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
      return noteId;
    },
    async updateNote(id, payload) {
      if (!payload.title && !payload.content && !payload.tags) return;
      await transaction((db) => {
        const fields: string[] = [];
        const values: (string | number | null)[] = [];
        if (typeof payload.title !== "undefined") {
          fields.push("title = ?");
          values.push(payload.title ?? null);
        }
        if (typeof payload.content !== "undefined") {
          fields.push("content = ?");
          values.push(payload.content ?? null);
        }
        if (typeof payload.tags !== "undefined") {
          fields.push("tags = ?");
          values.push(payload.tags ?? null);
        }
        values.push(id);
        const stmt = db.prepare(
          `UPDATE notes SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?`,
        );
        try {
          stmt.bind(values);
          stmt.step();
        } finally {
          stmt.finalize();
        }

        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('notes', ?, 'update', ?)",
        );
        try {
          queueStmt.bind([id, JSON.stringify({ id, ...payload })]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async deleteNote(id) {
      await transaction((db) => {
        const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
        try {
          stmt.bind([id]);
          stmt.step();
        } finally {
          stmt.finalize();
        }
        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('notes', ?, 'delete', ?)",
        );
        try {
          queueStmt.bind([id, JSON.stringify({ id })]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async addHealthMetric(payload) {
      await transaction((db) => {
        const stmt = db.prepare(
          "INSERT INTO health_metrics (metric, value, unit, recorded_at, notes, synced) VALUES (?, ?, ?, ?, ?, 0)",
        );
        try {
          stmt.bind([
            payload.metric,
            payload.value,
            payload.unit ?? null,
            formatISO(new Date()),
            payload.notes ?? null,
          ]);
          stmt.step();
        } finally {
          stmt.finalize();
        }
        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('health_metrics', NULL, 'insert', ?)",
        );
        try {
          queueStmt.bind([JSON.stringify(payload)]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async addCommunityPost(payload) {
      await transaction((db) => {
        const stmt = db.prepare(
          "INSERT INTO community_posts (author, body, created_at, reactions, synced) VALUES (?, ?, CURRENT_TIMESTAMP, 0, 0)",
        );
        try {
          stmt.bind([payload.author, payload.body]);
          stmt.step();
        } finally {
          stmt.finalize();
        }

        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('community_posts', NULL, 'insert', ?)",
        );
        try {
          queueStmt.bind([JSON.stringify(payload)]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
    },
    async addSosLog(payload) {
      let logId = 0;
      await transaction((db) => {
        const stmt = db.prepare(
          "INSERT INTO sos_logs (triggered_at, latitude, longitude, address, message, status, synced) VALUES (?, ?, ?, ?, ?, ?, 0)",
        );
        try {
          stmt.bind([
            formatISO(new Date()),
            payload.latitude ?? null,
            payload.longitude ?? null,
            payload.address ?? null,
            payload.message ?? null,
            payload.status ?? "pending",
          ]);
          stmt.step();
        } finally {
          stmt.finalize();
        }

        const idStmt = db.prepare("SELECT last_insert_rowid() as id");
        try {
          if (idStmt.step()) {
            const row = idStmt.get({}) as { id?: unknown };
            logId = row?.id ? Number(row.id) : 0;
          }
        } finally {
          idStmt.finalize();
        }

        const queueStmt = db.prepare(
          "INSERT INTO sync_queue (entity, entity_id, operation, payload) VALUES ('sos_logs', ?, 'insert', ?)",
        );
        try {
          queueStmt.bind([logId, JSON.stringify({ id: logId, ...payload })]);
          queueStmt.step();
        } finally {
          queueStmt.finalize();
        }
      });
      await get().refreshFromDb();
      return logId;
    },
    async refreshFromDb() {
      const snapshot = await loadStateSnapshot();
      set((state) => {
        state.transactions = snapshot.transactions;
        state.reminders = snapshot.reminders;
        state.notes = snapshot.notes;
        state.healthMetrics = snapshot.healthMetrics;
        state.communityPosts = snapshot.communityPosts;
        state.sosLogs = snapshot.sosLogs;
        state.nearbyDrivers = snapshot.nearbyDrivers;
        state.userName = snapshot.userName;
        state.initialized = true;
      });
    },
  })),
);

interface SyncPayload {
  id?: number;
  entity: string;
  operation: string;
  payload: Record<string, unknown>;
}

export async function getPendingSyncPayloads(): Promise<SyncPayload[]> {
  const db = await getDatabase();
  const stmt = db.prepare(
    "SELECT id, entity, operation, payload FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC",
  );
  const items: SyncPayload[] = [];
  try {
    while (stmt.step()) {
      const row = stmt.get({}) as Record<string, unknown>;
      items.push({
        id: Number(row.id),
        entity: String(row.entity),
        operation: String(row.operation),
        payload: JSON.parse(String(row.payload)),
      });
    }
  } finally {
    stmt.finalize();
  }
  return items;
}

export async function markSynced(queueId: number) {
  await transaction((db) => {
    const stmt = db.prepare("UPDATE sync_queue SET status = 'synced' WHERE id = ?");
    try {
      stmt.bind([queueId]);
      stmt.step();
    } finally {
      stmt.finalize();
    }
  });
}

export function calculateDailySummary(transactions: TransactionRecord[]) {
  const today = startOfDay(new Date()).toISOString().slice(0, 10);
  let income = 0;
  let expense = 0;
  transactions.forEach((tx) => {
    const txDate = tx.date.slice(0, 10);
    if (txDate === today) {
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
  });
  return {
    date: today,
    income,
    expense,
    balance: income - expense,
  };
}
