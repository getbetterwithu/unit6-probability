// ===== 무대(배경 및 캐릭터 스프라이트) 관리 모듈 =====
// 두 인물 무대: 스텝의 left/right 설정을 그대로 무대에 올린다.
// 화자는 앞으로(active), 상대는 뒤로(inactive), 나레이션·시스템·위젯 대사는 둘 다 은은하게(calm) 남긴다.

const CHAR_BASE = 'assets/characters';
const BG_BASE = 'assets/backgrounds';

// 캐릭터 이름 한국어 -> 영문 키
export const CHAR_KEYS = {
  '폴리곤': 'apprentice',
  '이리스': 'companion',
  '테론': 'architect',
  '소폴로스': 'merchant',
  '피타고라스': 'pythagoras',
  '탈레스': 'thales',
  '피캐스': 'pecas',     // 정본 마스코트 굴 생물
  '광부': 'miner',       // 정본 베테랑 광부
  '라이벌': 'rival',
};

// 배경 매핑
const BG_MAP = {
  classroom: `${BG_BASE}/classroom.png`,
  merchant_camp: `${BG_BASE}/merchant_camp.png`,
  mine_shaft: `${BG_BASE}/mine_shaft.png`,
  diamond_cave: `${BG_BASE}/diamond_cave.png`,
  diamond_vault: `${BG_BASE}/diamond_vault.png`,
  library: `${BG_BASE}/library.png`,
  warehouse: `${BG_BASE}/warehouse.png`,
  title: `${BG_BASE}/title_probability.png`,
  title_probability: `${BG_BASE}/title_probability.png`,
  safe: `${BG_BASE}/diamond_vault.png`,
};

const NON_SPEAKERS = new Set(['', '나레이션', '시스템']);

export function getCharSrc(name, emotion = 'neutral') {
  if (!name) return null;
  const eng = CHAR_KEYS[name] || name;
  return `${CHAR_BASE}/${eng}_${emotion}.png`;
}

// 장면에서 쓸 스프라이트를 미리 내려받아 표정 교체 시 잔상·깜빡임을 없앤다.
const preloaded = new Set();
export function preloadSteps(steps) {
  for (const step of steps || []) {
    for (const side of ['left', 'right']) {
      const c = step?.[side];
      if (!c?.name) continue;
      const src = getCharSrc(c.name, c.emotion || 'neutral');
      if (!src || preloaded.has(src)) continue;
      preloaded.add(src);
      const img = new Image();
      img.src = src;
    }
  }
}

export function createStage(containerEl) {
  const bgEl = containerEl.querySelector('#stage-bg');
  const slots = {
    left: makeSlot(containerEl.querySelector('#char-left')),
    right: makeSlot(containerEl.querySelector('#char-right')),
  };

  let currentBg = '';

  function makeSlot(el) {
    return { el, img: el?.querySelector('img') || null, name: '', key: '', token: 0 };
  }

  function setBg(bgKey) {
    if (!bgKey || currentBg === bgKey) return;
    const url = BG_MAP[bgKey] || `${BG_BASE}/${bgKey}.png`;
    currentBg = bgKey;
    if (bgEl) {
      bgEl.style.backgroundImage = `linear-gradient(to top, rgba(11,13,18,0.92) 0%, rgba(11,13,18,0.38) 35%, transparent 65%), url("${url}")`;
    }
  }

  function setMood(slot, mood) {
    slot.el.classList.remove('active', 'inactive', 'calm', 'empty');
    slot.el.classList.add(mood);
  }

  function clearSlot(slot) {
    if (!slot.el) return;
    slot.token += 1;
    slot.name = '';
    slot.key = '';
    setMood(slot, 'empty');
  }

  // 스프라이트를 모두 불러온 뒤에 한 번에 교체한다. 없는 표정은 neutral로 대체한다.
  function showSlot(slot, cfg, mood) {
    if (!slot.el || !slot.img) return;
    const emotion = cfg.emotion || 'neutral';
    const key = `${cfg.name}_${emotion}`;

    if (slot.key === key) {
      setMood(slot, mood);
      return;
    }

    const sameChar = slot.name === cfg.name;
    const token = ++slot.token;
    const candidates = [getCharSrc(cfg.name, emotion)];
    if (emotion !== 'neutral') candidates.push(getCharSrc(cfg.name, 'neutral'));

    // 다른 인물로 바뀌면 먼저 투명하게 만들어, 이전 인물이 새 인물 위에 겹쳐 보이지 않게 한다.
    if (!sameChar) setMood(slot, 'empty');

    const tryLoad = (idx) => {
      if (token !== slot.token) return;
      if (idx >= candidates.length) {
        console.warn('[stage] 스프라이트를 찾지 못했습니다:', cfg.name, emotion);
        clearSlot(slot);
        return;
      }
      const probe = new Image();
      probe.onload = () => {
        if (token !== slot.token) return;
        slot.img.src = candidates[idx];
        slot.img.alt = cfg.name;
        slot.name = cfg.name;
        slot.key = key;
        // 한 프레임 뒤 클래스를 바꿔야 페이드인이 동작한다.
        requestAnimationFrame(() => {
          if (token === slot.token) setMood(slot, mood);
        });
      };
      probe.onerror = () => tryLoad(idx + 1);
      probe.src = candidates[idx];
    };
    tryLoad(0);
  }

  function update(step) {
    if (!step) return;
    if (step.bg) setBg(step.bg);

    // 인물 설정이 전혀 없는 스텝(배경만 바꾸는 호출 등)은 무대의 인물을 건드리지 않는다.
    if (!step.left && !step.right) return;

    const speaker = (step.speaker || '').trim();
    const calmAll = NON_SPEAKERS.has(speaker);
    const speakerOnStage =
      step.left?.name === speaker || step.right?.name === speaker;

    for (const side of ['left', 'right']) {
      const cfg = step[side];
      const slot = slots[side];
      if (!cfg || !cfg.name) {
        clearSlot(slot);
        continue;
      }
      let mood = 'calm';
      if (!calmAll && speakerOnStage) {
        mood = cfg.name === speaker ? 'active' : 'inactive';
      }
      showSlot(slot, cfg, mood);
    }
  }

  return { update, setBg };
}
