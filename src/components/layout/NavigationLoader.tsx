"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HouseLoader } from "@/components/ui/HouseLoader";
import { NAVIGATION_START } from "@/lib/navigation-events";
import { cn } from "@/lib/utils";

const DELAY = 350; // ms - a page that arrives sooner never shows it
const GIVE_UP = 15_000; // ms - never leave it on screen by mistake

/**
 * The page-change indicator, for slow connections.
 *
 * A navigation starts on a click on an internal link (or a form that
 * announces one, see lib/navigation-events.ts) and ends when the URL the
 * app renders changes. If that takes longer than DELAY, the house loader
 * comes up over the page. It never takes a click: the visitor can still
 * change their mind and go somewhere else.
 */
export function NavigationLoader() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const timers = useRef<{ show?: number; stop?: number }>({});

  // The new page has rendered: whatever was pending is over.
  useEffect(() => {
    window.clearTimeout(timers.current.show);
    window.clearTimeout(timers.current.stop);
    setVisible(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const current = timers.current;

    const start = () => {
      window.clearTimeout(current.show);
      window.clearTimeout(current.stop);
      current.show = window.setTimeout(() => setVisible(true), DELAY);
      current.stop = window.setTimeout(() => setVisible(false), GIVE_UP);
    };

    // Capture phase: Next's <Link> prevents the default on the way back up.
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or only a jump to an anchor on it: nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener(NAVIGATION_START, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAVIGATION_START, start);
      window.clearTimeout(current.show);
      window.clearTimeout(current.stop);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-canvas/50 backdrop-blur-[1px] transition-[opacity,visibility] duration-200",
        visible ? "opacity-100" : "invisible opacity-0",
      )}
    >
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl bg-canvas px-8 py-6 shadow-pop">
        {/* Mounted only while showing, so nothing animates unseen. */}
        {visible && <HouseLoader className="h-11 text-navy" />}
        <p className="text-sm font-medium text-fg-muted">{visible ? t("loading") : ""}</p>
      </div>
    </div>
  );
}
