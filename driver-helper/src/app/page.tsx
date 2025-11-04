"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const router = useRouter();
  const userName = useAppStore((state) => state.userName);
  const saveUserName = useAppStore((state) => state.saveUserName);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userName) {
      router.replace("/dashboard");
    }
  }, [router, userName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveUserName(name.trim());
      router.replace("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#2563eb] px-6 text-white">
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/10 p-10 shadow-2xl backdrop-blur-lg">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
            DH
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            Driver Helper
          </h1>
          <p className="mt-3 text-base text-white/80">
            आपका साथी हर सफर में · Your co-pilot on every ride
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <label className="block text-left text-sm font-medium uppercase tracking-wide text-white/80">
            Enter your name
          </label>
          <input
            type="text"
            placeholder="e.g. Rajesh"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/25 px-4 py-3 text-lg text-white placeholder:text-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex w-full items-center justify-center rounded-xl bg-white py-3 text-lg font-semibold text-[#1d4ed8] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/70"
          >
            {saving ? "Saving..." : "Start Driving"}
          </button>
        </form>
      </div>
    </div>
  );
}
