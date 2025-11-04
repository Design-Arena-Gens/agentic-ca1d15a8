"use client";

import { FormEvent, useState } from "react";
import { format } from "date-fns";
import { FileEdit, Trash } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function NotesPage() {
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  const startEdit = (id: number) => {
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    setEditingId(id);
    setForm({
      title: note.title ?? "",
      content: note.content,
      tags: note.tags ?? "",
    });
  };

  const resetForm = () => {
    setForm({ title: "", content: "", tags: "" });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.content.trim()) return;
    setSubmitting(true);
    if (editingId) {
      await updateNote(editingId, {
        title: form.title || null,
        content: form.content,
        tags: form.tags || null,
      });
    } else {
      await addNote({
        title: form.title || null,
        content: form.content,
        tags: form.tags || null,
      });
    }
    resetForm();
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-900">Offline Notes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Save toll info, regular passenger details, or voice-to-text summaries from Gemini.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            placeholder="Write your note..."
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{editingId ? "Editing note" : "New note"}</span>
            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {submitting ? "Saving..." : editingId ? "Update Note" : "Save Note"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-md">
            You haven&apos;t created any notes yet.
          </div>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="rounded-3xl bg-white p-6 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {note.title || "Untitled"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Updated {format(new Date(note.updated_at), "d MMM yyyy, hh:mm a")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(note.id)}
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <FileEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await deleteNote(note.id);
                      if (editingId === note.id) {
                        resetForm();
                      }
                    }}
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:border-rose-200 hover:text-rose-600"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                {note.content}
              </p>
              {note.tags && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {note.tags.split(",").map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-600"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
