/**
 * The ALASER mark for generated icons: white houses on the logo's navy.
 * Shared by icon.tsx (browser tabs) and apple-icon.tsx (home screens).
 *
 * The paths are the ones in components/brand/Mark.tsx - kept in step with
 * it by hand, because these render in Satori, which takes plain SVG and not
 * a React component that expects the page's CSS.
 */
export const NAVY = "#13182c";

export function BrandIcon({ size, radius }: { size: number; radius: number }) {
  // The mark is wide and low; at tab size it takes nearly the whole width
  // so the houses still read at 16 pixels.
  const markWidth = Math.round(size * (size <= 48 ? 0.9 : 0.78));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: NAVY,
        borderRadius: radius,
      }}
    >
      <svg
        width={markWidth}
        height={Math.round((markWidth * 52) / 120)}
        viewBox="0 0 120 52"
        fill="#ffffff"
      >
        <path
          fillRule="evenodd"
          d="M24.5 12.2 2 30.1v2.2h6.2V50h32.6V32.3H47v-2.2L24.5 12.2Zm5.1 22.6h-10v9.4h10v-9.4Z"
        />
        <path
          fillRule="evenodd"
          d="M95.5 12.2 73 30.1v2.2h6.2V50h32.6V32.3H118v-2.2L95.5 12.2Zm5.1 22.6h-10v9.4h10v-9.4Z"
        />
        <path
          fillRule="evenodd"
          d="M60 1 35.6 20.4V10.9h-6.1v14.3L24 29.4v2.3h7.4V50h57.2V31.7H96v-2.3L60 1Zm7.3 25.1H52.7v14.6h14.6V26.1Z"
        />
      </svg>
    </div>
  );
}
