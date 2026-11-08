import { renderMath } from '../engine/math.js';
import { PROBLEMS } from '../data/problems.js?v=73';
import { playSfx } from '../engine/sound.js?v=1';

export function mountQuiz(root, problemId, { onSolved }) {
  const problem = PROBLEMS[problemId];
  if (!problem) {
    root.textContent = '문제를 찾지 못했다.';
    return;
  }
  root.innerHTML = `
    <div class="quiz">
      <p class="quiz-prompt" id="quiz-prompt"></p>
      <div class="quiz-choices" id="quiz-choices"></div>
      <p class="quiz-feedback" id="quiz-feedback"></p>
    </div>`;
  const prompt = root.querySelector('#quiz-prompt');
  prompt.textContent = problem.prompt;
  renderMath(prompt);
  const feedback = root.querySelector('#quiz-feedback');
  const box = root.querySelector('#quiz-choices');
  for (const choice of problem.choices) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-choice';
    btn.innerHTML = choice;
    renderMath(btn);
    btn.addEventListener('click', () => {
      const want = problem.answer.replace(/\$/g, '').replace(/\s/g, '');
      const got = choice.replace(/\$/g, '').replace(/\s/g, '');
      if (got === want) {
        playSfx('correct');
        feedback.textContent = '맞다.';
        box.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        if (onSolved) onSolved(problem);
      } else {
        playSfx('wrong');
        feedback.innerHTML = problem.wrong;
        renderMath(feedback);
      }
    });
    box.appendChild(btn);
  }
}
