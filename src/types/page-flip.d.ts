/**
 * Minimal types for page-flip (StPageFlip) 2.0.7, which ships none.
 *
 * Only the surface this project uses is declared - read off the library's own
 * source rather than guessed, so a mismatch here is a real API change.
 */
declare module "page-flip" {
  export type FlipSetting = {
    startPage?: number;
    size?: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  };

  export type FlipEvent<T = unknown> = { data: T; object: PageFlip };

  export class PageFlip {
    constructor(element: HTMLElement, setting: FlipSetting);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(pageNum: number, corner?: "top" | "bottom"): void;
    turnToPage(pageNum: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on(
      event: "flip" | "changeOrientation" | "changeState" | "init" | "update",
      callback: (e: FlipEvent) => void,
    ): PageFlip;
    destroy(): void;
  }
}
