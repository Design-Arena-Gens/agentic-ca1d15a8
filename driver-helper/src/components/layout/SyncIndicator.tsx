"use client";

import { useAppStore } from "@/store/useAppStore";
import { Loader2, WifiOff, Cloud } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export function SyncIndicator() {
  const syncing = useAppStore((state) => state.syncing);
  const online = useAppStore((state) => state.online);
  const lastSyncedAt = useAppStore((state) => state.lastSyncedAt);

  if (!online) {
    return (
      <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 text-amber-900">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Offline mode · Changes will sync when you&apos;re back online.</span>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 text-blue-900">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Syncing with cloud...</span>
      </div>
    );
  }

  if (!lastSyncedAt) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 text-emerald-900">
      <Cloud className="h-4 w-4" />
      <span className="text-sm font-medium">
        Synced {formatDistanceToNowStrict(new Date(lastSyncedAt))} ago
      </span>
    </div>
  );
}
