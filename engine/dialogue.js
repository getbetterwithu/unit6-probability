import { texToHtml } from './math.js';

/**
 * 텍스트를 일반 텍스트 토큰과 수식 토큰($...$, $$...$$)으로 분해
 */
function tokenize(text) {
  const tokens = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }
    const raw = match[0];
    const isDisplay = raw.startsWith('$$');
    const tex = isDisplay ? raw.slice(2, -2) : raw.slice(1, -1);
    tokens.push({
      type: 'math',
      raw,
      html: texToHtml(tex, isDisplay),
    });
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  return tokens;
}

export function formatDialogueHtml(text) {
  const tokens = tokenize(text || '');
  return tokens.map(t => t.type === 'math' ? `<span class="dialogue-math">${t.html}</span>` : t.value).join('');
}

export function createDialogue({ speakerEl, textEl, hintEl, onWaitWidget, onAdvance, onPrev, onComplete }) {
  let queue = [];
  let i = 0;
  let typing = false;
  let animId = null;
  let currentTokens = [];
  let locked = false;
  let finished = false;

  function renderFull() {
    textEl.innerHTML = '';
    for (const t of currentTokens) {
      if (t.type === 'math') {
        const span = document.createElement('span');
        span.className = 'dialogue-math';
        span.innerHTML = t.html;
        textEl.appendChild(span);
      } else {
        const span = document.createElement('span');
        span.textContent = t.value;
        textEl.appendChild(span);
      }
    }
  }

  function show(step) {
    if (animId) cancelAnimationFrame(animId);
    speakerEl.textContent = step.speaker || '';
    currentTokens = tokenize(step.text || '');
    textEl.innerHTML = '';
    typing = true;

    let tokenIdx = 0;
    let charIdx = 0;
    let currentSpan = null;

    function stepType() {
      if (tokenIdx >= currentTokens.length) {
        typing = false;
        animId = null;
        return;
      }

      const tok = currentTokens[tokenIdx];
      if (tok.type === 'math') {
        // 수식 토큰은 절대 글자 단위로 쪼개지 않고, 렌더링된 완제품 KaTeX HTML 엘리먼트를 한 번에 삽입!
        const mathSpan = document.createElement('span');
        mathSpan.className = 'dialogue-math';
        mathSpan.innerHTML = tok.html;
        textEl.appendChild(mathSpan);
        tokenIdx += 1;
        charIdx = 0;
        currentSpan = null;
        // 약간의 딜레이 후 다음 토큰 진행
        animId = requestAnimationFrame(stepType);
        return;
      }

      // 일반 텍스트 토큰인 경우
      if (!currentSpan) {
        currentSpan = document.createElement('span');
        textEl.appendChild(currentSpan);
      }

      // 1프레임당 2자씩 경쾌하게 타이핑
      charIdx += 2;
      currentSpan.textContent = tok.value.slice(0, charIdx);

      if (charIdx >= tok.value.length) {
        tokenIdx += 1;
        charIdx = 0;
        currentSpan = null;
      }

      animId = requestAnimationFrame(stepType);
    }

    animId = requestAnimationFrame(stepType);
  }

  function finishTyping() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    typing = false;
    renderFull();
  }

  function next() {
    if (locked) return;
    if (typing) {
      finishTyping();
      return; // 타이핑 중 클릭/엔터 시 완성만 하고 멈춤 (급발진 방지)
    }

    // 마지막 대사 뒤에서 연타해도 완료 처리는 한 번만 실행한다
    if (finished) return;
    i += 1;
    if (i >= queue.length) {
      finished = true;
      if (onComplete) onComplete();
      return;
    }
    const step = queue[i];
    if (onAdvance) onAdvance(step, i);

    if (step.type === 'widget') {
      locked = true;
      if (onWaitWidget) {
        onWaitWidget(step, () => {
          locked = false;
          next();
        });
      }
      return;
    }

    show(step);
    updateHint();
  }

  function prev() {
    locked = false; // 위젯 잠금을 해제하고 이전 대사로 자유롭게 복귀!
    if (typing) {
      finishTyping();
      return;
    }
    if (i <= 0) return;

    // 위젯 직후에서 이전으로 갈 때 안전 처리
    finished = false;
    i -= 1;
    while (i > 0 && queue[i].type === 'widget') {
      i -= 1;
    }
    const step = queue[i];
    if (onPrev) onPrev(step, i);
    if (step.type !== 'widget') {
      show(step);
      updateHint();
    }
  }

  function updateHint() {
    // 하단 안내 바 제거됨
  }

  function handleKey(e) {
    if (locked) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  }

  function start(steps, startIndex = 0) {
    // 직전 대사의 타자 효과가 남아 있으면 next()가 「완성만 하고 멈춤」으로 빠져
    // 첫 스텝을 띄우지 못하고 i가 -1로 남는다. 시작 전에 타자 상태를 비운다.
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    typing = false;
    queue = steps;
    // 저장된 위치가 시나리오 길이를 넘으면(시나리오가 바뀐 경우 등) 마지막 대사로 맞춘다.
    // 그대로 두면 대사를 하나도 안 보여 주고 거점이 곧바로 완료 처리된다.
    const last = Math.max(0, steps.length - 1);
    const safeStart = Number.isFinite(startIndex) ? Math.min(Math.max(0, startIndex), last) : 0;
    i = safeStart - 1;
    locked = false;
    finished = false;
    next();
  }

  function showDirect(speaker, text) {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    typing = false;
    speakerEl.textContent = speaker || '';
    textEl.innerHTML = text || '';
  }

  return {
    start,
    next,
    prev,
    handleKey,
    click: next,
    unlock: () => { locked = false; },
    getCurrentIndex: () => i,
    showDirect,
  };
}
