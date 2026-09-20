import { Archivo, Instrument_Sans, IBM_Plex_Mono, Noto_Kufi_Arabic, IBM_Plex_Sans_Arabic } from "next/font/google";

/**
 * Latin display. Archivo is loaded as a variable font across its WIDTH axis, not
 * just weight — headlines are set expanded (wdth ~112-125) so they read as drafted
 * architectural lettering. Stencil lettering on a drawing sheet is condensed sans,
 * never a serif; that is the whole argument for this face.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Latin body. Humanist grotesque with enough character to not read as Inter. */
export const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

/**
 * Data voice — prices, areas, reference codes, dimension strings. Tabular figures
 * are non-negotiable here: a price column that shifts width as digits change is the
 * detail that reads as amateur. Plex Mono is also the Arabic family's sibling, so
 * the two scripts share a designer.
 */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

/**
 * Arabic display. Kufic is the architectural script — squared, built from the same
 * right angles as a floor plan, and it originates in carved and bricked building
 * inscription. It gives the Arabic side the same logic as Archivo's squared caps
 * instead of treating Arabic as a fallback.
 */
export const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-kufi",
  display: "swap",
});

/** Arabic body, on its own larger scale — see --t-* overrides in globals.css. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex-ar",
  display: "swap",
});

export const fontVariables = [
  archivo.variable,
  instrument.variable,
  plexMono.variable,
  kufi.variable,
  plexArabic.variable,
].join(" ");
