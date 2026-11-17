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

      <!-- 교과서 표준 직육면체 겨냥도 SVG (가로: 2.5, 세로: 2.5, 두께: 1) -->
      <div style="background:#261b12; border-radius:10px; border:1px solid #5c4324; padding:16px; display:flex; justify-content:center; align-items:center;">
        <svg viewBox="0 0 520 320" width="100%" height="280" style="max-height:280px; overflow:visible;">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f1c40f" />
            </marker>
          </defs>

          <!-- 납작한 직육면체 (가로 2.5 : 세로 2.5 : 두께 1) — 1단위 = 60px, 깊이는 비스듬히 줄여 그림 -->
          <!-- 넓은 면 2개(윗면 6, 아랫면 1), 얇은 옆면 4개(2·3·4·5) — 실측 확률표와 같은 배치 -->

          <!-- 1. 보이지 않는 숨은 모서리 (점선): 뒷면 왼쪽 아래 꼭짓점에서 -->
          <line x1="220" y1="200" x2="150" y2="250" stroke="#7f6548" stroke-width="2" stroke-dasharray="5,5" />
          <line x1="220" y1="200" x2="370" y2="200" stroke="#7f6548" stroke-width="2" stroke-dasharray="5,5" />
          <line x1="220" y1="200" x2="220" y2="140" stroke="#7f6548" stroke-width="2" stroke-dasharray="5,5" />

          <!-- 2. 입체 면 -->
          <!-- 넓은 윗면 (가로 2.5 × 세로 2.5, 눈 6) -->
          <polygon points="150,190 300,190 370,140 220,140" fill="#f5c278" stroke="#3d2b1a" stroke-width="2.5" />
          <circle cx="220" cy="177.5" r="4.5" fill="#3d2b1a" />
          <circle cx="265" cy="177.5" r="4.5" fill="#3d2b1a" />
          <circle cx="237.5" cy="165" r="4.5" fill="#3d2b1a" />
          <circle cx="282.5" cy="165" r="4.5" fill="#3d2b1a" />
          <circle cx="255" cy="152.5" r="4.5" fill="#3d2b1a" />
          <circle cx="300" cy="152.5" r="4.5" fill="#3d2b1a" />

          <!-- 얇은 오른쪽 옆면 (세로 2.5 × 두께 1, 눈 3) -->
          <polygon points="300,190 370,140 370,200 300,250" fill="#c98a44" stroke="#3d2b1a" stroke-width="2.5" />
          <circle cx="317.5" cy="222.5" r="4" fill="#3d2b1a" />
          <circle cx="335" cy="195" r="4" fill="#3d2b1a" />
          <circle cx="352.5" cy="167.5" r="4" fill="#3d2b1a" />

          <!-- 얇은 앞면 (가로 2.5 × 두께 1, 눈 2) -->
          <polygon points="150,190 300,190 300,250 150,250" fill="#e09d4f" stroke="#3d2b1a" stroke-width="2.5" />
          <circle cx="195" cy="208" r="5" fill="#3d2b1a" />
          <circle cx="255" cy="232" r="5" fill="#3d2b1a" />

          <!-- 3. 치수선 -->
          <!-- 가로 치수선 (앞면 아래) -->
          <line x1="150" y1="268" x2="300" y2="268" stroke="#f1c40f" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
          <text x="225" y="290" fill="#ffd152" font-size="16" font-weight="800" text-anchor="middle">가로: 2.5</text>

          <!-- 세로(깊이) 치수선 (오른쪽 아래 비스듬히) -->
          <line x1="312" y1="262" x2="382" y2="212" stroke="#f1c40f" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
          <text x="392" y="246" fill="#ffd152" font-size="16" font-weight="800" text-anchor="start">세로: 2.5</text>

          <!-- 두께 치수선 (왼쪽 수직) -->
          <line x1="130" y1="190" x2="130" y2="250" stroke="#f1c40f" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
          <text x="118" y="226" fill="#ffd152" font-size="16" font-weight="800" text-anchor="end">두께: 1</text>
        </svg>
      </div>

      <!-- 판정 설명 및 증거 확보 버튼 -->
      <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-size:1.15rem; font-weight:800; color:#ffd152;">
            가로 2.5 : 세로 2.5 : 두께 1
          </div>
          <div style="font-size:0.95rem; color:#ff7675; font-weight:700; margin-top:3px;">
            넓은 면 2개, 얇은 면 4개인 직육면체 — 모든 면이 나올 가능성이 같지 않음!
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
        label: '직육면체 증거: 2.5:2.5:1 편향 주사위',
      });
    }
  });
}
