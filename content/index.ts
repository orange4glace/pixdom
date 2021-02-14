import { Measure } from 'content/measure';
import { Screen } from 'content/screen';

const screen = new Screen(new Measure());

window.addEventListener('keypress', e => {
  if (e.key === 'm') {
    screen.toggle();
  }
}, {
  capture: true
})

function update() {
  screen.update();
  requestAnimationFrame(update);
}
requestAnimationFrame(update);