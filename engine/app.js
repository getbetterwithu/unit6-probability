import { STEPS } from '../data/scenario.js?v=76';
import { createDialogue } from './dialogue.js?v=4';
import { setTension, refute } from './director.js?v=12';
import { createStage } from './stage.js?v=2';
import { playBgm, playSfx, toggleMute, isMuted } from './sound.js?v=1';
import { mountDiceInspector } from '../widgets/dice-inspector.js';
import { mountQuiz } from '../widgets/quiz.js?v=74';
import { mountDiceRoll } from '../widgets/dice-roll.js';
import { mountPathLink } from '../widgets/path-link.js?v=19';
import { mountPecasPick } from '../widgets/pecas-pick.js?v=14';
import { mountGuguSpeed } from '../widgets/gugu-speed.js?v=3';
import { mountNonogram } from '../widgets/nonogram.js?v=19';

const speakerEl = document.getElementById('speaker-box');
const textEl = document.getElementById('text-box');
const widgetRoot = document.getElementById('widget-root');
const bag = document.getElementById('evidence-bag');
const stageContainer = document.getElementById('game-container');
const dialogue = document.getElementById('dialogue-layer');
const soundBtn = document.getElementById('btn-sound');

const stage = createStage(stageContainer);
let hasCuboid = false;

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
    if (step.bgm) playBgm(step.bgm);
    widgetRoot.hidden = false;
    widgetRoot.innerHTML = '';
    if (step.widget === 'dice-inspector') {
      mountDiceInspector(widgetRoot, {
        onEvidence(card) {
          addCard(card);
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          done();
        },
      });
      return;
    }
    if (step.widget === 'dice-roll') {
      mountDiceRoll(widgetRoot, {
        onDone() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          done();
        },
      });
      return;
    }
    if (step.widget === 'path-link') {
      mountPathLink(widgetRoot, { onDone() {} });
      return;
    }
    if (step.widget === 'nonogram') {
      mountNonogram(widgetRoot, { onDone() {} });
      return;
    }
    if (step.widget === 'pecas-pick') {
      mountPecasPick(widgetRoot, { onDone() {} });
      return;
    }
    if (step.widget === 'gugu-speed') {
      mountGuguSpeed(widgetRoot, { onDone() {} });
      return;
    }
    if (step.widget === 'quiz') {
      mountQuiz(widgetRoot, step.problemId, {
        onSolved() {
          widgetRoot.hidden = true;
          widgetRoot.innerHTML = '';
          setTension(95);
          done();
        },
      });
    }
  },
  onAdvance(step) {
    stage.update(step);
    if (step.bgm) {
      playBgm(step.bgm);
    }
    if (step.refute) {
      playSfx('evidence');
      refute(stageContainer, bag);
    }
    if (step.speaker === '테론' && step.text?.includes('다시 겨루자')) setTension(60);
  },
});

dialogue.addEventListener('click', () => {
  playSfx('click');
  dlg.click();
});

window.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter' && ev.key !== ' ' && ev.code !== 'Space') return;
  const tag = ev.target && ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
  ev.preventDefault();
  playSfx('click');
  dlg.key();
}, true);

document.getElementById('game-container').tabIndex = 0;
document.getElementById('game-container').focus();
document.body.dataset.engine = 'v76';

const stepParam = parseInt(new URLSearchParams(location.search).get('step') || '0', 10);
if (stepParam > 0 && stepParam < STEPS.length) {
  dlg.start(STEPS.slice(stepParam));
} else {
  dlg.start(STEPS);
}
setTension(12);
