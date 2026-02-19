"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { parseCommand, type CommandResponse } from "./command-parser";
import { useOSStore } from "@/core/os-store";

const prompt = "duck@feather:~$";

type TerminalLine = {
  id: string;
  type: "input" | "output" | "error";
  content: string;
};

function createLine(type: TerminalLine["type"], content: string): TerminalLine {
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, type, content };
}

export default function FeatherApp() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [lines]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) {
      return;
    }

    const store = useOSStore.getState();
    const response: CommandResponse = parseCommand(inputValue, {
      openWindowsCount: store.openWindows.length,
      focusedWindowId: store.focusedWindowId,
    });

    setLines((prev) => {
      if (response.clear) {
        return [];
      }

      const nextLines: TerminalLine[] = [
        ...prev,
        createLine("input", inputValue),
        ...response.lines.map((payload) => createLine(payload.type, payload.content)),
      ];

      return nextLines;
    });

    if (response.openAppId) {
      store.openApp(response.openAppId);
    }

    const updatedHistory = [...commandHistory, inputValue];
    setCommandHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length);

    setInputValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputValue(commandHistory[nextIndex] ?? "");
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = Math.min(commandHistory.length, historyIndex + 1);
      setHistoryIndex(nextIndex);
      setInputValue(nextIndex === commandHistory.length ? "" : commandHistory[nextIndex]);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60">
      <div className="flex-1 overflow-hidden p-4">
        <div
          ref={scrollRef}
          className="flex h-full flex-col gap-2 overflow-y-auto border border-white/5 bg-black/40 p-3 pr-2 font-mono text-sm text-white/80"
        >
          {lines.length === 0 && (
            <p className="text-xs text-white/40">Type &quot;help&quot; for a list of commands.</p>
          )}
          {lines.map((line) => (
            <div
              key={line.id}
              className={`whitespace-pre-wrap ${
                line.type === "input"
                  ? "text-amber-200"
                  : line.type === "error"
                    ? "text-rose-300"
                    : "text-white/80"
              }`}
            >
              {line.type === "input" ? `${prompt} ${line.content}` : line.content}
            </div>
          ))}
        </div>
      </div>

      <form className="border-t border-white/10 px-4 py-3" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 font-mono text-sm text-white/60">
          <span className="text-amber-300">{prompt}</span>
          <input
            autoFocus
            spellCheck="false"
            autoComplete="off"
            className="flex-1 bg-transparent text-sm font-mono text-white outline-none"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </form>
    </div>
  );
}
