export function mountPecasPick(root, { onDone }) {
  root.innerHTML = `
    <div class="popup path-pop">
      <p class="dice-hint" id="pup-hint">움직이는 다섯 마리 중 주황을 클릭하시오.</p>
      <div id="pup-yard" style="position:relative;height:320px;background:#f7f1e6;border-radius:12px;overflow:hidden;"></div>
      <p class="dice-readout"><span id="pup-msg">집기 전</span> <button type="button" id="pup-btn" style="margin-left:8px;background:#3a2a1c;color:#f0e6d2;border:1px solid #e5a93b;border-radius:8px;padding:2px 8px;">다시</button></p>
    </div>`;
  const yard = root.querySelector('#pup-yard');
  const stages = [
    { count: 5, speed: 2.4, hint: '움직이는 다섯 마리 중 주황을 클릭하시오.' },
    { count: 7, speed: 4.2, hint: '일곱 마리다. 더 빠르다. 주황을 클릭하시오.' },
    { count: 9, speed: 4.6, hint: '아홉 마리다. 아주 조금만 더 빠르다. 주황을 클릭하시오.' },
  ];
  let stage = 0;
  let odd = 0;
  let done = false;
  let wander = 0;
  const movers = [];
  function pupSvg(color) {
    return `<svg viewBox="0 0 80 90" width="48" height="56">
      <path d="M40 28 L40 8" stroke="#6d6d6d" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 12 Q32 4 40 10 Q48 4 56 12" fill="none" stroke="#9a9a9a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="40" cy="46" r="22" fill="${color}"/>
      <circle cx="32" cy="42" r="3" fill="#1a1a1a"/>
      <circle cx="48" cy="42" r="3" fill="#1a1a1a"/>
      <path d="M32 54 Q40 60 48 54" fill="none" stroke="#1a1a1a" stroke-width="2"/>
    </svg>`;
  }
  function place() {
    if (wander) cancelAnimationFrame(wander);
    yard.innerHTML = '';
    const n = stages[stage].count;
    odd = Math.floor(Math.random() * n);
    for (let i = 0; i < n; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pup';
      const span = bounds();
      const cols = Math.max(3, Math.min(n, Math.floor(span.w / 88)));
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Math.min(span.w, 8 + col * 88);
      const y = Math.min(span.h, 8 + row * 80);
      b.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:48px;height:56px;line-height:0;overflow:visible;border:0;background:transparent;padding:0;cursor:pointer;`;
      b.dataset.x = x;
      b.dataset.y = y;
      b.innerHTML = pupSvg(i === odd ? '#E65100' : '#8d6e63');
      b.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType === 'touch') {
          ev.preventDefault();
          ev.stopPropagation();
          b.dataset.touch = '1';
        }
      });
      b.addEventListener('click', (ev) => {
        if (ev.pointerType === 'touch' || b.dataset.touch === '1') {
          b.dataset.touch = '';
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }
        catchPup(i);
      });
      yard.appendChild(b);
    }
    root.querySelector('#pup-hint').textContent = stages[stage].hint;
  }
  function setBtn(label, orange) {
    const btn = root.querySelector('#pup-btn');
    btn.textContent = label;
    btn.style.background = orange ? '#E65100' : '#3a2a1c';
    btn.style.color = orange ? '#fff' : '#f0e6d2';
    btn.style.borderColor = orange ? '#E65100' : '#e5a93b';
  }
  function catchPup(i) {
    if (done) return;
    const msg = root.querySelector('#pup-msg');
    if (i !== odd) {
      msg.textContent = '같은 색이다. 주황을 집으시오.';
      return;
    }
    done = true;
    if (wander) cancelAnimationFrame(wander);
    if (stage < 2) {
      msg.textContent = '놓쳤다.';
      setBtn('다음단계', true);
      return;
    }
    msg.textContent = '그 한 마리다.';
    setBtn('성공', true);
    if (onDone) onDone();
  }
  const PUP_W = 48;
  const PUP_H = 56;
  function bounds() {
    const w = yard.clientWidth || 400;
    const h = yard.clientHeight || 300;
    return { w: Math.max(8, w - PUP_W - 8), h: Math.max(8, h - PUP_H - 8) };
  }
  function randTarget() {
    const span = bounds();
    return { x: 4 + Math.random() * span.w, y: 4 + Math.random() * span.h };
  }
  function startWander() {
    if (wander) cancelAnimationFrame(wander);
    movers.length = 0;
    yard.querySelectorAll('.pup').forEach((b) => {
      movers.push({ el: b, x: Number(b.dataset.x), y: Number(b.dataset.y), tx: randTarget().x, ty: randTarget().y });
    });
    const speed = stages[stage].speed;
    const step = () => {
      if (done) return;
      movers.forEach((m) => {
        const dx = m.tx - m.x;
        const dy = m.ty - m.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < speed) {
          const next = randTarget();
          m.tx = next.x;
          m.ty = next.y;
        } else {
          m.x += (dx / dist) * speed;
          m.y += (dy / dist) * speed;
        }
        const span = bounds();
        m.x = Math.max(8, Math.min(span.w, m.x));
        m.y = Math.max(8, Math.min(span.h, m.y));
        m.tx = Math.max(8, Math.min(span.w, m.tx));
        m.ty = Math.max(8, Math.min(span.h, m.ty));
        m.el.style.left = m.x + 'px';
        m.el.style.top = m.y + 'px';
      });
      wander = requestAnimationFrame(step);
    };
    wander = requestAnimationFrame(step);
  }
  function begin() {
    done = false;
    root.querySelector('#pup-msg').textContent = '집기 전';
    setBtn('다시', false);
    place();
    requestAnimationFrame(() => {
      const span = bounds();
      yard.querySelectorAll('.pup').forEach((b, i) => {
        const x = Math.min(span.w, 12 + (i % 5) * 70);
        const y = Math.min(span.h, 12 + Math.floor(i / 5) * 72);
        b.style.left = x + 'px';
        b.style.top = y + 'px';
        b.dataset.x = x;
        b.dataset.y = y;
      });
      startWander();
    });
  }
  begin();
  root.querySelector('#pup-btn').addEventListener('click', (ev) => {
    ev.stopPropagation();
    const label = ev.currentTarget.textContent;
    if (label === '다음단계') {
      stage += 1;
      begin();
      return;
    }
    if (label === '성공') return;
    begin();
  });
}
