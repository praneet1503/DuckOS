import type { Session, User } from "@/types/auth";

const USERS_KEY = "duckos_users";
const SESSION_KEY = "duckos_session";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getUsers(): User[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(USERS_KEY);
      return [];
    }

    const validUsers = parsed.filter((item): item is User => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as User).id === "string" &&
        typeof (item as User).username === "string" &&
        typeof (item as User).passwordHash === "string" &&
        typeof (item as User).createdAt === "number"
      );
    });

    if (validUsers.length !== parsed.length) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(validUsers));
    }

    return validUsers;
  } catch {
    window.localStorage.removeItem(USERS_KEY);
    return [];
  }
}

export function saveUsers(users: User[]): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    window.localStorage.removeItem(USERS_KEY);
  }
}

export function getSession(): Session | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Session).userId !== "string"
    ) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed as Session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSession(userId: string): void {
  if (!canUseStorage()) return;

  const payload: Session = { userId };

  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function clearSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
}
