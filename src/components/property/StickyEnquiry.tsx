"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, CalendarClock } from "lucide-react";

import { waHref } from "@/lib/contact";
import type { Locale } from "@/i18n/routing";

/**
 * Mobile sticky enquiry bar.
 *
 * Appears once the hero has passed, never covers content (the page reserves
 * padding for it), and carries the price so the visitor never has to scroll
 * back up to remember what they are asking about. This is the conversion path
 * on the primary device.
 */
export function StickyEnquiry({
  refCode,
  title,
  price,
  period,
}: {
  refCode: string;
  title: string;
  price: string;
  period?: string | null;
}) {
  const t = useTranslations("property");
  const tw = useTranslations("whatsapp");
  const locale = (useParams().locale as Locale) ?? "en";
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = waHref(tw("template", { ref: refCode, title }), locale);
  const external = href.startsWith("http");

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-edge bg-navy/97 backdrop-blur-[3px] lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="label truncate text-giza-dim" dir="ltr">
                {refCode}
              </p>
              <p className="truncate font-data text-[0.9rem] text-sheet tabular-nums" dir="ltr">
                {price}
                {period && <span className="ms-1 text-giza-dim">{period}</span>}
              </p>
            </div>

            <a
              href="#enquire"
              className="label flex min-h-12 shrink-0 items-center gap-2 border border-giza-dim/50 px-3.5 text-sheet"
            >
              <CalendarClock className="size-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("requestViewing")}</span>
            </a>

            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="label flex min-h-12 shrink-0 items-center gap-2 bg-survey-deep px-4 text-sheet"
            >
              <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden="true" />
              {t("whatsappShort")}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
