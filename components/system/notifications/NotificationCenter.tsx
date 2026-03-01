"use client";
import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/store/useNotifications";
function NotificationCenterInner() {
  const notifications = useNotifications((state) => state.notifications);
  const dismissNotification = useNotifications((state) => state.dismissNotification);
  if (notifications.length === 0) return null;
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[70] flex max-h-[calc(100vh-2rem)] w-[320px] flex-col gap-2">
      <AnimatePresence initial={false}>
        {notifications.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto rounded-xl border border-white/15 bg-black/45 px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-white/90">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-white/70">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissNotification(item.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
const NotificationCenter = memo(NotificationCenterInner);
export default NotificationCenter;

//all cleared//