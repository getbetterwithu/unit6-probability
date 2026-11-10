import { SCENARIOS, STEPS } from '../data/scenario.js?v=84';
import { createDialogue } from './dialogue.js?v=8';
import { setTension, refute } from './director.js?v=12';
import { createStage } from './stage.js?v=3';
import { playBgm, playSfx, toggleMute, isMuted } from './sound.js?v=1';
import { mountDiceInspector } from '../widgets/dice-inspector.js?v=20261110_v2';
import { mountProblemBoard } from '../widgets/problem-board.js?v=20261110_v2';
import { mountPathLink } from '../widgets/path-link.js?v=20261110_v2';
import { mountPecasPick } from '../widgets/pecas-pick.js?v=20261110_v2';
import { mountGuguSpeed } from '../widgets/gugu-speed.js?v=20261110_v2';
import { mountNonogram } from '../widgets/nonogram.js?v=20261110_v2';
import { createBacklog } from '../widgets/backlog.js?v=1';
import { mountWorldMap } from '../widgets/world-map.js?v=3';
import { mountEndingJournal } from '../widgets/ending-journal.js?v=3';

const speakerEl = document.getElementById('speaker-box');
const textEl = document.getElementById('text-box');
const widgetRoot = document.getElementById('widget-root');
const bag = document.getElementById('evidence-bag');
const stageContainer = document.getElementById('game-container');
const dialogue = document.getElementById('dialogue-layer');
const soundBtn = document.getElementById('btn-sound');
const btnBacklog = document.getElementById('btn-backlog');
const btnWorldMap = document.getElementById('btn-world-map');
const btnPrev = document.getElementById('btn-nav-prev');
const btnNext = document.getElementById('btn-nav-next');
const hudChapter = document.getElementById('hud-chapter');

const stage = createStage(stageContainer);
const backlog = createBacklog(stageContainer);
const dialogueHistory = [];
let hasCuboid = false;
let isMapOpen = false;
let currentLocation = 'intro';
let currentStepIndex = 0;

// 이전 위치 및 인덱스 기억 (지도 닫기 시 정확한 위치 복원용)
let lastLocation = 'intro';
let lastStepIndex = 0;

// 원석 수집 및 월드 상태
let worldState = {
  ruby: false,
  emerald: false,
  sapphire: false,
};
try {
  const savedState = JSON.parse(localStorage.getItem('u6_world_state') || '{}');
  if (savedState && typeof savedState === 'object') {
    worldState = { ...worldState, ...savedState };
  }
} catch (e) {}

function saveWorldState() {
  try {
    localStorage.setItem('u6_world_state', JSON.stringify(worldState));
  } catch (e) {}
}

// 브라우저 전체화면 요청 헬퍼
function requestFullScreenMode() {
  try {
    const el = document.documentElement;
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  } catch (err) {
    /* 자동 전체화면 차단 시 무시 */
  }
}

// 미니게임/문제 다시 열기 플로팅 버튼
let reopenBtn = document.getElementById('btn-reopen-widget');
if (!reopenBtn) {
  reopenBtn = document.createElement('button');
  reopenBtn.id = 'btn-reopen-widget';
  reopenBtn.type = 'button';
  reopenBtn.style.cssText = `
    position: absolute; top: 58px; right: 20px; z-index: 9;
    background: linear-gradient(135deg, #f5b041, #d4af37); color: #1c1308;
    border: none; border-radius: 8px; padding: 8px 16px; font-weight: 800; font-size: 0.95rem;
    box-shadow: 0 4px 16px rgba(245,176,65,0.5); cursor: pointer; display: none;
    transition: transform 0.15s;
  `;
  reopenBtn.innerHTML = '🧩 도전 과제 다시 열기';
  stageContainer.appendChild(reopenBtn);
}

// 챕터 배지 업데이트
function updateChapterBadge(index, step) {
  if (!hudChapter) return;
  if (isMapOpen) {
    hudChapter.textContent = '🗺️ 케팔로니아 탐험 지도';
    return;
  }
  if (step?.chapter) {
    hudChapter.textContent = step.chapter;
  }
}

// 음소거 버튼 UI 초기화
function updateSoundBtn() {
  if (!soundBtn) return;
  if (isMuted()) {
    soundBtn.classList.add('muted');
  } else {
    soundBtn.classList.remove('muted');
  }
}
updateSoundBtn();

if (soundBtn) {
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const muted = toggleMute();
    updateSoundBtn();
    if (!muted) playSfx('click');
  });
}

function addCard(card) {
  hasCuboid = true;
  bag.innerHTML = `<button type="button" class="card" data-id="${card.id}">${card.label}</button>`;
  setTension(85);
  playSfx('evidence');
  refute(stageContainer, bag);
}

// 완료된 위젯/문제 스텝 캐시 (거점명+스텝인덱스 기반)
let clearedSteps = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('u6_cleared_steps') || '[]');
  clearedSteps = new Set(saved);
} catch (e) {}

// 현재 활성화된 위젯 과제의 패스/완료/재오픈 상태 추적
let currentActiveDoneFn = null;
let currentActiveReopenLabel = '';
let currentActiveMountFn = null;

// 토스트 메시지 알림 함수
function showToast(message, isGold = true) {
  const existing = document.getElementById('u6-toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'u6-toast-msg';
  toast.style.cssText = `
    position: absolute; top: 72px; left: 50%; transform: translateX(-50%);
    background: ${isGold ? 'linear-gradient(135deg, #2a1f14, #1c140c)' : 'rgba(20,15,10,0.95)'};
    border: 2px solid ${isGold ? '#ffd152' : '#e74c3c'};
    color: ${isGold ? '#ffd152' : '#ff7675'};
    padding: 10px 24px; border-radius: 30px; font-weight: 800; font-size: 0.95rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.85); z-index: 999;
    animation: fadeIn 0.25s ease; pointer-events: none; text-align: center;
  `;
  toast.innerHTML = message;
  stageContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}

function markStepCleared(key) {
  clearedSteps.add(key);
  try {
    localStorage.setItem('u6_cleared_steps', JSON.stringify([...clearedSteps]));
  } catch (e) {}
}

// 거점 완료 축하 알림 배너
function showLocationClearNotice(title, desc, onNext) {
  playSfx('clear');
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: absolute; inset: 0; z-index: 55;
    background: rgba(10, 8, 5, 0.88); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.4s ease;
  `;
  banner.innerHTML = `
    <div style="width:min(520px, 94%); background:#1c1308; border:3px solid #d4af37; border-radius:16px; padding:28px 24px; text-align:center; box-shadow:0 12px 48px rgba(0,0,0,0.9); color:#f5eedb;">
      <div style="font-size:46px; margin-bottom:8px;">💎</div>
      <h2 style="font-size:1.6rem; font-weight:900; color:#ffd152; margin:0 0 10px;">${title}</h2>
      <p style="font-size:1.02rem; line-height:1.6; color:#ffeaa7; margin:0 0 24px; word-break:keep-all;">
        ${desc}
      </p>
      <button type="button" id="btn-banner-ok" style="background:linear-gradient(135deg, #d4af37, #f39c12); color:#1c1308; border:none; border-radius:8px; padding:12px 28px; font-weight:800; font-size:1.1rem; cursor:pointer; box-shadow:0 4px 16px rgba(245,176,65,0.4);">
        🗺️ 케팔로니아 지도로 이동 ▶
      </button>
    </div>
  `;
  stageContainer.appendChild(banner);
  banner.querySelector('#btn-banner-ok').addEventListener('click', () => {
    playSfx('click');
    banner.remove();
    if (onNext) onNext();
  });
}

// 월드맵 열기
function openWorldMap() {
  isMapOpen = true;
  lastLocation = currentLocation;
  lastStepIndex = dlg.getCurrentIndex();

  if (dialogue) dialogue.style.display = 'none';
  if (btnPrev) btnPrev.style.display = 'none';
  if (btnNext) btnNext.style.display = 'none';
  widgetRoot.hidden = false;
  widgetRoot.innerHTML = '';
  reopenBtn.style.display = 'none';
  updateChapterBadge();
  stage.update({ bg: 'merchant_camp' });
  playBgm('merchant');

  mountWorldMap(widgetRoot, {
    worldState,
    onSelectLocation: (loc) => {
      startLocation(loc, 0);
    },
    onClose: () => {
      // 닫았을 때 직전 보던 대사 스텝 위치 그대로 복원!
      startLocation(lastLocation, lastStepIndex);
    },
  });
}

// 거점 시작 함수 (지정된 스텝 인덱스로 바로 시작 가능)
function startLocation(loc, startIndex = 0) {
  isMapOpen = false;
  currentLocation = loc;
  currentStepIndex = startIndex;
  try {
    localStorage.setItem('u6_current_location', loc);
    localStorage.setItem('u6_location_step', String(startIndex));
  } catch (e) {}

  widgetRoot.hidden = true;
  widgetRoot.innerHTML = '';
  reopenBtn.style.display = 'none';
  if (dialogue) dialogue.style.display = '';
  if (btnPrev) btnPrev.style.display = '';
  if (btnNext) btnNext.style.display = '';

  const steps = SCENARIOS[loc] || SCENARIOS.intro;
  dlg.start(steps, startIndex);
}

// 대화창 엔진 초기화
const dlg = createDialogue({
  speakerEl,
  textEl,
  hintEl: document.querySelector('.next-indicator'),
  onWaitWidget(step, done) {
    const currentIdx = dlg.getCurrentIndex();
    currentStepIndex = currentIdx;
    const stepKey = `${currentLocation}_${currentIdx}_${step.widget || ''}_${step.problemId || ''}`;
    stage.update(step);
    updateChapterBadge(currentIdx, step);
    if (step.bgm) playBgm(step.bgm);

    // 완료 콜백 (클리어 기록 누적)
    const handleDone = () => {
      currentActiveDoneFn = null;
      currentActiveMountFn = null;
      currentActiveReopenLabel = '';
      markStepCleared(stepKey);
      widgetRoot.hidden = true;
      widgetRoot.innerHTML = '';
      reopenBtn.style.display = 'none';
      done();
    };
    currentActiveDoneFn = handleDone;

    // 닫기(접기) 공통 핸들러
    const handleClose = (btnLabel = '🧩 도전 과제 다시 열기') => {
      currentActiveReopenLabel = btnLabel;
      currentActiveMountFn = mountCurrentWidget;
      widgetRoot.hidden = true;
      reopenBtn.style.display = 'block';
      reopenBtn.innerHTML = btnLabel;
      reopenBtn.onclick = () => {
        mountCurrentWidget();
      };

      // 대화창에 미션 대기 안내 메시지 즉시 렌더링
      dlg.showDirect(
        '미션 안내',
        `<strong style="color:#ffd152;">[도전 과제 대기 중]</strong> 우측 상단의 <strong style="color:#ffeaa7;">[${btnLabel}]</strong> 버튼을 눌러 과제를 완료해야 다음 이야기로 나아갈 수 있습니다.<br><span style="font-size:0.9rem; color:#bdc3c7;">(◀ 이전 버튼을 누르면 언제든 앞선 대사들을 다시 확인할 수 있습니다.)</span>`
      );
    };

    function mountCurrentWidget() {
      widgetRoot.hidden = false;
      widgetRoot.innerHTML = '';
      reopenBtn.style.display = 'none';
      currentActiveMountFn = mountCurrentWidget;

      if (step.widget === 'dice-inspector') {
        mountDiceInspector(widgetRoot, {
          onEvidence(card) {
            addCard(card);
            handleDone();
          },
        });
        return;
      }

      if (step.widget === 'path-link') {
        mountPathLink(widgetRoot, {
          onDone: handleDone,
          onClose: () => handleClose('🚂 광맥 한붓그리기 다시 열기'),
        });
        return;
      }

      if (step.widget === 'nonogram') {
        mountNonogram(widgetRoot, {
          onDone: handleDone,
          onClose: () => handleClose('🗺️ 네모로직 지도 다시 열기'),
        });
        return;
      }

      if (step.widget === 'pecas-pick') {
        mountPecasPick(widgetRoot, {
          onDone: handleDone,
          onClose: () => handleClose('✨ 피캐스 정령 잡기 다시 열기'),
        });
        return;
      }

      if (step.widget === 'gugu-speed') {
        mountGuguSpeed(widgetRoot, {
          onDone: handleDone,
          onClose: () => handleClose('⚡ 암산 속도 훈련 다시 열기'),
        });
        return;
      }

      // 퀴즈 / 문제 풀이 보드
      if (step.widget === 'quiz' || step.widget === 'problem-board') {
        mountProblemBoard(widgetRoot, step.problemId, {
          onSolved() {
            setTension(95);
            handleDone();
          },
          onClose: () => handleClose('📝 문제 풀이 다시 열기'),
        });
        return;
      }
    }

    // 이미 한 번 클리어한 스텝인 경우: 다시 풀지 않고 바로 통과 가능!
    if (clearedSteps.has(stepKey)) {
      widgetRoot.hidden = true;
      widgetRoot.innerHTML = '';
      reopenBtn.style.display = 'block';
      reopenBtn.innerHTML = '🧩 이미 완료된 과제 다시 열기';
      reopenBtn.onclick = () => {
        mountCurrentWidget();
      };
      done();
      return;
    }

    // 처음 도달한 스텝: 위젯 표시
    mountCurrentWidget();
  },
  onAdvance(step, i) {
    currentStepIndex = i;
    stage.update(step);
    updateChapterBadge(i, step);
    reopenBtn.style.display = 'none';

    // 대사 히스토리 누적
    if (step.text) {
      const last = dialogueHistory[dialogueHistory.length - 1];
      if (!last || last.stepIndex !== i || last.speaker !== step.speaker) {
        dialogueHistory.push({
          stepIndex: i,
          speaker: step.speaker || '',
          text: step.text,
        });
      }
    }

    // 자동 진행 상태 저장
    if (!demoParam) {
      try {
        localStorage.setItem('u6_location_step', String(i));
      } catch (e) {}
    }

    if (step.bgm) {
      playBgm(step.bgm);
    }
    if (step.refute) {
      playSfx('evidence');
      refute(stageContainer, bag);
    }
    if (step.speaker === '테론' && step.text?.includes('다시 겨루자')) setTension(60);
  },
  onPrev(step, i) {
    currentStepIndex = i;
    stage.update(step);
    updateChapterBadge(i, step);
    reopenBtn.style.display = 'none';
    if (step.bgm) {
      playBgm(step.bgm);
    }
  },
  onComplete() {
    // 거점 시나리오 종료 콜백
    if (currentLocation === 'intro') {
      openWorldMap();
      return;
    }

    if (currentLocation === 'camp') {
      worldState.ruby = true;
      saveWorldState();
      showLocationClearNotice(
        '🔴 루비 원석 획득!',
        '소폴로스의 시험과 정오각형 룬 제단(7/36)을 돌파하고 찬란한 루비 원석을 손에 넣었습니다!',
        () => openWorldMap()
      );
      return;
    }

    if (currentLocation === 'mine') {
      worldState.emerald = true;
      saveWorldState();
      showLocationClearNotice(
        '🟢 에메랄드 원석 획득!',
        '선로 한붓그리기와 광맥 석문의 일차방정식(5/36)을 해제하고 신비로운 에메랄드 원석을 손에 넣었습니다!',
        () => openWorldMap()
      );
      return;
    }

    if (currentLocation === 'cave') {
      worldState.sapphire = true;
      saveWorldState();
      showLocationClearNotice(
        '🔵 사파이어 원석 획득!',
        '피캐스의 정령 잡기와 두 주사위 곱 짝수 확률(3/4)을 풀어내고 영롱한 사파이어 원석을 손에 넣었습니다!',
        () => openWorldMap()
      );
      return;
    }

    if (currentLocation === 'vault') {
      // 최종 결전 및 에필로그 종료 -> 탐험 일지 수료증 표시!
      showEndingJournal();
    }
  },
});

function showEndingJournal() {
  if (dialogue) dialogue.style.display = 'none';
  if (btnPrev) btnPrev.style.display = 'none';
  if (btnNext) btnNext.style.display = 'none';
  widgetRoot.hidden = false;
  widgetRoot.innerHTML = '';
  hudChapter.textContent = '📜 피타고라스 학당 수학 모험록';

  mountEndingJournal(widgetRoot, {
    playerName: localStorage.getItem('u6_player_name') || '용감한 탐험가',
    onRestart() {
      localStorage.clear();
      window.location.reload();
    },
    onGoMinigames() {
      location.href = 'games.html';
    },
  });
}

// 지도 열기/닫기 토글 버튼 이벤트
if (btnWorldMap) {
  btnWorldMap.addEventListener('click', (e) => {
    e.stopPropagation();
    playSfx('click');
    if (isMapOpen) {
      startLocation(lastLocation, lastStepIndex);
    } else {
      openWorldMap();
    }
  });
}

// 대사 기록(백로그) 버튼 이벤트
if (btnBacklog) {
  btnBacklog.addEventListener('click', (e) => {
    e.stopPropagation();
    playSfx('click');
    backlog.open(dialogueHistory);
  });
}

// 내비게이션 버튼 이벤트
if (btnPrev) {
  btnPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    playSfx('click');
    dlg.prev();
  });
}

if (btnNext) {
  btnNext.addEventListener('click', (e) => {
    e.stopPropagation();
    playSfx('click');
    dlg.next();
  });
}

// 대화창 클릭 진행
dialogue.addEventListener('click', (e) => {
  if (backlog.isOpen() || isMapOpen) return;
  if (e.target.closest('button')) return;
  if (currentActiveDoneFn && widgetRoot.hidden) {
    playSfx('error');
    showToast(`⚠️ 우측 상단의 <strong style="color:#ffeaa7;">[${currentActiveReopenLabel || '과제 다시 열기'}]</strong> 버튼을 눌러 과제를 완료해야 합니다!`, false);
    if (reopenBtn) {
      reopenBtn.style.transform = 'scale(1.1)';
      setTimeout(() => { if (reopenBtn) reopenBtn.style.transform = 'none'; }, 200);
    }
    return;
  }
  playSfx('click');
  dlg.click();
});

// 화면 전체(배경) 탭/클릭 시에도 대사 진행 지원
stageContainer.addEventListener('click', (e) => {
  if (backlog.isOpen() || isMapOpen) return;
  if (!widgetRoot.hidden) return;
  if (e.target.closest('#dialogue-layer') || e.target.closest('#btn-sound') || e.target.closest('#btn-backlog') || e.target.closest('#btn-world-map') || e.target.closest('#evidence-bag') || e.target.closest('#top-hud') || e.target.closest('#btn-reopen-widget')) return;
  if (currentActiveDoneFn && widgetRoot.hidden) {
    playSfx('error');
    showToast(`⚠️ 우측 상단의 <strong style="color:#ffeaa7;">[${currentActiveReopenLabel || '과제 다시 열기'}]</strong> 버튼을 눌러 과제를 완료해야 합니다!`, false);
    return;
  }
  playSfx('click');
  dlg.click();
});

// ==========================================
// 관리자 치트 발동 공통 함수 (PC 백틱 5회 / 모바일 상단 타이틀 5회 탭)
// ==========================================
function triggerAdminCheat() {
  // [핵심 기능] 현재 풀고 있는 스테이지나 미니게임이 있다면 즉시 정답 처리(Pass)!
  if (currentActiveDoneFn) {
    const passFn = currentActiveDoneFn;
    currentActiveDoneFn = null;
    currentActiveMountFn = null;
    currentActiveReopenLabel = '';
    playSfx('correct');
    showToast('⚡ [치트 발동] 현재 진행 중인 과제를 즉시 정답 처리하고 통과합니다!', true);
    const adminModal = document.getElementById('admin-cheat-modal');
    if (adminModal) adminModal.remove();
    passFn();
    return;
  }

  // 진행 중인 과제가 없는 일반 대사 구간인 경우: 관리자 챕터 워프 모달 열기
  openAdminModal();
}

// 1. PC: 백틱( ` ) 5회 연속 연타 감지기
let backtickTimes = [];
window.addEventListener('keydown', (ev) => {
  if (ev.key === '`' || ev.code === 'Backquote') {
    const now = Date.now();
    backtickTimes.push(now);
    // 2.5초 이내의 입력만 유지
    backtickTimes = backtickTimes.filter((t) => now - t <= 2500);

    if (backtickTimes.length >= 5) {
      backtickTimes = [];
      ev.preventDefault();
      triggerAdminCheat();
      return;
    }
  }
});

// 2. 모바일/터치: 최상단 타이틀 또는 챕터 배지 5회 연속 탭 감지기 (관리자 치트)
let hudTapTimes = [];
function onAdminTap(e) {
  if (e.button && e.button !== 0) return;
  const now = Date.now();
  hudTapTimes.push(now);
  hudTapTimes = hudTapTimes.filter((t) => now - t <= 2500);

  const target = e.currentTarget;
  if (target) {
    target.style.transition = 'transform 0.1s';
    target.style.transform = 'scale(0.92)';
    setTimeout(() => { if (target) target.style.transform = 'none'; }, 100);
  }

  if (hudTapTimes.length >= 5) {
    hudTapTimes = [];
    e.preventDefault();
    e.stopPropagation();
    triggerAdminCheat();
  }
}

const hudTitleEl = document.getElementById('hud-game-title') || document.querySelector('.hud-game-title');
if (hudTitleEl) {
  hudTitleEl.addEventListener('pointerdown', onAdminTap);
}
const hudChapterEl = document.getElementById('hud-chapter');
if (hudChapterEl) {
  hudChapterEl.addEventListener('pointerdown', onAdminTap);
}

  // ESC 키로 백로그, 월드맵 또는 관리자 모달 닫기
  if (ev.key === 'Escape') {
    const adminModal = document.getElementById('admin-cheat-modal');
    if (adminModal) {
      adminModal.remove();
      return;
    }
    if (backlog.isOpen()) {
      ev.preventDefault();
      backlog.close();
      return;
    }
  }

  // M 키로 케팔로니아 탐험 지도 토글
  if (ev.key === 'm' || ev.key === 'M') {
    const tag = ev.target && ev.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      ev.preventDefault();
      if (isMapOpen) {
        startLocation(lastLocation, lastStepIndex);
      } else {
        openWorldMap();
      }
      return;
    }
  }

  // L 키로 대사 로그(Backlog) 토글
  if (ev.key === 'l' || ev.key === 'L') {
    const tag = ev.target && ev.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      ev.preventDefault();
      if (backlog.isOpen()) backlog.close();
      else backlog.open(dialogueHistory);
      return;
    }
  }

  // 백로그나 월드맵이 열려 있을 때는 다른 키 진행 차단
  if (backlog.isOpen() || isMapOpen) return;

  const tag = ev.target && ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

  if (ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space' || ev.key === 'ArrowRight') {
    ev.preventDefault();
    if (currentActiveDoneFn && widgetRoot.hidden) {
      playSfx('error');
      showToast(`⚠️ 우측 상단의 <strong style="color:#ffeaa7;">[${currentActiveReopenLabel || '과제 다시 열기'}]</strong> 버튼을 눌러 과제를 완료해야 합니다!`, false);
      return;
    }
    playSfx('click');
    dlg.next();
  } else if (ev.key === 'ArrowLeft') {
    ev.preventDefault();
    playSfx('click');
    dlg.prev();
  }
}, true);

// ==========================================
// 관리자 / 치트 패널 모달
// ==========================================
function openAdminModal() {
  playSfx('evidence');
  const existing = document.getElementById('admin-cheat-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'admin-cheat-modal';
  modal.style.cssText = `
    position: absolute; inset: 0; z-index: 99;
    background: rgba(12, 10, 8, 0.94); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.25s ease;
  `;

  modal.innerHTML = `
    <div style="width:min(560px, 94%); max-height:88vh; background:#1e1610; border:2.5px solid #ffd152; border-radius:14px; padding:18px 20px; color:#f5eedb; box-shadow:0 16px 64px rgba(0,0,0,0.95); overflow-y:auto; -webkit-overflow-scrolling:touch;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #d4af37; padding-bottom:10px; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:22px;">🛠️</span>
          <h2 style="font-size:1.25rem; font-weight:900; color:#ffd152; margin:0;">관리자 디버그 & 치트 패널</h2>
        </div>
        <button type="button" id="admin-close-btn" style="background:#3a2a1c; border:1px solid #d4af37; color:#ffd152; border-radius:6px; padding:4px 10px; font-weight:800; cursor:pointer;">
          ✕ 닫기
        </button>
      </div>

      <p style="font-size:0.88rem; color:#bdc3c7; margin:0 0 14px; line-height:1.45;">
        빠른 검증을 위한 챕터 워프 및 문제 프리패스 도구입니다.<br>
        <strong>[발동 키]</strong> PC: 백틱( \` ) 5회 연타 / 모바일: 상단 타이틀 5회 연속 탭
      </p>

      <!-- 1. 현재 과제 즉시 정답 처리 -->
      <div style="margin-bottom:16px; background:rgba(0,0,0,0.3); padding:12px; border-radius:8px; border:1px dashed #ffd152;">
        <div style="font-size:0.92rem; font-weight:800; color:#ffd152; margin-bottom:6px;">⚡ 현재 과제 원터치 패스</div>
        <button type="button" id="admin-pass-current" style="width:100%; background:linear-gradient(135deg, #e67e22, #d35400); color:#fff; border:none; padding:10px 14px; border-radius:6px; font-weight:800; font-size:0.95rem; cursor:pointer; box-shadow:0 4px 12px rgba(230,126,34,0.4);">
          ⚡ [치트] 현재 진행 중인 과제/미니게임 즉시 정답 처리 (Pass)
        </button>
      </div>

      <!-- 2. 거점 / 챕터 바로 가기 -->
      <div style="margin-bottom:20px;">
        <div style="font-size:0.95rem; font-weight:800; color:#ffeaa7; margin-bottom:8px;">📍 챕터 / 거점 즉시 이동</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px;">
          <button type="button" class="admin-warp-btn" data-loc="map" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;">🗺️ 탐험 지도</button>
          <button type="button" class="admin-warp-btn" data-loc="intro" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;">🏛️ 학당 인트로</button>
          <button type="button" class="admin-warp-btn" data-loc="camp" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;">🎪 1. 야영지 (루비)</button>
          <button type="button" class="admin-warp-btn" data-loc="mine" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;">⛏️ 2. 광맥 갱도 (에메랄드)</button>
          <button type="button" class="admin-warp-btn" data-loc="cave" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;">💎 3. 다이아 동굴 (사파이어)</button>
          <button type="button" class="admin-warp-btn" data-loc="vault" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;">⚔️ 4. 다이아 금고 결전</button>
        </div>
      </div>

      <!-- 3. 치트 및 결과 점프 -->
      <div style="margin-bottom:20px;">
        <div style="font-size:0.95rem; font-weight:800; color:#ffeaa7; margin-bottom:8px;">✨ 원석 치트 & 수료증 점프</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button type="button" id="admin-cheat-all-gems" style="background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; padding:10px 14px; border-radius:6px; font-weight:800; font-size:0.95rem; cursor:pointer;">
            ✨ 치트: 3대 원석 즉시 획득 & 금고 봉인 해제
          </button>
          <button type="button" id="admin-jump-ending" style="background:linear-gradient(135deg, #d4af37, #f39c12); color:#1c1308; border:none; padding:10px 14px; border-radius:6px; font-weight:800; font-size:0.95rem; cursor:pointer;">
            📜 엔딩: 피타고라스 학당 수학 모험록(수료증) 즉시 보기
          </button>
          <button type="button" id="admin-reset-all" style="background:#c0392b; color:#fff; border:none; padding:10px 14px; border-radius:6px; font-weight:800; font-size:0.95rem; cursor:pointer;">
            🔄 데이터 완전 초기화 (처음부터 재시작)
          </button>
        </div>
      </div>
    </div>
  `;

  stageContainer.appendChild(modal);

  modal.querySelector('#admin-close-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('#admin-pass-current').addEventListener('click', () => {
    if (currentActiveDoneFn) {
      const passFn = currentActiveDoneFn;
      currentActiveDoneFn = null;
      currentActiveMountFn = null;
      currentActiveReopenLabel = '';
      playSfx('correct');
      showToast('⚡ [치트 발동] 현재 진행 중인 과제를 즉시 통과했습니다!', true);
      modal.remove();
      passFn();
    } else {
      alert('현재 활성화된(풀고 있는) 과제나 미니게임이 없습니다.');
    }
  });

  modal.querySelectorAll('.admin-warp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const loc = btn.dataset.loc;
      modal.remove();
      if (loc === 'map') {
        openWorldMap();
      } else {
        startLocation(loc, 0);
      }
    });
  });

  modal.querySelector('#admin-cheat-all-gems').addEventListener('click', () => {
    worldState.ruby = true;
    worldState.emerald = true;
    worldState.sapphire = true;
    saveWorldState();
    playSfx('clear');
    alert('✨ 3대 원석(루비, 에메랄드, 사파이어)을 모두 획득했습니다! 지도로 이동합니다.');
    modal.remove();
    openWorldMap();
  });

  modal.querySelector('#admin-jump-ending').addEventListener('click', () => {
    modal.remove();
    showEndingJournal();
  });

  modal.querySelector('#admin-reset-all').addEventListener('click', () => {
    if (confirm('모든 진행 상황과 저장 데이터를 완전히 초기화하시겠습니까?')) {
      localStorage.clear();
      location.reload();
    }
  });
}

document.getElementById('game-container').tabIndex = 0;
document.getElementById('game-container').focus();
document.body.dataset.engine = 'v84';

// ==========================================
// 학생 이름 입력 모달
// ==========================================
function promptPlayerNameModal(onDone) {
  const existingName = localStorage.getItem('u6_player_name');
  if (existingName && existingName.trim().length > 0) {
    onDone(existingName);
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'player-name-modal';
  modal.style.cssText = `
    position: absolute; inset: 0; z-index: 68;
    background: rgba(10, 8, 5, 0.94); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="width:min(440px, 92%); background:#1e1610; border:2.5px solid #d4af37; border-radius:14px; padding:28px 24px; text-align:center; box-shadow:0 12px 48px rgba(0,0,0,0.85); color:#f5eedb;">
      <div style="font-size:42px; margin-bottom:8px;">⚔️</div>
      <h2 style="font-size:1.4rem; font-weight:800; color:#ffd152; margin:0 0 10px; letter-spacing:0.5px;">탐험 대원 등록</h2>
      <p style="font-size:0.95rem; line-height:1.5; color:#bdc3c7; margin:0 0 20px; word-break:keep-all;">
        피타고라스 학당의 밀명을 수행할 대원의 이름을 입력해 주세요.<br>
        (완결 시 공식 수료증에 학생의 이름이 새겨집니다.)
      </p>
      <input type="text" id="input-player-name" placeholder="대원 이름 (예: 홍길동)" maxlength="12" style="
        width: 80%; padding: 10px 14px; font-size: 1.1rem; font-weight: 700; text-align: center;
        background: #0d0a07; border: 1.5px solid #d4af37; border-radius: 8px; color: #ffd152;
        margin-bottom: 20px; outline: none;
      "/>
      <div>
        <button type="button" id="btn-save-name" style="
          background:linear-gradient(135deg, #d4af37, #f39c12); color:#1c1308;
          border:none; border-radius:8px; padding:10px 28px; font-weight:800; font-size:1.05rem; cursor:pointer;
          box-shadow:0 4px 14px rgba(245,176,65,0.4);
        ">
          모험 시작하기 ▶
        </button>
      </div>
    </div>
  `;

  stageContainer.appendChild(modal);

  const inputEl = modal.querySelector('#input-player-name');
  const btnSave = modal.querySelector('#btn-save-name');
  inputEl.focus();

  const handleSave = () => {
    let name = inputEl.value.trim();
    if (!name) name = '용감한 탐험가';
    localStorage.setItem('u6_player_name', name);
    playSfx('click');
    modal.remove();
    onDone(name);
  };

  btnSave.addEventListener('click', handleSave);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSave();
  });
}

// 이전 진행 이어하기 모달 표시 함수
function promptResumeModal(savedLoc, savedStep, onResume, onRestart) {
  const modal = document.createElement('div');
  modal.id = 'resume-modal';
  modal.style.cssText = `
    position: absolute; inset: 0; z-index: 60;
    background: rgba(10, 8, 5, 0.92); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.3s ease;
  `;

  const locNames = {
    intro: '피타고라스 학당 (인트로)',
    camp: '소폴로스의 야영지 (루비)',
    mine: '어두운 광맥 갱도 (에메랄드)',
    cave: '빛나는 다이아 동굴 (사파이어)',
    vault: '테론의 다이아몬드 금고 (최종 결전)',
  };
  const locName = locNames[savedLoc] || '케팔로니아 탐험 지도';
  const gemCount = (worldState.ruby ? 1 : 0) + (worldState.emerald ? 1 : 0) + (worldState.sapphire ? 1 : 0);
  const studentName = localStorage.getItem('u6_player_name') || '탐험가';

  modal.innerHTML = `
    <div style="width:min(480px, 92%); background:#1e1610; border:2.5px solid #d4af37; border-radius:14px; padding:28px 24px; text-align:center; box-shadow:0 12px 48px rgba(0,0,0,0.85); color:#f5eedb;">
      <div style="font-size:42px; margin-bottom:8px;">📜</div>
      <h2 style="font-size:1.4rem; font-weight:800; color:#ffd152; margin:0 0 12px; letter-spacing:0.5px;">이전 모험 기록 발견</h2>
      <p style="font-size:1.02rem; line-height:1.6; color:#bdc3c7; margin:0 0 20px; word-break:keep-all;">
        <strong style="color:#ffd152;">${studentName}</strong> 대원의 이전 탐험 기록<br>
        <strong style="color:#ffeaa7;">${locName}</strong> (원석: ${gemCount} / 3개)이 남아 있습니다.<br>
        이어서 모험을 계속하시겠습니까?
      </p>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button type="button" id="btn-resume-yes" style="flex:1; background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; border-radius:8px; padding:12px 18px; font-weight:800; font-size:1.05rem; cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.35);">
          ⚔️ 이어서 하기
        </button>
        <button type="button" id="btn-resume-no" style="background:#2a1f14; color:#bdc3c7; border:1px solid #5c4324; border-radius:8px; padding:12px 16px; font-size:0.95rem; cursor:pointer;">
          처음부터
        </button>
      </div>
    </div>
  `;

  stageContainer.appendChild(modal);

  modal.querySelector('#btn-resume-yes').addEventListener('click', () => {
    requestFullScreenMode();
    playSfx('click');
    modal.remove();
    onResume();
  });

  modal.querySelector('#btn-resume-no').addEventListener('click', () => {
    playSfx('click');
    localStorage.removeItem('u6_world_state');
    localStorage.removeItem('u6_current_location');
    localStorage.removeItem('u6_location_step');
    modal.remove();
    onRestart();
  });
}

// 시네마틱 인트로 오프닝 연출 (클릭 시 자동 전체화면 처리!)
function showCinematicIntro(onStart) {
  const intro = document.createElement('div');
  intro.id = 'cinematic-intro';
  intro.style.cssText = `
    position: absolute; inset: 0; z-index: 70;
    background: radial-gradient(circle at center, #1a1309 0%, #050402 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer; transition: opacity 0.8s ease;
  `;

  intro.innerHTML = `
    <div style="text-align:center; padding:0 24px;">
      <div style="font-size:1.05rem; font-weight:700; color:#bdc3c7; letter-spacing:4px; margin-bottom:14px;">
        피타고라스 학당 3부작 완결편
      </div>
      <h1 style="font-size:2.8rem; font-weight:900; color:#ffd152; margin:0 0 16px; letter-spacing:2px; text-shadow:0 0 35px rgba(245,176,65,0.65);">
        🎲 폴리곤과 운명의 주사위
      </h1>
      <div style="font-size:1.25rem; font-weight:600; color:#ffeaa7; margin-bottom:46px; letter-spacing:1px;">
        중학교 2학년 수학 · 경우의 수와 확률
      </div>
      <div style="display:inline-block; border:1.5px solid #d4af37; background:rgba(212,175,55,0.18); color:#ffeaa7; padding:12px 34px; border-radius:30px; font-size:1.15rem; font-weight:800; letter-spacing:1px; box-shadow:0 0 24px rgba(245,176,65,0.35);">
        ⚔️ 화면을 터치하거나 클릭하여 모험 시작
      </div>
    </div>
  `;

  stageContainer.appendChild(intro);

  const startAction = () => {
    intro.removeEventListener('click', startAction);
    requestFullScreenMode(); // 자동 전체화면 전환!
    playSfx('click');
    intro.style.opacity = '0';
    setTimeout(() => {
      intro.remove();
      promptPlayerNameModal(() => {
        onStart();
      });
    }, 600);
  };

  intro.addEventListener('click', startAction);
}

const urlParams = new URLSearchParams(location.search);
const demoParam = urlParams.get('demo');

if (demoParam) {
  // 데모 모드 (미니게임 4종 단독 실행)
  if (dialogue) dialogue.style.display = 'none';
  if (btnPrev) btnPrev.style.display = 'none';
  if (btnNext) btnNext.style.display = 'none';
  if (btnBacklog) btnBacklog.style.display = 'none';
  if (btnWorldMap) btnWorldMap.style.display = 'none';
  if (hudChapter) hudChapter.textContent = '미니게임 특별 체험 모드';
  widgetRoot.hidden = false;
  widgetRoot.innerHTML = '';
  reopenBtn.style.display = 'none';

  const exitDemo = (msg = '체험을 종료하시겠소?') => {
    if (confirm(`${msg}\n미니게임 목록 페이지로 돌아가시겠습니까?`)) {
      location.href = 'games.html';
    } else {
      reopenBtn.style.display = 'block';
    }
  };

  if (demoParam === 'nonogram') {
    stage.update({ bg: 'merchant_camp' });
    playBgm('merchant');
    mountNonogram(widgetRoot, {
      onDone: () => exitDemo('🎉 네모로직 지도를 성공적으로 복원했습니다!'),
      onClose: () => exitDemo('네모로직 게임을 종료하시겠소?'),
    });
  } else if (demoParam === 'path') {
    stage.update({ bg: 'mine_shaft' });
    playBgm('cave');
    mountPathLink(widgetRoot, {
      onDone: () => exitDemo('🎉 오륜 레일을 성공적으로 연결했습니다!'),
      onClose: () => exitDemo('오륜 한붓그리기를 종료하시겠소?'),
    });
  } else if (demoParam === 'pecas') {
    stage.update({ bg: 'diamond_cave' });
    playBgm('cave');
    mountPecasPick(widgetRoot, {
      onDone: () => exitDemo('🎉 피캐스의 신비한 정령 잡기를 모두 마쳤습니다!'),
      onClose: () => exitDemo('정령 잡기 게임을 종료하시겠소?'),
    });
  } else if (demoParam === 'gugu') {
    stage.update({ bg: 'classroom' });
    playBgm('main');
    mountGuguSpeed(widgetRoot, {
      onDone: () => exitDemo('🎉 암산 속도 훈련을 성공적으로 마쳤습니다!'),
      onClose: () => exitDemo('암산 속도 훈련을 종료하시겠소?'),
    });
  } else {
    location.href = 'games.html';
  }
} else {
  // 일반 시나리오 모드
  const locParam = urlParams.get('loc');
  const savedLoc = localStorage.getItem('u6_current_location');
  const savedStep = parseInt(localStorage.getItem('u6_location_step') || '0', 10);

  if (locParam && SCENARIOS[locParam]) {
    // URL에 직접 ?loc=camp 등으로 지정한 경우
    startLocation(locParam, 0);
  } else if (savedLoc && (savedLoc !== 'intro' || savedStep > 0)) {
    // 이전에 플레이하던 기록이 있는 경우
    promptResumeModal(
      savedLoc,
      savedStep,
      () => {
        if (savedLoc === 'map') {
          openWorldMap();
        } else {
          startLocation(savedLoc, savedStep);
        }
      },
      () => {
        showCinematicIntro(() => {
          startLocation('intro', 0);
        });
      }
    );
  } else {
    showCinematicIntro(() => {
      startLocation('intro', 0);
    });
  }
}
setTension(12);
