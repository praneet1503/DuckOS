"use client";
import { useEffect, useRef, useState } from "react";
import { formatDate, formatTime, getNow } from "@/lib/time";
interface TimeWidgetProps {
  timezone?: string;
}
export default function TimeWidget({ timezone }: TimeWidgetProps) {
  const [now, setNow] = useState<Date>(getNow);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(getNow());
    }, 1_000);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  const timeOptions: Intl.DateTimeFormatOptions | undefined = timezone
    ? { timeZone: timezone }
    : undefined;
  const time = formatTime(now, timeOptions);
  const date = formatDate(now);
  return (
    <div className="absolute z-20 pointer-events-none select-none" style={{ left: "var(--widget-edge-padding)", top: "var(--widget-top-padding)", }}>
      <div className="px-5 py-3 rounded-2xl">
        <div className="text-white text-3xl font-mono tracking-widest drop-shadow-sm">{time}</div>
        <div className="text-white/70 text-sm tracking-wide mt-1">{date}</div>
      </div>
    </div>
  );
}


// all cleared//