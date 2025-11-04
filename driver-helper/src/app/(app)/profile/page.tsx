"use client";

import { FormEvent, useState } from "react";
import { format } from "date-fns";
import { LogOut, ShieldAlert, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { resetDatabase } from "@/lib/sqlite";

export default function ProfilePage() {
  const userName = useAppStore((state) => state.userName);
  const saveUserName = useAppStore((state) => state.saveUserName);
  const reminders = useAppStore((state) => state.reminders);
  const sosLogs = useAppStore((state) => state.sosLogs);
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || name === userName) return;
    setSaving(true);
    await saveUserName(name.trim());
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            <p className="text-sm text-slate-500">Manage your Driver Helper identity.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Your name"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? "Saving..." : "Update Name"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming Reminders</h2>
        {reminders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No reminders saved. Add from dashboard.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{reminder.title}</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(reminder.remind_at), "d MMM yyyy, hh:mm a")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">SOS History</h2>
        </div>
        {sosLogs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">You haven&apos;t triggered SOS yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sosLogs.map((log) => (
              <li key={log.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {format(new Date(log.triggered_at), "d MMM yyyy, hh:mm a")}
                </p>
                <p className="text-xs text-slate-500">{log.address}</p>
                <p className="mt-1 text-xs text-emerald-600">Status: {log.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-md">
        <p className="font-semibold text-slate-900">App Preferences</p>
        <ul className="mt-2 space-y-1">
          <li>Offline-first · SQLite local storage</li>
          <li>Cloud sync when online</li>
          <li>Gemini AI integration</li>
        </ul>
        <button
          onClick={async () => {
            await resetDatabase();
            window.location.href = "/";
          }}
          className="mt-4 flex items-center gap-2 text-xs font-semibold text-rose-500 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" /> Reset onboarding (clear data from browser storage)
        </button>
      </section>
    </div>
  );
}
