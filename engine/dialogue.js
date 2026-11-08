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

export function createDialogue({ speakerEl, textEl, hintEl, onWaitWidget, onAdvance, onPrev }) {
  let queue = [];
  let i = 0;
  let typing = false;
  let animId = null;
  let currentTokens = [];
  let locked = false;

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

    i += 1;
    if (i >= queue.length) return;
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
    if (locked) return;
    if (typing) {
      finishTyping();
      return;
    }
    if (i <= 0) return;

    // 위젯 직후에서 이전으로 갈 때 안전 처리
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
    if (!hintEl) return;
    const nxt = queue[i + 1];
    if (nxt && nxt.type === 'widget') {
      hintEl.textContent = '클릭하여 도전 시작 ▼';
    } else {
      hintEl.textContent = '◀ 이전 / 다음 ▶ (엔터, 스페이스, 터치)';
    }
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
    queue = steps;
    i = startIndex - 1;
    locked = false;
    next();
  }

  return {
    start,
    next,
    prev,
    handleKey,
    click: next,
    unlock: () => { locked = false; },
    getCurrentIndex: () => i,
  };
}
