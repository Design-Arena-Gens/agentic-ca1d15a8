"use client";

import { FormEvent, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Droplets, HeartPulse, MoonStar, Utensils } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const quickMetrics = [
  { label: "Water 250ml", metric: "water", value: 250, unit: "ml", icon: Droplets },
  { label: "Meal Logged", metric: "meals", value: 1, unit: "count", icon: Utensils },
  { label: "Rest 15min", metric: "rest", value: 15, unit: "min", icon: MoonStar },
];

export default function HealthPage() {
  const metrics = useAppStore((state) => state.healthMetrics);
  const addMetric = useAppStore((state) => state.addHealthMetric);
  const [customMetric, setCustomMetric] = useState({
    metric: "blood_pressure",
    value: "120",
    unit: "mmHg",
    notes: "120/80",
  });
  const [submitting, setSubmitting] = useState(false);

  const logQuickMetric = async (metric: typeof quickMetrics[number]) => {
    await addMetric({
      metric: metric.metric,
      value: metric.value,
      unit: metric.unit,
      notes: metric.label,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    await addMetric({
      metric: customMetric.metric,
      value: parseFloat(customMetric.value.replace(/[^0-9.]/g, "")) || 0,
      unit: customMetric.unit,
      notes: customMetric.notes,
    });
    setCustomMetric({ metric: "blood_pressure", value: "120", unit: "mmHg", notes: "120/80" });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <HeartPulse className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Driver Health Center</h1>
        </div>
        <p className="mt-2 text-sm text-white/90">
          Small habits lead to safe journeys. Log water, meals, rest and vitals.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {quickMetrics.map((item) => (
            <button
              key={item.label}
              onClick={() => logQuickMetric(item)}
              className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <item.icon className="h-5 w-5" /> {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900">Custom Metric</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Metric (e.g. blood_pressure)"
            value={customMetric.metric}
            onChange={(event) => setCustomMetric((prev) => ({ ...prev, metric: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Value"
            value={customMetric.value}
            onChange={(event) => setCustomMetric((prev) => ({ ...prev, value: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Unit"
            value={customMetric.unit}
            onChange={(event) => setCustomMetric((prev) => ({ ...prev, unit: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Notes"
            value={customMetric.notes}
            onChange={(event) => setCustomMetric((prev) => ({ ...prev, notes: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? "Logging..." : "Save Metric"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {metrics.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-md">
            No health records yet. Use the quick actions above.
          </div>
        ) : (
          metrics.map((metric) => (
            <article key={metric.id} className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-md">
              <div>
                <p className="text-sm font-semibold text-slate-900 capitalize">
                  {metric.metric.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-slate-500">
                  {metric.notes || "Logged"} · {formatDistanceToNow(new Date(metric.recorded_at), { addSuffix: true })}
                </p>
              </div>
              <span className="text-lg font-semibold text-emerald-600">
                {metric.value} {metric.unit}
              </span>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
