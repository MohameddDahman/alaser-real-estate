"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle } from "lucide-react";

import { waHref } from "@/lib/contact";
import type { Locale } from "@/i18n/routing";

/**
 * Phone-only bar with the price and the two ways to ask.
 *
 * Appears once the photographs have scrolled away, never covers content (the
 * page reserves room for it), and carries the price so nobody has to scroll
 * back up to remember what they are asking about.
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
    const onScroll = () => setShown(window.scrollY > 480);
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
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas shadow-[0_-6px_20px_-8px_rgb(22_26_43/0.2)] lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-fg tabular-nums">
                <span dir="ltr">{price}</span>
                {period && <span className="ms-1 text-sm font-normal text-fg-subtle">{period}</span>}
              </p>
              <p className="truncate text-xs text-fg-subtle" dir="ltr">
                {refCode}
              </p>
            </div>

            <a href="#enquire" className="btn btn-outline shrink-0 px-3.5">
              {t("requestViewing")}
            </a>

            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="btn btn-whatsapp shrink-0 px-3.5"
            >
              <MessageCircle className="size-4" strokeWidth={2} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("whatsappShort")}</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
