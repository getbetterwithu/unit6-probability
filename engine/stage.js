// ===== 무대(배경 및 캐릭터 스프라이트) 관리 모듈 =====

const CHAR_BASE = 'assets/characters';
const BG_BASE = 'assets/backgrounds';

// 캐릭터 이름 한국어 -> 영문 키
const CHAR_KEYS = {
  '폴리곤': 'apprentice',
  '이리스': 'companion',
  '테론': 'architect',
  '소폴로스': 'merchant',
  '피타고라스': 'pythagoras',
  '탈레스': 'thales',
  '피캐스': 'rival',
  '광부': 'rival',
};

// 배경 매핑
const BG_MAP = {
  classroom: `${BG_BASE}/classroom.png`,
  merchant_camp: `${BG_BASE}/merchant_camp.png`,
  temple_site1: `${BG_BASE}/temple_site1.png`,
  basement: `${BG_BASE}/basement.png`,
  library: `${BG_BASE}/library.png`,
  warehouse: `${BG_BASE}/warehouse.png`,
  title: `${BG_BASE}/title.png`,
};

function getCharSrc(key, emotion = 'neutral') {
  if (!key) return null;
  const eng = CHAR_KEYS[key] || key;
  return `${CHAR_BASE}/${eng}_${emotion}.png`;
}

export function createStage(containerEl) {
  const bgEl = containerEl.querySelector('#stage-bg');
  const leftCharEl = containerEl.querySelector('#char-left');
  const rightCharEl = containerEl.querySelector('#char-right');
  const leftImg = leftCharEl?.querySelector('img');
  const rightImg = rightCharEl?.querySelector('img');

  let currentBg = '';

  function setBg(bgKey) {
    if (!bgKey || currentBg === bgKey) return;
    const url = BG_MAP[bgKey] || `${BG_BASE}/${bgKey}.png`;
    currentBg = bgKey;
    if (bgEl) {
      bgEl.style.backgroundImage = `linear-gradient(to top, rgba(11,13,18,0.92) 0%, rgba(11,13,18,0.4) 35%, transparent 65%), url("${url}")`;
    }
  }

  function setActor(charEl, imgEl, charConfig, isActive) {
    if (!charEl || !imgEl) return;
    if (!charConfig || !charConfig.name) {
      charEl.classList.add('hidden');
      return;
    }
    const src = getCharSrc(charConfig.name, charConfig.emotion || 'neutral');
    if (src) {
      imgEl.src = src;
      imgEl.alt = charConfig.name;
      charEl.classList.remove('hidden');
      if (isActive) {
        charEl.classList.add('active');
        charEl.classList.remove('inactive');
      } else {
        charEl.classList.remove('active');
        charEl.classList.add('inactive');
      }
    } else {
      charEl.classList.add('hidden');
    }
  }

  function update(step) {
    if (!step) return;
    if (step.bg) {
      setBg(step.bg);
    }

    // 좌/우 캐릭터 결정
    const left = step.left;
    const right = step.right;
    const activeSide = step.activeSide || (step.speaker === (right?.name) ? 'right' : 'left');

    setActor(leftCharEl, leftImg, left, activeSide === 'left');
    setActor(rightCharEl, rightImg, right, activeSide === 'right');
  }

  return { update, setBg };
}
