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
import { BurrowApp, BurrowIcon } from "@/apps/burrow";
import { QuillApp, QuillIcon } from "@/apps/quill";
import { LensApp, LensIcon } from "@/apps/lens";
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
  name: "Notes",
  icon: NestIcon,
  defaultSize: { width: 720, height: 480 },
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

registerApp({
  id: "burrow",
  name: "Burrow",
  icon: BurrowIcon,
  defaultSize: { width: 800, height: 500 },
  component: BurrowApp,
});

registerApp({
  id: "quill",
  name: "Quill",
  icon: QuillIcon,
  defaultSize: { width: 860, height: 560 },
  component: QuillApp,
});

registerApp({
  id: "lens",
  name: "Lens",
  icon: LensIcon,
  defaultSize: { width: 780, height: 520 },
  component: LensApp,
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
