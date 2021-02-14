import { getOverlappingDim, getRectDim, isPointInRect, isRectInRect, Rect, UNIQUE_ID } from './util';

export interface IMeasure {
  getSmallestDOMAt(x: number, y: number): HTMLElement;
  getBestMatchedDOMInside(rect: Rect): HTMLElement;
  getBoundingClientRect(dom: HTMLElement): DOMRect;
  getBestMatchedParentDOM(dom: HTMLElement): HTMLElement;
}

export class Measure implements IMeasure {

  private *iterateDOMs(): Generator<HTMLElement> {
    const all = document.getElementsByTagName("*");
    for (const el of all) {
      if (el.classList.contains(UNIQUE_ID)) continue;
      yield el as HTMLElement;
    }
  }

  getSmallestDOMAt(x: number, y: number): HTMLElement {
    let best: Element;
    let bestDim: number = Infinity;
    const doms = this.iterateDOMs();
    for (const el of doms) {
      const rect = el.getBoundingClientRect();
      if (isPointInRect(x, y, rect)) {
        const dim = getRectDim(rect);
        if (bestDim > dim) {
          best = el;
          bestDim = dim;
        }
      }
    }
    return best as HTMLElement;
  }

  getBestMatchedDOMInside(rect: Rect): HTMLElement {
    let best: Element;
    let bestDim: number = 0;
    const doms = this.iterateDOMs();
    for (const el of doms) {
      const elRect = this.getBoundingClientRect(el);
      if (!isRectInRect(rect, elRect)) continue;
      const dim = getRectDim(elRect);
      if (bestDim <= dim) {
        best = el;
        bestDim = dim;
      }
    }
    return best as HTMLElement;
  }

  getBoundingClientRect(dom: HTMLElement): DOMRect {
    return dom.getBoundingClientRect();
  }

  getBestMatchedParentDOM(dom: HTMLElement): HTMLElement {
    throw new Error('Method not implemented.');
  }

}