/* ══════════════════════════════════════════════════════════════
   QuackAPI — Top Bar
   ────────────────────────────────────────────────────────────
   [Method] [URL Input] [Send] [Save]
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo } from "react";
import type { HttpMethod } from "../types";
import MethodSelector from "./MethodSelector";
import URLInput from "./URLInput";
import { QAButton } from "./ui";

interface TopBarProps {
  method: HttpMethod;
  url: string;
  urlValid: boolean;
  isLoading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onSave: () => void;
}

function TopBar({
  method,
  url,
  urlValid,
  isLoading,
  onMethodChange,
  onUrlChange,
  onSend,
  onSave,
}: TopBarProps) {
  const canSend = urlValid && url.trim() !== "" && !isLoading;

  return (
    <div className="flex items-center gap-0 px-3 py-2 border-b border-[var(--os-border)]">
      <MethodSelector value={method} onChange={onMethodChange} />
      <URLInput
        value={url}
        onChange={onUrlChange}
        isValid={urlValid}
        onSubmit={onSend}
      />
      <QAButton
        variant="primary"
        size="md"
        onClick={onSend}
        disabled={!canSend}
        className="rounded-none rounded-r px-4 font-semibold min-w-[64px]"
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <LoadingSpinner />
            Sending
          </span>
        ) : (
          "Send"
        )}
      </QAButton>
      <div className="w-px h-6 bg-[var(--os-border)] mx-2" />
      <QAButton variant="ghost" size="md" onClick={onSave}>
        Save
      </QAButton>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-3 w-3"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="8"
        opacity="0.7"
      />
    </svg>
  );
}

export default memo(TopBar);
