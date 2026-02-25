/* ══════════════════════════════════════════════════════════════
   QuackAPI — Body Editor (JSON textarea with validation)
   ══════════════════════════════════════════════════════════ */

"use client";

import { memo, useCallback, useRef } from "react";

interface BodyEditorProps {
  value: string;
  onChange: (body: string) => void;
  isValid: boolean;
}

function BodyEditor({ value, onChange, isValid }: BodyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleFormat = useCallback(() => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Can't format invalid JSON
    }
  }, [value, onChange]);

  const showError = value.trim() !== "" && !isValid;
  const charCount = value.length;
  const lineCount = value ? value.split("\n").length : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-(--os-border)">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-(--os-text-secondary)">
            Raw JSON
          </span>
          {showError && (
            <span className="text-[11px] text-red-400 font-medium">
              Invalid JSON
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-(--os-text-secondary)">
            {lineCount} lines · {charCount} chars
          </span>
          <button
            onClick={handleFormat}
            disabled={showError || !value.trim()}
            className="text-[11px] text-(--os-accent-teal) hover:text-(--os-accent-teal)/80
              disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
          >
            Format
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder='{\n  "key": "value"\n}'
        className={`
          flex-1 w-full px-3 py-2 resize-none
          bg-transparent text-foreground
          text-[12px] font-mono leading-[1.6]
          outline-none
          placeholder:text-(--os-text-secondary)/30
          ${showError ? "bg-red-500/3" : ""}
        `}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}

export default memo(BodyEditor);
