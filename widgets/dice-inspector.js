/**
 * 3D 직육면체 검증기 (widgets/dice-inspector.js)
 * 2D 캔버스 기반 3차원 투영 렌더러로 CSS 3D 면 찢어짐 버그를 원천 해결.
 * 실시간 3D 치수선(가로 1, 세로 1, 높이 2.5) 및 회전 인터랙션 지원.
 */

const RATIO = { x: 1, y: 1, z: 2.5 };

export function mountDiceInspector(root, { onEvidence }) {
  root.innerHTML = `
    <div class="dice-inspector-container">
      <div class="dice-inspector-header">
        <span class="inspector-badge">📐 3D 입체 증거 검증</span>
        <p class="dice-hint">주사위를 손가락이나 마우스로 자유롭게 회전시켜 보시오. [모서리 재기]를 누르면 실시간 치수가 나타납니다.</p>
      </div>
      <div class="dice-canvas-wrapper">
        <canvas id="dice-3d-canvas" width="540" height="300"></canvas>
      </div>
      <div class="dice-controls">
        <div class="dice-readout" id="dice-readout">가로 ? · 세로 ? · 높이 ?</div>
        <button type="button" class="dice-measure-btn" id="dice-measure">
          <span class="btn-icon">📏</span> 모서리 재기
        </button>
      </div>
    </div>
  `;

  const canvas = root.querySelector('#dice-3d-canvas');
  const ctx = canvas.getContext('2d');
  const readout = root.querySelector('#dice-readout');
  const measureBtn = root.querySelector('#dice-measure');

  // 모서리 치수선 표시 여부
  let showDimensions = false;

  // 3D 모델 크기 (가로 1 : 세로 1 : 높이 2.5 비율)
  const W = 55;   // 가로 (X)
  const H = 55;   // 세로 (Y)
  const D = 137.5; // 높이/길이 (Z = 55 * 2.5)

  // 8개 꼭짓점 정의 (중심 0,0,0)
  const baseVertices = [
    { x: -W, y: -H, z: -D }, // 0: 좌-상-후
    { x:  W, y: -H, z: -D }, // 1: 우-상-후
    { x:  W, y:  H, z: -D }, // 2: 우-하-후
    { x: -W, y:  H, z: -D }, // 3: 좌-하-후
    { x: -W, y: -H, z:  D }, // 4: 좌-상-전
    { x:  W, y: -H, z:  D }, // 5: 우-상-전
    { x:  W, y:  H, z:  D }, // 6: 우-하-전
    { x: -W, y:  H, z:  D }, // 7: 좌-하-전
  ];

  // 6개 면 정의 (반시계방향 외적 normal)
  const faces = [
    { name: 'front',  indices: [4, 5, 6, 7], num: 1, baseColor: [220, 160, 90] }, // +Z (정면 1)
    { name: 'back',   indices: [1, 0, 3, 2], num: 6, baseColor: [180, 130, 75] }, // -Z (배면 6)
    { name: 'top',    indices: [0, 1, 5, 4], num: 2, baseColor: [245, 195, 125] }, // -Y (상면 2)
    { name: 'bottom', indices: [3, 7, 6, 2], num: 5, baseColor: [160, 110, 60] }, // +Y (하면 5)
    { name: 'right',  indices: [1, 2, 6, 5], num: 3, baseColor: [205, 145, 80] }, // +X (우측면 3)
    { name: 'left',   indices: [0, 4, 7, 3], num: 4, baseColor: [190, 135, 70] }, // -X (좌측면 4)
  ];

  // 기본 회전 각도
  let rotX = -0.42;
  let rotY = 0.65;
  let dragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fov = 460;
    const cameraDist = 480;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const tv = baseVertices.map((v) => {
      // Y 회전
      const x1 = v.x * cosY + v.z * sinY;
      const y1 = v.y;
      const z1 = -v.x * sinY + v.z * cosY;

      // X 회전
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      // 원근 투영
      const zDist = z2 + cameraDist;
      const scale = fov / Math.max(zDist, 50);
      const projX = cx + x2 * scale;
      const projY = cy + y2 * scale;

      return { x: x2, y: y2, z: z2, projX, projY, scale };
    });

    // 면 정보 계산 및 법선 벡터 외적
    const renderedFaces = faces.map((f) => {
      const v0 = tv[f.indices[0]];
      const v1 = tv[f.indices[1]];
      const v2 = tv[f.indices[2]];
      const v3 = tv[f.indices[3]];

      // 2D 외적 (신발끈 공식 / 2D winding order)
      const cross2D = (v1.projX - v0.projX) * (v2.projY - v0.projY) - (v1.projY - v0.projY) * (v2.projX - v0.projX);

      const avgZ = (v0.z + v1.z + v2.z + v3.z) / 4;
      const centerProjX = (v0.projX + v1.projX + v2.projX + v3.projX) / 4;
      const centerProjY = (v0.projY + v1.projY + v2.projY + v3.projY) / 4;

      return {
        face: f,
        v0, v1, v2, v3,
        cross2D,
        avgZ,
        centerProjX,
        centerProjY,
      };
    });

    // Z-depth 기준 정렬 (깊은 면부터 먼저 그림)
    renderedFaces.sort((a, b) => a.avgZ - b.avgZ);

    renderedFaces.forEach((rf) => {
      // 카메라 앞면 여부 (2D 외적이 양수면 앞면)
      const isFront = rf.cross2D > 0;

      ctx.beginPath();
      ctx.moveTo(rf.v0.projX, rf.v0.projY);
      ctx.lineTo(rf.v1.projX, rf.v1.projY);
      ctx.lineTo(rf.v2.projX, rf.v2.projY);
      ctx.lineTo(rf.v3.projX, rf.v3.projY);
      ctx.closePath();

      if (isFront) {
        const [r, g, b] = rf.face.baseColor;
        // 면마다 음영 그라디언트
        const grad = ctx.createLinearGradient(rf.v0.projX, rf.v0.projY, rf.v2.projX, rf.v2.projY);
        grad.addColorStop(0, `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`);
        grad.addColorStop(1, `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`);

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#4a2f13';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 주사위 눈 번호
        ctx.fillStyle = '#1c1106';
        ctx.font = 'bold 26px "Cinzel", "Noto Serif KR", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rf.face.num, rf.centerProjX, rf.centerProjY);
      } else {
        // 뒷면 와이어프레임
        ctx.fillStyle = 'rgba(160, 110, 60, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 65, 30, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // 2단계: 모서리 치수선 (showDimensions 활성화 시)
    if (showDimensions) {
      drawDimensionLines(tv);
    }
  }

  function drawDimensionLines(tv) {
    ctx.save();
    // 1) 가로 (X축: 꼭짓점 0 -> 1)
    drawDimLine(tv[0], tv[1], '가로 1', -28);

    // 2) 세로 (Y축: 꼭짓점 1 -> 2)
    drawDimLine(tv[1], tv[2], '세로 1', 32);

    // 3) 높이/길이 (Z축: 꼭짓점 5 -> 1)
    drawDimLine(tv[5], tv[1], '높이 2.5', 38);
    ctx.restore();
  }

  function drawDimLine(p1, p2, label, offsetDist) {
    const dx = p2.projX - p1.projX;
    const dy = p2.projY - p1.projY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const ox1 = p1.projX + nx * offsetDist;
    const oy1 = p1.projY + ny * offsetDist;
    const ox2 = p2.projX + nx * offsetDist;
    const oy2 = p2.projY + ny * offsetDist;

    // 보조선 점선
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ffd152';
    ctx.lineWidth = 1.5;
    ctx.moveTo(p1.projX, p1.projY);
    ctx.lineTo(ox1, oy1);
    ctx.moveTo(p2.projX, p2.projY);
    ctx.lineTo(ox2, oy2);
    ctx.stroke();

    // 치수 본선 실선
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2.5;
    ctx.moveTo(ox1, oy1);
    ctx.lineTo(ox2, oy2);
    ctx.stroke();

    // 화살표 머리
    drawArrowHead(ox1, oy1, ox2, oy2);
    drawArrowHead(ox2, oy2, ox1, oy1);

    // 치수 라벨
    const mx = (ox1 + ox2) / 2;
    const my = (oy1 + oy2) / 2;
    ctx.fillStyle = 'rgba(18, 14, 10, 0.9)';
    ctx.fillRect(mx - 38, my - 13, 76, 26);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mx - 38, my - 13, 76, 26);

    ctx.fillStyle = '#ffeaa7';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mx, my);
  }

  function drawArrowHead(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 8;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
  }

  // 포인터 이벤트
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointerup', () => {
    dragging = false;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    rotY += dx * 0.012;
    rotX += dy * 0.012;
    rotX = Math.max(-1.4, Math.min(1.4, rotX));
    render();
  });

  // 모서리 재기 버튼
  measureBtn.addEventListener('click', () => {
    showDimensions = true;
    readout.innerHTML = `
      <span class="highlight-ratio">가로 1 · 세로 1 · 높이 2.5</span>
      <span class="ratio-verdict">(모서리 비율 1 : 1 : 2.5 — 정육면체가 아님!)</span>
    `;
    readout.classList.add('measured');
    render();

    if (onEvidence) {
      setTimeout(() => {
        onEvidence({
          id: 'cuboid',
          label: '직육면체 증거: 1:1:2.5 편향 주사위',
        });
      }, 1200);
    }
  });

  // 초기 렌더링
  render();

  if (new URLSearchParams(location.search).get('measure') === '1') {
    measureBtn.click();
  }
}
