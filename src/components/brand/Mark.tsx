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

/** Mark plus wordmark, as it is locked up in their logo. */
export function Logo({
  className,
  withDescriptor = true,
}: {
  className?: string;
  withDescriptor?: boolean;
}) {
  return (
    <span className={className}>
      <Mark className="h-7 w-auto" />
      <span className="mt-1.5 block font-display text-[0.95rem] leading-none tracking-[0.34em] [font-variation-settings:'wdth'_100,'wght'_500]">
        ALASER
      </span>
      {withDescriptor && (
        <span className="mt-1 block font-data text-[0.5rem] leading-none tracking-[0.22em] text-giza-dim uppercase">
          Real Estate Marketing
        </span>
      )}
    </span>
  );
}
