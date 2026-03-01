"use client";

import { useEffect } from "react";
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
import { QuackCodeApp, QuackCodeIcon } from "@/apps/quackcode";
import { QuackAPIApp, QuackAPIIcon } from "@/apps/quackapi";
import { ClockApp, ClockIcon } from "@/apps/clock";
import { CalendarApp, CalendarIcon } from "@/apps/calendar";
import OSRoot from "@/components/system/OSRoot";

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

registerApp({
  id: "quackcode",
  name: "QuackCode",
  icon: QuackCodeIcon,
  defaultSize: { width: 900, height: 560 },
  component: QuackCodeApp,
});

registerApp({
  id: "quackapi.app",
  name: "QuackAPI",
  icon: QuackAPIIcon,
  defaultSize: { width: 1100, height: 700 },
  component: QuackAPIApp,
});

registerApp({
  id: "clock",
  name: "Clock",
  icon: ClockIcon,
  defaultSize: { width: 480, height: 380 },
  component: ClockApp,
});

registerApp({
  id: "calendar",
  name: "Calendar",
  icon: CalendarIcon,
  defaultSize: { width: 520, height: 560 },
  component: CalendarApp,
});

/**
 * Root page — orchestrates boot → desktop transition.
 */
export default function Home() {
  const storeRegister = useOSStore((s) => s.registerApp);
  const registeredApps = useOSStore((s) => s.registeredApps);

  // Log on client load
  useEffect(() => {
    console.log("59");
  }, []);

  // Sync registry → Zustand store (idempotent)
  useEffect(() => {
    if (registeredApps.length === 0) {
      for (const app of getRegisteredApps()) {
        storeRegister(app);
      }
    }
  }, [registeredApps.length, storeRegister]);

  return <OSRoot />;
}
