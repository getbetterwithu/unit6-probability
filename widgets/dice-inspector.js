/**
 * 직육면체 주사위 겨냥도 검증기 (widgets/dice-inspector.js)
 * 요란한 3D 회전과 깜빡임을 배제하고, 가로·세로·높이 치수선이 명확한 교과서 표준 겨냥도로 직관적 증거를 제시.
 */

export function mountDiceInspector(root, { onEvidence }) {
  root.innerHTML = `
    <div class="dice-inspector-container" style="max-width:680px; margin:0 auto; background:#1e1610; border:2.5px solid #d4af37; border-radius:14px; padding:20px 24px; color:#f5eedb; box-shadow:0 12px 40px rgba(0,0,0,0.85);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1.5px solid rgba(245,176,65,0.25); padding-bottom:10px;">
        <span style="background:#d4af37; color:#1c1308; font-weight:800; font-size:0.9rem; padding:3px 12px; border-radius:4px;">📐 입체 증거 검증</span>
        <span style="color:#bdc3c7; font-size:0.95rem;">테론의 주사위 치수 실측</span>
      </div>

      <!-- 교과서 표준 직육면체 겨냥도 SVG (가로: 1, 세로: 1, 높이: 2.5) -->
      <div style="background:#261b12; border-radius:10px; border:1px solid #5c4324; padding:16px; display:flex; justify-content:center; align-items:center;">
        <svg viewBox="0 0 520 320" width="100%" height="280" style="max-height:280px; overflow:visible;">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f1c40f" />
            </marker>
          </defs>

          <!-- 1. 보이지 않는 숨은 모서리 (점선) -->
          <!-- 뒷면 좌하 -> 앞면 좌하, 뒷면 좌하 -> 뒷면 우하, 뒷면 좌하 -> 뒷면 좌상 -->
          <line x1="210" y1="215" x2="160" y2="255" stroke="#7f6548" stroke-width="2" stroke-dasharray="5,5" />
          <line x1="210" y1="215" x2="310" y2="215" stroke="#7f6548" stroke-width="2" stroke-dasharray="5,5" />
          <line x1="210" y1="215" x2="210" y2="65"  stroke="#7f6548" stroke-width="2" stroke-dasharray="5,5" />

          <!-- 2. 입체 면 렌더링 -->
          <!-- 윗면 (상면: 가로 100, 깊이 50, 눈 2) -->
          <polygon points="160,105 260,105 310,65 210,65" fill="#f5c278" stroke="#3d2b1a" stroke-width="2.5" />
          <!-- 윗면 주사위 눈 2 -->
          <circle cx="225" cy="88" r="4.5" fill="#3d2b1a" />
          <circle cx="245" cy="82" r="4.5" fill="#3d2b1a" />

          <!-- 옆면 (우측면: 깊이 50, 높이 150, 눈 3) -->
          <polygon points="260,105 310,65 310,215 260,255" fill="#c98a44" stroke="#3d2b1a" stroke-width="2.5" />
          <!-- 옆면 주사위 눈 3 -->
          <circle cx="277" cy="140" r="4.5" fill="#3d2b1a" />
          <circle cx="285" cy="160" r="4.5" fill="#3d2b1a" />
          <circle cx="293" cy="180" r="4.5" fill="#3d2b1a" />

          <!-- 앞면 (정면: 가로 100, 높이 150, 눈 1) -->
          <polygon points="160,105 260,105 260,255 160,255" fill="#e09d4f" stroke="#3d2b1a" stroke-width="2.5" />
          <!-- 앞면 주사위 눈 1 (붉은색/검정 큰 점) -->
          <circle cx="210" cy="180" r="10" fill="#c0392b" stroke="#8e2b20" stroke-width="1.5" />

          <!-- 3. 치수선 (가로 1, 세로 1, 높이 2.5) -->
          <!-- 가로 치수선 (하단) -->
          <line x1="160" y1="275" x2="260" y2="275" stroke="#f1c40f" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
          <text x="210" y="296" fill="#ffd152" font-size="16" font-weight="800" text-anchor="middle">가로: 1</text>

          <!-- 세로 (깊이) 치수선 (우하단 비스듬히) -->
          <line x1="275" y1="265" x2="325" y2="225" stroke="#f1c40f" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
          <text x="325" y="260" fill="#ffd152" font-size="16" font-weight="800" text-anchor="start">세로: 1</text>

          <!-- 높이 치수선 (좌측 수직) -->
          <line x1="135" y1="105" x2="135" y2="255" stroke="#f1c40f" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
          <text x="120" y="185" fill="#ffd152" font-size="16" font-weight="800" text-anchor="end">높이: 2.5</text>
        </svg>
      </div>

      <!-- 판정 설명 및 증거 확보 버튼 -->
      <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:1.15rem; font-weight:800; color:#ffd152;">
            가로 1 : 세로 1 : 높이 2.5
          </div>
          <div style="font-size:0.95rem; color:#ff7675; font-weight:700; margin-top:3px;">
            모서리 길이가 서로 다른 직육면체 — 모든 면이 나올 가능성이 같지 않음!
          </div>
        </div>
        <button type="button" id="btn-claim-evidence" style="background:linear-gradient(135deg, #d4af37, #f39c12); color:#1c1308; border:none; border-radius:8px; padding:11px 22px; font-weight:800; font-size:1.05rem; cursor:pointer; box-shadow:0 4px 14px rgba(243,156,18,0.4); transition:transform 0.15s;">
          📌 직육면체 증거 확보 ▶
        </button>
      </div>
    </div>
  `;

  const btn = root.querySelector('#btn-claim-evidence');
  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = '확보 완료!';
    if (onEvidence) {
      onEvidence({
        id: 'cuboid',
        label: '직육면체 증거: 1:1:2.5 편향 주사위',
      });
    }
  });
}
