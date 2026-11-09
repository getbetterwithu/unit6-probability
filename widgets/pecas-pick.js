import { playSfx } from '../engine/sound.js';

export function mountPecasPick(root, { onDone, onClose }) {
  root.innerHTML = `
    <div class="popup pecas-popup" style="position:relative; width:min(900px, 98%); background:#1a140d; border:2.5px solid #d4af37; border-radius:14px; padding:18px 24px; color:#f5eedb;">
      <!-- 우측 상단 닫기 (잠시 접기) 버튼 -->
      <button type="button" id="pup-btn-close" style="position:absolute; top:12px; right:14px; background:rgba(0,0,0,0.5); border:1px solid #d4af37; color:#ffeaa7; border-radius:6px; padding:4px 10px; font-size:0.85rem; cursor:pointer;" title="잠시 접어두기">
        ✕ 닫기
      </button>

      <div style="margin-bottom: 12px;">
        <span style="background:#d4af37; color:#1c1308; font-weight:800; font-size:0.85rem; padding:3px 10px; border-radius:4px;">✨ 피캐스의 신비한 정령 잡기</span>
        <p class="dice-hint" id="pup-hint" style="color:#bdc3c7; font-size:0.95rem; margin-top:6px;">움직이는 정령들 중 색이 다른 한 마리를 찾아 클릭하시오.</p>
      </div>

      <div id="pup-yard" style="position:relative; height:340px; background:#f7f1e6; border-radius:10px; overflow:hidden; border:2px solid #5c4324;"></div>

      <div style="margin-top: 14px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="pup-msg" style="font-weight:700; color:#ffeaa7; font-size:1.05rem;">움직이는 주황 정령을 찾아보시오.</span>
          <button type="button" id="pup-btn" style="background:#3a2a1c; color:#ffeaa7; border:1px solid #d4af37; border-radius:6px; padding:4px 12px; font-weight:700; cursor:pointer;">
            다시 시도
          </button>
        </div>
        <button type="button" id="pup-complete-btn" style="display:none; background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; border-radius:6px; padding:10px 20px; font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4);">
          ✨ 정령 포획 완료 · 다음으로 ▶
        </button>
      </div>
    </div>`;

  // 닫기 버튼
  root.querySelector('#pup-btn-close').addEventListener('click', () => {
    if (onClose) onClose();
  });

  const yard = root.querySelector('#pup-yard');
  const msgEl = root.querySelector('#pup-msg');
  const retryBtn = root.querySelector('#pup-btn');
  const completeBtn = root.querySelector('#pup-complete-btn');

  const stages = [
    { count: 7, speed: 5.5, hint: '1단계: 일곱 마리의 빠른 정령 중 주황 피캐스를 낚아채시오!' },
    { count: 11, speed: 7.8, hint: '2단계: 열한 마리로 급증! 회색 무리 속 주황 피캐스를 낚아채시오.' },
    { count: 15, speed: 10.5, hint: '최종 단계: 열다섯 마리의 광란의 유영! 단 한 마리의 주황 피캐스를 낚아채시오!' },
  ];

  let currentStage = 0;
  let oddIndex = 0;
  let stageCleared = false;
  let animId = null;
  const movers = [];

  const PUP_W = 68;
  const PUP_H = 62;

  const ORANGE_SRC = 'assets/characters/pecas_mini_orange.png';
  const GRAY_SRC = 'assets/characters/pecas_mini_gray.png';

  function pupHtml(isOrange) {
    const src = isOrange ? ORANGE_SRC : GRAY_SRC;
    const filter = isOrange
      ? 'drop-shadow(0 4px 10px rgba(230,81,0,0.65))'
      : 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))';
    return `<img src="${src}" alt="피캐스" style="width:100%; height:100%; object-fit:contain; pointer-events:none; filter:${filter};" draggable="false" />`;
  }

  // 안전 영역 계산: 바닥에 쏠리거나 잘리는 것 원천 방지
  function getSafeBounds() {
    const w = yard.clientWidth || 800;
    const h = yard.clientHeight || 340;
    return {
      minX: 16,
      maxX: Math.max(30, w - PUP_W - 20),
      minY: 16,
      maxY: Math.max(30, h - PUP_H - 24), // 아래쪽 24px 이상 여유 공간 확보
    };
  }

  function randCoord() {
    const b = getSafeBounds();
    return {
      x: b.minX + Math.random() * (b.maxX - b.minX),
      y: b.minY + Math.random() * (b.maxY - b.minY),
    };
  }

  function startStage() {
    if (animId) cancelAnimationFrame(animId);
    yard.innerHTML = '';
    movers.length = 0;
    stageCleared = false;

    const n = stages[currentStage].count;
    oddIndex = Math.floor(Math.random() * n);
    root.querySelector('#pup-hint').textContent = stages[currentStage].hint;
    msgEl.textContent = `정령들이 흩어졌습니다! 주황 정령을 찾으시오. (${currentStage + 1} / 3단계)`;
    retryBtn.textContent = '다시 시도';

    // 전 영역에 고르게 분산 배치
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'pup-token';
      const pos = randCoord();
      b.style.cssText = `position:absolute; left:${pos.x}px; top:${pos.y}px; width:${PUP_W}px; height:${PUP_H}px; cursor:pointer; user-select:none; z-index:2;`;
      b.innerHTML = pupHtml(i === oddIndex);

      b.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        onCatch(i);
      });

      yard.appendChild(b);

      const target = randCoord();
      movers.push({
        el: b,
        x: pos.x,
        y: pos.y,
        tx: target.x,
        ty: target.y,
      });
    }

    startWander();
  }

  function startWander() {
    const speed = stages[currentStage].speed;
    const bounds = getSafeBounds();

    function step() {
      if (stageCleared) return;

      movers.forEach((m) => {
        const dx = m.tx - m.x;
        const dy = m.ty - m.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < speed) {
          const next = randCoord();
          m.tx = next.x;
          m.ty = next.y;
        } else {
          m.x += (dx / dist) * speed;
          m.y += (dy / dist) * speed;

          // 절대 경계선 Clamping (화면 밖이나 바닥으로 절대 이탈 불가)
          m.x = Math.max(bounds.minX, Math.min(bounds.maxX, m.x));
          m.y = Math.max(bounds.minY, Math.min(bounds.maxY, m.y));

          m.el.style.left = `${m.x}px`;
          m.el.style.top = `${m.y}px`;
        }
      });

      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
  }

  function onCatch(i) {
    if (stageCleared) return;

    if (i !== oddIndex) {
      playSfx('wrong');
      msgEl.textContent = '❌ 회색 피캐스요! 정령들이 놀라 일제히 도망칩니다!';
      msgEl.style.color = '#ff7675';
      // 모든 정령들이 즉시 새 좌표로 급격히 방향 전환
      movers.forEach((m) => {
        const next = randCoord();
        m.tx = next.x;
        m.ty = next.y;
      });
      return;
    }

    // 성공!
    stageCleared = true;
    if (animId) cancelAnimationFrame(animId);
    playSfx('correct');

    if (currentStage < 2) {
      msgEl.innerHTML = `🎉 <strong>${currentStage + 1}단계 성공!</strong> 더 빠른 정령들이 나타납니다.`;
      retryBtn.textContent = '다음 단계 도전 ▶';
      retryBtn.style.background = '#e65100';
      retryBtn.style.borderColor = '#ffd152';
    } else {
      // 3단계 최종 완료
      msgEl.innerHTML = '🎉 <strong>모든 정령을 완벽히 포획했습니다!</strong>';
      retryBtn.style.display = 'none';
      completeBtn.style.display = 'block';
      completeBtn.focus();
    }
  }

  retryBtn.addEventListener('click', () => {
    if (stageCleared && currentStage < 2) {
      currentStage += 1;
      startStage();
    } else {
      startStage();
    }
  });

  completeBtn.addEventListener('click', () => {
    if (onDone) onDone();
  });

  // 시작
  setTimeout(startStage, 50);
}
