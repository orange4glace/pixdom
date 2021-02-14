export class BoxManager {

  private boxes_: HTMLElement[] = [];
  get boxes(): readonly HTMLElement[] { return this.boxes_; }

  add(dom: HTMLElement) {
    if (this.boxes_.indexOf(dom) != -1) {
      return;
    }
    this.boxes_.push(dom);
  }

  remove(dom: HTMLElement) {
    const idx = this.boxes_.indexOf(dom);
    if (idx == -1) return;
    this.boxes_.splice(idx, 1);
  }

  has(dom: HTMLElement) {
    return this.boxes_.indexOf(dom) != -1;
  }

  validate() {
    this.boxes_ = this.boxes_.filter(b => document.body.contains(b));
  }

}