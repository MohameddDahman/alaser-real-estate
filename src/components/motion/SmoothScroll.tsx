"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Smooth scroll, deliberately restrained.
 *
 * The brief's "never" list includes smooth-scroll hijacking that fights the
 * trackpad, so this is tuned to smooth the *tail* of a scroll rather than take
 * it over: a short duration, a gentle ease-out, `syncTouch` off so phones keep
 * their native momentum entirely.
 *
 * Under prefers-reduced-motion Lenis is not mounted at all - not configured
 * away, not disabled, simply absent - so the browser's own scrolling is
 * untouched.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        duration: 0.9,
        // Exponential ease-out: catches up fast, settles softly.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        syncTouch: false, // phones keep native momentum
      }}
    >
      {children}
    </ReactLenis>
  );
}
