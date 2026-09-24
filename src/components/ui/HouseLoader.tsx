import { cn } from "@/lib/utils";

/**
 * The loading indicator: the three houses of the ALASER mark hop one after
 * another, the way three dots do everywhere else - and in Arabic the wave
 * runs right to left, with the reading.
 *
 * Pure SVG and CSS (see `.house-loader` in globals.css), so it renders on
 * the server and needs no script. Sized by the height it is given; the
 * colour is currentColor. `still` draws the houses at rest, for a
 * placeholder that should not move.
 */
export function HouseLoader({
  className,
  label,
  still = false,
}: {
  className?: string;
  /** Announced to screen readers; leave out where the context already says it. */
  label?: string;
  still?: boolean;
}) {
  return (
    <svg
      viewBox="0 -8 120 60"
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn("house-loader w-auto", still && "house-loader--still", className)}
    >
      <g className="house">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24.5 12.2 2 30.1v2.2h6.2V50h32.6V32.3H47v-2.2L24.5 12.2Zm5.1 22.6h-10v9.4h10v-9.4Z"
        />
        <rect x="24.1" y="34.8" width="0.9" height="9.4" />
        <rect x="19.6" y="39" width="10" height="0.9" />
      </g>
      <g className="house">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60 1 35.6 20.4V10.9h-6.1v14.3L24 29.4v2.3h7.4V50h57.2V31.7H96v-2.3L60 1Zm7.3 25.1H52.7v14.6h14.6V26.1Z"
        />
        <rect x="59.1" y="26.1" width="1.8" height="14.6" />
        <rect x="52.7" y="32.5" width="14.6" height="1.8" />
      </g>
      <g className="house">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M95.5 12.2 73 30.1v2.2h6.2V50h32.6V32.3H118v-2.2L95.5 12.2Zm5.1 22.6h-10v9.4h10v-9.4Z"
        />
        <rect x="95.1" y="34.8" width="0.9" height="9.4" />
        <rect x="90.6" y="39" width="10" height="0.9" />
      </g>
    </svg>
  );
}
