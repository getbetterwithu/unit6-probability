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
import { createBacklog } from '../widgets/backlog.js?v=1';

const speakerEl = document.getElementById('speaker-box');
const textEl = document.getElementById('text-box');
const widgetRoot = document.getElementById('widget-root');
const bag = document.getElementById('evidence-bag');
const stageContainer = document.getElementById('game-container');
const dialogue = document.getElementById('dialogue-layer');
const soundBtn = document.getElementById('btn-sound');
const btnBacklog = document.getElementById('btn-backlog');
const btnPrev = document.getElementById('btn-nav-prev');
const btnNext = document.getElementById('btn-nav-next');
const hudChapter = document.getElementById('hud-chapter');

const stage = createStage(stageContainer);
const backlog = createBacklog(stageContainer);
const dialogueHistory = [];
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

// 완료된 위젯/문제 스텝 캐시 (뒤로 갔다 다시 와도 자동 통과)
let clearedSteps = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('u6_cleared_steps') || '[]');
  clearedSteps = new Set(saved);
} catch (e) {}

function markStepCleared(idx) {
  clearedSteps.add(idx);
  try {
    localStorage.setItem('u6_cleared_steps', JSON.stringify([...clearedSteps]));
  } catch (e) {}
}

const dlg = createDialogue({
  speakerEl,
  textEl,
  hintEl: document.querySelector('.next-indicator'),
  onWaitWidget(step, done) {
    const currentIdx = dlg.getCurrentIndex();
    stage.update(step);
    updateChapterBadge(currentIdx, step);
    if (step.bgm) playBgm(step.bgm);

    // 완료 콜백 (클리어 기록 누적)
    const handleDone = () => {
      markStepCleared(currentIdx);
      widgetRoot.hidden = true;
      widgetRoot.innerHTML = '';
      reopenBtn.style.display = 'none';
      done();
    };

    // 닫기(접기) 공통 핸들러
    const handleClose = () => {
      widgetRoot.hidden = true;
      reopenBtn.style.display = 'block';
      reopenBtn.innerHTML = '🧩 도전 과제 다시 열기';
    };

    function mountCurrentWidget() {
      widgetRoot.hidden = false;
      widgetRoot.innerHTML = '';
      reopenBtn.style.display = 'none';

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
          onClose: handleClose,
        });
        return;
      }

      if (step.widget === 'nonogram') {
        mountNonogram(widgetRoot, {
          onDone: handleDone,
          onClose: handleClose,
        });
        return;
      }

      if (step.widget === 'pecas-pick') {
        mountPecasPick(widgetRoot, {
          onDone: handleDone,
          onClose: handleClose,
        });
        return;
      }

      if (step.widget === 'gugu-speed') {
        mountGuguSpeed(widgetRoot, {
          onDone: handleDone,
          onClose: handleClose,
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
        });
        return;
      }
    }

    // 이미 한 번 클리어한 스텝인 경우: 다시 풀지 않고 바로 통과 가능!
    if (clearedSteps.has(currentIdx)) {
      widgetRoot.hidden = true;
      widgetRoot.innerHTML = '';
      reopenBtn.style.display = 'block';
      reopenBtn.innerHTML = '🧩 이미 완료된 과제 다시 열기';
      reopenBtn.onclick = () => {
        mountCurrentWidget();
      };
      // 잠금 해제하여 '다음 ▶'이나 대화창 클릭으로 바로 진행 허용
      done();
      return;
    }

    // 처음 도달한 스텝: 위젯 표시
    mountCurrentWidget();
  },
  onAdvance(step, i) {
    stage.update(step);
    updateChapterBadge(i, step);
    reopenBtn.style.display = 'none';

    // 대사 히스토리 누적 (텍스트 대사만)
    if (step.text) {
      const last = dialogueHistory[dialogueHistory.length - 1];
      if (!last || last.stepIndex !== i) {
        dialogueHistory.push({
          stepIndex: i,
          speaker: step.speaker || '',
          text: step.text,
        });
      }
    }

    // 자동 진행 상태 저장 (데모 모드가 아닐 때)
    if (!demoParam) {
      try {
        localStorage.setItem('u6_saved_step', String(i));
      } catch (e) {
        /* storage 제한 예외 무시 */
      }
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
    stage.update(step);
    updateChapterBadge(i, step);
    reopenBtn.style.display = 'none';
    if (step.bgm) {
      playBgm(step.bgm);
    }
  },
});

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
  if (backlog.isOpen()) return;
  if (e.target.closest('button')) return;
  playSfx('click');
  dlg.click();
});

// 화면 전체(배경) 탭/클릭 시에도 대사 진행 지원 (위젯/백로그가 떠있지 않을 때)
stageContainer.addEventListener('click', (e) => {
  if (backlog.isOpen()) return;
  if (!widgetRoot.hidden) return;
  if (e.target.closest('#dialogue-layer') || e.target.closest('#btn-sound') || e.target.closest('#btn-backlog') || e.target.closest('#evidence-bag') || e.target.closest('#top-hud') || e.target.closest('#btn-reopen-widget')) return;
  playSfx('click');
  dlg.click();
});

// 키보드 이벤트
window.addEventListener('keydown', (ev) => {
  // ESC 키로 백로그 닫기
  if (ev.key === 'Escape') {
    if (backlog.isOpen()) {
      ev.preventDefault();
      backlog.close();
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

  // 백로그가 열려 있을 때는 다른 키 진행 차단
  if (backlog.isOpen()) return;

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

// 이전 진행 이어하기 모달 표시 함수
function promptResumeModal(savedStep, onResume, onRestart) {
  const modal = document.createElement('div');
  modal.id = 'resume-modal';
  modal.style.cssText = `
    position: absolute; inset: 0; z-index: 60;
    background: rgba(10, 8, 5, 0.92); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.3s ease;
  `;

  const chapterTitle = getChapterTitle(savedStep, STEPS[savedStep]);

  modal.innerHTML = `
    <div style="width:min(480px, 92%); background:#1e1610; border:2.5px solid #d4af37; border-radius:14px; padding:28px 24px; text-align:center; box-shadow:0 12px 48px rgba(0,0,0,0.85); color:#f5eedb;">
      <div style="font-size:42px; margin-bottom:8px;">📜</div>
      <h2 style="font-size:1.4rem; font-weight:800; color:#ffd152; margin:0 0 12px; letter-spacing:0.5px;">이전 모험 기록 발견</h2>
      <p style="font-size:1.02rem; line-height:1.6; color:#bdc3c7; margin:0 0 24px; word-break:keep-all;">
        이전에 진행하던 <strong style="color:#ffeaa7;">${chapterTitle}</strong><br>
        (단계 ${savedStep + 1} / ${STEPS.length}) 기록이 남아 있습니다.<br>
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
    playSfx('click');
    modal.remove();
    onResume();
  });

  modal.querySelector('#btn-resume-no').addEventListener('click', () => {
    playSfx('click');
    localStorage.removeItem('u6_saved_step');
    modal.remove();
    onRestart();
  });
}

// 시네마틱 인트로 오프닝 연출
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
    playSfx('click');
    intro.style.opacity = '0';
    setTimeout(() => {
      intro.remove();
      onStart();
    }, 800);
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
  const stepParam = parseInt(urlParams.get('step') || '-1', 10);
  const savedStep = parseInt(localStorage.getItem('u6_saved_step') || '0', 10);

  if (stepParam >= 0 && stepParam < STEPS.length) {
    // URL에 직접 ?step=N을 지정한 경우
    dlg.start(STEPS.slice(stepParam));
    updateChapterBadge(stepParam, STEPS[stepParam]);
  } else if (savedStep > 0 && savedStep < STEPS.length) {
    // 자동 저장된 기록이 있을 때 이어하기 모달 표시
    promptResumeModal(
      savedStep,
      () => {
        dlg.start(STEPS.slice(savedStep));
        updateChapterBadge(savedStep, STEPS[savedStep]);
      },
      () => {
        showCinematicIntro(() => {
          dlg.start(STEPS);
          updateChapterBadge(0, STEPS[0]);
        });
      }
    );
  } else {
    showCinematicIntro(() => {
      dlg.start(STEPS);
      updateChapterBadge(0, STEPS[0]);
    });
  }
}
setTension(12);
