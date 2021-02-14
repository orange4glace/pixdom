import './screen.scss';
import { Emitter } from '@orange4glace/vs-lib/base/common/event';
import { BoxManager } from 'content/boxManager';
import { ScreenMeasureTool } from 'content/tool/measure';
import { ScreenSelectTool } from 'content/tool/select';
import { IScreenTool } from 'content/tool/tool';
import { applyDOMRect, UNIQUE_ID } from 'content/util';
import { IMeasure } from './measure';

export class Screen {

  private onMousemove_ = new Emitter<void>();
  readonly onMousemove = this.onMousemove_.event;

  private dom_: HTMLElement;
  get dom() { return this.dom_; }

  private pageX_: number = 0;
  get pageX() { return this.pageX_; }
  private pageY_: number = 0;
  get pageY() { return this.pageY_; }

  private screenX_: number = 0;
  get screenX() { return this.screenX_; }
  private screenY_: number = 0;
  get screenY() { return this.screenY_; }

  private clientX_: number = 0;
  get clientX() { return this.clientX_; }
  private clientY_: number = 0;
  get clientY() { return this.clientY_; }

  private currentTool_: IScreenTool;
  get currentTool() { return this.currentTool_; }

  private width_: number;
  private height_: number;
  get width() { return this.width_; }
  get height() { return this.height_; }

  readonly boxes: BoxManager;

  private boxOverlays_: [HTMLElement, HTMLElement][] = [];

  constructor(
    readonly measure: IMeasure
  ) {
    this.boxes = new BoxManager();
    
    this.dom_ = document.createElement('div');
    this.dom_.className = `${UNIQUE_ID}`
    this.dom_.setAttribute('style', `
      position: fixed;
      z-index: 99999999;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      pointer-events: none;
    `);
    document.body.append(this.dom_);

    window.addEventListener('mousemove', e => {
      this.pageX_ = e.pageX;
      this.pageY_ = e.pageY;
      this.screenX_ = e.screenX;
      this.screenY_ = e.screenY;
      this.clientX_ = e.clientX;
      this.clientY_ = e.clientY;
      this.onMousemove_.fire();
    }, {
      capture: true
    });
    window.addEventListener('resize', () => this.resize());
    this.resize();

    const measureTool = new ScreenMeasureTool(this);
    const selectTool = new ScreenSelectTool(this);
    measureTool.onActivate();
    selectTool.onActivate();
    // this.setTool(selectTool);
  }

  private resize() {
    this.width_ = this.dom_.offsetWidth;
    this.height_ = this.dom.offsetHeight;
  }

  setTool(tool: IScreenTool) {
    // if (this.currentTool_) {
    //   this.currentTool_.onDeactivate(); 
    // }
    // this.currentTool_ = tool;
    // if (this.currentTool_) {
    //   this.currentTool_.onActivate();
    // }
  }

  update() {
    this.boxes.validate();
    const removes = this.boxOverlays_.filter(o => !this.boxes.has(o[0]));
    const newOverlays = this.boxOverlays_.filter(o => this.boxes.has(o[0]));
    removes.forEach(rm => rm[1].remove());
    const appends = this.boxes.boxes.filter(b => !!!this.boxOverlays_.find(o => o[0] === b));
    for (const a of appends) {
      const overlay = document.createElement('div');
      overlay.className = `${UNIQUE_ID} __sc_overlay`;
      this.dom_.append(overlay);
      newOverlays.push([a, overlay]);
    }
    this.boxOverlays_ = newOverlays;
    for (const o of this.boxOverlays_) {
      applyDOMRect(o[1], this.measure.getBoundingClientRect(o[0]));
    }
  }

  enable() {
    this.dom.style.display = 'inherit';
  }
  
  disable() {
    this.dom_.style.display = 'none';
  }

  toggle() {
    if (this.dom.style.display === 'none') this.enable();
    else this.disable();
  }

}