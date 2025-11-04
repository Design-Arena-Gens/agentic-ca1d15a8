"use client";

import Link from "next/link";
import { ArrowRight, BellRing, NotebookPen, ShieldAlert, Stethoscope, Users, Wallet } from "lucide-react";
import { useAppStore, calculateDailySummary } from "@/store/useAppStore";
import { format } from "date-fns";

const featureCards = [
  {
    title: "SOS Help",
    description: "Alert trusted drivers & share live location",
    href: "/sos",
    icon: ShieldAlert,
    accent: "bg-red-500/10 text-red-600",
  },
  {
    title: "Income & Expense",
    description: "Track daily rides, fuel & savings",
    href: "/earnings",
    icon: Wallet,
    accent: "bg-sky-500/10 text-sky-600",
  },
  {
    title: "Community",
    description: "Connect with local driver groups",
    href: "/community",
    icon: Users,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Health",
    description: "Monitor vitals & wellness tips",
    href: "/health",
    icon: Stethoscope,
    accent: "bg-purple-500/10 text-purple-600",
  },
  {
    title: "Notes",
    description: "Save quick reminders & route notes",
    href: "/notes",
    icon: NotebookPen,
    accent: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "AI Assistant",
    description: "Chat, translate & plan with Gemini",
    href: "/assistant",
    icon: ArrowRight,
    accent: "bg-indigo-500/10 text-indigo-600",
  },
];

export default function DashboardPage() {
  const userName = useAppStore((state) => state.userName);
  const transactions = useAppStore((state) => state.transactions);
  const reminders = useAppStore((state) => state.reminders);
  const notes = useAppStore((state) => state.notes);
  const summary = calculateDailySummary(transactions);
  const todayReminders = reminders.filter((reminder) =>
    reminder.remind_at.startsWith(summary.date),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Today, {format(new Date(), "EEE d MMM")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Hello {userName} 👋
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Here&apos;s your drive summary for today. Stay safe and hydrated!
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-sky-500/10 p-4">
            <p className="text-sm font-medium text-sky-600">Earnings</p>
            <p className="mt-1 text-2xl font-semibold text-sky-900">
              ₹{summary.income.toFixed(0)}
            </p>
          </div>
          <div className="rounded-2xl bg-rose-500/10 p-4">
            <p className="text-sm font-medium text-rose-600">Expenses</p>
            <p className="mt-1 text-2xl font-semibold text-rose-900">
              ₹{summary.expense.toFixed(0)}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-600">Balance</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">
              ₹{summary.balance.toFixed(0)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {featureCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex items-start gap-4 rounded-3xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
            >
              <card.icon className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3">
                Open <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Reminders</h3>
            <BellRing className="h-5 w-5 text-amber-500" />
          </div>
          {todayReminders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No reminders for today. Add one in the Notes section.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {todayReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm"
                >
                  <span>{reminder.title}</span>
                  <span className="text-slate-500">
                    {format(new Date(reminder.remind_at), "hh:mm a")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Latest Notes</h3>
            <NotebookPen className="h-5 w-5 text-indigo-500" />
          </div>
          {notes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              You have no notes yet. Tap notes to capture quick thoughts.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notes.slice(0, 3).map((note) => (
                <li key={note.id} className="rounded-2xl bg-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {note.title || "Untitled note"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {note.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
