import './select.scss';
import { Screen } from 'content/screen';
import { IScreenTool } from 'content/tool/tool';
import { applyDOMRect, getRectDim, isPointInRect, isRectInRect, throttle, UNIQUE_ID } from 'content/util';

export class ScreenSelectTool implements IScreenTool {
  static readonly NAME = 'ScreenSelectTool';

  name: string = ScreenSelectTool.NAME;

  private dom_: HTMLElement;
  private hoveringDOM_: HTMLElement;
  private hoveringTargetDOM_: HTMLElement;
  private selectingDOM_: HTMLElement;

  private mousedownX_: number;
  private mousedownY_: number;

  private top_: number;
  private right_: number;
  private bottom_: number;
  private left_: number;

  private phase_: 'OVER' | 'THRES' | 'RANGE';

  constructor(
    readonly screen: Screen
  ) {
    this.dom_ = document.createElement('div');
    this.dom_.className = `${UNIQUE_ID} tool-select`;

    this.handleMousedown = this.handleMousedown.bind(this);
    this.handleMousemove = this.handleMousemove.bind(this);
    this.handleMouseup = this.handleMouseup.bind(this);
    this.updateHovering = throttle(this.updateHovering.bind(this), 33);
  }

  onActivate(): void {
    this.hoveringDOM_?.remove();
    this.selectingDOM_?.remove();
    this.screen.dom.append(this.dom_);
    this.phase_ = 'OVER';

    this.dom_.addEventListener('contextmenu', e => e.preventDefault());
    this.dom_.addEventListener('mousedown', this.handleMousedown);
    this.dom_.addEventListener('mousemove', this.handleMousemove);
    this.dom_.addEventListener('mouseup', this.handleMouseup);
  }

  onDeactivate(): void {
    this.hoveringDOM_?.remove();
    this.selectingDOM_?.remove();
    this.dom_.remove();
    
    this.dom_.removeEventListener('mousedown', this.handleMousedown);
    this.dom_.removeEventListener('mousemove', this.handleMousemove);
    this.dom_.removeEventListener('mouseup', this.handleMouseup);
  }

  private handleMousedown(e: MouseEvent) {
    e.preventDefault();
    const x = this.screen.clientX;
    const y = this.screen.clientY;
    this.mousedownX_ = x;
    this.mousedownY_ = y;

    if (this.phase_ == 'OVER') {
      this.phase_ = 'THRES';
    }
  }

  private handleMousemove() {
    const x = this.screen.clientX;
    const y = this.screen.clientY;

    if (this.phase_ === 'OVER' || this.phase_ === 'THRES') {
      if (!this.hoveringDOM_) {
        this.hoveringDOM_ = document.createElement('div');
        this.hoveringDOM_.className = `${UNIQUE_ID} hovering`;
        this.dom_.append(this.hoveringDOM_);
      }
      this.updateHovering();
    }
    else if (this.phase_ === 'RANGE') {
      this.right_ = x;
      this.bottom_ = y;
      this.updateSelectinDOM();
    }
    
    if (this.phase_ === 'THRES') {
      if (Math.abs(this.mousedownX_ - x) + Math.abs(this.mousedownY_ - y) > 3) {
        this.hoveringDOM_.remove();
        this.hoveringDOM_ = undefined;
        this.selectingDOM_ = document.createElement('div');
        this.selectingDOM_.className = `${UNIQUE_ID} selecting`;
        this.dom_.append(this.selectingDOM_);
        this.top_ = y;
        this.right_ = x;
        this.bottom_ = y;
        this.left_ = x;
        this.updateSelectinDOM();
        this.phase_ = 'RANGE';
      }
    }
  }

  private updateHovering() {
    const x = this.screen.clientX;
    const y = this.screen.clientY;
    if (this.phase_ === 'OVER' || this.phase_ === 'THRES') {
      const dom = this.screen.measure.getSmallestDOMAt(x, y);
      this.hoveringTargetDOM_ = dom;
      const rect = this.screen.measure.getBoundingClientRect(dom);
      applyDOMRect(this.hoveringDOM_, rect);
    }
  }

  private handleMouseup(e: MouseEvent) {
    const x = this.screen.clientX;
    const y = this.screen.clientY;
    if (this.phase_ === 'RANGE') {
      if (e.button == 0) {
        const best = this.screen.measure.getBestMatchedDOMInside(this.selectingDOM_.getBoundingClientRect());
        if (best) {
          this.screen.boxes.add(best);
        }
      }
      if (e.button == 2) {
        const removes = this.screen.boxes.boxes.filter(box => isRectInRect(this.selectingDOM_.getBoundingClientRect(), this.screen.measure.getBoundingClientRect(box)));
        for (const remove of removes) {
          this.screen.boxes.remove(remove);
        }
      }
      this.selectingDOM_.remove();
    }
    else {
      if (e.button == 0) {
        if (this.hoveringTargetDOM_) {
          this.screen.boxes.add(this.hoveringTargetDOM_);
        }
      }
      if (e.button === 2) {
        const removes = this.screen.boxes.boxes.filter(box => {
          const rect = this.screen.measure.getBoundingClientRect(box);
          return isPointInRect(x, y, rect);
        })
        removes.sort((a, b) => getRectDim(this.screen.measure.getBoundingClientRect(a)) - getRectDim(this.screen.measure.getBoundingClientRect(b)));
        removes[0] && this.screen.boxes.remove(removes[0]);
      }
    }
    this.phase_ = 'OVER';
  }

  private updateSelectinDOM() {
    const l = Math.min(this.left_, this.right_);
    const r = Math.max(this.left_, this.right_);
    const t = Math.min(this.top_, this.bottom_);
    const b = Math.max(this.top_, this.bottom_);
    this.selectingDOM_.style.left = `${l}px`;
    this.selectingDOM_.style.top = `${t}px`;
    this.selectingDOM_.style.width = `${r - l}px`;
    this.selectingDOM_.style.height = `${b - t}px`;
  }

  canBeSwitchedTo(tool: IScreenTool): boolean {
    return true;
  }

}