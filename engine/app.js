import { STEPS } from '../data/scenario.js?v=82';
import { createDialogue } from './dialogue.js?v=7';
import { setTension, refute } from './director.js?v=12';
import { createStage } from './stage.js?v=3';
import { playBgm, playSfx, toggleMute, isMuted } from './sound.js?v=1';
import { mountDiceInspector } from '../widgets/dice-inspector.js?v=3';
import { mountProblemBoard } from '../widgets/problem-board.js?v=3';
import { mountPathLink } from '../widgets/path-link.js?v=20';
import { mountPecasPick } from '../widgets/pecas-pick.js?v=15';
import { mountGuguSpeed } from '../widgets/gugu-speed.js?v=3';
import { mountNonogram } from '../widgets/nonogram.js?v=20';

const speakerEl = document.getElementById('speaker-box');
const textEl = document.getElementById('text-box');
const widgetRoot = document.getElementById('widget-root');
const bag = document.getElementById('evidence-bag');
const stageContainer = document.getElementById('game-container');
const dialogue = document.getElementById('dialogue-layer');
const soundBtn = document.getElementById('btn-sound');
const btnPrev = document.getElementById('btn-nav-prev');
const btnNext = document.getElementById('btn-nav-next');
const hudChapter = document.getElementById('hud-chapter');

const stage = createStage(stageContainer);
let hasCuboid = false;

// 미니게임 다시 열기 플로팅 버튼 생성
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
  reopenBtn.addEventListener('click', () => {
    reopenBtn.style.display = 'none';
    widgetRoot.hidden = false;
  });
  stageContainer.appendChild(reopenBtn);
}

// 챕터명 자동 판별기
function getChapterTitle(stepIndex, step) {
  if (step?.chapter) return step.chapter;
  if (stepIndex <= 4) return '1장 · 피타고라스 학당의 밀명';
  if (stepIndex <= 9) return '2장 · 소폴로스의 관문';
  if (stepIndex <= 13) return '3장 · 어두운 광맥 갱도';
  if (stepIndex <= 21) return '4장 · 빛나는 다이아 방';
  if (stepIndex <= 27) return '5장 · 학당 서고의 결전 준비';
  if (stepIndex <= 43) return '6장 · 다이아 금고 결전';
  return '에필로그 · 새로운 지평';
}

function updateChapterBadge(index, step) {
  if (!hudChapter) return;
  hudChapter.textContent = getChapterTitle(index, step);
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

const dlg = createDialogue({
  speakerEl,
  textEl,
  hintEl: document.querySelector('.next-indicator'),
  onWaitWidget(step, done) {
    stage.update(step);
    updateChapterBadge(dlg.getCurrentIndex(), step);
    if (step.bgm) playBgm(step.bgm);
    widgetRoot.hidden = false;
    widgetRoot.innerHTML = '';
    reopenBtn.style.display = 'none';

    // 닫기(접기) 공통 핸들러
    const handleClose = () => {
      widgetRoot.hidden = true;
      reopenBtn.style.display = 'block';
    };

    if (step.widget === 'dice-inspector') {
      mountDiceInspector(widgetRoot, {
        onEvidence(card) {
          addCard(card);
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          reopenBtn.style.display = 'none';
          done();
        },
      });
      return;
    }

    if (step.widget === 'path-link') {
      mountPathLink(widgetRoot, {
        onDone() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          reopenBtn.style.display = 'none';
          done();
        },
        onClose: handleClose,
      });
      return;
    }

    if (step.widget === 'nonogram') {
      mountNonogram(widgetRoot, {
        onDone() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          reopenBtn.style.display = 'none';
          done();
        },
        onClose: handleClose,
      });
      return;
    }

    if (step.widget === 'pecas-pick') {
      mountPecasPick(widgetRoot, {
        onDone() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          reopenBtn.style.display = 'none';
          done();
        },
        onClose: handleClose,
      });
      return;
    }

    if (step.widget === 'gugu-speed') {
      mountGuguSpeed(widgetRoot, {
        onDone() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          reopenBtn.style.display = 'none';
          done();
        },
        onClose: handleClose,
      });
      return;
    }

    // 퀴즈 / 문제 풀이 보드
    if (step.widget === 'quiz' || step.widget === 'problem-board') {
      mountProblemBoard(widgetRoot, step.problemId, {
        onSolved() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          reopenBtn.style.display = 'none';
          setTension(95);
          done();
        },
      });
      return;
    }
  },
  onAdvance(step, i) {
    stage.update(step);
    updateChapterBadge(i, step);
    reopenBtn.style.display = 'none';
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
    stage.update(step);
    updateChapterBadge(i, step);
    reopenBtn.style.display = 'none';
    if (step.bgm) {
      playBgm(step.bgm);
    }
  },
});

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
  if (e.target.closest('button')) return;
  playSfx('click');
  dlg.click();
});

// 화면 전체(배경) 탭/클릭 시에도 대사 진행 지원 (위젯이 떠있지 않을 때)
stageContainer.addEventListener('click', (e) => {
  if (!widgetRoot.hidden) return;
  if (e.target.closest('#dialogue-layer') || e.target.closest('#btn-sound') || e.target.closest('#evidence-bag') || e.target.closest('#top-hud') || e.target.closest('#btn-reopen-widget')) return;
  playSfx('click');
  dlg.click();
});

// 키보드 이벤트
window.addEventListener('keydown', (ev) => {
  const tag = ev.target && ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

  if (ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space' || ev.key === 'ArrowRight') {
    ev.preventDefault();
    playSfx('click');
    dlg.next();
  } else if (ev.key === 'ArrowLeft') {
    ev.preventDefault();
    playSfx('click');
    dlg.prev();
  }
}, true);

document.getElementById('game-container').tabIndex = 0;
document.getElementById('game-container').focus();
document.body.dataset.engine = 'v82';

const stepParam = parseInt(new URLSearchParams(location.search).get('step') || '0', 10);
if (stepParam > 0 && stepParam < STEPS.length) {
  dlg.start(STEPS.slice(stepParam));
  updateChapterBadge(stepParam, STEPS[stepParam]);
} else {
  dlg.start(STEPS);
  updateChapterBadge(0, STEPS[0]);
}
setTension(12);
