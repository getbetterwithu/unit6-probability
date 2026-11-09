import { playSfx } from '../engine/sound.js';

export function mountWorldMap(root, { worldState, onSelectLocation, onClose }) {
  const { ruby = false, emerald = false, sapphire = false } = worldState || {};
  const gemCount = (ruby ? 1 : 0) + (emerald ? 1 : 0) + (sapphire ? 1 : 0);
  const vaultUnlocked = gemCount >= 3;

  root.innerHTML = `
    <div class="world-map-container" style="position:relative; width:min(980px, 98%); background:#18120b; border:2.5px solid #d4af37; border-radius:16px; padding:24px; color:#f5eedb; box-shadow:0 16px 64px rgba(0,0,0,0.92); animation:fadeIn 0.3s ease;">
      <!-- 상단 헤더 & 원석 수집 상황판 -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(245,176,65,0.3); padding-bottom:14px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <span style="background:#d4af37; color:#1c1308; font-weight:900; font-size:0.85rem; padding:3px 10px; border-radius:4px; letter-spacing:0.5px;">WORLD MAP</span>
          <h2 style="font-size:1.5rem; font-weight:800; color:#ffd152; margin:6px 0 0; letter-spacing:1px;">🗺️ 케팔로니아 수학 탐험 지도</h2>
        </div>
        <!-- 3대 보석 인벤토리 슬롯 및 닫기 버튼 -->
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.4); padding:8px 16px; border-radius:30px; border:1px solid #5c4324;">
            <span style="font-size:0.85rem; color:#bdc3c7; font-weight:700;">원석 수집:</span>
            <span title="루비 원석" style="font-size:1.3rem; opacity:${ruby ? '1' : '0.25'}; filter:${ruby ? 'drop-shadow(0 0 8px #ff4757)' : 'grayscale(1)'};">🔴</span>
            <span title="에메랄드 원석" style="font-size:1.3rem; opacity:${emerald ? '1' : '0.25'}; filter:${emerald ? 'drop-shadow(0 0 8px #2ed573)' : 'grayscale(1)'};">🟢</span>
            <span title="사파이어 원석" style="font-size:1.3rem; opacity:${sapphire ? '1' : '0.25'}; filter:${sapphire ? 'drop-shadow(0 0 8px #1e90ff)' : 'grayscale(1)'};">🔵</span>
            <span style="font-weight:800; color:#ffd152; font-size:1rem; margin-left:4px;">${gemCount} / 3</span>
          </div>
          ${onClose ? `
          <button type="button" id="btn-map-close" style="background:#2a1f14; border:1px solid #d4af37; color:#ffd152; border-radius:8px; padding:8px 14px; font-weight:800; font-size:0.9rem; cursor:pointer;">
            ✕ 모험 복귀
          </button>
          ` : ''}
        </div>
      </div>

      <p style="margin:0 0 20px; color:#bdc3c7; font-size:0.95rem; line-height:1.5;">
        자유롭게 거점을 선택하여 이동하시오. 3개 거점의 시련을 모두 통과하고 원석을 모아야 테론의 다이아몬드 금고 봉인이 해제됩니다.
      </p>

      <!-- 4대 거점 선택 그리드 -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <!-- 1. 소폴로스 상단 -->
        <div class="map-card" data-loc="camp" style="background:#22180f; border:2px solid ${ruby ? '#2ed573' : '#d4af37'}; border-radius:12px; padding:18px; cursor:pointer; transition:transform 0.15s, border-color 0.15s; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:1.6rem;">🎪</span>
            <span style="font-size:0.8rem; font-weight:800; padding:3px 8px; border-radius:4px; ${ruby ? 'background:#2ed573; color:#0b1e13;' : 'background:rgba(245,176,65,0.2); color:#ffd152;'}">
              ${ruby ? '✅ 완료 (루비 획득)' : '도전 가능'}
            </span>
          </div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#ffd152; margin:0 0 6px;">1. 소폴로스의 야영지</h3>
          <p style="font-size:0.85rem; color:#bdc3c7; margin:0; line-height:1.4;">
            갱도 지도 복원 네모로직 & 정오각형 제단 꼭짓점 이동 확률 (보스)
          </p>
        </div>

        <!-- 2. 광맥 갱도 -->
        <div class="map-card" data-loc="mine" style="background:#22180f; border:2px solid ${emerald ? '#2ed573' : '#d4af37'}; border-radius:12px; padding:18px; cursor:pointer; transition:transform 0.15s, border-color 0.15s; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:1.6rem;">⛏️</span>
            <span style="font-size:0.8rem; font-weight:800; padding:3px 8px; border-radius:4px; ${emerald ? 'background:#2ed573; color:#0b1e13;' : 'background:rgba(245,176,65,0.2); color:#ffd152;'}">
              ${emerald ? '✅ 완료 (에메랄드 획득)' : '도전 가능'}
            </span>
          </div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#ffd152; margin:0 0 6px;">2. 어두운 광맥 갱도</h3>
          <p style="font-size:0.85rem; color:#bdc3c7; margin:0; line-height:1.4;">
            선로 연결 오륜 한붓그리기 & 일차방정식 석문 해제 (보스)
          </p>
        </div>

        <!-- 3. 다이아 동굴 -->
        <div class="map-card" data-loc="cave" style="background:#22180f; border:2px solid ${sapphire ? '#2ed573' : '#d4af37'}; border-radius:12px; padding:18px; cursor:pointer; transition:transform 0.15s, border-color 0.15s; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:1.6rem;">💎</span>
            <span style="font-size:0.8rem; font-weight:800; padding:3px 8px; border-radius:4px; ${sapphire ? 'background:#2ed573; color:#0b1e13;' : 'background:rgba(245,176,65,0.2); color:#ffd152;'}">
              ${sapphire ? '✅ 완료 (사파이어 획득)' : '도전 가능'}
            </span>
          </div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#ffd152; margin:0 0 6px;">3. 빛나는 다이아 동굴</h3>
          <p style="font-size:0.85rem; color:#bdc3c7; margin:0; line-height:1.4;">
            피캐스 정령 잡기 & 두 주사위 곱 짝수 확률 (보스)
          </p>
        </div>
      </div>

      <!-- 최종 관문: 다이아몬드 금고 배너 -->
      <div style="margin-top:20px;">
        <div class="map-card ${vaultUnlocked ? 'unlocked' : 'locked'}" data-loc="vault" style="
          background:${vaultUnlocked ? 'linear-gradient(135deg, #2a1f14, #3d2a13)' : 'rgba(20, 15, 10, 0.6)'};
          border:2.5px solid ${vaultUnlocked ? '#ffd152' : '#5c4324'};
          border-radius:14px; padding:20px 24px;
          display:flex; justify-content:space-between; align-items:center;
          cursor:${vaultUnlocked ? 'pointer' : 'not-allowed'};
          box-shadow:${vaultUnlocked ? '0 0 24px rgba(245,176,65,0.4)' : 'none'};
        ">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.8rem;">🏛️</span>
              <h3 style="font-size:1.3rem; font-weight:900; color:${vaultUnlocked ? '#ffd152' : '#888'}; margin:0;">
                최종 관문: 테론의 다이아몬드 금고
              </h3>
            </div>
            <p style="font-size:0.9rem; color:${vaultUnlocked ? '#ffeaa7' : '#666'}; margin:6px 0 0;">
              ${vaultUnlocked ? '✨ 3대 원석의 힘으로 금고의 봉인이 풀렸습니다! 지금 결전에 돌입하십시오.' : '🔒 3개 거점의 원석을 모두 모아야 금고의 봉인이 열립니다.'}
            </p>
          </div>
          <button type="button" style="
            background:${vaultUnlocked ? 'linear-gradient(135deg, #d4af37, #f39c12)' : '#332417'};
            color:${vaultUnlocked ? '#1c1308' : '#777'};
            border:none; border-radius:8px; padding:12px 24px;
            font-size:1.05rem; font-weight:800; cursor:${vaultUnlocked ? 'pointer' : 'not-allowed'};
          ">
            ${vaultUnlocked ? '⚔️ 최종 결전 진입 ▶' : '봉인됨'}
          </button>
        </div>
      </div>
    </div>
  `;

  // 닫기 버튼 이벤트
  const btnClose = root.querySelector('#btn-map-close');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      playSfx('click');
      if (onClose) onClose();
    });
  }

  // 호버 및 클릭 이벤트
  root.querySelectorAll('.map-card').forEach((card) => {
    const loc = card.dataset.loc;
    if (loc === 'vault' && !vaultUnlocked) return;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'none';
    });
    card.addEventListener('click', () => {
      playSfx('click');
      if (onSelectLocation) onSelectLocation(loc);
    });
  });
}
