import './measure.scss';
import { DisposableStore } from '@orange4glace/vs-lib/base/common/lifecycle';
import { Screen } from '../screen';
import { IScreenTool } from './tool';
import { getRectDim, isPointInRect, raycast, UNIQUE_ID } from 'content/util';

export class ScreenMeasureTool implements IScreenTool {
  static readonly NAME = 'ScreenMeasureTool';

  readonly name: string = ScreenMeasureTool.NAME;

  private disposables_: DisposableStore;

  private dom_: HTMLCanvasElement;
  private ctx_: CanvasRenderingContext2D;
  private horizontalDOM_: HTMLElement;
  private verticalDOM_: HTMLElement;

  private horizontalLabelDOM_: HTMLElement;
  private verticalLabelDOM_: HTMLElement;

  private widthLabelDOM_: HTMLElement;
  private heightLabelDOM_: HTMLElement;

  private interval_: any;

  private fontSize_;

  constructor(
    readonly screen: Screen
  ) {
    this.draw = this.draw.bind(this);

    this.dom_ = document.createElement('canvas');
    this.ctx_ = this.dom_.getContext('2d');

    this.fontSize_ = chrome.storage.sync.get(['measureFontSize'], result => {
      this.fontSize_ = result['measureFontSize'] || 11;
    });
    this.fontSize_ = this.fontSize_ || 11;
    window.addEventListener('keypress', e => {
      if (e.key === '=') {
        this.fontSize_ = this.fontSize_ + 1;
        chrome.storage.sync.set({
          'measureFontSize': this.fontSize_
        });
      }
      else if (e.key === '-') {
        this.fontSize_ = this.fontSize_ - 1;
        chrome.storage.sync.set({
          'measureFontSize': this.fontSize_
        });
      }
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  private resize() {
    this.dom_.width = this.screen.dom.offsetWidth;
    this.dom_.height = this.screen.dom.offsetHeight;
  }

  onActivate(): void {
    this.disposables_ = new DisposableStore();

    this.horizontalDOM_ = document.createElement('div');
    this.verticalDOM_ = document.createElement('div');
    this.horizontalLabelDOM_ = document.createElement('div');
    this.verticalLabelDOM_ = document.createElement('div');
    this.widthLabelDOM_ = document.createElement('div');
    this.heightLabelDOM_ = document.createElement('div');
    this.dom_.className = `${UNIQUE_ID} tool-measure`;
    this.horizontalDOM_.className = `${UNIQUE_ID} horizontal`;
    this.verticalDOM_.className = `${UNIQUE_ID} vertical`;
    this.horizontalLabelDOM_.className = `${UNIQUE_ID} label label-horizontal`;
    this.verticalLabelDOM_.className = `${UNIQUE_ID} label label-vertical`;
    this.widthLabelDOM_.className = `${UNIQUE_ID} label label-horizontal`;
    this.heightLabelDOM_.className = `${UNIQUE_ID} label label-vertical`;
    this.dom_.append(this.horizontalDOM_);
    this.dom_.append(this.verticalDOM_);
    this.dom_.append(this.horizontalLabelDOM_);
    this.dom_.append(this.verticalLabelDOM_);
    this.dom_.append(this.widthLabelDOM_);
    this.dom_.append(this.heightLabelDOM_);
    this.screen.dom.append(this.dom_);

    this.disposables_.add(this.screen.onMousemove(() => this.draw()));
    this.interval_ = setInterval(this.draw, 33);
  }

  onDeactivate(): void {
    this.dom_.remove();
    this.disposables_.dispose();
    clearInterval(this.interval_);
  }

  private draw() {
    const x = this.screen.clientX;
    const y = this.screen.clientY;

    const cast = raycast(x, y, this.screen.boxes.boxes.map(b => this.screen.measure.getBoundingClientRect(b)));

    const left = Math.max(0, cast.left);
    const right = Math.min(this.screen.width, cast.right);
    const top = Math.max(0, cast.top);
    const bottom = Math.min(this.screen.height, cast.bottom);

    this.ctx_.clearRect(0, 0, this.screen.width, this.screen.height);

    this.ctx_.lineWidth = 1;
    this.ctx_.strokeStyle = '#8be0ad';
    this.ctx_.beginPath();
    this.ctx_.moveTo(left, y + 0.5);
    this.ctx_.lineTo(right, y + 0.5);
    this.ctx_.moveTo(x + 0.5, top);
    this.ctx_.lineTo(x + 0.5, bottom);
    this.ctx_.stroke();

    this.ctx_.font = `${this.fontSize_}px Arial`;

    {
      const horizontalLabelDim = this.ctx_.measureText(`${right - left}`);
      const hly = y + this.fontSize_ / 2;
      const hlx = Math.min(this.screen.width - horizontalLabelDim.width - 5, right + 5);
      this.ctx_.fillStyle = 'black';
      this.ctx_.fillRect(hlx - 2, hly - this.fontSize_, horizontalLabelDim.width + 4, this.fontSize_ + 4);
      this.ctx_.fillStyle = 'white';
      this.ctx_.fillText(`${right - left}`, hlx, hly);
    }
    { 
      const verticalLabelDim = this.ctx_.measureText(`${bottom - top}`);
      const vly = Math.min(this.screen.height - 10, bottom + this.fontSize_ + 4);
      const vlx = x - verticalLabelDim.width / 2;
      this.ctx_.fillStyle = 'black';
      this.ctx_.fillRect(vlx - 2, vly - this.fontSize_, verticalLabelDim.width + 4, this.fontSize_ + 4);
      this.ctx_.fillStyle = 'white';
      this.ctx_.fillText(`${bottom - top}`, vlx, vly);
    }

    const candidates = this.screen.boxes.boxes.filter(box => {
      const rect = this.screen.measure.getBoundingClientRect(box);
      return isPointInRect(x, y, rect);
    })
    candidates.sort((a, b) => getRectDim(this.screen.measure.getBoundingClientRect(a)) - getRectDim(this.screen.measure.getBoundingClientRect(b)));
    const hovering = candidates[0];
    if (hovering) {
      const hoveringRect = this.screen.measure.getBoundingClientRect(hovering);
      
      const horizontalLabelDim = this.ctx_.measureText(`${hoveringRect.right - hoveringRect.left}`);
      const hly = hoveringRect.top - 6;
      const hlx = hoveringRect.left + hoveringRect.width / 2 - horizontalLabelDim.width / 2;
      this.ctx_.fillStyle = '#043542';
      this.ctx_.fillRect(hlx - 2, hly - this.fontSize_, horizontalLabelDim.width + 4, this.fontSize_ + 4);
      this.ctx_.fillStyle = 'white';
      this.ctx_.fillText(`${hoveringRect.right - hoveringRect.left}`, hlx, hly);

      const verticalLabelDim = this.ctx_.measureText(`${hoveringRect.bottom - hoveringRect.top}`);
      const vly = hoveringRect.top + hoveringRect.height / 2 + this.fontSize_ / 2;
      const vlx = hoveringRect.right + 6;
      this.ctx_.fillStyle = '#043542';
      this.ctx_.fillRect(vlx - 2, vly - this.fontSize_, verticalLabelDim.width + 4, this.fontSize_ + 4);
      this.ctx_.fillStyle = 'white';
      this.ctx_.fillText(`${hoveringRect.bottom - hoveringRect.top}`, vlx, vly);
    }
    else {
      this.widthLabelDOM_.style.display = 'none';
      this.heightLabelDOM_.style.display = 'none';
    }
  }

  canBeSwitchedTo(tool: IScreenTool): boolean {
    return true;
  }

}