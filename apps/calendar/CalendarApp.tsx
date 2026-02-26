"use client";

import { useState, useMemo } from "react";
import { generateCalendarGrid } from "@/lib/calendar";

// ── Helpers ──────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Component ────────────────────────────────────────────────

export default function CalendarApp() {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const grid = useMemo(() => generateCalendarGrid(year, month), [year, month]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="flex h-full w-full select-none flex-col bg-linear-to-br from-zinc-900 to-black p-10 text-white">
      {/* ── Header ─────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>

        <h2 className="text-2xl font-semibold tracking-wide">
          {MONTH_NAMES[month]} {year}
        </h2>

        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {/* ── Day-of-week labels ─────────────────────── */}
      <div className="mb-2 grid grid-cols-7 gap-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium tracking-wider text-white/40"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ──────────────────────────── */}
      <div className="grid flex-1 grid-cols-7 gap-2">
        {grid.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} />;
          }

          const isToday = isSameDay(cell, today);
          const isSelected = selectedDate ? isSameDay(cell, selectedDate) : false;

          return (
            <button
              key={cell.toISOString()}
              onClick={() => setSelectedDate(cell)}
              className={`flex aspect-square items-center justify-center rounded-xl text-sm transition-colors ${
                isToday
                  ? "bg-white font-semibold text-black"
                  : isSelected
                    ? "border border-white/40 bg-white/20"
                    : "hover:bg-white/10"
              }`}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 3L5 8L10 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 3L11 8L6 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
