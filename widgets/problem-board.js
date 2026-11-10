import { renderMathString, texToHtml } from '../engine/math.js';
import { PROBLEMS } from '../data/problems.js';
import { playSfx } from '../engine/sound.js';

/**
 * 4단원 스타일 전면 문제 풀이 보드 (widgets/problem-board.js)
 * - 상단 전용 툴바 (펜, 지우개, 4색, Undo, 전체 지우기, 정답 확인)
 * - 좌측: 문제 카드, 상황 삽화(또는 인터랙티브 조작기), KaTeX 발문, 단답형 수식 디스플레이
 * - 우측: 광활한 양피지 모눈 풀이 캔버스 (스타일러스 펜 필기)
 * - 동치 분수 복수 정답 채점 엔진 (6/10 == 3/5, 5/10 == 1/2 완벽 정답 인정)
 * - KaTeX Live Math Display (2/5 입력 시 실시간 분수 렌더링)
 */
export function mountProblemBoard(root, problemId, { onSolved, onClose }) {
  const problem = PROBLEMS[problemId];
  if (!problem) {
    root.innerHTML = `<div class="board-error">문제를 찾을 수 없습니다.</div>`;
    return;
  }

  let wrongCount = 0;
  let isSolved = false;

  // 10번 문제 인터랙티브 밸브 상태
  const valveStates = [false, false, false]; // [1번, 2번, 3번] false: 닫힘, true: 열림

  root.innerHTML = `
    <div class="full-problem-board">
      <!-- 상단 전용 툴바 -->
      <div class="board-top-toolbar">
        <div class="toolbar-group">
          <span class="problem-tag-badge">문제 ${problem.num || ''}</span>
          <button type="button" class="tool-btn active" id="btn-tool-pen">
            <span>🖊️</span> <span class="tool-label">펜</span>
          </button>
          <button type="button" class="tool-btn" id="btn-tool-eraser">
            <span>🧹</span> <span class="tool-label">지우개</span>
          </button>
          
          <div class="color-swatch-group">
            <button type="button" class="color-btn active" data-color="#1c1308" style="background:#1c1308;" title="검정"></button>
            <button type="button" class="color-btn" data-color="#c0392b" style="background:#c0392b;" title="빨강"></button>
            <button type="button" class="color-btn" data-color="#2980b9" style="background:#2980b9;" title="파랑"></button>
            <button type="button" class="color-btn" data-color="#d4af37" style="background:#d4af37;" title="황금"></button>
          </div>

          <button type="button" class="btn-undo" id="btn-tool-undo" title="실행취소">
            ↩️ <span class="tool-label">취소</span>
          </button>
          <button type="button" class="btn-clear-all" id="btn-tool-clear" title="전체 지우기">
            🗑️ <span class="tool-label">지우기</span>
          </button>
        </div>

        <div class="toolbar-group">
          <!-- 모바일 전용 탭 전환 버튼 [✏️ 연습장] <-> [📝 문제] -->
          <button type="button" class="tool-btn mobile-tab-btn" id="btn-mobile-toggle-view" style="display:none;" title="연습장 / 문제 전환">
            ✏️ <span id="mobile-tab-text">연습장</span>
          </button>
          ${onClose ? `
          <button type="button" class="btn-board-close" id="btn-board-close" title="잠시 문제 접어두기" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; border-radius:6px; padding:6px 12px; font-weight:800; font-size:0.9rem; cursor:pointer; margin-right:8px;">
            ✕ 잠시 닫기
          </button>
          ` : ''}
          <button type="button" class="btn-board-submit" id="top-btn-submit">
            ✨ <span class="submit-label">정답 확인</span>
          </button>
        </div>
      </div>

      <!-- 본문 2열 레이아웃 -->
      <div class="board-main-container">
        <!-- 좌측 패널 (문제 및 입력) -->
        <div class="board-left-panel">
          <div class="board-problem-card">
            <div class="problem-header-row">
              <span class="board-chapter-name">${problem.chapter || ''} · ${problem.title || ''}</span>
            </div>
            
            <!-- 상황 영역: 10번 문제일 때는 인터랙티브 밸브, 그 외는 고화질 상황 삽화 -->
            <div class="board-illustration-frame" id="illustration-container" style="position:relative;">
              ${problem.type === 'interactive-valve' ? `
                <div class="interactive-valves-box" id="valves-box">
                  <div class="valve-unit" data-idx="0">
                    <div class="valve-dial dial-red" id="valve-dial-0">
                      <div class="valve-line"></div>
                    </div>
                    <span class="valve-label">1번 밸브</span>
                    <span class="valve-status" id="v-status-0">[닫힘]</span>
                  </div>
                  <div class="valve-unit" data-idx="1">
                    <div class="valve-dial dial-green" id="valve-dial-1">
                      <div class="valve-line"></div>
                    </div>
                    <span class="valve-label">2번 밸브</span>
                    <span class="valve-status" id="v-status-1">[닫힘]</span>
                  </div>
                  <div class="valve-unit" data-idx="2">
                    <div class="valve-dial dial-blue" id="valve-dial-2">
                      <div class="valve-line"></div>
                    </div>
                    <span class="valve-label">3번 밸브</span>
                    <span class="valve-status" id="v-status-2">[닫힘]</span>
                  </div>
                </div>
              ` : `
                <img src="${problem.image ? problem.image + '?v=20261109_9' : ''}" alt="${problem.title}" class="board-illustration-img" id="board-zoomable-img" style="cursor:zoom-in; transition:transform 0.15s;" title="클릭하여 크게 보기" onerror="this.style.display='none'"/>
                <div style="position:absolute; bottom:6px; right:8px; background:rgba(0,0,0,0.65); border:1px solid #d4af37; border-radius:4px; padding:2px 8px; font-size:0.75rem; color:#ffd152; pointer-events:none;">
                  🔍 클릭하여 확대
                </div>
              `}
            </div>
            
            <p class="board-prompt-text" id="board-prompt-text"></p>
          </div>

          <!-- 단답형 입력 및 KaTeX Live Display -->
          <div class="board-answer-section">
            <div class="answer-input-row">
              <label for="board-answer-input" class="answer-input-label">답안 입력:</label>
              <div class="math-input-wrapper">
                <input type="text" id="board-answer-input" class="board-text-input" placeholder="정답 (예: 7 또는 2/5)" autocomplete="off" />
                <div class="katex-live-display" id="katex-display" style="display: none;"></div>
              </div>
              ${problem.unit ? `<span class="board-answer-unit">${problem.unit}</span>` : ''}
              <button type="button" class="btn-board-submit" id="inline-btn-submit">확인</button>
            </div>

            <!-- 터치 가상 키패드 -->
            <div class="board-keypad">
              <div class="keypad-row">
                <button type="button" class="k-btn" data-key="1">1</button>
                <button type="button" class="k-btn" data-key="2">2</button>
                <button type="button" class="k-btn" data-key="3">3</button>
                <button type="button" class="k-btn" data-key="4">4</button>
                <button type="button" class="k-btn" data-key="5">5</button>
              </div>
              <div class="keypad-row">
                <button type="button" class="k-btn" data-key="6">6</button>
                <button type="button" class="k-btn" data-key="7">7</button>
                <button type="button" class="k-btn" data-key="8">8</button>
                <button type="button" class="k-btn" data-key="9">9</button>
                <button type="button" class="k-btn" data-key="0">0</button>
                <button type="button" class="k-btn k-slash" data-key="/" title="분수">/</button>
                <button type="button" class="k-btn k-back" data-action="back" title="지우기">⌫</button>
              </div>
            </div>

            <!-- 피드백 박스 -->
            <div class="board-feedback" id="board-feedback-box" style="display: none;">
              <p id="board-feedback-msg"></p>
              <button type="button" class="board-btn-hint" id="board-btn-hint" style="display: none;">
                💡 힌트 열어보기
              </button>
              <div class="board-hint-box" id="board-hint-box" style="display: none;"></div>
            </div>

            <!-- 정답 시 다음 진행 버튼 -->
            <div id="board-next-container" style="display: none;">
              <button type="button" class="btn-board-next" id="btn-board-next">
                이야기 계속 진행하기 ▶
              </button>
            </div>
          </div>
        </div>

        <!-- 우측 패널: 광활한 양피지 모눈 풀이 캔버스 -->
        <div class="board-right-panel" id="canvas-container">
          <button type="button" class="btn-canvas-back-to-problem" id="btn-canvas-back">
            📝 문제로 돌아가기
          </button>
          <canvas id="full-drawing-canvas"></canvas>
        </div>
      </div>
    </div>
  `;

  // 10번 문제 밸브 인터랙션 이벤트
  if (problem.type === 'interactive-valve') {
    const valveUnits = root.querySelectorAll('.valve-unit');
    valveUnits.forEach((u) => {
      u.addEventListener('click', () => {
        playSfx('click');
        const idx = Number(u.dataset.idx);
        valveStates[idx] = !valveStates[idx];
        const dial = root.querySelector(`#valve-dial-${idx}`);
        const status = root.querySelector(`#v-status-${idx}`);
        if (valveStates[idx]) {
          dial.classList.add('open');
          status.textContent = '[열림]';
          status.style.color = '#2ecc71';
        } else {
          dial.classList.remove('open');
          status.textContent = '[닫힘]';
          status.style.color = '#e74c3c';
        }
      });
    });
  }

  // 발문 KaTeX 렌더링
  const promptEl = root.querySelector('#board-prompt-text');
  promptEl.innerHTML = renderMathString(problem.prompt);

  const inputEl = root.querySelector('#board-answer-input');
  const katexDisplay = root.querySelector('#katex-display');
  const topSubmitBtn = root.querySelector('#top-btn-submit');
  const inlineSubmitBtn = root.querySelector('#inline-btn-submit');
  const feedbackBox = root.querySelector('#board-feedback-box');
  const feedbackMsg = root.querySelector('#board-feedback-msg');
  const hintBtn = root.querySelector('#board-btn-hint');
  const hintBox = root.querySelector('#board-hint-box');
  const nextContainer = root.querySelector('#board-next-container');
  const nextBtn = root.querySelector('#btn-board-next');

  // KaTeX Live Math Display (2/5 입력 시 실시간 분수 자동 렌더링)
  function updateMathDisplay() {
    const val = inputEl.value.trim();
    if (!val) {
      katexDisplay.style.display = 'none';
      return;
    }

    if (val.includes('/')) {
      const parts = val.split('/');
      const num = parts[0].trim();
      const den = parts[1].trim();
      if (num && den) {
        katexDisplay.style.display = 'flex';
        katexDisplay.innerHTML = texToHtml(`\\frac{${num}}{${den}}`);
        return;
      }
    }
    katexDisplay.style.display = 'none';
  }

  inputEl.addEventListener('input', updateMathDisplay);

  // 가상 키패드
  root.querySelectorAll('.k-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isSolved) return;
      const key = btn.dataset.key;
      const action = btn.dataset.action;
      if (key) {
        inputEl.value += key;
      } else if (action === 'back') {
        inputEl.value = inputEl.value.slice(0, -1);
      }
      updateMathDisplay();
      inputEl.focus();
    });
  });

  // 이미지 확대 라이트박스 (클릭하여 크게 보기)
  const zoomableImg = root.querySelector('#board-zoomable-img');
  if (zoomableImg) {
    zoomableImg.addEventListener('click', () => {
      playSfx('click');
      const lightbox = document.createElement('div');
      lightbox.id = 'board-img-lightbox';
      lightbox.style.cssText = `
        position: fixed; inset: 0; z-index: 999;
        background: rgba(8, 6, 4, 0.88); backdrop-filter: blur(10px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        cursor: zoom-out; animation: fadeIn 0.2s ease; padding: 20px;
      `;
      lightbox.innerHTML = `
        <div style="position:relative; width:min(1140px, 96vw); max-height:94vh; display:flex; flex-direction:column; align-items:center;">
          <img src="${problem.image ? problem.image + '?v=20261109_9' : ''}" alt="${problem.title}" style="max-width:95vw; max-height:86vh; width:auto; height:auto; object-fit:contain; border:2.5px solid #d4af37; border-radius:12px; box-shadow:0 20px 80px rgba(0,0,0,0.95); background:#181008;"/>
          <div style="margin-top:10px; color:#ffeaa7; font-size:0.95rem; font-weight:700; background:rgba(0,0,0,0.85); padding:6px 20px; border-radius:20px; border:1px solid #d4af37;">
            ✕ 화면 아무 곳이나 클릭하거나 ESC를 누르면 닫힙니다.
          </div>
        </div>
      `;
      document.body.appendChild(lightbox);

      const closeLightbox = () => {
        lightbox.remove();
        window.removeEventListener('keydown', handleEsc);
      };

      const handleEsc = (e) => {
        if (e.key === 'Escape') closeLightbox();
      };

      lightbox.addEventListener('click', closeLightbox);
      window.addEventListener('keydown', handleEsc);
    });
  }

  // 동치 분수 수치 파서 (6/10 == 3/5 == 0.6)
  function parseVal(str) {
    if (!str) return NaN;
    const clean = str.replace(/\s+/g, '').replace(/가지|개|번/g, '');
    if (clean.includes('/')) {
      const [n, d] = clean.split('/').map(Number);
      if (d === 0 || isNaN(n) || isNaN(d)) return NaN;
      return n / d;
    }
    return Number(clean);
  }

  // 동치 분수 채점기
  function isEquivalentAnswer(userStr, targetStr, altList = []) {
    const uVal = parseVal(userStr);
    const tVal = parseVal(targetStr);

    if (isNaN(uVal)) return false;

    // 1) 수치적 동치 비교 (오차 0.00001 이내)
    if (!isNaN(tVal) && Math.abs(uVal - tVal) < 1e-5) {
      return true;
    }

    // 2) 대체 정답 목록 비교
    for (const alt of altList) {
      const aVal = parseVal(alt);
      if (!isNaN(aVal) && Math.abs(uVal - aVal) < 1e-5) {
        return true;
      }
      if (userStr.replace(/\s+/g, '') === alt.replace(/\s+/g, '')) {
        return true;
      }
    }

    // 3) 문자열 정규화 비교
    const uNorm = userStr.replace(/\s+/g, '');
    const tNorm = targetStr.replace(/\s+/g, '');
    return uNorm === tNorm;
  }

  function checkAnswer() {
    if (isSolved) return;

    const userRaw = inputEl.value.trim();
    if (!userRaw) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'board-feedback wrong';
      feedbackMsg.textContent = '답안을 입력해주세요!';
      return;
    }

    const correct = isEquivalentAnswer(userRaw, problem.answer, problem.altAnswers);

    if (correct) {
      isSolved = true;
      playSfx('correct');
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'board-feedback correct';
      feedbackMsg.innerHTML = '🎉 <strong>정답입니다!</strong> 완벽하게 해결했습니다.';

      // 풀이 해설 공개 (완전한 정답 풀이 explanation 우선 표출!)
      hintBox.style.display = 'block';
      hintBox.innerHTML = `<strong>[명쾌한 풀이 및 정답 해설]</strong><br>${renderMathString(problem.explanation || problem.hint || '')}`;
      hintBtn.style.display = 'none';

      inputEl.disabled = true;
      topSubmitBtn.disabled = true;
      inlineSubmitBtn.disabled = true;
      nextContainer.style.display = 'block';
      nextBtn.focus();
    } else {
      wrongCount += 1;
      playSfx('wrong');
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'board-feedback wrong shake-anim';
      feedbackMsg.innerHTML = `❌ <strong>정답이 아닙니다.</strong> 우측 연습장에서 다시 한번 계산해 보세요! (시도 ${wrongCount}회)`;

      setTimeout(() => {
        feedbackBox.classList.remove('shake-anim');
      }, 500);

      if (wrongCount >= 2 && problem.hint) {
        hintBtn.style.display = 'inline-block';
      }
    }
  }

  topSubmitBtn.addEventListener('click', checkAnswer);
  inlineSubmitBtn.addEventListener('click', checkAnswer);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkAnswer();
    }
  });

  hintBtn.addEventListener('click', () => {
    if (hintBox.style.display === 'none') {
      hintBox.style.display = 'block';
      hintBox.innerHTML = `<strong>💡 [힌트]</strong> ${renderMathString(problem.hint || '')}`;
      hintBtn.textContent = '💡 힌트 접기';
    } else {
      hintBox.style.display = 'none';
      hintBtn.textContent = '💡 힌트 열어보기';
    }
  });

  nextBtn.addEventListener('click', () => {
    if (onSolved) onSolved(problem);
  });

  // ==========================================
  // 우측 광활한 모눈 풀이 캔버스 드로잉 엔진
  // ==========================================
  const container = root.querySelector('#canvas-container');
  const canvas = root.querySelector('#full-drawing-canvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
    redrawHistory();
  }

  let currentTool = 'pen';
  let currentColor = '#1c1308';
  let penWidth = 2.5;
  let eraserWidth = 24;
  let isDrawing = false;
  let strokes = [];
  let currentStroke = null;

  function redrawHistory() {
    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    strokes.forEach((s) => {
      if (!s.points || s.points.length === 0) return;
      ctx.save();
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = s.width;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const pos = getCanvasPos(e);
    currentStroke = {
      tool: currentTool,
      color: currentColor,
      width: currentTool === 'eraser' ? eraserWidth : penWidth,
      points: [pos],
    };
    strokes.push(currentStroke);

    ctx.save();
    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = eraserWidth;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = penWidth;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function moveDraw(e) {
    if (!isDrawing || !currentStroke) return;
    const pos = getCanvasPos(e);
    currentStroke.points.push(pos);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.restore();
  }

  canvas.addEventListener('mousedown', startDraw);
  window.addEventListener('mousemove', moveDraw);
  window.addEventListener('mouseup', endDraw);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
  window.addEventListener('touchmove', moveDraw, { passive: true });
  window.addEventListener('touchend', endDraw);

  // 툴바 버튼 이벤트
  const penBtn = root.querySelector('#btn-tool-pen');
  const eraserBtn = root.querySelector('#btn-tool-eraser');
  const undoBtn = root.querySelector('#btn-tool-undo');
  const clearBtn = root.querySelector('#btn-tool-clear');

  penBtn.addEventListener('click', () => {
    currentTool = 'pen';
    penBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  });

  eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.classList.add('active');
    penBtn.classList.remove('active');
  });

  root.querySelectorAll('.color-btn').forEach((b) => {
    b.addEventListener('click', () => {
      currentColor = b.dataset.color;
      currentTool = 'pen';
      penBtn.classList.add('active');
      eraserBtn.classList.remove('active');
      root.querySelectorAll('.color-btn').forEach((cb) => cb.classList.remove('active'));
      b.classList.add('active');
    });
  });

  undoBtn.addEventListener('click', () => {
    if (strokes.length > 0) {
      strokes.pop();
      redrawHistory();
    }
  });

  clearBtn.addEventListener('click', () => {
    strokes = [];
    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  });

  const btnClose = root.querySelector('#btn-board-close');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      playSfx('click');
      if (onClose) onClose();
    });
  }

  // 모바일 탭 토글 [✏️ 연습장] <-> [📝 문제]
  const btnMobileToggle = root.querySelector('#btn-mobile-toggle-view');
  const btnCanvasBack = root.querySelector('#btn-canvas-back');
  const boardEl = root.querySelector('.full-problem-board');
  const mobileTabText = root.querySelector('#mobile-tab-text');

  function setMobileView(showCanvas) {
    if (showCanvas) {
      boardEl.classList.add('show-canvas');
      if (mobileTabText) mobileTabText.textContent = '문제';
      if (btnMobileToggle) btnMobileToggle.classList.add('active');
      setTimeout(resizeCanvas, 60);
    } else {
      boardEl.classList.remove('show-canvas');
      if (mobileTabText) mobileTabText.textContent = '연습장';
      if (btnMobileToggle) btnMobileToggle.classList.remove('active');
    }
  }

  if (btnMobileToggle && boardEl) {
    btnMobileToggle.addEventListener('click', () => {
      playSfx('click');
      const isShowing = boardEl.classList.contains('show-canvas');
      setMobileView(!isShowing);
    });
  }

  if (btnCanvasBack) {
    btnCanvasBack.addEventListener('click', () => {
      playSfx('click');
      setMobileView(false);
    });
  }

  setTimeout(() => {
    resizeCanvas();
    inputEl.focus();
  }, 100);

  window.addEventListener('resize', resizeCanvas);
}
