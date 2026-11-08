const PATTERN = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,1,0,0,1,0],
  [0,1,0,0,1,1,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];

function clues(lines) {
  return lines.map((row) => {
    const out = [];
    let n = 0;
    row.forEach((cell) => {
      if (cell) n += 1;
      else if (n) { out.push(n); n = 0; }
    });
    if (n) out.push(n);
    return out.length ? out : [0];
  });
}

export function mountNonogram(root, { onDone }) {
  const rowClues = clues(PATTERN);
  const colClues = clues(PATTERN[0].map((_, i) => PATTERN.map((row) => row[i])));
  const cell = 28;
  const side = 78;
  root.innerHTML = `
    <div class="popup nono">
      <p class="dice-hint">1 2 1은 한 칸, 비우고, 두 칸, 비우고, 한 칸입니다. 0은 그 줄을 칠하지 않습니다.</p>
      <div id="nono-wrap"></div>
      <p class="dice-readout" id="nono-msg">칠하는 중</p>
    </div>`;
  const wrap = root.querySelector('#nono-wrap');
  wrap.style.cssText = `display:grid;grid-template-columns:${side}px repeat(10, ${cell}px);gap:3px;justify-content:center;align-items:end;`;
  wrap.appendChild(document.createElement('div'));
  colClues.forEach((nums) => {
    const d = document.createElement('div');
    d.style.cssText = `width:${cell}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;color:#f0e6d2;font-size:14px;font-weight:700;line-height:16px;min-height:34px;`;
    d.innerHTML = nums.map((n) => `<span>${n}</span>`).join('');
    wrap.appendChild(d);
  });
  const marks = PATTERN.map((row) => row.map(() => 0));
  const buttons = [];
  PATTERN.forEach((row, r) => {
    const clue = document.createElement('div');
    clue.style.cssText = `width:${side}px;color:#f0e6d2;font-size:14px;font-weight:700;text-align:right;line-height:${cell}px;white-space:nowrap;`;
    clue.innerHTML = rowClues[r].map((n) => `<span style="display:inline-block;min-width:14px;text-align:center;">${n}</span>`).join('');
    wrap.appendChild(clue);
    row.forEach(() => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell';
      b.style.cssText = `width:${cell}px;height:${cell}px;background:#f7f1e6;border:1px solid #6b4a22;padding:0;cursor:pointer;`;
      buttons.push(b);
      wrap.appendChild(b);
    });
  });
  function paint(done) {
    buttons.forEach((b, i) => {
      const r = Math.floor(i / 10);
      const c = i % 10;
      const on = marks[r][c] === 1;
      b.style.background = done && PATTERN[r][c] ? '#2b2b2b' : (on ? '#4a4a4a' : '#f7f1e6');
    });
  }
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => {
      const r = Math.floor(i / 10);
      const c = i % 10;
      marks[r][c] = marks[r][c] ? 0 : 1;
      const ok = PATTERN.every((pr, rr) => pr.every((bit, cc) => bit === marks[rr][cc]));
      paint(ok);
      root.querySelector('#nono-msg').textContent = ok ? '해골이 나왔다.' : '칠하는 중';
      if (ok && onDone) onDone();
    });
  });
}
