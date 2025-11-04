"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AudioLines,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function AssistantPage() {
  const notes = useAppStore((state) => state.notes);
  const reminders = useAppStore((state) => state.reminders);
  const transactions = useAppStore((state) => state.transactions);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [translationInput, setTranslationInput] = useState("");
  const [translationDirection, setTranslationDirection] = useState<"en-hi" | "hi-en">("en-hi");
  const [translationOutput, setTranslationOutput] = useState("");
  const [translateLoading, setTranslateLoading] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, []);

  const handleChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    const prompt = chatInput.trim();
    const nextHistory = [...chatHistory, { role: "user" as const, text: prompt }];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          prompt,
          history: nextHistory,
        }),
      });
      const data = await response.json();
      const text = (response.ok ? data.text : data.error) || "Unable to respond";
      setChatHistory((prev) => [...prev, { role: "model" as const, text }]);
    } catch (_error) {
      console.error("Gemini chat error", _error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model" as const,
          text: "Network error while contacting Gemini.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!translationInput.trim()) return;
    setTranslateLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "translate",
          text: translationInput,
          direction: translationDirection,
        }),
      });
      const data = await response.json();
      setTranslationOutput((response.ok ? data.text : data.error) || "");
    } catch (_error) {
      console.error("Gemini translate error", _error);
      setTranslationOutput("Network error during translation.");
    } finally {
      setTranslateLoading(false);
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setRecording(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunks.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        setTranscribeLoading(true);
        try {
          const response = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "transcribe",
              audio: base64,
              mimeType: "audio/webm",
            }),
          });
          const data = await response.json();
          setTranscription((response.ok ? data.text : data.error) || "");
        } catch (_error) {
          console.error("Gemini transcribe error", _error);
          setTranscription("Unable to transcribe audio.");
        } finally {
          setTranscribeLoading(false);
        }
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    setRecording(true);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [] as { title: string; snippet: string }[];
    const query = searchQuery.toLowerCase();
    const noteMatches = notes
      .filter((note) =>
        note.content.toLowerCase().includes(query) ||
        (note.title ?? "").toLowerCase().includes(query),
      )
      .map((note) => ({
        title: `Note: ${note.title || "Untitled"}`,
        snippet: note.content.slice(0, 140),
      }));
    const reminderMatches = reminders
      .filter((reminder) => reminder.title.toLowerCase().includes(query))
      .map((reminder) => ({
        title: "Reminder",
        snippet: `${reminder.title} · ${format(new Date(reminder.remind_at), "d MMM, hh:mm a")}`,
      }));
    const earningsMatches = transactions
      .filter((tx) =>
        (tx.category ?? "").toLowerCase().includes(query) ||
        (tx.notes ?? "").toLowerCase().includes(query),
      )
      .map((tx) => ({
        title: `Transaction ${tx.type === "income" ? "Income" : "Expense"}`,
        snippet: `${tx.category} ₹${tx.amount} on ${format(new Date(tx.date), "d MMM")}`,
      }));
    return [...noteMatches, ...reminderMatches, ...earningsMatches].slice(0, 10);
  }, [notes, reminders, transactions, searchQuery]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-semibold">Gemini AI Assistant</h1>
        <p className="mt-2 text-sm text-white/90">
          Ask anything, translate between Hindi ↔ English, take voice notes, and search your offline data.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Chat with Gemini</h2>
          </div>
          <div className="mt-4 h-64 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            {chatHistory.length === 0 ? (
              <p className="text-slate-500">No conversation yet. Ask for route tips or manage your schedule.</p>
            ) : (
              chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-3 py-2 ${message.role === "user" ? "bg-indigo-500 text-white" : "bg-white text-slate-800 shadow"}`}
                  >
                    {message.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleChat} className="mt-3 flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask Gemini..."
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900">Translation</h2>
          </div>
          <textarea
            className="mt-3 min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Type text in Hindi or English"
            value={translationInput}
            onChange={(event) => setTranslationInput(event.target.value)}
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() =>
                setTranslationDirection((prev) => (prev === "en-hi" ? "hi-en" : "en-hi"))
              }
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Direction: {translationDirection === "en-hi" ? "English → Hindi" : "Hindi → English"}
            </button>
            <button
              onClick={handleTranslate}
              disabled={translateLoading}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {translateLoading ? "Working..." : "Translate"}
            </button>
          </div>
          {translationOutput && (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {translationOutput}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <AudioLines className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-semibold text-slate-900">Voice to Text</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Record quick thoughts in Hindi or English. Gemini will transcribe them for you.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${recording ? "bg-rose-500" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {recording ? "Stop" : "Start"}
            </button>
            {transcribeLoading && <Loader2 className="h-4 w-4 animate-spin text-rose-500" />}
          </div>
          {transcription && (
            <div className="mt-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              {transcription}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-900">Smart Search</h2>
          </div>
          <input
            type="text"
            placeholder="Search notes, reminders, earnings..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
          />
          <div className="mt-3 space-y-2 text-sm">
            {searchQuery && searchResults.length === 0 && (
              <p className="text-slate-500">No matches found offline.</p>
            )}
            {searchResults.map((result, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{result.title}</p>
                <p className="mt-1 text-sm text-slate-700">{result.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
