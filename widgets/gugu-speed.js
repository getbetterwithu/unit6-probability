const LIMIT = 20;
const GOAL = 10;

export function mountGuguSpeed(root, { onDone }) {
  root.innerHTML = `
    <div class="popup path-pop" style="position:relative;">
      <p class="dice-hint">식을 보고 답을 입력한 뒤 엔터를 누르시오. 오답이거나 시간이 끝나면 실패입니다.</p>
      <div style="display:flex;gap:16px;align-items:center;">
        <div style="flex:1;text-align:center;">
          <p id="gugu-q" style="font-size:42px;font-weight:800;margin:8px 0;">2 × 2</p>
          <input id="gugu-in" inputmode="numeric" autocomplete="off" style="width:140px;font-size:28px;text-align:center;padding:6px;border:2px solid #6b4a22;border-radius:8px;">
          <p id="gugu-score" style="margin:8px 0 0;">맞힌 개수 0</p>
        </div>
        <div style="width:72px;text-align:center;">
          <p style="margin:0;font-size:13px;">남은 시간</p>
          <p id="gugu-time" style="font-size:36px;font-weight:800;margin:4px 0;color:#E65100;">20</p>
        </div>
      </div>
      <div id="gugu-fail" style="display:none;position:absolute;inset:12px;background:rgba(255,255,255,0.96);border:2px solid #E65100;border-radius:12px;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
        <p style="font-size:22px;font-weight:800;margin:0;">재도전을 하시겠습니까?</p>
        <div>
          <button type="button" id="gugu-yes" style="margin-right:8px;background:#E65100;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;">예</button>
          <button type="button" id="gugu-no" style="background:#3a2a1c;color:#f0e6d2;border:0;border-radius:8px;padding:8px 14px;">아니오</button>
        </div>
      </div>
    </div>`;
  const qEl = root.querySelector('#gugu-q');
  const input = root.querySelector('#gugu-in');
  const timeEl = root.querySelector('#gugu-time');
  const scoreEl = root.querySelector('#gugu-score');
  const fail = root.querySelector('#gugu-fail');
  let a = 2, b = 2, score = 0, left = LIMIT, timer = 0, over = false;
  function problem() {
    a = 2 + Math.floor(Math.random() * 8);
    b = 2 + Math.floor(Math.random() * 8);
    qEl.textContent = `${a} × ${b}`;
    input.value = '';
    input.focus();
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = 0;
  }
  function failGame() {
    if (over) return;
    over = true;
    stop();
    input.disabled = true;
    fail.style.display = 'flex';
  }
  function start() {
    stop();
    over = false;
    score = 0;
    left = LIMIT;
    scoreEl.textContent = '맞힌 개수 0/10';
    timeEl.textContent = String(left);
    input.disabled = false;
    fail.style.display = 'none';
    problem();
    timer = setInterval(() => {
      left -= 1;
      timeEl.textContent = String(left);
      if (left <= 0) failGame();
    }, 1000);
  }
  input.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    ev.stopPropagation();
    if (over) return;
    const raw = input.value.trim();
    if (raw === '') return;
    if (Number(raw) !== a * b) {
      failGame();
      return;
    }
    score += 1;
    scoreEl.textContent = `맞힌 개수 ${score}/10`;
    if (score >= GOAL) {
      stop();
      over = true;
      input.disabled = true;
      qEl.textContent = '10문제를 맞혔다.';
      return;
    }
    problem();
  });
  root.querySelector('#gugu-yes').addEventListener('click', (ev) => {
    ev.stopPropagation();
    start();
  });
  root.querySelector('#gugu-no').addEventListener('click', (ev) => {
    ev.stopPropagation();
    fail.style.display = 'none';
  });
  start();
  if (onDone) { /* 통과 조건은 시간 테스트 뒤에 정한다. */ }
}
