import { mountProblemBoard } from './problem-board.js';

/**
 * 하위 호환 브릿지: quiz 호출을 mountProblemBoard로 리다이렉트
 */
export function mountQuiz(root, problemId, { onSolved }) {
  mountProblemBoard(root, problemId, { onSolved });
}
