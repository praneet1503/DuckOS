"use client";

import { useRef, useCallback } from "react";

export interface DragCallbacks {
  onDragEnd: (x: number, y: number) => void;
  getPosition: () => { x: number; y: number };
  disabled?: boolean;
}

export function useDrag({ onDragEnd, getPosition, disabled }: DragCallbacks) {
  const elRef = useRef<HTMLDivElement | null>(null);

  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0, 
    startY: 0, 
    originX: 0, 
    originY: 0, 
    grabOffsetX: 0, 
    grabOffsetY: 0,
    rafId: 0,
    latestClientX: 0,
    latestClientY: 0,
  });

  const tick = useCallback(() => {
    const d = drag.current;
    if (!d.active || !elRef.current) return;
    const nx = d.latestClientX - d.grabOffsetX;
    const ny = d.latestClientY - d.grabOffsetY;
    elRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    d.rafId = 0;
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active || e.pointerId !== d.pointerId) return;
      d.latestClientX = e.clientX;
      d.latestClientY = e.clientY;
      if (!d.rafId) {
        d.rafId = requestAnimationFrame(tick);
      }
    },
    [tick]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active || e.pointerId !== d.pointerId) return;
      d.active = false;

      if (d.rafId) {
        cancelAnimationFrame(d.rafId);
        d.rafId = 0;
      }

      if (elRef.current) {
        elRef.current.style.transform = "";
        elRef.current.style.willChange = "";
      }

      const finalX = e.clientX - d.grabOffsetX;
      const finalY = e.clientY - d.grabOffsetY;

      onDragEnd(finalX, finalY);

      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
    },
    [onDragEnd, onPointerMove]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.button !== 0) return; 
      e.preventDefault();

      const pos = getPosition();
      const d = drag.current;
      d.active = true;
      d.pointerId = e.pointerId;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.originX = pos.x;
      d.originY = pos.y;
      d.grabOffsetX = e.clientX - pos.x;
      d.grabOffsetY = e.clientY - pos.y;
      d.latestClientX = e.clientX;
      d.latestClientY = e.clientY;

      if (elRef.current) {
        elRef.current.style.willChange = "transform";
      }

      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerup", onPointerUp, true);
      window.addEventListener("pointercancel", onPointerUp, true);

      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [disabled, getPosition, onPointerMove, onPointerUp]
  );

  return { elRef, onPointerDown };
}
