"use client";

import { PropsWithChildren, useEffect } from "react";
import { syncWithCloud } from "@/lib/cloudSync";
import { useAppStore } from "@/store/useAppStore";

export function AppStateProvider({ children }: PropsWithChildren) {
  const initialized = useAppStore((state) => state.initialized);
  const initialize = useAppStore((state) => state.initialize);
  const online = useAppStore((state) => state.online);
  const setOnline = useAppStore((state) => state.setOnline);
  const setSyncing = useAppStore((state) => state.setSyncing);
  const setLastSynced = useAppStore((state) => state.setLastSynced);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => {
      setOnline(false);
      setSyncing(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline, setSyncing]);

  useEffect(() => {
    if (!initialized) return;
    if (!online) return;
    let cancelled = false;
    const executeSync = async () => {
      setSyncing(true);
      const result = await syncWithCloud();
      if (result.success && !cancelled) {
        setLastSynced(new Date().toISOString());
      }
      if (!cancelled) {
        setSyncing(false);
      }
    };
    executeSync();
    const interval = window.setInterval(executeSync, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [initialized, online, setLastSynced, setSyncing]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface text-foreground">
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-tight">Driver Helper</p>
          <p className="mt-3 text-base text-slate-500">
            Preparing your offline workspace...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
