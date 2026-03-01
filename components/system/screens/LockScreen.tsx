"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { formatDate, formatTime } from "@/lib/time";
export default function LockScreen() {
  const loading = useAuth((s) => s.loading);
  const error = useAuth((s) => s.error);
  const login = useAuth((s) => s.login);
  const clearError = useAuth((s) => s.clearError);
  const [password, setPassword] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [time, setTime] = useState(() => formatTime(new Date()));
  const [date, setDate] = useState(() => formatDate(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(formatTime(now));
      setDate(formatDate(now));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const triggerShake = useCallback(() => {
    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 380);
  }, []);
  const handleSubmit = useCallback(async () => {
    if (loading) return;
    const success = await login(password);
    if (!success) {
      triggerShake();
      setFailedAttempts((count) => count + 1);
      return;
    }
    setPassword("");
  }, [loading, login, password, triggerShake]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleSubmit();
      }
    },
    [handleSubmit],
  );
  const submitDisabled = password.length < 1 || loading;
  return (
    <motion.div
      key="lock"
      className="fixed inset-0 z-100 flex flex-col select-none cursor-default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/backgrounds/duck-pond.jpg"
          alt=""
          className="h-full w-full object-cover scale-110"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[20px]" />
      </div>
      <motion.div
        className="shrink-0 pt-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <p className="text-6xl font-light tracking-wide text-white/90 drop-shadow-lg">
          {time}
        </p>
        <p className="mt-2 text-sm text-white/70">{date}</p>
      </motion.div>
      <div className="flex flex-1 items-center justify-center px-4">
        <motion.div
          className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/8 px-8 py-10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-[20px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-4xl shadow-lg shadow-black/20">
              🦆
            </div>
            <p className="text-lg font-medium text-white drop-shadow-md">
              prentz
            </p>
            <motion.div
              className="mt-2 w-full"
              animate={isShaking ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="relative flex w-full items-center">
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-white/15"
                />
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitDisabled}
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
                  aria-label="Unlock"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>
            {error && (
              <p
                className="text-center text-sm font-medium text-red-300/95"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="text-center text-xs text-white/45">
              {failedAttempts >= 2
                ? "hint:wowwwww....couldnt you just open the browser console or what ??? anyways the pass is 59"
                : "hint:check a number in the console box"}
            </div>
            {failedAttempts >= 1 && (
              <button
                type="button"
                onClick={() => useAuth.getState().bypassLogin()}
                className="mt-2 text-center text-xs text-blue-300 underline"
              >
                only press if you dont know how to open browser console
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// all cleared,generated by AI//