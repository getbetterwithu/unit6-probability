const RATIO = { x: 1, y: 1, z: 2.5 };

export function mountDiceInspector(root, { onEvidence }) {
  root.innerHTML = `
    <div class="dice-ui">
      <p class="dice-hint">드래그해서 돌려 보시오. 세 모서리 길이를 재면 증거가 됩니다.</p>
      <svg class="dice-svg" viewBox="0 0 420 240" id="dice-svg"></svg>
      <div class="dice-readout" id="dice-readout">가로 ? · 세로 ? · 높이 ?</div>
      <button type="button" id="dice-measure">모서리 재기</button>
    </div>`;

  const svg = root.querySelector('#dice-svg');
  let ang = 0.6;
  let drag = false;
  let lx = 0;

  function draw() {
    const w = 70;
    const h = 70;
    const d = 175;
    const ox = 70;
    const oy = 150;
    const dx = Math.cos(ang) * d * 0.55;
    const dy = -Math.sin(ang) * d * 0.35;
    const front = `${ox},${oy} ${ox + w},${oy} ${ox + w},${oy - h} ${ox},${oy - h}`;
    const side = `${ox + w},${oy} ${ox + w + dx},${oy + dy} ${ox + w + dx},${oy - h + dy} ${ox + w},${oy - h}`;
    const top = `${ox},${oy - h} ${ox + w},${oy - h} ${ox + w + dx},${oy - h + dy} ${ox + dx},${oy - h + dy}`;
    svg.innerHTML = `
      <polygon points="${side}" fill="#a8844a" stroke="#5c4324" stroke-width="2"/>
      <polygon points="${top}" fill="#e2c48a" stroke="#5c4324" stroke-width="2"/>
      <polygon points="${front}" fill="#c9a36a" stroke="#5c4324" stroke-width="2"/>
      <text x="${ox + w / 2}" y="${oy - h / 2}" text-anchor="middle" font-size="22" fill="#2a1c0c">1</text>`;
  }
  draw();

  svg.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointerup', () => { drag = false; });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    ang += (e.clientX - lx) * 0.01;
    lx = e.clientX;
    draw();
  });

  root.querySelector('#dice-measure').addEventListener('click', () => {
    root.querySelector('#dice-readout').textContent =
      `가로 ${RATIO.x} · 세로 ${RATIO.y} · 높이 ${RATIO.z}  (1 : 1 : 2.5)`;
    if (onEvidence) onEvidence({ id: 'cuboid', label: '직육면체 증거' });
  });
}
