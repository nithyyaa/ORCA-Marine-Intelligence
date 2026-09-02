"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  Send,
  User,
  MapPin,
  Sparkles,
  ShieldCheck,
  Fish,
  CloudSun,
  Waves,
} from "lucide-react";
import Link from "next/link";

const suggestions = [
  {
    icon: ShieldCheck,
    title: "Fishing safety",
    question: "Is it safe to fish tomorrow at 6 AM?",
  },
  {
    icon: Fish,
    title: "Find fishing zones",
    question: "Find the nearest suitable fishing zone",
  },
  {
    icon: CloudSun,
    title: "Weather",
    question: "What will the weather be tomorrow?",
  },
  {
    icon: Waves,
    title: "Ocean conditions",
    question: "Show current ocean conditions",
  },
];

export default function AskORCA() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "orca"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(text = input) {
    if (!text.trim() || loading) return;

    const question = text.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/orca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "orca",
          text:
            data.response ||
            "Unable to get a marine intelligence response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "orca",
          text:
            "⚠️ ORCA could not connect to the marine intelligence service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/10 px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-xl border border-white/10 p-2 hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <Bot className="text-cyan-400" size={22} />
            </div>

            <div>
              <h1 className="font-semibold">Ask ORCA</h1>
              <p className="text-xs text-slate-500">
                Agentic Marine Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          <MapPin size={15} className="text-cyan-400" />
          Visakhapatnam, India
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col px-6 py-10">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10">
              <Sparkles size={36} className="text-cyan-400" />
            </div>

            <h2 className="text-4xl font-semibold tracking-tight">
              How can ORCA help?
            </h2>

            <p className="mt-3 max-w-2xl text-center text-slate-400">
              Ask questions naturally about marine safety, fishing zones,
              weather, ocean conditions, tides and hazards.
            </p>

            <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() => sendMessage(item.question)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                        <Icon
                          size={20}
                          className="text-cyan-400"
                        />
                      </div>

                      <div>
                        <div className="font-medium text-white">
                          {item.title}
                        </div>

                        <div className="mt-1 text-sm text-slate-400">
                          {item.question}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto pb-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "orca" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                    <Bot
                      size={18}
                      className="text-cyan-400"
                    />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-cyan-400 font-medium text-slate-950"
                      : "border border-white/10 bg-white/[0.05] text-slate-200"
                  }`}
                >
                  {message.text}
                </div>

                {message.role === "user" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <User size={17} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">
                  <Bot
                    size={18}
                    className="text-cyan-400"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm text-slate-400">
                  ORCA is analysing the marine conditions...
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2 shadow-2xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask ORCA about the marine environment..."
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-500"
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-600">
            ORCA • Marine intelligence assistant
          </p>
        </div>
      </section>
    </main>
  );
}