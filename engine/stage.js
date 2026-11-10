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
  '피캐스': 'pecas',     // 정본 마스코트 굴 생물
  '광부': 'miner',       // 정본 베테랑 광부
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
  let activeCharKey = ''; // 현재 표시 중인 캐릭터 이름+감정 키

  function setBg(bgKey) {
    if (!bgKey || currentBg === bgKey) return;
    const url = BG_MAP[bgKey] || `${BG_BASE}/${bgKey}.png`;
    currentBg = bgKey;
    if (bgEl) {
      bgEl.style.backgroundImage = `linear-gradient(to top, rgba(11,13,18,0.92) 0%, rgba(11,13,18,0.38) 35%, transparent 65%), url("${url}")`;
    }
  }

  function hideAllActors() {
    if (leftCharEl) {
      leftCharEl.classList.add('hidden');
      leftCharEl.classList.remove('active', 'inactive');
    }
    if (rightCharEl) {
      rightCharEl.classList.add('hidden');
      rightCharEl.classList.remove('active', 'inactive');
    }
    activeCharKey = '';
  }

  function update(step) {
    if (!step) return;
    if (step.bg) {
      setBg(step.bg);
    }

    const speaker = (step.speaker || '').trim();

    // 1. 나레이션이거나 화자가 없는 경우: 캐릭터 전원 깔끔하게 퇴장 (배경 및 대사 집중)
    if (!speaker || speaker === '나레이션' || speaker === '시스템') {
      hideAllActors();
      return;
    }

    // 2. 화자 정보 추출: step.left 또는 step.right 중 화자와 일치하는 설정 우선 탐색
    let speakerConfig = null;
    let preferredSide = 'left';

    if (step.left && step.left.name === speaker) {
      speakerConfig = step.left;
      preferredSide = 'left';
    } else if (step.right && step.right.name === speaker) {
      speakerConfig = step.right;
      preferredSide = 'right';
    } else if (CHAR_KEYS[speaker]) {
      // step에 명시되지 않았더라도 정본 화자 키가 있는 경우
      speakerConfig = { name: speaker, emotion: 'neutral' };
      preferredSide = 'left';
    }

    if (!speakerConfig) {
      hideAllActors();
      return;
    }

    const emotion = speakerConfig.emotion || 'neutral';
    const targetSrc = getCharSrc(speakerConfig.name, emotion);
    if (!targetSrc) {
      hideAllActors();
      return;
    }

    // 사용자 핵심 요구사항: "정확하게 대사를 치는 인물만 나와야 함 (비화자 잔상 및 잦은 인물 교체 혼란 제거)"
    const targetEl = (preferredSide === 'right') ? rightCharEl : leftCharEl;
    const targetImg = (preferredSide === 'right') ? rightImg : leftImg;
    const otherEl = (preferredSide === 'right') ? leftCharEl : rightCharEl;

    // 비화자 엘리먼트는 무조건 즉시 숨김
    if (otherEl) {
      otherEl.classList.add('hidden');
      otherEl.classList.remove('active', 'inactive');
    }

    if (targetEl && targetImg) {
      const nextKey = `${speakerConfig.name}_${emotion}`;
      const isCharSwapping = (activeCharKey && !activeCharKey.startsWith(speakerConfig.name + '_'));
      activeCharKey = nextKey;

      if (isCharSwapping) {
        // 인물 자체가 다른 캐릭터로 바뀔 때: 이전 인물의 형태가 남아 찌그러지는 잔상 모핑 방지
        targetEl.style.opacity = '0';
        targetEl.style.transition = 'none';
        targetImg.src = targetSrc;
        targetImg.alt = speakerConfig.name;

        // 한 프레임 대기 후 부드럽게 등장
        requestAnimationFrame(() => {
          targetEl.style.transition = 'opacity 0.22s ease, transform 0.28s ease';
          targetEl.classList.remove('hidden', 'inactive');
          targetEl.classList.add('active');
          targetEl.style.opacity = '1';
        });
      } else {
        // 동일 인물이거나 최초 등장 시
        targetImg.src = targetSrc;
        targetImg.alt = speakerConfig.name;
        targetEl.classList.remove('hidden', 'inactive');
        targetEl.classList.add('active');
        targetEl.style.opacity = '1';
      }
    }
  }

  return { update, setBg };
}
