import { playSfx } from '../engine/sound.js';

/**
 * 케팔로니아 고대 양피지 탐험 지도 (widgets/world-map.js)
 * - 실제 섬 지형, 해안선, 산맥, 바다 파도, 나침반 로즈(Compass Rose)가 그려진 고대 양피지 지도
 * - 거점 4곳: [🎪 상인 야영지], [⛏️ 광산 갱도], [💎 다이아 동굴], [🏛️ 다이아몬드 금고]
 * - 원석 수집 상황에 따른 실시간 시각 피드백 및 최종 관문 봉인 해제 연출
 */
export function mountWorldMap(root, { worldState, onSelectLocation, onClose }) {
  const { ruby = false, emerald = false, sapphire = false } = worldState || {};
  const gemCount = (ruby ? 1 : 0) + (emerald ? 1 : 0) + (sapphire ? 1 : 0);
  const vaultUnlocked = gemCount >= 3;

  root.innerHTML = `
    <div class="ancient-world-map-wrapper" style="
      position: relative; width: min(1080px, 98%); height: min(620px, 86vh);
      background: #1c140c; border: 3px solid #d4af37; border-radius: 16px;
      box-shadow: 0 20px 80px rgba(0,0,0,0.95); overflow: hidden;
      display: flex; flex-direction: column; animation: fadeIn 0.4s ease;
    ">
      <style>
        @keyframes dashMove {
          to { stroke-dashoffset: -40; }
        }
        @keyframes vaultGlow {
          0%, 100% { filter: drop-shadow(0 0 10px #ffd152); transform: scale(1); }
          50% { filter: drop-shadow(0 0 22px #f39c12); transform: scale(1.04); }
        }
        @keyframes pinBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .map-route-line {
          stroke: #8c6d46; stroke-width: 2.5; stroke-dasharray: 6 5;
          animation: dashMove 2.5s linear infinite;
        }
        .map-route-active {
          stroke: #ffd152; stroke-width: 3.5; stroke-dasharray: 7 5;
          animation: dashMove 1.8s linear infinite;
        }
        .map-pin {
          cursor: pointer; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .map-pin:hover {
          transform: scale(1.12);
        }
        .vault-unlocked-glow {
          animation: vaultGlow 2s infinite ease-in-out;
        }
      </style>

      <!-- 상단 헤더 HUD 바 (양피지 테마) -->
      <div style="
        background: linear-gradient(180deg, rgba(28, 20, 12, 0.96) 0%, rgba(20, 14, 8, 0.88) 100%);
        border-bottom: 2px solid rgba(212, 175, 55, 0.4); padding: 10px 20px;
        display: flex; justify-content: space-between; align-items: center; z-index: 10;
      ">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">🗺️</span>
          <div>
            <div style="font-size:1.15rem; font-weight:900; color:#ffd152; letter-spacing:1px;">
              케팔로니아 수학 탐험 지도
            </div>
            <div style="font-size:0.8rem; color:#bdc3c7;">
              원하는 거점을 터치하여 이동하시오. 3개 원석을 모아야 금고의 봉인이 열립니다.
            </div>
          </div>
        </div>

        <!-- 3대 보석 인벤토리 & 모험 복귀 버튼 -->
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="
            display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.5);
            padding:6px 14px; border-radius:30px; border:1px solid #5c4324;
          ">
            <span style="font-size:0.85rem; color:#bdc3c7; font-weight:700;">원석 수집:</span>
            <span title="소폴로스 상단 루비 원석" style="font-size:1.25rem; opacity:${ruby ? '1' : '0.25'}; filter:${ruby ? 'drop-shadow(0 0 8px #ff4757)' : 'grayscale(1)'};">🔴</span>
            <span title="광맥 갱도 에메랄드 원석" style="font-size:1.25rem; opacity:${emerald ? '1' : '0.25'}; filter:${emerald ? 'drop-shadow(0 0 8px #2ed573)' : 'grayscale(1)'};">🟢</span>
            <span title="다이아 동굴 사파이어 원석" style="font-size:1.25rem; opacity:${sapphire ? '1' : '0.25'}; filter:${sapphire ? 'drop-shadow(0 0 8px #1e90ff)' : 'grayscale(1)'};">🔵</span>
            <span style="font-weight:900; color:#ffd152; font-size:1rem; margin-left:4px;">${gemCount} / 3</span>
          </div>

          ${onClose ? `
          <button type="button" id="btn-map-close" style="
            background: linear-gradient(135deg, #3a2a1c, #2a1f14);
            border: 1.5px solid #d4af37; color: #ffd152; border-radius: 8px;
            padding: 7px 16px; font-weight: 800; font-size: 0.9rem; cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5); transition: all 0.2s;
          ">
            ✕ 모험 복귀
          </button>
          ` : ''}
        </div>
      </div>

      <!-- 메인 양피지 고대 지도 캔버스 (SVG 인터랙티브 맵) -->
      <div style="position:relative; flex:1; width:100%; height:100%; background:#e4d3b2; overflow:hidden;">
        <svg id="world-map-svg" viewBox="0 0 960 520" style="width:100%; height:100%; display:block;" preserveAspectRatio="xMidYMid slice">
          <defs>
            <!-- 양피지 배경 패턴 -->
            <radialGradient id="mapOceanGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#d9c39e"/>
              <stop offset="100%" stop-color="#bba078"/>
            </radialGradient>
            <!-- 섬 육지 그라디언트 -->
            <linearGradient id="islandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fdf6e7"/>
              <stop offset="50%" stop-color="#f5e8cf"/>
              <stop offset="100%" stop-color="#ecd9b5"/>
            </linearGradient>
            <!-- 핀 그림자 -->
            <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
            </filter>
          </defs>

          <!-- 1. 바다 배경 -->
          <rect width="960" height="520" fill="url(#mapOceanGrad)"/>

          <!-- 바다 파도 곡선 (엔틱 디테일) -->
          <g stroke="#9a815a" stroke-width="1.2" fill="none" opacity="0.4">
            <path d="M 60 70 Q 75 62 90 70 Q 105 78 120 70"/>
            <path d="M 820 120 Q 835 112 850 120 Q 865 128 880 120"/>
            <path d="M 120 440 Q 135 432 150 440 Q 165 448 180 440"/>
            <path d="M 760 410 Q 775 402 790 410 Q 805 418 820 410"/>
            <path d="M 40 260 Q 55 252 70 260 Q 85 268 100 260"/>
          </g>

          <!-- 2. 케팔로니아 고대 섬 육지 해안선 실루엣 -->
          <path d="
            M 180 120
            C 250 80, 420 70, 560 90
            C 680 110, 810 160, 840 260
            C 860 330, 800 420, 680 450
            C 560 470, 390 460, 260 430
            C 160 400, 120 320, 130 220
            C 140 160, 150 140, 180 120 Z
          " fill="url(#islandGrad)" stroke="#7d5f38" stroke-width="3" filter="url(#pinShadow)"/>

          <!-- 해안선 모래톱 보조선 -->
          <path d="
            M 190 130
            C 255 92, 415 82, 550 100
            C 665 120, 795 170, 825 260
            C 845 320, 790 405, 675 435
            C 555 455, 395 445, 270 418
            C 175 390, 138 315, 145 225
            C 152 170, 162 150, 190 130 Z
          " fill="none" stroke="#b89b70" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>

          <!-- 3. 고대 지형 장식 (산맥 & 숲 & 절벽) -->
          <!-- 북부 험준한 산맥 (광산 갱도 부근) -->
          <g fill="#c4aa82" stroke="#684a25" stroke-width="1.8" opacity="0.85">
            <polygon points="320,180 345,130 370,180"/>
            <polygon points="360,185 390,120 420,185"/>
            <polygon points="410,180 435,135 460,180"/>
            <polygon points="280,185 305,140 330,185"/>
          </g>

          <!-- 남서쪽 바위 언덕 (다이아 동굴 부근) -->
          <g fill="#c4aa82" stroke="#684a25" stroke-width="1.5" opacity="0.75">
            <polygon points="210,360 235,320 260,360"/>
            <polygon points="250,365 275,315 300,365"/>
          </g>

          <!-- 4. 고대 나침반 로즈 (Compass Rose, 좌하단) -->
          <g transform="translate(100, 430) scale(0.65)" opacity="0.7">
            <circle cx="0" cy="0" r="45" fill="none" stroke="#7d5f38" stroke-width="2"/>
            <circle cx="0" cy="0" r="38" fill="none" stroke="#7d5f38" stroke-width="1" stroke-dasharray="3 2"/>
            <polygon points="0,-45 8,-12 0,0 -8,-12" fill="#7d5f38"/>
            <polygon points="0,45 8,12 0,0 -8,12" fill="#a4845c"/>
            <polygon points="45,0 12,8 0,0 12,-8" fill="#a4845c"/>
            <polygon points="-45,0 -12,8 0,0 -12,-8" fill="#a4845c"/>
            <text x="0" y="-50" text-anchor="middle" fill="#5c4324" font-size="16" font-weight="900">N</text>
          </g>

          <!-- 지도 명칭 라벨 -->
          <text x="820" y="80" text-anchor="end" fill="#5c4324" font-size="18" font-family="'Cinzel', serif" font-weight="900" letter-spacing="2">
            KEPHALONIA
          </text>
          <text x="820" y="98" text-anchor="end" fill="#8c6d46" font-size="11" font-weight="bold">
            ARCHIPELAGO OF PROBABILITY
          </text>

          <!-- 5. 거점 간 점선 탐험 경로선 -->
          <!-- 야영지(동: 680, 240) <-> 금고(중앙: 480, 260) -->
          <path d="M 680 240 C 600 230, 550 245, 480 260" fill="none" class="map-route-line"/>
          <!-- 갱도(북: 380, 150) <-> 금고(중앙: 480, 260) -->
          <path d="M 380 150 C 410 200, 440 230, 480 260" fill="none" class="map-route-line"/>
          <!-- 동굴(남서: 270, 360) <-> 금고(중앙: 480, 260) -->
          <path d="M 270 360 C 330 350, 410 320, 480 260" fill="none" class="map-route-line"/>
          <!-- 야영지 <-> 갱도 외곽 경로 -->
          <path d="M 680 240 C 620 170, 490 140, 380 150" fill="none" class="map-route-line" opacity="0.4"/>
          <!-- 동굴 <-> 야영지 남부 외곽 경로 -->
          <path d="M 270 360 C 420 420, 580 340, 680 240" fill="none" class="map-route-line" opacity="0.4"/>

          <!-- 6. 인터랙티브 거점 4대 핀/마커 -->

          <!-- [거점 1] 🎪 소폴로스의 야영지 (동쪽 평원: 680, 230) -->
          <g class="map-pin" data-loc="camp" transform="translate(680, 230)" filter="url(#pinShadow)">
            <!-- 핀 베이스 원반 -->
            <circle cx="0" cy="0" r="32" fill="#2c1e14" stroke="${ruby ? '#2ed573' : '#d4af37'}" stroke-width="${ruby ? '3.5' : '2.5'}"/>
            <text x="0" y="8" text-anchor="middle" font-size="28">🎪</text>
            <!-- 상태 배지 -->
            <rect x="-55" y="38" width="110" height="24" rx="5" fill="#1c1308" stroke="${ruby ? '#2ed573' : '#d4af37'}" stroke-width="1.5"/>
            <text x="0" y="54" text-anchor="middle" fill="${ruby ? '#2ed573' : '#ffd152'}" font-size="11" font-weight="900">
              ${ruby ? '✅ 1. 야영지 (루비)' : '1. 소폴로스 야영지'}
            </text>
            ${ruby ? `<circle cx="24" cy="-22" r="10" fill="#c0392b" stroke="#fff" stroke-width="1.5"/>
                      <text x="24" y="-18" text-anchor="middle" font-size="10">🔴</text>` : ''}
          </g>

          <!-- [거점 2] ⛏️ 어두운 광맥 갱도 (북쪽 산맥: 380, 140) -->
          <g class="map-pin" data-loc="mine" transform="translate(380, 140)" filter="url(#pinShadow)">
            <!-- 핀 베이스 원반 -->
            <circle cx="0" cy="0" r="32" fill="#2c1e14" stroke="${emerald ? '#2ed573' : '#d4af37'}" stroke-width="${emerald ? '3.5' : '2.5'}"/>
            <text x="0" y="8" text-anchor="middle" font-size="28">⛏️</text>
            <!-- 상태 배지 -->
            <rect x="-55" y="38" width="110" height="24" rx="5" fill="#1c1308" stroke="${emerald ? '#2ed573' : '#d4af37'}" stroke-width="1.5"/>
            <text x="0" y="54" text-anchor="middle" fill="${emerald ? '#2ed573' : '#ffd152'}" font-size="11" font-weight="900">
              ${emerald ? '✅ 2. 갱도 (에메랄드)' : '2. 어두운 광맥 갱도'}
            </text>
            ${emerald ? `<circle cx="24" cy="-22" r="10" fill="#27ae60" stroke="#fff" stroke-width="1.5"/>
                         <text x="24" y="-18" text-anchor="middle" font-size="10">🟢</text>` : ''}
          </g>

          <!-- [거점 3] 💎 빛나는 다이아 동굴 (남서쪽 해안 암석: 270, 350) -->
          <g class="map-pin" data-loc="cave" transform="translate(270, 350)" filter="url(#pinShadow)">
            <!-- 핀 베이스 원반 -->
            <circle cx="0" cy="0" r="32" fill="#2c1e14" stroke="${sapphire ? '#2ed573' : '#d4af37'}" stroke-width="${sapphire ? '3.5' : '2.5'}"/>
            <text x="0" y="8" text-anchor="middle" font-size="28">💎</text>
            <!-- 상태 배지 -->
            <rect x="-55" y="38" width="110" height="24" rx="5" fill="#1c1308" stroke="${sapphire ? '#2ed573' : '#d4af37'}" stroke-width="1.5"/>
            <text x="0" y="54" text-anchor="middle" fill="${sapphire ? '#2ed573' : '#ffd152'}" font-size="11" font-weight="900">
              ${sapphire ? '✅ 3. 동굴 (사파이어)' : '3. 빛나는 다이아 동굴'}
            </text>
            ${sapphire ? `<circle cx="24" cy="-22" r="10" fill="#2980b9" stroke="#fff" stroke-width="1.5"/>
                          <text x="24" y="-18" text-anchor="middle" font-size="10">🔵</text>` : ''}
          </g>

          <!-- [최종 거점] 🏛️ 테론의 다이아몬드 금고 (섬 중앙 신전: 480, 260) -->
          <g class="map-pin ${vaultUnlocked ? 'vault-unlocked-glow' : ''}" data-loc="vault" transform="translate(480, 260)" filter="url(#pinShadow)">
            <!-- 후광 아우라 (봉인 해제 시) -->
            ${vaultUnlocked ? `
              <circle cx="0" cy="0" r="48" fill="rgba(245, 176, 65, 0.25)" stroke="#ffd152" stroke-width="2"/>
            ` : ''}
            <!-- 핀 베이스 원반 -->
            <circle cx="0" cy="0" r="38" fill="${vaultUnlocked ? '#3d2a13' : '#1c140c'}"
                    stroke="${vaultUnlocked ? '#ffd152' : '#5c4324'}" stroke-width="${vaultUnlocked ? '4' : '2'}"/>
            <text x="0" y="10" text-anchor="middle" font-size="34">🏛️</text>

            <!-- 배지 -->
            <rect x="-70" y="44" width="140" height="26" rx="6"
                  fill="${vaultUnlocked ? '#2a1f14' : '#140f09'}"
                  stroke="${vaultUnlocked ? '#ffd152' : '#5c4324'}" stroke-width="1.8"/>
            <text x="0" y="61" text-anchor="middle" fill="${vaultUnlocked ? '#ffd152' : '#7f8c8d'}" font-size="11" font-weight="900">
              ${vaultUnlocked ? '⚔️ 최종 결전: 다이아 금고' : '🔒 금고 (원석 3개 필요)'}
            </text>
          </g>
        </svg>

        <!-- 하단 거점 안내 툴팁 카드 바 -->
        <div id="map-tooltip" style="
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          background: rgba(24, 18, 11, 0.94); border: 2px solid #d4af37; border-radius: 30px;
          padding: 8px 24px; color: #ffeaa7; font-size: 0.95rem; font-weight: 700;
          box-shadow: 0 4px 20px rgba(0,0,0,0.8); pointer-events: none; transition: opacity 0.2s;
        ">
          🗺️ 지도의 깃발 거점을 터치하여 모험을 시작하시오.
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

  const tooltip = root.querySelector('#map-tooltip');
  const locDescs = {
    camp: ruby ? '✅ 소폴로스의 야영지 (완료됨 · 다시 도전하여 복습 가능)' : '🎪 소폴로스의 야영지: 갱도 지도 복원 네모로직 & 정오각형 제단 룬 이동 (7/36)',
    mine: emerald ? '✅ 어두운 광맥 갱도 (완료됨 · 다시 도전하여 복습 가능)' : '⛏️ 어두운 광맥 갱도: 선로 오륜 한붓그리기 & 일차방정식 석문 해제 (5/36)',
    cave: sapphire ? '✅ 빛나는 다이아 동굴 (완료됨 · 다시 도전하여 복습 가능)' : '💎 빛나는 다이아 동굴: 피캐스 정령 잡기 & 두 주사위 곱 짝수 마법 (3/4)',
    vault: vaultUnlocked ? '⚔️ 테론의 다이아몬드 금고: 3대 원석으로 봉인이 풀렸습니다! 최종 결전 돌입' : '🔒 테론의 다이아몬드 금고: 루비, 에메랄드, 사파이어 3개 원석을 모두 모아야 합니다.',
  };

  // 핀 인터랙션 바인딩
  root.querySelectorAll('.map-pin').forEach((pin) => {
    const loc = pin.dataset.loc;

    pin.addEventListener('mouseenter', () => {
      if (locDescs[loc]) {
        tooltip.textContent = locDescs[loc];
      }
    });

    pin.addEventListener('mouseleave', () => {
      tooltip.textContent = '🗺️ 지도의 깃발 거점을 터치하여 모험을 시작하시오.';
    });

    pin.addEventListener('click', () => {
      if (loc === 'vault' && !vaultUnlocked) {
        playSfx('error');
        tooltip.innerHTML = '⚠️ <strong style="color:#e74c3c;">봉인됨!</strong> 3대 원석(루비, 에메랄드, 사파이어)을 먼저 모두 수집해야 합니다.';
        return;
      }
      playSfx('click');
      if (onSelectLocation) onSelectLocation(loc);
    });
  });
}
