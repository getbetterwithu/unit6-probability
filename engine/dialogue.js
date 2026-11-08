import { renderMath } from './math.js';

export function createDialogue({ speakerEl, textEl, hintEl, onWaitWidget, onAdvance }) {
  let queue = [];
  let i = 0;
  let typing = false;
  let full = '';
  let locked = false;

  function show(step) {
    speakerEl.textContent = step.speaker || '';
    full = step.text || '';
    textEl.textContent = '';
    typing = true;
    let n = 0;
    const tick = () => {
      n += 1;
      textEl.textContent = full.slice(0, n);
      if (n < full.length) requestAnimationFrame(tick);
      else {
        typing = false;
        renderMath(textEl);
      }
    };
    requestAnimationFrame(tick);
  }

  function next() {
    if (locked) return;
    if (typing) {
      textEl.textContent = full;
      typing = false;
      renderMath(textEl);
      return;
    }
    i += 1;
    if (i >= queue.length) return;
    const step = queue[i];
    if (onAdvance) onAdvance(step, i);
    if (step.type === 'widget') {
      locked = true;
      if (onWaitWidget) onWaitWidget(step, () => { locked = false; next(); });
      return;
    }
    show(step);
    hint();
  }

  function hint() {
    if (!hintEl) return;
    const nxt = queue[i + 1];
    if (nxt && nxt.type === 'widget') hintEl.textContent = '클릭하여 도전 시작 ▼';
    else hintEl.textContent = '엔터, 스페이스, 클릭으로 진행 ▼';
  }

  function key() {
    if (locked) return;
    if (typing) {
      textEl.textContent = full;
      typing = false;
      renderMath(textEl);
    }
    const nxt = queue[i + 1];
    if (nxt && nxt.type === 'widget') return;
    next();
  }

  function start(steps) {
    queue = steps;
    i = -1;
    locked = false;
    next();
  }

  function click() { next(); }

  return { start, click, key, unlock: () => { locked = false; } };
}
