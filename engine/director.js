export function shake(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'shake 400ms linear both';
  el.classList.add('screen-shake');
  clearTimeout(el._shakeTimer);
  el._shakeTimer = setTimeout(() => {
    el.style.animation = '';
    el.classList.remove('screen-shake');
  }, 400);
}

export function setTension(value) {
  const bar = document.getElementById('tension-fill');
  if (!bar) return;
  const v = Math.max(0, Math.min(100, value));
  bar.style.width = v + '%';
}

export function refute(stageEl, bagEl) {
  shake(stageEl || '#game-container');
  const lines = document.getElementById('focus-lines');
  if (lines) {
    lines.classList.add('on');
    setTimeout(() => lines.classList.remove('on'), 700);
  }
  if (bagEl) bagEl.classList.add('used');
}
