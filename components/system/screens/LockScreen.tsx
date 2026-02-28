"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { formatDate, formatTime } from "@/lib/time";

/**
 * Lock Screen — macOS-inspired login surface.
 *
 * Shows a blurred wallpaper backdrop, current time, circular avatar,
 * username, password field, and an unlock button.
 * Uses local-only auth state from Zustand.
 */
export default function LockScreen() {
  const users = useAuth((s) => s.users);
  const selectedUserId = useAuth((s) => s.selectedUserId);
  const loading = useAuth((s) => s.loading);
  const error = useAuth((s) => s.error);
  const register = useAuth((s) => s.register);
  const loginSelectedUser = useAuth((s) => s.loginSelectedUser);
  const selectUser = useAuth((s) => s.selectUser);
  const clearError = useAuth((s) => s.clearError);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const hasUsers = users.length > 0;
  const selectedUser = users.find((item) => item.id === selectedUserId) ?? null;
  const isRegisterMode = !hasUsers || isCreatingAccount;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [time, setTime] = useState(() => formatTime(new Date()));
  const [date, setDate] = useState(() => formatDate(new Date()));

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(formatTime(now));
      setDate(formatDate(now));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (hasUsers && !selectedUserId && users[0]) {
      selectUser(users[0].id);
    }
  }, [hasUsers, selectedUserId, selectUser, users]);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 380);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (loading) return;

    if (isRegisterMode) {
      const success = await register(username, password);
      if (!success) {
        triggerShake();
        return;
      }
      return;
    }

    const success = await loginSelectedUser(password);
    if (!success) {
      triggerShake();
      return;
    }

    setPassword("");
  }, [
    isRegisterMode,
    loading,
    loginSelectedUser,
    password,
    register,
    triggerShake,
    username,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  const submitDisabled = isRegisterMode
    ? username.trim().length === 0 || password.length < 4 || loading
    : !selectedUser || password.length < 4 || loading;

  return (
    <motion.div
      key="lock"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-start select-none cursor-default pt-12 sm:pt-16 lg:pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Wallpaper + blur + dark overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/backgrounds/duck-pond.jpg"
          alt=""
          className="h-full w-full object-cover scale-105"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-lg" />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-start gap-6 px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p className="text-6xl font-light tracking-wide text-white/92 drop-shadow-lg">
            {time}
          </p>
          <p className="mt-2 text-sm text-white/70">{date}</p>
        </motion.div>

        {/* ── Login Section ──────────────────────────────────── */}
        <motion.div
          className="w-full max-w-md p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex flex-col items-center space-y-4">
            {!isRegisterMode ? (
              <>
                <div className="flex w-full flex-wrap justify-center gap-6 pb-2">
                  {users.map((user) => {
                    const active = selectedUser?.id === user.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          selectUser(user.id);
                          clearError();
                        }}
                        className={`group flex flex-col items-center justify-center transition-all cursor-pointer ${
                          active
                            ? "scale-105 opacity-100"
                            : "scale-100 opacity-50 hover:opacity-80"
                        }`}
                      >
                        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 border border-white/20 text-4xl shadow-xl backdrop-blur-md transition-transform group-hover:scale-105">
                          {user.avatar ?? "🦆"}
                        </div>
                        <p className="w-30 truncate text-center text-lg font-medium text-white drop-shadow-md">
                          {user.username}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-4xl shadow-lg shadow-black/20">
                  🦆
                </div>
                <p className="text-sm tracking-wider uppercase text-white/60">
                  Create Account
                </p>

                <p className="text-center text-xs text-white/60">
                  Create a fresh account if you forgot an existing password; the
                  others remain untouched.
                </p>

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="mt-2 w-full max-w-[280px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-white/15"
                />
              </>
            )}

            <motion.div
              className="mt-6 w-full max-w-[280px]"
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
                  autoFocus={!isRegisterMode}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-white/15"
                />
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitDisabled}
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
                  aria-label={isRegisterMode ? "Create account" : "Unlock"}
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  ) : isRegisterMode ? (
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
                      <path d="M9 11c-1.657 0-3 1.343-3 3v1h12v-1c0-1.657-1.343-3-3-3H9z" />
                      <path d="M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      <path d="M20 11v-2" />
                      <path d="M17 10h6" />
                      <path d="M20 8v6" />
                    </svg>
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

            {hasUsers && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingAccount((prev) => !prev);
                  clearError();
                }}
                className="mt-4 text-xs text-white/60 underline"
              >
                {isCreatingAccount
                  ? "Back to unlock"
                  : "Forgot password? Create new account"}
              </button>
            )}

            {error ? (
              <p
                className="mt-4 text-center text-sm font-medium text-red-300/95"
                role="alert"
              >
                {error}
              </p>
            ) : (
              <p className="mt-4 text-center text-xs text-white/55">
                {hasUsers
                  ? "Enter your password to unlock."
                  : "Username: 3–16 letters/numbers. Password: min 4 chars."}
              </p>
            )}

            <div className="text-center text-xs text-white/45">
              {hasUsers
                ? "Local auth only • no backend"
                : "First account is created locally on this device"}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
