"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, User, CheckCircle2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "How much is the pool fee?",
  "Overnight parking details?",
  "What are the check-in & out hours?",
  "Tagaytay weather & packing tip?",
  "Where to eat the best bulalo?",
  "Payment methods accepted?",
];

export function AiConciergeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Mabuhay! I'm Ate Grace, your Tagaytay staycation co-host. 🌸 Ask me anything about our panoramic Taal suite, pool fees, parking, check-in, or local food recommendations!",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const msgIdCounter = useRef(1);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    msgIdCounter.current += 1;
    const userMsgId = `user-msg-${msgIdCounter.current}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();

      msgIdCounter.current += 1;
      const botMsgId = `bot-msg-${msgIdCounter.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: "assistant",
          content: data.message?.content || "Thank you for asking! Let me know if you need anything else po.",
        },
      ]);
    } catch {
      msgIdCounter.current += 1;
      const errMsgId = `err-msg-${msgIdCounter.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errMsgId,
          role: "assistant",
          content:
            "Sorry po, having a momentary connection glitch. Standard check-in is 2:00 PM, pool fee is ₱150 regular / ₱300 holiday, and parking is ₱150 overnight!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            id="open-concierge-btn"
            className="group relative flex items-center gap-3 rounded-full bg-emerald-700 px-5 py-3.5 text-white shadow-xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-400"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              </span>
            </div>
            <div className="text-left">
              <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-200">
                24/7 Co-Host AI
              </span>
              <span className="block text-sm font-bold">Ask Ate Grace</span>
            </div>
          </button>
        )}
      </div>

      {/* Slide-over Drawer / Chat Window */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-all duration-300 sm:rounded-l-3xl border-l border-emerald-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-900 to-teal-800 px-6 py-4 text-white sm:rounded-tl-3xl">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-emerald-300">
                <Bot className="h-6 w-6 text-emerald-100" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-emerald-900 bg-emerald-400"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold leading-tight">Ate Grace</h3>
                  <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
                    AI Concierge
                  </span>
                </div>
                <p className="text-xs text-emerald-200">Wind Residences Co-Host • Taglish/English</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              id="close-concierge-btn"
              className="rounded-full p-1.5 text-emerald-200 hover:bg-emerald-800 hover:text-white"
              aria-label="Close concierge"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Info Badge Banner */}
          <div className="flex items-center justify-between bg-emerald-50/80 px-4 py-2 border-b border-emerald-100/60 text-xs text-emerald-900">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified Building Knowledge Base
            </span>
            <span className="text-emerald-700 font-medium">Taal View Suite</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-700 text-white rounded-br-none shadow-sm"
                      : "bg-white text-slate-800 shadow-sm border border-slate-200/80 rounded-bl-none whitespace-pre-line"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-1 text-xs text-slate-400">Ate Grace is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="border-t border-slate-100 bg-white px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Popular Guest Questions:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50/60 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="border-t border-slate-200 bg-white p-3 sm:rounded-bl-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in English or Taglish..."
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              Instant responses powered by Gemini AI with official Wind Residences Tagaytay rules.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
