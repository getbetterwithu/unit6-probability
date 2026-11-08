import { playSfx } from '../engine/sound.js';

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

export function mountNonogram(root, { onDone, onClose }) {
  const rowClues = clues(PATTERN);
  const colClues = clues(PATTERN[0].map((_, i) => PATTERN.map((row) => row[i])));
  const cell = 30;
  const side = 85;

  root.innerHTML = `
    <div class="popup nono-popup" style="position:relative; max-width: 640px; background: #1e1610; border: 2.5px solid #d4af37; border-radius: 14px; padding: 20px;">
      <!-- 우측 상단 닫기 (잠시 접기) 버튼 -->
      <button type="button" class="btn-popup-close" id="nono-btn-close" style="position:absolute; top:12px; right:14px; background:rgba(0,0,0,0.5); border:1px solid #d4af37; color:#ffeaa7; border-radius:6px; padding:4px 10px; font-size:0.85rem; cursor:pointer;" title="잠시 접어두기">
        ✕ 닫기
      </button>

      <div style="margin-bottom: 12px;">
        <span style="background:#d4af37; color:#1c1308; font-weight:800; font-size:0.85rem; padding:3px 10px; border-radius:4px;">🗺️ 갱도 지도 암호 복원</span>
        <p class="dice-hint" style="color:#bdc3c7; font-size:0.95rem; margin-top:6px;">가로와 세로의 숫자 힌트를 보고 칸을 칠하여 갱도 지도 표식을 복원하시오.</p>
      </div>

      <div id="nono-wrap"></div>

      <div style="margin-top: 14px; display:flex; justify-content:space-between; align-items:center;">
        <p class="dice-readout" id="nono-msg" style="font-weight:700; color:#ffeaa7; font-size:1.05rem;">지도를 복원하는 중...</p>
        <button type="button" id="nono-btn-complete" style="display:none; background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; border-radius:6px; padding:8px 18px; font-size:1.05rem; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4);">
          ✨ 확인 완료 · 다음으로 ▶
        </button>
      </div>
    </div>
  `;

  // 닫기 버튼 (건너뛰기 없음, 오직 접어두기)
  root.querySelector('#nono-btn-close').addEventListener('click', () => {
    if (onClose) onClose();
  });

  const wrap = root.querySelector('#nono-wrap');
  wrap.style.cssText = `display:grid;grid-template-columns:${side}px repeat(10, ${cell}px);gap:3px;justify-content:center;align-items:end;`;
  wrap.appendChild(document.createElement('div'));

  colClues.forEach((nums) => {
    const d = document.createElement('div');
    d.style.cssText = `width:${cell}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;color:#ffeaa7;font-size:13px;font-weight:700;line-height:16px;min-height:36px;`;
    d.innerHTML = nums.map((n) => `<span>${n}</span>`).join('');
    wrap.appendChild(d);
  });

  const marks = PATTERN.map((row) => row.map(() => 0));
  const buttons = [];

  PATTERN.forEach((row, r) => {
    const clue = document.createElement('div');
    clue.style.cssText = `width:${side}px;color:#ffeaa7;font-size:13px;font-weight:700;text-align:right;line-height:${cell}px;padding-right:8px;white-space:nowrap;`;
    clue.innerHTML = rowClues[r].map((n) => `<span style="display:inline-block;min-width:14px;text-align:center;">${n}</span>`).join('');
    wrap.appendChild(clue);

    row.forEach(() => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell';
      b.style.cssText = `width:${cell}px;height:${cell}px;background:#f5eedb;border:1px solid #6b4a22;border-radius:3px;padding:0;cursor:pointer;transition:background 0.15s;`;
      buttons.push(b);
      wrap.appendChild(b);
    });
  });

  let completed = false;
  const msgEl = root.querySelector('#nono-msg');
  const completeBtn = root.querySelector('#nono-btn-complete');

  function paint(done) {
    buttons.forEach((b, i) => {
      const r = Math.floor(i / 10);
      const c = i % 10;
      const on = marks[r][c] === 1;
      b.style.background = done && PATTERN[r][c] ? '#ffd152' : (on ? '#3a2512' : '#f5eedb');
    });
  }

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => {
      if (completed) return;
      playSfx('click');
      const r = Math.floor(i / 10);
      const c = i % 10;
      marks[r][c] = marks[r][c] ? 0 : 1;
      const ok = PATTERN.every((pr, rr) => pr.every((bit, cc) => bit === marks[rr][cc]));
      paint(ok);

      if (ok) {
        completed = true;
        playSfx('correct');
        msgEl.innerHTML = '🎉 <strong>고대 해골 지도 표식이 온전히 복원되었습니다!</strong>';
        msgEl.style.color = '#2ecc71';
        completeBtn.style.display = 'block';
        completeBtn.focus();
      }
    });
  });

  // 완료 후 다음 진행 버튼 클릭 시에만 진행!
  completeBtn.addEventListener('click', () => {
    if (onDone) onDone();
  });
}
