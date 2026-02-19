export type TerminalLinePayload = {
  type: "output" | "error";
  content: string;
};

export type CommandResponse = {
  lines: TerminalLinePayload[];
  clear?: boolean;
  openAppId?: string;
};

export type CommandContext = {
  openWindowsCount: number;
  focusedWindowId: string | null;
};

const HELP_TEXT = [
  "Available commands:",
  "help \u2014 show this help text",
  "clear \u2014 clear the terminal",
  "echo [text] \u2014 repeat text",
  "system \u2014 show window metadata",
  "open pond \u2014 launch Pond",
  "open nest \u2014 launch Nest",
];

export function parseCommand(input: string, context: CommandContext): CommandResponse {
  const trimmed = input.trim();
  if (!trimmed) {
    return { lines: [] };
  }

  const [command, ...args] = trimmed.split(/\s+/);
  const lower = command.toLowerCase();

  if (lower === "help") {
    return {
      lines: HELP_TEXT.map((line) => ({ type: "output", content: line })),
    };
  }

  if (lower === "clear") {
    return { lines: [], clear: true };
  }

  if (lower === "echo") {
    return {
      lines: [{ type: "output", content: args.join(" ") }],
    };
  }

  if (lower === "system") {
    return {
      lines: [
        {
          type: "output",
          content: `open windows: ${context.openWindowsCount}`,
        },
        {
          type: "output",
          content: `focused window: ${context.focusedWindowId ?? "none"}`,
        },
      ],
    };
  }

  if (lower === "open") {
    const target = args[0]?.toLowerCase();
    if (target === "pond" || target === "nest") {
      return {
        lines: [
          {
            type: "output",
            content: `Opening ${target.charAt(0).toUpperCase() + target.slice(1)}`,
          },
        ],
        openAppId: target,
      };
    }

    return {
      lines: [
        {
          type: "error",
          content: `Unknown application: ${args[0] ?? "?"}`,
        },
      ],
    };
  }

  return {
    lines: [
      {
        type: "error",
        content: `Command not found: ${command}`,
      },
    ],
  };
}
