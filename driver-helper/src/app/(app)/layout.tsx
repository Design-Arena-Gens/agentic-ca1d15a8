"use client";

import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { useAppStore } from "@/store/useAppStore";

function AppGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const userName = useAppStore((state) => state.userName);

  useEffect(() => {
    if (!userName) {
      router.replace("/");
    }
  }, [router, userName]);

  if (!userName) {
    return null;
  }

  return children;
}

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <AppGuard>
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-slate-50 pb-24">
        <SyncIndicator />
        <main className="flex-1 px-4 pb-10 pt-6 md:px-6 lg:px-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppGuard>
  );
}
