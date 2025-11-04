"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, IndianRupee } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface FormState {
  type: "income" | "expense";
  amount: string;
  category: string;
  notes: string;
  date: string;
}

const createDefaultForm = (): FormState => ({
  type: "income",
  amount: "",
  category: "Ride",
  notes: "",
  date: new Date().toISOString().slice(0, 10),
});

export default function EarningsPage() {
  const transactions = useAppStore((state) => state.transactions);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const [form, setForm] = useState<FormState>(createDefaultForm);
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") {
          acc.income += tx.amount;
        } else {
          acc.expense += tx.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [transactions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    await addTransaction({
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      notes: form.notes,
      date: `${form.date}T00:00:00`,
    });
    setForm(createDefaultForm());
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-900">Income & Expense</h1>
        <p className="mt-2 text-sm text-slate-500">
          Track all your rides, tips, fuel costs and toll expenses in one place.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<ArrowUpCircle className="h-8 w-8 text-emerald-500" />}
            label="Total Income"
            value={`₹${totals.income.toFixed(0)}`}
          />
          <SummaryCard
            icon={<ArrowDownCircle className="h-8 w-8 text-rose-500" />}
            label="Total Expense"
            value={`₹${totals.expense.toFixed(0)}`}
          />
          <SummaryCard
            icon={<IndianRupee className="h-8 w-8 text-sky-500" />}
            label="Net Balance"
            value={`₹${(totals.income - totals.expense).toFixed(0)}`}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900">Add Entry</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: "income" }))}
              className={`flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${form.type === "income" ? "bg-emerald-500 text-white" : "text-slate-600"}`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: "expense" }))}
              className={`flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${form.type === "expense" ? "bg-rose-500 text-white" : "text-slate-600"}`}
            >
              Expense
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Category (e.g. Ride, Fuel, Toll)"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
            required
          />
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="md:col-span-2 min-h-[80px] rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
          />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
        <div className="mt-4 space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">No entries yet. Add your first record above.</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tx.category || "General"}</p>
                  <p className="text-xs text-slate-500">
                    {format(parseISO(tx.date), "EEE, d MMM yyyy")}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-600" : "text-rose-500"}`}
                >
                  {tx.type === "income" ? "+" : "-"}₹{tx.amount.toFixed(0)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-slate-100 p-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
