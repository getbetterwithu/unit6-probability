import { playSfx } from '../engine/sound.js';

const LIMIT = 15; // 15초 제한
const GOAL = 10;   // 10문제 통과

export function mountGuguSpeed(root, { onDone, onClose }) {
  const isTouchDevice = ('ontouchstart' in window) || (window.innerWidth <= 768) || (navigator.maxTouchPoints > 0);

  root.innerHTML = `
    <div class="popup gugu-popup" style="position:relative; width:min(680px, 96%); background:#1a140d; border:2.5px solid #d4af37; border-radius:14px; padding:18px 20px; color:#f5eedb; box-shadow:0 8px 32px rgba(0,0,0,0.85); box-sizing:border-box;">
      <style>
        .g-pad-btn {
          height: 42px; background: #2a1f14; border: 1.5px solid #d4af37; border-radius: 6px;
          color: #ffeaa7; font-size: 1.2rem; font-weight: 800; cursor: pointer;
          touch-action: manipulation; transition: transform 0.08s, background 0.08s;
          user-select: none;
        }
        .g-pad-btn:active {
          transform: scale(0.94); background: #ffd152; color: #1c1308;
        }
        @media (max-width: 768px) {
          .gugu-popup { padding: 14px 12px !important; max-height: 94dvh !important; }
          .g-pad-btn { height: 46px !important; font-size: 1.35rem !important; }
          #gugu-q { font-size: 36px !important; margin: 2px 0 8px !important; }
          #gugu-time { font-size: 34px !important; }
          #gugu-in { width: 140px !important; font-size: 22px !important; padding: 6px 10px !important; }
        }
      </style>

      <!-- 우측 상단 닫기 (잠시 접기) 버튼 -->
      <button type="button" id="gugu-btn-close" style="position:absolute; top:12px; right:14px; background:rgba(0,0,0,0.5); border:1px solid #d4af37; color:#ffeaa7; border-radius:6px; padding:4px 10px; font-size:0.85rem; cursor:pointer;" title="잠시 접어두기">
        ✕ 닫기
      </button>

      <div style="margin-bottom: 10px;">
        <span style="background:#d4af37; color:#1c1308; font-weight:800; font-size:0.85rem; padding:3px 10px; border-radius:4px;">⚡ 피타고라스 암산 속도 훈련</span>
        <p class="dice-hint" style="color:#bdc3c7; font-size:0.92rem; margin-top:4px;">곱셈 문제를 보고 정답을 입력하시오. (목표: ${GOAL}문제 통과)</p>
      </div>

      <div style="display:flex; gap:14px; align-items:center; background:#24180f; padding:12px 16px; border-radius:10px; border:1.5px solid #5c4324;">
        <div style="flex:1; text-align:center;">
          <p id="gugu-q" style="font-size:46px; font-weight:900; margin:2px 0 8px; color:#ffd152; font-family:'KaTeX_Main', serif; letter-spacing:2px;">2 × 2</p>
          <input id="gugu-in" autocomplete="off" placeholder="정답 입력" style="width:160px; font-size:24px; font-weight:800; text-align:center; padding:6px 12px; background:#f7f1e6; color:#1c1308; border:2.5px solid #d4af37; border-radius:8px; outline:none;" ${isTouchDevice ? 'readonly inputmode="none" placeholder="키패드 터치"' : 'inputmode="numeric"'}>
          <p id="gugu-score" style="margin:8px 0 0; font-size:0.95rem; font-weight:700; color:#bdc3c7;">맞힌 개수 0 / ${GOAL}</p>
        </div>
        <div style="width:90px; text-align:center; border-left:1.5px solid #4a341c; padding-left:10px;">
          <p style="margin:0; font-size:0.8rem; color:#bdc3c7; font-weight:700;">남은 시간</p>
          <p id="gugu-time" style="font-size:40px; font-weight:900; margin:4px 0; color:#e67e22; font-family:monospace;">${LIMIT}</p>
          <span style="font-size:0.75rem; color:#888;">초</span>
        </div>
      </div>

      <!-- 터치 전용 가상 숫자 키패드 (모바일 화면 가림 원천 차단) -->
      <div id="gugu-keypad" style="margin-top:12px; display:flex; flex-direction:column; gap:5px;">
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:5px;">
          <button type="button" class="g-pad-btn" data-key="1">1</button>
          <button type="button" class="g-pad-btn" data-key="2">2</button>
          <button type="button" class="g-pad-btn" data-key="3">3</button>
          <button type="button" class="g-pad-btn" data-key="4">4</button>
          <button type="button" class="g-pad-btn" data-key="5">5</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:5px;">
          <button type="button" class="g-pad-btn" data-key="6">6</button>
          <button type="button" class="g-pad-btn" data-key="7">7</button>
          <button type="button" class="g-pad-btn" data-key="8">8</button>
          <button type="button" class="g-pad-btn" data-key="9">9</button>
          <button type="button" class="g-pad-btn" data-key="0">0</button>
        </div>
        <div style="display:grid; grid-template-columns:1.2fr 2fr; gap:5px;">
          <button type="button" class="g-pad-btn g-pad-back" data-action="back" style="background:#4a1c17; border-color:#e74c3c; color:#ff7675;">⌫ 지움</button>
          <button type="button" class="g-pad-btn g-pad-enter" data-action="enter" style="background:linear-gradient(135deg, #d4af37, #f39c12); color:#1c1308; font-weight:900;">확인 ⏎</button>
        </div>
      </div>

      <!-- 실패 시 재도전 오버레이 -->
      <div id="gugu-fail" style="display:none; position:absolute; inset:12px; background:rgba(20,12,6,0.96); border:2px solid #e74c3c; border-radius:12px; flex-direction:column; align-items:center; justify-content:center; gap:14px; z-index:10;">
        <p style="font-size:22px; font-weight:800; margin:0; color:#ff7675;">시간 초과 또는 오답입니다!</p>
        <p style="font-size:15px; margin:0; color:#dfe6e9;">다시 집중해서 도전해 보겠소?</p>
        <div style="display:flex; gap:10px;">
          <button type="button" id="gugu-yes" style="background:linear-gradient(135deg, #e67e22, #d35400); color:#fff; border:none; border-radius:8px; padding:10px 20px; font-weight:800; font-size:1rem; cursor:pointer;">⚡ 다시 도전</button>
          <button type="button" id="gugu-no" style="background:#3a2a1c; color:#f0e6d2; border:1px solid #d4af37; border-radius:8px; padding:10px 16px; font-size:0.95rem; cursor:pointer;">잠시 닫기</button>
        </div>
      </div>

      <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; min-height:36px;">
        <p id="gugu-msg" style="margin:0; font-weight:700; color:#ffd152; font-size:0.95rem;">신속하고 정확하게 답을 입력하시오!</p>
        <button type="button" id="gugu-btn-complete" style="display:none; background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; border-radius:8px; padding:8px 18px; font-size:1rem; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4);">
          ✨ 훈련 완료 · 다음으로 ▶
        </button>
      </div>
    </div>`;

  // 닫기 버튼
  root.querySelector('#gugu-btn-close').addEventListener('click', () => {
    stop();
    if (onClose) onClose();
  });

  const qEl = root.querySelector('#gugu-q');
  const input = root.querySelector('#gugu-in');
  const timeEl = root.querySelector('#gugu-time');
  const scoreEl = root.querySelector('#gugu-score');
  const fail = root.querySelector('#gugu-fail');
  const msgEl = root.querySelector('#gugu-msg');
  const completeBtn = root.querySelector('#gugu-btn-complete');

  let a = 2, b = 2, score = 0, left = LIMIT, timer = 0, over = false;

  function problem() {
    a = 2 + Math.floor(Math.random() * 8);
    b = 2 + Math.floor(Math.random() * 8);
    qEl.textContent = `${a} × ${b}`;
    input.value = '';
    if (!isTouchDevice) {
      input.focus();
    }
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = 0;
  }

  function failGame() {
    if (over) return;
    over = true;
    stop();
    playSfx('wrong');
    input.disabled = true;
    fail.style.display = 'flex';
  }

  function handleAnswerSubmit() {
    if (over) return;
    const raw = input.value.trim();
    if (raw === '') return;
    if (Number(raw) !== a * b) {
      failGame();
      return;
    }
    playSfx('click');
    score += 1;
    scoreEl.textContent = `맞힌 개수 ${score} / ${GOAL}`;
    if (score >= GOAL) {
      stop();
      over = true;
      input.disabled = true;
      playSfx('correct');
      qEl.textContent = '통과!';
      qEl.style.color = '#2ecc71';
      msgEl.innerHTML = '🎉 <strong>훌륭하오! 제한 시간 안에 모든 계산을 마쳤소.</strong>';
      msgEl.style.color = '#2ecc71';
      completeBtn.style.display = 'block';
      completeBtn.focus();
      return;
    }
    problem();
  }

  function start() {
    stop();
    over = false;
    score = 0;
    left = LIMIT;
    scoreEl.textContent = `맞힌 개수 0 / ${GOAL}`;
    timeEl.textContent = String(left);
    timeEl.style.color = '#e67e22';
    input.disabled = false;
    fail.style.display = 'none';
    completeBtn.style.display = 'none';
    msgEl.textContent = '신속하고 정확하게 답을 입력하시오!';
    msgEl.style.color = '#ffd152';
    problem();
    timer = setInterval(() => {
      left -= 1;
      timeEl.textContent = String(left);
      if (left <= 5) {
        timeEl.style.color = '#e74c3c';
      }
      if (left <= 0) {
        failGame();
      }
    }, 1000);
  }

  // PC 물리 키보드 Enter 입력 (PC 원본 조작성 100% 보존)
  input.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    ev.stopPropagation();
    handleAnswerSubmit();
  });

  // 모바일 가상 터치 키패드 버튼 이벤트
  root.querySelectorAll('.g-pad-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (over) return;
      playSfx('click');
      const key = btn.dataset.key;
      const action = btn.dataset.action;
      if (key !== undefined) {
        if (input.value.length < 3) {
          input.value += key;
        }
      } else if (action === 'back') {
        input.value = input.value.slice(0, -1);
      } else if (action === 'enter') {
        handleAnswerSubmit();
      }
    });
  });

  root.querySelector('#gugu-yes').addEventListener('click', (ev) => {
    ev.stopPropagation();
    start();
  });

  root.querySelector('#gugu-no').addEventListener('click', (ev) => {
    ev.stopPropagation();
    fail.style.display = 'none';
    if (onClose) onClose();
  });

  completeBtn.addEventListener('click', () => {
    stop();
    if (onDone) onDone();
  });

  start();
}
