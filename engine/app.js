import { STEPS } from '../data/scenario.js?v=73';
import { createDialogue } from './dialogue.js?v=3';
import { setTension, refute } from './director.js?v=12';
import { mountDiceInspector } from '../widgets/dice-inspector.js';
import { mountQuiz } from '../widgets/quiz.js?v=73';
import { mountDiceRoll } from '../widgets/dice-roll.js';
import { mountPathLink } from '../widgets/path-link.js?v=19';
import { mountPecasPick } from '../widgets/pecas-pick.js?v=14';
import { mountGuguSpeed } from '../widgets/gugu-speed.js?v=3';
import { mountNonogram } from '../widgets/nonogram.js?v=19';

const speakerEl = document.getElementById('speaker-box');
const textEl = document.getElementById('text-box');
const widgetRoot = document.getElementById('widget-root');
const bag = document.getElementById('evidence-bag');
const stage = document.getElementById('game-container');
const dialogue = document.getElementById('dialogue-layer');

let hasCuboid = false;

function addCard(card) {
  hasCuboid = true;
  bag.innerHTML = `<button type="button" class="card" data-id="${card.id}">${card.label}</button>`;
  setTension(85);
  refute(stage, bag);
}

const dlg = createDialogue({
  speakerEl,
  textEl,
  hintEl: document.querySelector('.next-indicator'),
  onWaitWidget(step, done) {
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
      mountDiceRoll(widgetRoot, { onDone() {
        widgetRoot.hidden = true;
        widgetRoot.innerHTML = '';
        done();
      } });
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
    if (step.speaker === '테론' && step.text.includes('다시 겨루자')) setTension(60);
  },
});

dialogue.addEventListener('click', () => dlg.click());
window.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter' && ev.key !== ' ' && ev.code !== 'Space') return;
  const tag = ev.target && ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
  ev.preventDefault();
  dlg.key();
}, true);
document.getElementById('game-container').tabIndex = 0;
document.getElementById('game-container').focus();
document.body.dataset.engine = 'v70';
const demo = new URLSearchParams(location.search).get('demo');
const samples = {
  '1': [
    { speaker: '테론', text: '치우친 주사위는 접었다. 이 정육면체를 실제로 굴려 보자.' },
    { type: 'widget', widget: 'dice-roll' },
  ],
  path: [
    { speaker: '이리스', text: '다섯 고리를 한 번에 그리시오. 같은 선은 두 번 지나지 마시오.' },
    { type: 'widget', widget: 'path-link' },
  ],
  pecas: [
    { speaker: '폴리곤', text: '다섯 마리다. 색이 다른 한 마리를 집으시오.' },
    { type: 'widget', widget: 'pecas-pick' },
  ],
  nonogram: [
    { speaker: '소폴로스', text: '지도는 말로 안 준다. 칸을 칠하면 해골이 나온다.' },
    { type: 'widget', widget: 'nonogram' },
  ],
  gugu: [
    { speaker: '이리스', text: '구구단이 빠르게 나온다. 답을 입력하고 엔터를 누르시오.' },
    { type: 'widget', widget: 'gugu-speed' },
  ],
};
dlg.start(samples[demo] || STEPS);
if (demo === 'path' || demo === 'pecas' || demo === 'nonogram' || demo === 'gugu') dlg.click();
setTension(8);
