/**
 * Tells the page-change indicator that a navigation has started which it
 * cannot see for itself - a `router.push` from a form, rather than a click
 * on a link. See components/layout/NavigationLoader.tsx.
 */
export const NAVIGATION_START = "alaser:navigation-start";

export function announceNavigation() {
  window.dispatchEvent(new Event(NAVIGATION_START));
}
