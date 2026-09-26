import { brand } from "@/content/client-facts";
import { cn } from "@/lib/utils";

/**
 * The Alaser mark, redrawn as vector from the client's existing logo: three
 * pitched roofs, the centre one taller, with a chimney and punched windows.
 *
 * Redrawn rather than traced from the screenshot so it stays crisp at every
 * size, inherits currentColor for the navy/sheet inversion, and can be animated
 * in the hero. OPEN QUESTION `logo` in client-facts.ts asks the client for the
 * original vector - when it arrives this file is the only thing that changes.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 52"
      fill="none"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      <g fill="currentColor">
        {/* Left roof + wall, window punched with evenodd */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24.5 12.2 2 30.1v2.2h6.2V50h32.6V32.3H47v-2.2L24.5 12.2Zm5.1 22.6h-10v9.4h10v-9.4Z"
        />
        {/* Right roof + wall, mirrored */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M95.5 12.2 73 30.1v2.2h6.2V50h32.6V32.3H118v-2.2L95.5 12.2Zm5.1 22.6h-10v9.4h10v-9.4Z"
        />
        {/* Centre roof, taller, with chimney on the left slope */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60 1 35.6 20.4V10.9h-6.1v14.3L24 29.4v2.3h7.4V50h57.2V31.7H96v-2.3L60 1Zm7.3 25.1H52.7v14.6h14.6V26.1Z"
        />
        {/* Mullions — the cross in the centre window */}
        <rect x="59.1" y="26.1" width="1.8" height="14.6" />
        <rect x="52.7" y="32.5" width="14.6" height="1.8" />
        <rect x="24.1" y="34.8" width="0.9" height="9.4" />
        <rect x="19.6" y="39" width="10" height="0.9" />
        <rect x="95.1" y="34.8" width="0.9" height="9.4" />
        <rect x="90.6" y="39" width="10" height="0.9" />
      </g>
    </svg>
  );
}

/**
 * The logo as the home page opens on it: the mark, then the wordmark set as
 * in their logo, and the company's name in the visitor's language beneath -
 * the first thing a visitor sees is whose site this is.
 *
 * Colour is currentColor, so it sits white on the navy hero.
 */
export function Logo({ locale, className }: { locale: "en" | "ar"; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 sm:gap-5", className)}>
      <Mark className="h-12 w-auto shrink-0 sm:h-14" />
      <span aria-hidden="true" className="h-11 w-px shrink-0 bg-current opacity-30 sm:h-12" />
      <p className="min-w-0 leading-none">
        <span className="block">
          {/* Tracking leaves a space after the last letter; the negative end
              margin takes it back, so the word lines up with the name below
              in either direction. */}
          <span
            lang="en"
            dir="ltr"
            className="-me-[0.28em] inline-block font-display text-[1.5rem] tracking-[0.28em] [font-variation-settings:'wdth'_100,'wght'_600] sm:text-[1.75rem]"
          >
            {brand.latin}
          </span>
        </span>
        <span className="mt-2 block text-[0.9375rem] font-medium opacity-80 sm:text-base">
          {locale === "ar" ? `${brand.arabic} ${brand.descriptor.ar}` : brand.descriptor.en}
        </span>
      </p>
    </div>
  );
}
