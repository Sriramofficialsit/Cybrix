// Minimal types for page-flip (StPageFlip) 2.0.7, which ships none.
// Covers only what the story reader uses.
declare module "page-flip" {
  export interface FlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    startPage?: number;
    showCover?: boolean;
    usePortrait?: boolean;
    flippingTime?: number;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    showPageCorners?: boolean;
    mobileScrollSupport?: boolean;
    autoSize?: boolean;
    useMouseEvents?: boolean;
    disableFlipByClick?: boolean;
    clickEventForward?: boolean;
    swipeDistance?: number;
    startZIndex?: number;
  }
  export type FlipState = "user_fold" | "fold_corner" | "flipping" | "read";
  export interface FlipEvent<T = unknown> {
    data: T;
    object: PageFlip;
  }
  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    on(event: "flip", cb: (e: FlipEvent<number>) => void): this;
    on(event: "changeState", cb: (e: FlipEvent<FlipState>) => void): this;
    on(event: "init" | "update" | "changeOrientation", cb: (e: FlipEvent) => void): this;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    destroy(): void;
  }
}
