"use client";

import { FormEvent, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function CommunityPage() {
  const posts = useAppStore((state) => state.communityPosts);
  const addPost = useAppStore((state) => state.addCommunityPost);
  const userName = useAppStore((state) => state.userName) || "Driver";
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    await addPost({ author: userName, body: message.trim() });
    setMessage("");
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-900">Driver Community</h1>
        <p className="mt-2 text-sm text-slate-500">
          Share updates, traffic alerts, police checkpoints and support your fellow drivers.
        </p>
        <form onSubmit={submitPost} className="mt-4 space-y-3">
          <textarea
            className="min-h-[120px] w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Share something helpful..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={300}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{message.length}/300</span>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? "Posting..." : "Post Update"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-md">
            No community updates yet. Start the conversation above!
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="rounded-3xl bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{post.author}</p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <MessageCircle className="h-4 w-4" /> Community
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{post.body}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
