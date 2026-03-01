"use client";
import { create } from "zustand";
export interface OSNotification {id: string;title: string; message: string;createdAt: number;durationMs: number;}
interface NotificationState {
    notifications: OSNotification[];
}

interface NotificationActions {
    pushNotification: (payload: {title: string;message: string;durationMs?: number;}) => string;
    dismissNotification: (id: string) => void;
    clearNotifications: () => void;
}
const timers = new Map<string, ReturnType<typeof setTimeout>>();
function uid(): string {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export const useNotifications = create<NotificationState & NotificationActions>()((set, get) => ({
    notifications: [],

    pushNotification: ({ title, message, durationMs = 4000 }) => {
        const id = uid();
        const next: OSNotification = {
            id,
            title,
            message,
            createdAt: Date.now(),
            durationMs,
        };
        set((state) => ({ notifications: [...state.notifications, next] }));
        if (durationMs > 0) {
            const timeoutId = setTimeout(() => {
                get().dismissNotification(id);
            }, durationMs);
            timers.set(id, timeoutId);
        }

        return id;
    },

    dismissNotification: (id) => {
        const timeoutId = timers.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timers.delete(id);
        }
        set((state) => ({
            notifications: state.notifications.filter((item) => item.id !== id),
        }));
    },
    clearNotifications: () => {
        for (const timeoutId of timers.values()) {
            clearTimeout(timeoutId);
        }
        timers.clear();
        set({ notifications: [] });
    },
}));
// all cleared//