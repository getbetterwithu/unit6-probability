const FACE = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(-90deg) rotateY(0deg)',
  3: 'rotateX(0deg) rotateY(-90deg)',
  4: 'rotateX(0deg) rotateY(90deg)',
  5: 'rotateX(90deg) rotateY(0deg)',
  6: 'rotateX(0deg) rotateY(180deg)',
};

export function mountDiceRoll(root, { onDone }) {
  root.innerHTML = `
    <div class="popup">
      <p class="dice-hint">정육면체를 실제로 굴립니다. 멈춘 눈을 보고 답을 쓰시오.</p>
      <div class="roll-scene"><div class="cube" id="roll-cube">
        <div class="face f1">1</div><div class="face f2">2</div><div class="face f3">3</div>
        <div class="face f4">4</div><div class="face f5">5</div><div class="face f6">6</div>
      </div></div>
      <p class="dice-readout" id="roll-readout">구르는 중</p>
      <form class="roll-form" id="roll-form">
        <label>5 이상이면 몇 가지? <input id="roll-answer" inputmode="numeric" autocomplete="off"></label>
        <button type="submit">확인</button>
      </form>
    </div>`;
  const cube = root.querySelector('#roll-cube');
  const face = 1 + Math.floor(Math.random() * 6);
  const end = FACE[face];
  cube.animate(
    [
      { transform: 'rotateX(40deg) rotateY(20deg)' },
      { transform: 'rotateX(680deg) rotateY(540deg)' },
      { transform: end },
    ],
    { duration: 1400, easing: 'cubic-bezier(.12,.7,.2,1)', fill: 'forwards' }
  );
  setTimeout(() => {
    root.querySelector('#roll-readout').textContent = `멈춘 눈: ${face}`;
  }, 1400);
  root.querySelector('#roll-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const got = root.querySelector('#roll-answer').value.trim();
    const box = root.querySelector('#roll-readout');
    if (got === '2') {
      box.textContent = '맞다. 5와 6, 두 가지.';
      if (onDone) onDone({ face });
    } else {
      box.textContent = '5와 6이다. 두 가지를 쓰시오.';
    }
  });
}
