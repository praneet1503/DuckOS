"use client";

import React, { useState } from "react";
import { useOSStore } from "@/core/os-store";

type Message = { from: "user" | "assistant"; text: string };

export default function EchoApp() {
  const [messages, setMessages] = useState<Message[]>([
    { from: "assistant", text: "Hello — I'm Echo. Ask me to open apps or say hi." },
  ]);
  const [input, setInput] = useState("");

  function pushAssistant(text: string) {
    setMessages((m) => [...m, { from: "assistant", text }]);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");

    // Simulate thinking + support simple "open <app>" commands
    setTimeout(() => {
      const lower = text.toLowerCase();
      const openMatch = lower.match(/^open\s+(\w+)/);
      if (openMatch) {
        const appId = openMatch[1];
        const store = useOSStore.getState();
        if (store.registeredApps.some((a) => a.id === appId)) {
          store.openApp(appId);
          pushAssistant(`Opening ${appId}...`);
          return;
        } else {
          pushAssistant(`I couldn't find an app named ${appId}.`);
          return;
        }
      }

      // Default reply
      pushAssistant(`You said: "${text}"`);
    }, 800);
  }

  return (
    <div className="p-3 w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto mb-2">
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-full ${m.from === "user" ? "self-end bg-indigo-600 text-white" : "self-start bg-gray-800 text-gray-100"} p-2 rounded`}
            >
              {m.text}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-2 py-1 bg-gray-900 rounded"
          placeholder="Type a message or ‘open pond’"
        />
        <button className="px-3 py-1 bg-green-600 rounded text-white">Send</button>
      </form>
    </div>
  );
}
