export const UNIQUE_ID = '______measure';

export function throttle (callback, limit) {
    var waiting = false;                      // Initially, we're not waiting
    return function () {                      // We return a throttled function
        if (!waiting) {                       // If we're not waiting
            callback.apply(this, arguments);  // Execute users function
            waiting = true;                   // Prevent future invocations
            setTimeout(function () {          // After a period of time
                waiting = false;              // And allow future invocations
            }, limit);
        }
    }
}

export interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function applyDOMRect(src: HTMLElement, rect: DOMRect) {
  src.style.left = `${rect.left}px`;
  src.style.top = `${rect.top}px`;
  src.style.width = `${rect.width}px`;
  src.style.height = `${rect.height}px`;
}

export function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
}

export function getRectDim(rect: Rect): number {
  return (rect.right - rect.left) * (rect.bottom - rect.top);
}

export function getOverlappingDim(lhs: Rect, rhs: Rect): number {
  const w = Math.min(lhs.right, rhs.right) - Math.max(lhs.left, rhs.left);
  const h = Math.min(lhs.bottom - rhs.bottom) - Math.max(lhs.top - rhs.top);
  if (w >= 0 && h >= 0) return w * h;
  return 0;
}

export function isRectInRect(outside: Rect, inside: Rect): boolean {
  return outside.left <= inside.left && outside.right >= inside.right &&
         outside.top <= inside.top && outside.bottom >= inside.bottom;
}

export function raycast(x: number, y: number, rects: readonly Rect[]) {
  let left = -Infinity;
  let right = Infinity;
  let top = -Infinity;
  let bottom = Infinity;

  for (const rect of rects) {
    if (x <= rect.left && rect.top <= y && y <= rect.bottom) {
      right = Math.min(right, rect.left);
    }
    if (rect.right <= x && rect.top <= y && y <= rect.bottom) {
      left = Math.max(left, rect.right);
    }
    if (y <= rect.top && rect.left <= x && x <= rect.right) {
      bottom = Math.min(bottom, rect.top);
    }
    if (rect.bottom <= y && rect.left <= x && x <= rect.right) {
      top = Math.max(top, rect.bottom);
    }
  }

  return {
    left, right, top, bottom
  };
}