"use client";

import { create } from "zustand";
import { useScreen } from "@/store/useScreen";
import type { AuthActions, AuthState, User } from "@/types/auth";

// single hardcoded user
const FIXED_USER: User = {
  id: "prentz",
  username: "prentz",
  avatar: "🦆",
};

const CORRECT_PASSWORD = "59";

export const useAuth = create<AuthState & AuthActions>()((set, get) => {
  return {
    currentUser: null,
    loading: false,
    error: null,

    login: async (password) => {
      set({ loading: true, error: null });
      if (password === CORRECT_PASSWORD) {
        set({ currentUser: FIXED_USER, loading: false });
        useScreen.getState().setScreen("desktop");
        return true;
      }
      set({ loading: false, error: "Incorrect password." });
      return false;
    },

    logout: () => {
      set({ currentUser: null, error: null });
      useScreen.getState().setScreen("lock");
    },

    lock: () => {
      set({ currentUser: null, error: null });
      useScreen.getState().setScreen("lock");
    },

    autoLogin: () => {
      // no persistence, nothing to do
    },
// for dumb people who don't know how to check browser console for hints
    bypassLogin: () => {
      set({ currentUser: FIXED_USER, error: null });
      useScreen.getState().setScreen("desktop");
    },
    clearError: () => set({ error: null }),
  };
});
