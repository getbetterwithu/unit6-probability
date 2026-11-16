// engine/math-validator.js — 동치 분수·소수 판정 및 오개념 진단 엔진

/**
 * 분수 또는 소수 문자열을 안전하게 파싱하여 수치값(val)과 분자/분모를 반환합니다.
 * "3/4", "0.75", "7" 등 정상 입력만 수용하며, "1/2/3", "1//2" 등 비정상 입력은 null을 반환합니다.
 */
export function parseFraction(str) {
  if (str == null) return null;
  const cleaned = String(str).replace(/\s+/g, '').replace(/(가지|개|번)$/g, '');
  if (!cleaned) return null;

  // 분수 형태 (a/b)
  const fracMatch = cleaned.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return { val: num / den, num, den };
  }

  // 일반 정수 또는 소수 형태
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    const val = Number(cleaned);
    if (!Number.isFinite(val)) return null;
    return { val, num: val, den: 1 };
  }

  return null;
}

/**
 * 학생 답안과 정답(및 altAnswers)을 오차 1e-6 이내에서 동치 비교하고,
 * 오답인 경우 대표 오개념을 진단하여 맞춤형 피드백을 반환합니다.
 */
export function validateAnswer(userAns, problem) {
  const user = parseFraction(userAns);
  if (!user) {
    return {
      isCorrect: false,
      misconceptionHint: '분수는 3/4 처럼 분모를 0이 아닌 수로 써 주세요. (1/2/3 처럼 /를 두 번 쓰면 읽을 수 없습니다.)'
    };
  }

  // 1. 정답 및 대체 정답(altAnswers) 목록과 동치 비교
  const candidates = [problem.answer, ...(problem.altAnswers || [])];
  let isCorrect = false;

  for (const cand of candidates) {
    const correct = parseFraction(cand);
    if (correct && Math.abs(user.val - correct.val) < 1e-6) {
      isCorrect = true;
      break;
    }
  }

  if (isCorrect) {
    return { isCorrect: true, misconceptionHint: null };
  }

  // 2. 오답인 경우 대표 오개념 진단 피드백 매칭
  let misconceptionHint = null;
  const list = problem.misconceptions || [];

  for (const m of list) {
    const target = parseFraction(m.wrongAnswer || m.match);
    if (target && Math.abs(user.val - target.val) < 1e-6) {
      misconceptionHint = m.feedback || m.msg;
      break;
    }
  }

  // 3. 일반적인 확률 상한 초과 감지 (P > 1)
  if (!misconceptionHint && user.val > 1 && String(problem.answer).includes('/')) {
    misconceptionHint = '확률은 0과 1 사이의 값입니다. 1보다 크다면 전체 경우의 수를 잘못 세었을 수 있어요.';
  }

  return { isCorrect: false, misconceptionHint };
}
