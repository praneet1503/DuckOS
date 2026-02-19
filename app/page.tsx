"use client";

import { AnimatePresence } from "framer-motion";
import { useOSStore } from "@/core/os-store";
import {
  registerApp,
  getRegisteredApps,
} from "@/core/app-registry";
import { PondApp, PondIcon } from "@/apps/pond";
import { NestApp, NestIcon } from "@/apps/nest";
import { FeatherApp, FeatherIcon } from "@/apps/feather";
import { FlightApp, FlightIcon } from "@/apps/flight";
import { EchoApp, EchoIcon } from "@/apps/echo";
import BootScreen from "@/components/BootScreen";
import Desktop from "@/components/Desktop";

// ── One-time, module-level app registration ───────────────
registerApp({
  id: "pond",
  name: "Pond",
  icon: PondIcon,
  defaultSize: { width: 600, height: 400 },
  component: PondApp,
});

registerApp({
  id: "nest",
  name: "Nest",
  icon: NestIcon,
  defaultSize: { width: 700, height: 500 },
  component: NestApp,
});

registerApp({
  id: "feather",
  name: "Feather",
  icon: FeatherIcon,
  defaultSize: { width: 650, height: 400 },
  component: FeatherApp,
});

registerApp({
  id: "flight",
  name: "Flight",
  icon: FlightIcon,
  defaultSize: { width: 520, height: 360 },
  component: FlightApp,
});

registerApp({
  id: "echo",
  name: "Echo",
  icon: EchoIcon,
  defaultSize: { width: 520, height: 420 },
  component: EchoApp,
});

/**
 * Root page — orchestrates boot → desktop transition.
 */
export default function Home() {
  const isBooted = useOSStore((s) => s.isBooted);
  const boot = useOSStore((s) => s.boot);
  const storeRegister = useOSStore((s) => s.registerApp);

  // Sync registry → Zustand store (idempotent)
  const registeredApps = useOSStore((s) => s.registeredApps);
  if (registeredApps.length === 0) {
    for (const app of getRegisteredApps()) {
      storeRegister(app);
    }
  }

  function handleBootComplete() {
    boot();
  }

  return (
    <AnimatePresence mode="wait">
      {!isBooted ? (
        <BootScreen key="boot" onBootComplete={handleBootComplete} />
      ) : (
        <Desktop key="desktop" />
      )}
    </AnimatePresence>
  );
}
