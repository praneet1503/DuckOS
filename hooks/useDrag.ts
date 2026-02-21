"use client";

import { useRef, useCallback } from "react";

export interface DragCallbacks {
  /** Called once when the drag ends, with the final viewport position. */
  onDragEnd: (x: number, y: number) => void;
  /** Called to get the current committed position (for start offset). */
  getPosition: () => { x: number; y: number };
  /** Whether drag should be suppressed (e.g. window is maximised). */
  disabled?: boolean;
}

/**
 * Pure pointer-based drag hook.
 *
 * Rules:
 * - No DOM reads (getBoundingClientRect, offsetTop, etc.) during move.
 * - Position expressed solely via translate3d on the element.
 * - State committed only on pointer-up.
 * - Uses requestAnimationFrame to throttle visual updates.
 */
export function useDrag({ onDragEnd, getPosition, disabled }: DragCallbacks) {
  const elRef = useRef<HTMLDivElement | null>(null);

  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0, // clientX at pointerdown
    startY: 0, // clientY at pointerdown
    originX: 0, // window position.x at pointerdown
    originY: 0, // window position.y at pointerdown
    grabOffsetX: 0, // pointer relative to window origin
    grabOffsetY: 0,
    rafId: 0,
    latestClientX: 0,
    latestClientY: 0,
  });

  const tick = useCallback(() => {
    const d = drag.current;
    if (!d.active || !elRef.current) return;
    // compute based on grab offset so pointer stays at same relative point
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

      // Cancel any pending frame
      if (d.rafId) {
        cancelAnimationFrame(d.rafId);
        d.rafId = 0;
      }

      // final position uses grab offset as well
      const finalX = e.clientX - d.grabOffsetX;
      const finalY = e.clientY - d.grabOffsetY;

      // Commit final position — the component will re-render with the new
      // translate3d value from props, so we do NOT clear the transform here.
      onDragEnd(finalX, finalY);

      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
    },
    [onDragEnd, onPointerMove]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.button !== 0) return; // left-click only
      e.preventDefault();

      const pos = getPosition();
      const d = drag.current;
      d.active = true;
      d.pointerId = e.pointerId;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.originX = pos.x;
      d.originY = pos.y;
      // calculate grab offset: pointer relative to window origin
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

      // Capture so we keep getting events even if the pointer leaves the element
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [disabled, getPosition, onPointerMove, onPointerUp]
  );

  return { elRef, onPointerDown };
}
