"use client";

import { useEffect, useState } from "react";
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";

type AgentStatus = "running" | "completed" | "failed" | "skipped" | "retrying" | "fallback";

type AgentTrace = {
  name: string;
  status: AgentStatus;
  reason: string;
};

const agentIcons: Record<string, string> = {
  "Planner / Orchestrator Agent": "🧠",
  "Planner/Orchestrator": "🧠",
  "Weather Agent": "🌦️",
  "Ocean Agent": "🌊",
  "Tide Agent": "🌊",
  "Fishing / PFZ Agent": "🎣",
  "Geospatial Agent": "🗺️",
  "Disaster / Risk Agent": "⚠️",
  "Risk Agent": "⚠️",
  "Route Optimization Agent": "🧭",
  "Validation / Safety Agent": "🛡️",
  "Validation Agent": "🛡️",
  "Explanation Agent": "💡",
  "Visualization Agent": "📊",
  "Satellite Agent": "🛰️",
  "Marine Data Agent": "🌐",
};

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
  const [listening, setListening] = useState(false);

  // Voice output state
  const [speakingMessage, setSpeakingMessage] = useState<number | null>(null);

  const [agentTraces, setAgentTraces] = useState<
    Record<number, AgentTrace[]>
  >({});
  const [expandedAgents, setExpandedAgents] = useState<
    Record<number, boolean>
  >({});

  // Item 1: execution summary and evidence metadata returned by /api/orca.
  const [executionSummaries, setExecutionSummaries] = useState<Record<number, any>>({});
  const [evidenceSummaries, setEvidenceSummaries] = useState<Record<number, any>>({});
  const [followUps, setFollowUps] = useState<Record<number, string[]>>({});
  const [agentPlans, setAgentPlans] = useState<Record<number, any>>({});

  const [language, setLanguage] = useState("en");

  const [locationName, setLocationName] = useState(
    "Location unavailable"
  );

  useEffect(() => {
    const loadOperatingLocation = () => {
      try {
        const savedLocation = localStorage.getItem(
          "orca-location"
        );

        if (!savedLocation) {
          setLocationName("Location unavailable");
          return;
        }

        const location = JSON.parse(savedLocation);

        if (location?.name) {
          setLocationName(location.name);
        } else {
          setLocationName("Location unavailable");
        }
      } catch (error) {
        console.error(
          "Unable to load operating location:",
          error
        );

        setLocationName("Location unavailable");
      }
    };

    loadOperatingLocation();

    const interval = setInterval(
      loadOperatingLocation,
      1000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * Browser voice input.
   *
   * This remains exactly as before:
   * English  -> en-IN
   * Telugu   -> te-IN
   * Hindi    -> hi-IN
   * Tamil    -> ta-IN
   * Kannada  -> kn-IN
   */
  function startVoiceInput() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    const speechLanguage: Record<string, string> = {
      en: "en-IN",
      te: "te-IN",
      hi: "hi-IN",
      ta: "ta-IN",
      kn: "kn-IN",
    };

    recognition.lang =
      speechLanguage[language] || "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || "";

      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(
        "Voice recognition error:",
        event.error
      );

      setListening(false);
    };

    recognition.onend = () => setListening(false);

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Unable to start voice recognition:",
        error
      );

      setListening(false);
    }
  }

  /*
   * Browser voice output.
   *
   * IMPORTANT:
   * This intentionally uses the browser's built-in speechSynthesis.
   * No Azure.
   * No /api/tts.
   * No API key.
   *
   * Voice output follows the selected ORCA language.
   */
 function speakResponse(
  text: string,
  messageIndex: number
) {
  if (typeof window === "undefined") return;

  if (!("speechSynthesis" in window)) {
    alert(
      "Voice output is not supported in this browser."
    );
    return;
  }

  // If this response is already speaking,
  // stop the current speech.
  if (speakingMessage === messageIndex) {
    window.speechSynthesis.cancel();
    setSpeakingMessage(null);
    return;
  }

  // Stop any previous speech.
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/[*_`#]/g, "")
    .replace(/\n+/g, ". ")
    .trim();

  if (!cleanText) return;

  const utterance =
    new SpeechSynthesisUtterance(cleanText);

  const speechLanguage: Record<string, string> = {
    en: "en-IN",
    te: "te-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    kn: "kn-IN",
  };

  const targetLanguage =
    speechLanguage[language] || "en-IN";

  utterance.lang = targetLanguage;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voices =
    window.speechSynthesis.getVoices();

  /*
   * Prefer the selected language.
   *
   * Priority:
   * 1. Exact Indian language
   * 2. Same language family
   * 3. English India fallback
   */
  const languageVoice =
    voices.find(
      (voice) =>
        voice.lang.toLowerCase() ===
        targetLanguage.toLowerCase()
    ) ||
    voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(
            targetLanguage
              .split("-")[0]
              .toLowerCase()
          )
    ) ||
    voices.find((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith("en-in")
    ) ||
    voices.find((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith("en")
    );

  if (languageVoice) {
    utterance.voice = languageVoice;
  }

  utterance.onstart = () => {
    setSpeakingMessage(messageIndex);
  };

  utterance.onend = () => {
    setSpeakingMessage(null);
  };

  utterance.onerror = (event) => {
    console.error(
      "Browser speech synthesis error:",
      event
    );

    setSpeakingMessage(null);
  };

  window.speechSynthesis.speak(utterance);
}

  /*
   * Load browser voices.
   *
   * Some browsers populate the voice list asynchronously.
   * This ensures that the English voice list is ready
   * before the user presses Listen.
   */
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.getVoices();

    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );

      window.speechSynthesis.cancel();
    };
  }, []);

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
      let savedLocation: any = null;

      try {
        const raw =
          localStorage.getItem("orca-location");

        if (raw) {
          savedLocation = JSON.parse(raw);
        }
      } catch {
        savedLocation = null;
      }

      const res = await fetch("/api/orca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
          language,
          location:
            savedLocation?.name ?? locationName,
          latitude:
            savedLocation?.latitude ?? null,
          longitude:
            savedLocation?.longitude ?? null,
          conversationHistory: messages
            .slice(-10)
            .map((message) => ({
              role: message.role,
              text: message.text,
            })),
        }),
      });

      const raw = await res.text();

      let data;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        console.error(
          "Invalid API response:",
          raw
        );

        throw new Error(
          "ORCA API returned an invalid response."
        );
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `ORCA API request failed (${res.status})`
        );
      }

      const messageIndex =
        messages.length + 1;

      if (Array.isArray(data.agents)) {
        setAgentTraces((prev) => ({
          ...prev,
          [messageIndex]: data.agents,
        }));
      }

      if (data.executionSummary) {
        setExecutionSummaries((prev) => ({
          ...prev,
          [messageIndex]: data.executionSummary,
        }));
      }

      if (data.evidenceSummary) {
        setEvidenceSummaries((prev) => ({
          ...prev,
          [messageIndex]: data.evidenceSummary,
        }));
      }

      if (data.agentExecutionPlan) {
        setAgentPlans((prev) => ({
          ...prev,
          [messageIndex]: data.agentExecutionPlan,
        }));
      }

      if (Array.isArray(data.followUps)) {
        setFollowUps((prev) => ({
          ...prev,
          [messageIndex]: data.followUps,
        }));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "orca",
          text:
            data.response ||
            "Unable to get a marine intelligence response.",
        },
      ]);
    } catch (error) {
      console.error(
        "ORCA request failed:",
        error
      );

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

  function toggleAgents(index: number) {
    setExpandedAgents((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
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
              <Bot
                className="text-cyan-400"
                size={22}
              />
            </div>

            <div>
              <h1 className="font-semibold">
                Ask ORCA
              </h1>

              <p className="text-xs text-slate-500">
                Agentic Marine Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value)
            }
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 outline-none"
          >
            <option
              value="en"
              className="bg-[#06111f]"
            >
              English
            </option>

            <option
              value="te"
              className="bg-[#06111f]"
            >
              తెలుగు
            </option>

            <option
              value="hi"
              className="bg-[#06111f]"
            >
              हिन्दी
            </option>

            <option
              value="ta"
              className="bg-[#06111f]"
            >
              தமிழ்
            </option>

            <option
              value="kn"
              className="bg-[#06111f]"
            >
              ಕನ್ನಡ
            </option>
          </select>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <MapPin
              size={15}
              className="text-cyan-400"
            />

            {locationName}
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col px-6 py-10">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10">
              <Sparkles
                size={36}
                className="text-cyan-400"
              />
            </div>

            <h2 className="text-4xl font-semibold tracking-tight">
              How can ORCA help?
            </h2>

            <p className="mt-3 max-w-2xl text-center text-slate-400">
              Ask questions naturally about marine
              safety, fishing zones, weather, ocean
              conditions, tides and hazards.
            </p>

            <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() =>
                      sendMessage(item.question)
                    }
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

                <div className="max-w-2xl space-y-3">
                  <div
                    className={`rounded-2xl px-5 py-4 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-cyan-400 font-medium text-slate-950"
                        : "border border-white/10 bg-white/[0.05] text-slate-200"
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* English browser TTS button */}
                  {message.role === "orca" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          speakResponse(
                            message.text,
                            index
                          )
                        }
                        title={
                          speakingMessage === index
                            ? "Stop speaking"
                            : "Listen to ORCA"
                        }
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-cyan-300"
                      >
                        {speakingMessage === index ? (
                          <>
                            <VolumeX size={15} />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 size={15} />
                            Listen
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {message.role === "orca" && evidenceSummaries[index] && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-300">Evidence confidence</span>
                        <span className="text-cyan-300">
                          {Math.round((Number(evidenceSummaries[index].confidence) || 0) * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">
                        {evidenceSummaries[index].status === "supported" ? "Evidence-backed response" : "Partial evidence"}
                        {evidenceSummaries[index].limitation ? ` • ${evidenceSummaries[index].limitation}` : ""}
                      </p>
                    </div>
                  )}

                  {message.role === "orca" && executionSummaries[index] && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
                      <div className="font-medium text-slate-300">Execution summary</div>
                      <div className="mt-1">
                        Intent: {executionSummaries[index].intent || "GENERAL"} • {executionSummaries[index].agentsExecuted?.filter((name: string) => name !== "Planner / Orchestrator Agent" && name !== "Planner/Orchestrator").length || 0} specialist agents executed
                      </div>
                    </div>
                  )}

                  {message.role === "orca" && followUps[index]?.length > 0 && (
                    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] px-4 py-3">
                      <div className="mb-2 text-xs font-medium text-slate-400">You can also ask</div>
                      <div className="flex flex-wrap gap-2">
                        {followUps[index].map((followUp, followUpIndex) => (
                          <button
                            key={`${followUp}-${followUpIndex}`}
                            type="button"
                            onClick={() => sendMessage(followUp)}
                            disabled={loading}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-cyan-300 disabled:opacity-50"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.role === "orca" &&
                    agentTraces[index] && (
                      <div className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#081827]">
                        <button
                          type="button"
                          onClick={() =>
                            toggleAgents(index)
                          }
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.03]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10">
                              <Users
                                size={16}
                                className="text-cyan-400"
                              />
                            </div>

                            <div>
                              <div className="text-sm font-medium text-white">
                                Agent Collaboration
                              </div>

                              <div className="text-xs text-slate-500">
                                {
                                  agentTraces[
                                    index
                                  ].filter(
                                    (a) =>
                                      a.status ===
                                      "completed" &&
                                      a.name !== "Planner / Orchestrator Agent"
                                  ).length
                                }{" "}
                                agents completed
                              </div>
                            </div>
                          </div>

                          <ChevronDown
                            size={17}
                            className={`text-slate-500 transition ${
                              expandedAgents[index]
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        {agentPlans[index] && (
                          <div className="border-t border-white/[0.07] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-medium text-slate-300">Execution plan</div>
                                <div className="mt-1 text-[11px] text-slate-500">
                                  {agentPlans[index].mode === "llm" ? "Planner-generated" : "Deterministic fallback"}
                                  {agentPlans[index].reason ? ` • ${agentPlans[index].reason}` : ""}
                                </div>
                              </div>
                              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-1 text-[10px] text-cyan-300">
                                {agentPlans[index].selectedAgents?.length || 0} planned
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {(agentPlans[index].selectedAgents || []).map((name: string, planIndex: number) => {
                                const trace = [...agentTraces[index]].reverse().find((a) => a.name === name);
                                const status = trace?.status || "pending";
                                const statusClass =
                                  status === "completed"
                                    ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                                    : status === "failed"
                                    ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
                                    : status === "retrying" || status === "fallback"
                                    ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-300"
                                    : status === "skipped"
                                    ? "border-slate-400/20 bg-slate-400/[0.04] text-slate-500"
                                    : "border-white/10 bg-white/[0.03] text-slate-400";
                                return (
                                  <div key={`${name}-${planIndex}`} className="flex items-center gap-1.5">
                                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusClass}`}>
                                      {name}
                                      {status !== "pending" && status !== "completed" ? ` · ${status}` : ""}
                                    </span>
                                    {planIndex < (agentPlans[index].selectedAgents?.length || 0) - 1 && (
                                      <span className="text-slate-600">→</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                              <span className="text-emerald-400">● completed</span>
                              <span className="text-amber-300">● retry/fallback</span>
                              <span className="text-red-400">● failed</span>
                              <span className="text-slate-500">● pending/skipped</span>
                            </div>
                          </div>
                        )}

                        {expandedAgents[index] && (
                          <div className="border-t border-white/[0.07] px-4 py-4">
                            <div className="space-y-0">
                              {agentTraces[index].map(
                                (
                                  agent,
                                  agentIndex
                                ) => (
                                  <div
                                    key={`${agent.name}-${agentIndex}`}
                                    className="relative flex gap-3"
                                  >
                                    {agentIndex <
                                      agentTraces[index]
                                        .length -
                                        1 && (
                                      <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-white/10" />
                                    )}

                                    <div
                                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                        agent.status === "failed"
                                          ? "border-red-400/20 bg-red-400/10"
                                          : agent.status === "retrying" || agent.status === "fallback"
                                          ? "border-amber-400/20 bg-amber-400/10"
                                          : "border-cyan-400/15 bg-cyan-400/10"
                                      }`}
                                    >
                                      {agent.status ===
                                      "running" ? (
                                        <Loader2
                                          size={15}
                                          className="animate-spin text-cyan-400"
                                        />
                                      ) : agent.status ===
                                        "failed" ? (
                                        <span className="text-xs text-red-400">
                                          !
                                        </span>
                                      ) : (
                                        <span className="text-sm">
                                          {agentIcons[
                                            agent.name
                                          ] ||
                                            "🤖"}
                                        </span>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1 pb-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-200">
                                          {
                                            agent.name
                                          }
                                        </span>

                                        {agent.status ===
                                          "completed" && (
                                          <CheckCircle2
                                            size={13}
                                            className="text-emerald-400"
                                          />
                                        )}

                                        {agent.status ===
                                          "failed" && (
                                          <span className="text-[10px] uppercase tracking-wider text-red-400">
                                            failed
                                          </span>
                                        )}
                                        {agent.status === "retrying" && (
                                          <span className="text-[10px] uppercase tracking-wider text-amber-400">
                                            retrying
                                          </span>
                                        )}
                                        {agent.status === "fallback" && (
                                          <span className="text-[10px] uppercase tracking-wider text-amber-300">
                                            fallback
                                          </span>
                                        )}
                                        {agent.status === "skipped" && (
                                          <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                            skipped
                                          </span>
                                        )}
                                      </div>

                                      <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {agent.reason}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                  ORCA is analysing the marine
                  conditions...
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2 shadow-2xl">
            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask ORCA about the marine environment..."
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-500"
            />

            <button
              onClick={startVoiceInput}
              disabled={loading || listening}
              title={
                listening
                  ? "Listening..."
                  : "Speak to ORCA"
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                listening
                  ? "bg-red-400 text-slate-950"
                  : "bg-white/10 text-cyan-400 hover:bg-cyan-400/10"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {listening ? (
                <MicOff size={18} />
              ) : (
                <Mic size={18} />
              )}
            </button>

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