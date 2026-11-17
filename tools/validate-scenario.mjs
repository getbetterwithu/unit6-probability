// 시나리오 데이터 검사: 배포 전에 `node tools/validate-scenario.mjs` 로 실행한다.
// 인물 이미지 누락, 화자-무대 불일치, 없는 문제·배경·BGM 참조를 잡아낸다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const { SCENARIOS } = await load('data/scenario.js');
const { PROBLEMS } = await load('data/problems.js');
const { CHAR_KEYS, getCharSrc } = await load('engine/stage.js');

const problemIds = new Set(Array.isArray(PROBLEMS) ? PROBLEMS.map((p) => p.id) : Object.keys(PROBLEMS));
const bgmKeys = new Set(
  [...fs.readFileSync(path.join(ROOT, 'engine/sound.js'), 'utf8').matchAll(/^\s{2}(\w+):\s+'assets\/audio\//gm)].map((m) => m[1]),
);
const stageSrc = fs.readFileSync(path.join(ROOT, 'engine/stage.js'), 'utf8');
const bgKeys = new Set([...stageSrc.matchAll(/^\s{2}(\w+):\s+`\$\{BG_BASE\}/gm)].map((m) => m[1]));
const WIDGETS = new Set(['nonogram', 'problem-board', 'quiz', 'pecas-pick', 'path-link', 'gugu-speed', 'dice-inspector']);
const NON_SPEAKERS = new Set(['', '나레이션', '시스템']);

const errors = [];
const warns = [];
const err = (loc, msg) => errors.push(`${loc}  ${msg}`);
const warn = (loc, msg) => warns.push(`${loc}  ${msg}`);

for (const [scene, steps] of Object.entries(SCENARIOS)) {
  steps.forEach((s, i) => {
    const loc = `${scene}[${i}]`;
    const speaker = (s.speaker || '').trim();
    const isWidget = s.type === 'widget';

    for (const side of ['left', 'right']) {
      const c = s[side];
      if (!c) continue;
      if (!CHAR_KEYS[c.name]) err(loc, `${side}: 알 수 없는 인물 이름 '${c.name}'`);
      const file = getCharSrc(c.name, c.emotion || 'neutral');
      if (file && !fs.existsSync(path.join(ROOT, file))) err(loc, `${side}: 이미지 없음 ${file}`);
    }
    if (s.left && s.right && s.left.name === s.right.name) err(loc, '양쪽에 같은 인물이 배치됨');

    if (!NON_SPEAKERS.has(speaker)) {
      if (!CHAR_KEYS[speaker]) err(loc, `화자 '${speaker}' 는 등록된 인물이 아님`);
      const onStage = s.left?.name === speaker || s.right?.name === speaker;
      if (!isWidget && !onStage) err(loc, `화자 '${speaker}' 가 무대(left/right)에 없음`);
    }
    if (!isWidget && !s.left && !s.right) warn(loc, '무대에 인물이 한 명도 지정되지 않음');

    if (s.bg && !bgKeys.has(s.bg) && !fs.existsSync(path.join(ROOT, 'assets/backgrounds', `${s.bg}.png`))) err(loc, `배경 없음 '${s.bg}'`);
    if (s.bgm && !bgmKeys.has(s.bgm)) err(loc, `BGM 키 없음 '${s.bgm}'`);
    if (isWidget) {
      if (!WIDGETS.has(s.widget)) err(loc, `알 수 없는 위젯 '${s.widget}'`);
      if (s.widget === 'problem-board' || s.widget === 'quiz') {
        if (!s.problemId || !problemIds.has(s.problemId)) err(loc, `문제 번호 없음 '${s.problemId}'`);
      }
    }
    if (!isWidget) {
      const sentences = (s.text || '').split(/(?<=[.!?])\s+/).filter(Boolean).length;
      if (sentences > 3) warn(loc, `대사가 ${sentences}문장 (권장 2~3문장)`);
    }
  });
}

if (warns.length) console.log(`경고 ${warns.length}건\n  - ${warns.join('\n  - ')}\n`);
if (errors.length) {
  console.log(`오류 ${errors.length}건\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`오류 없음 (경고 ${warns.length}건)`);
