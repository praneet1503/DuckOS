"use client";

import { create } from "zustand";
import nodeCrypto from "crypto";
import {
  hashPassword,
  deriveHash,
  hashPasswordLegacy,
  PBKDF2_ITERATIONS,
} from "@/lib/crypto";
import {
  getUsers,
  saveUsers,
  getSession,
  setSession,
  clearSession,
} from "@/lib/storage";
import { useScreen } from "@/store/useScreen";
import type { AuthActions, AuthState, User } from "@/types/auth";

const USERNAME_REGEX = /^[a-zA-Z0-9]{3,16}$/;
const MIN_PASSWORD_LENGTH = 4;

function secureRandomHex(byteLength = 4): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const arr = new Uint8Array(byteLength);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  if (
    typeof nodeCrypto !== "undefined" &&
    typeof nodeCrypto.randomBytes === "function"
  ) {
    return nodeCrypto.randomBytes(byteLength).toString("hex");
  }

  const fallback: string[] = [];
  for (let i = 0; i < byteLength; i += 1) {
    fallback.push(
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0"),
    );
  }
  return fallback.join("");
}

function timingSafeEquals(bufA: Buffer, bufB: Buffer): boolean {
  if (bufA.length !== bufB.length) {
    nodeCrypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length, 0));
    return false;
  }

  return nodeCrypto.timingSafeEqual(bufA, bufB);
}

function bufferFromBase64(value: string) {
  return Buffer.from(value, "base64");
}

function bufferFromHex(value: string) {
  return Buffer.from(value, "hex");
}

type ParsedHash = {
  salt: string;
  iterations: number;
  hash: string;
};

function parsePasswordHash(value: string): ParsedHash | null {
  const parts = value.split("$");
  if (parts.length !== 3) {
    return null;
  }

  const iterations = Number(parts[1]);

  return {
    salt: parts[0],
    iterations: Number.isNaN(iterations) ? PBKDF2_ITERATIONS : iterations,
    hash: parts[2],
  };
}

function makeUser(username: string, passwordHash: string): User {
  const now = Date.now();
  const id =
    typeof nodeCrypto !== "undefined" &&
    typeof nodeCrypto.randomUUID === "function"
      ? nodeCrypto.randomUUID()
      : `user_${now}_${secureRandomHex(4)}`;

  return {
    id,
    username,
    passwordHash,
    createdAt: now,
  };
}

function validateCredentials(
  users: User[],
  username: string,
  password: string,
): string | null {
  const trimmed = username.trim();

  if (!USERNAME_REGEX.test(trimmed)) {
    return "Username must be 3–16 letters or numbers.";
  }

  if (
    users.some((user) => user.username.toLowerCase() === trimmed.toLowerCase())
  ) {
    return "Username already exists.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Password must be at least 4 characters.";
  }

  return null;
}

export const useAuth = create<AuthState & AuthActions>()((set, get) => {
  async function verifyPassword(user: User, password: string) {
    const parsed = parsePasswordHash(user.passwordHash);
    if (parsed) {
      const derived = await deriveHash(
        password,
        parsed.salt,
        parsed.iterations,
      );
      const derivedBuf = bufferFromBase64(derived);
      const storedBuf = bufferFromBase64(parsed.hash);
      return timingSafeEquals(derivedBuf, storedBuf);
    }

    const legacyHash = await hashPasswordLegacy(password);
    const derivedBuf = bufferFromHex(legacyHash);
    const storedBuf = bufferFromHex(user.passwordHash);
    const matches = timingSafeEquals(derivedBuf, storedBuf);

    if (matches) {
      const upgradedHash = await hashPassword(password);
      const nextUsers = get().users.map((item) =>
        item.id === user.id ? { ...item, passwordHash: upgradedHash } : item,
      );
      set({ users: nextUsers });
      saveUsers(nextUsers);
    }

    return matches;
  }

  return {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    selectedUserId: null,
    loadUsers: () => {
      const users = getUsers();
      set((state) => {
        const selectedExists =
          state.selectedUserId !== null &&
          users.some((u) => u.id === state.selectedUserId);

        return {
          users,
          selectedUserId: selectedExists
            ? state.selectedUserId
            : (users[0]?.id ?? null),
        };
      });
    },

    register: async (username, password) => {
      const users = get().users;
      const trimmedUsername = username.trim();
      const validationError = validateCredentials(
        users,
        trimmedUsername,
        password,
      );

      if (validationError) {
        set({ error: validationError });
        return false;
      }

      set({ loading: true, error: null });

      try {
        const passwordHash = await hashPassword(password);
        const created = makeUser(trimmedUsername, passwordHash);
        const nextUsers = [...users, created];

        saveUsers(nextUsers);
        setSession(created.id);
        set({
          users: nextUsers,
          currentUser: created,
          selectedUserId: created.id,
          loading: false,
        });
        useScreen.getState().setScreen("desktop");
        return true;
      } catch {
        set({ loading: false, error: "Unable to create account right now." });
        return false;
      }
    },

    login: async (username, password) => {
      const users = get().users;

      if (users.length === 0) {
        return get().register(username, password);
      }

      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        set({ error: "Enter a username." });
        return false;
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        set({ error: "Password must be at least 4 characters." });
        return false;
      }

      const user = users.find(
        (item) => item.username.toLowerCase() === trimmedUsername.toLowerCase(),
      );

      if (!user) {
        set({ error: "User not found." });
        return false;
      }

      set({ loading: true, error: null, selectedUserId: user.id });

      try {
        const matches = await verifyPassword(user, password);
        if (!matches) {
          set({ loading: false, error: "Incorrect password." });
          return false;
        }

        const refreshedUser = get()
          .users.find((u) => u.id === user.id) ?? user;
        setSession(refreshedUser.id);
        set({ currentUser: refreshedUser, loading: false, error: null });
        useScreen.getState().setScreen("desktop");
        return true;
      } catch {
        set({ loading: false, error: "Unable to sign in right now." });
        return false;
      }
    },

    loginSelectedUser: async (password) => {
      const { selectedUserId, users } = get();

      if (!selectedUserId) {
        set({ error: "Select a user first." });
        return false;
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        set({ error: "Password must be at least 4 characters." });
        return false;
      }

      const user = users.find((item) => item.id === selectedUserId);
      if (!user) {
        set({ error: "Selected user no longer exists." });
        return false;
      }

      set({ loading: true, error: null });

      try {
        const matches = await verifyPassword(user, password);
        if (!matches) {
          set({ loading: false, error: "Incorrect password." });
          return false;
        }

        const refreshedUser = get()
          .users.find((u) => u.id === user.id) ?? user;
        setSession(refreshedUser.id);
        set({ currentUser: refreshedUser, loading: false, error: null });
        useScreen.getState().setScreen("desktop");
        return true;
      } catch {
        set({ loading: false, error: "Unable to unlock right now." });
        return false;
      }
    },

    selectUser: (userId) => {
      set({ selectedUserId: userId, error: null });
    },

    clearError: () => set({ error: null }),

    logout: () => {
      clearSession();
      set({ currentUser: null, error: null });
      useScreen.getState().setScreen("lock");
    },

    lock: () => {
      const session = getSession();

      if (session) {
        set({ currentUser: null, selectedUserId: session.userId, error: null });
      } else {
        set({ currentUser: null, error: null });
      }

      useScreen.getState().setScreen("lock");
    },

    autoLogin: () => {
      const users = getUsers();
      const session = getSession();

      if (users.length === 0) {
        set({
          users: [],
          currentUser: null,
          selectedUserId: null,
          error: null,
        });
        return;
      }

      if (!session) {
        set({
          users,
          currentUser: null,
          selectedUserId: users[0]?.id ?? null,
          error: null,
        });
        return;
      }

      const user = users.find((item) => item.id === session.userId) ?? null;
      if (!user) {
        clearSession();
        set({
          users,
          currentUser: null,
          selectedUserId: users[0]?.id ?? null,
          error: null,
        });
        return;
      }

      set({
        users,
        currentUser: user,
        selectedUserId: user.id,
        error: null,
      });
    },
  };
});
