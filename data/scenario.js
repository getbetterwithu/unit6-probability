/**
 * 6편 본판. 1~6장, 퀴즈 12개(problems.js 정본). step당 대사 2~3문장.
 * 등장인물: 폴리곤, 이리스, 탈레스, 피타고라스, 테론, 소폴로스, 광부, 피캐스. 다른 인물은 쓰지 않음.
 * 선다형은 연속 두 화면까지. 세 번째부터는 말 화면을 끼운다.
 */
export const STEPS = [
  // 1장 학당
  { speaker: '이리스', text: '테론이라는 건축가가 교장실에 왔어. 같이 가자.' },
  { speaker: '나레이션', text: '나란히 걷다 손이 스친다. 이리스가 헛기침하고, 둘의 얼굴이 빨개진다.' },
  { speaker: '테론', text: '고대 파피루스를 지킬 금고가 필요해. 재료는 광맥의 다이아야.' },
  { speaker: '피타고라스', text: '폴리곤, 이리스. 이 일을 너희에게 맡긴다.' },

  // 2장 소폴로스 관문 (prob-01, prob-02)
  { speaker: '소폴로스', text: '광맥 길은 알려 줄 수 있어. 내가 내는 경우의 수 문제를 맞히면.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-01' },
  { speaker: '소폴로스', text: '좋아. 두 번째는 코디 문제다. 옷을 골라 세어 보시오.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-02' },
  { speaker: '나레이션', text: '지도가 펼쳐진다. 같은 표를 보던 둘의 머리가 가까워진다.' },
  { speaker: '이리스', text: '같이 가요.' },
  { speaker: '폴리곤', text: '어… 그래. 같이 가자.' },

  // 3장 광맥 갈림길 (prob-03)
  { speaker: '광부', text: '왼쪽이든 오른쪽이든, 느낌으로 가자.' },
  { speaker: '이리스', text: '세어 봐요. 느낌보다 세는 쪽이 빨라요.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-03' },
  { speaker: '나레이션', text: '길을 세며 가니 다이아 방에 닿는다. 좁은 통로에서 이리스가 넘어질 뻔하고, 폴리곤이 손목을 잡는다.' },
  { speaker: '나레이션', text: '잠깐 멈춘 뒤 둘은 손을 놓는다.' },

  // 4장 다이아 방, 피캐스 (prob-04, prob-05)
  { speaker: '나레이션', text: '다이아 방. 머리에 곡괭이를 단 굴 생물이 있다.' },
  { speaker: '폴리곤', text: '피캐스라고 부르자. 구슬 주머니를 흔들고 있어.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-04' },
  { speaker: '피캐스', text: '이번엔 주사위야. 합이 8이 나오는 쪽을 알려 줄게.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-05' },
  { speaker: '이리스', text: '천장에서 종이가…! 받아!' },
  { speaker: '나레이션', text: '파피루스가 떨어진다. 이리스가 받아 들고, 폴리곤과 손이 다시 겹친다.' },

  // 5장 학당, 확률의 성질 (prob-07, prob-08, prob-09)
  { speaker: '피타고라스', text: '파피루스에 「눈이 여섯이면 언제나 여섯 중 하나」라고 적혀 있다. 틀릴 수 있다.' },
  { speaker: '탈레스', text: '가능성이 모두 같을 때만, 세어서 확률을 말할 수 있어. 먼저 몸을 풀자.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-07' },
  { speaker: '탈레스', text: '반드시 나오는 일과 절대로 안 나오는 일을 헷갈리지 마라.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-08' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-09' },
  { speaker: '이리스', text: '피캐스를 무릎에 두고 들을게요. 가능성이 같은지부터 확인해요.' },

  // 6장 다이아 금고, 결전 (prob-06, prob-10, prob-11, prob-12)
  { speaker: '테론', text: '금고는 다 됐다. 파피루스를 넣기 전에, 이 주사위를 시험해 보자.' },
  { speaker: '나레이션', text: '테론이 길쭉한 주사위를 내놓는다. 눈은 여섯이고, 한쪽으로 눕혀져 있다.' },
  { type: 'widget', widget: 'dice-inspector' },
  { speaker: '폴리곤', text: '모서리가 1 대 1 대 2.5다. 정육면체가 아니다.', refute: true },
  { speaker: '이리스', text: '면이 기울어 있어요. 세어서 $\\frac{1}{6}$이라고 하면 안 돼요.' },
  { speaker: '테론', text: '500번 던졌더니 6이 125번 나왔다. 그럼 6이 나올 확률이라고 해도 되지?' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-06' },
  { speaker: '이리스', text: '맞아요. 많이 던진 결과로 근삿값은 말할 수 있어요.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-10' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-11' },
  { speaker: '소폴로스', text: '마지막 관문이다. 나는 소수 넷과 홀수 다섯을 그냥 더해 $\\frac{9}{10}$이라고 했다.' },
  { type: 'widget', widget: 'quiz', problemId: 'prob-12' },
  { speaker: '폴리곤', text: '3, 5, 7은 소수이면서 홀수다. 두 번 센 것을 빼야 맞다.' },
  { speaker: '테론', text: '네가 이겼다. 파피루스를 다이아 금고에 넣는다.' },
  { speaker: '이리스', text: '다음에 또, 같이.' },
];
