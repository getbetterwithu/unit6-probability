import { playSfx } from '../engine/sound.js';

/**
 * 케팔로니아 고대 양피지 탐험 지도 (widgets/world-map.js)
 * - 실제 섬 지형, 해안선, 산맥, 바다 파도, 나침반 로즈(Compass Rose)가 그려진 고대 양피지 지도
 * - 거점 4곳: [🎪 상인 야영지], [⛏️ 광산 갱도], [💎 다이아 동굴], [🏛️ 다이아몬드 금고]
 * - 모바일 전용 반응형: meet 비율 4대 거점 한눈에 표시, 핀치 줌 & 터치 드래그(Pan), 플로팅 줌 컨트롤, 하단 퀵 선택 바
 */
export function mountWorldMap(root, { worldState, onSelectLocation, onClose }) {
  const { ruby = false, emerald = false, sapphire = false } = worldState || {};
  const gemCount = (ruby ? 1 : 0) + (emerald ? 1 : 0) + (sapphire ? 1 : 0);
  const vaultUnlocked = gemCount >= 3;

  root.innerHTML = `
    <div class="ancient-world-map-wrapper" style="
      position: relative; width: min(1200px, 98vw); height: min(760px, 94vh); height: min(760px, 94dvh);
      background: #1c140c; border: 2.5px solid #d4af37; border-radius: 14px;
      box-shadow: 0 20px 80px rgba(0,0,0,0.95); overflow: hidden;
      display: flex; flex-direction: column; animation: fadeIn 0.35s ease;
      user-select: none; -webkit-user-select: none;
    ">
      <style>
        @keyframes dashMove {
          to { stroke-dashoffset: -40; }
        }
        @keyframes vaultGlow {
          0%, 100% { filter: drop-shadow(0 0 8px #ffd152); }
          50% { filter: drop-shadow(0 0 20px #f39c12); }
        }
        .map-route-line {
          stroke: #8c6d46; stroke-width: 2.5; stroke-dasharray: 6 5;
          animation: dashMove 2.5s linear infinite;
        }
        .map-pin {
          cursor: pointer;
          transition: filter 0.15s ease, transform 0.15s ease;
        }
        .map-pin:hover, .map-pin:active {
          filter: drop-shadow(0 0 14px #ffd152) !important;
        }
        .vault-unlocked-glow {
          animation: vaultGlow 2s infinite ease-in-out;
        }
        .map-zoom-btn {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(28, 20, 12, 0.92); border: 1.5px solid #d4af37;
          color: #ffd152; font-size: 1.15rem; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          transition: all 0.15s; touch-action: manipulation;
        }
        .map-zoom-btn:active {
          transform: scale(0.92);
          background: #d4af37; color: #1c140c;
        }
        .quick-loc-btn {
          background: rgba(28, 20, 12, 0.9); border: 1.5px solid #5c4324;
          color: #f5eedb; padding: 6px 12px; border-radius: 20px;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          white-space: nowrap; transition: all 0.15s; touch-action: manipulation;
        }
        .quick-loc-btn.active-target {
          border-color: #ffd152; color: #ffd152; background: rgba(245, 176, 65, 0.2);
        }
        .quick-loc-btn.cleared {
          border-color: #2ecc71; color: #2ecc71;
        }
        .quick-loc-btn:active {
          transform: scale(0.94);
        }
        @media (max-width: 768px) {
          .ancient-world-map-wrapper {
            width: 100vw !important; height: 100dvh !important;
            border-radius: 0 !important; border: none !important;
          }
          .map-header-sub { display: none !important; }
          .quick-loc-btn { padding: 4px 8px !important; font-size: 0.76rem !important; }
        }
      </style>

      <!-- 상단 헤더 HUD 바 -->
      <div style="
        background: linear-gradient(180deg, rgba(28, 20, 12, 0.98) 0%, rgba(20, 14, 8, 0.92) 100%);
        border-bottom: 2px solid rgba(212, 175, 55, 0.4); padding: 8px 12px;
        display: flex; justify-content: space-between; align-items: center; z-index: 10;
        flex-shrink: 0; gap: 8px;
      ">
        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
          <span style="font-size:20px; flex-shrink:0;">🗺️</span>
          <div style="min-width:0;">
            <div style="font-size:1.05rem; font-weight:900; color:#ffd152; letter-spacing:0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              케팔로니아 탐험 지도
            </div>
            <div class="map-header-sub" style="font-size:0.78rem; color:#bdc3c7; white-space:nowrap;">
              원하는 거점을 터치하여 이동하시오. 3개 원석을 모아야 금고가 열립니다.
            </div>
          </div>
        </div>

        <!-- 3대 보석 인벤토리 & 모험 복귀 버튼 -->
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <div style="
            display:flex; align-items:center; gap:4px; background:rgba(0,0,0,0.55);
            padding:4px 10px; border-radius:20px; border:1px solid #5c4324;
          ">
            <span title="루비" style="font-size:1.1rem; opacity:${ruby ? '1' : '0.25'}; filter:${ruby ? 'drop-shadow(0 0 6px #ff4757)' : 'grayscale(1)'};">🔴</span>
            <span title="에메랄드" style="font-size:1.1rem; opacity:${emerald ? '1' : '0.25'}; filter:${emerald ? 'drop-shadow(0 0 6px #2ed573)' : 'grayscale(1)'};">🟢</span>
            <span title="사파이어" style="font-size:1.1rem; opacity:${sapphire ? '1' : '0.25'}; filter:${sapphire ? 'drop-shadow(0 0 6px #1e90ff)' : 'grayscale(1)'};">🔵</span>
            <span style="font-weight:900; color:#ffd152; font-size:0.88rem; margin-left:3px;">${gemCount}/3</span>
          </div>

          ${onClose ? `
          <button type="button" id="btn-map-close" style="
            background: linear-gradient(135deg, #3a2a1c, #2a1f14);
            border: 1.5px solid #d4af37; color: #ffd152; border-radius: 8px;
            padding: 6px 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5); white-space: nowrap;
          ">
            ✕ 복귀
          </button>
          ` : ''}
        </div>
      </div>

      <!-- 메인 양피지 고대 지도 캔버스 (SVG 인터랙티브 맵) -->
      <div id="map-viewport" style="
        position: relative; flex: 1; width: 100%; height: 100%;
        background: #e4d3b2; overflow: hidden; cursor: grab; touch-action: none;
      ">
        <svg id="world-map-svg" viewBox="0 0 960 520" style="
          width: 100%; height: 100%; display: block;
        " preserveAspectRatio="xMidYMid meet">
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

          <!-- 줌 및 드래그 대상 그룹 -->
          <g id="map-zoom-group" transform="matrix(1 0 0 1 0 0)">
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
            <path d="M 680 240 C 600 230, 550 245, 480 260" fill="none" class="map-route-line"/>
            <path d="M 380 150 C 410 200, 440 230, 480 260" fill="none" class="map-route-line"/>
            <path d="M 270 360 C 330 350, 410 320, 480 260" fill="none" class="map-route-line"/>
            <path d="M 680 240 C 620 170, 490 140, 380 150" fill="none" class="map-route-line" opacity="0.4"/>
            <path d="M 270 360 C 420 420, 580 340, 680 240" fill="none" class="map-route-line" opacity="0.4"/>

            <!-- 6. 인터랙티브 거점 4대 핀/마커 -->

            <!-- [거점 1] 🎪 소폴로스의 야영지 (동쪽 평원: 680, 230) -->
            <g class="map-pin" data-loc="camp" transform="translate(680, 230)" filter="url(#pinShadow)">
              <circle cx="0" cy="0" r="32" fill="#2c1e14" stroke="${ruby ? '#2ed573' : '#d4af37'}" stroke-width="${ruby ? '3.5' : '2.5'}"/>
              <text x="0" y="8" text-anchor="middle" font-size="28">🎪</text>
              <rect x="-55" y="38" width="110" height="24" rx="5" fill="#1c1308" stroke="${ruby ? '#2ed573' : '#d4af37'}" stroke-width="1.5"/>
              <text x="0" y="54" text-anchor="middle" fill="${ruby ? '#2ed573' : '#ffd152'}" font-size="11" font-weight="900">
                ${ruby ? '✅ 1. 야영지 (루비)' : '1. 소폴로스 야영지'}
              </text>
              ${ruby ? `<circle cx="24" cy="-22" r="10" fill="#c0392b" stroke="#fff" stroke-width="1.5"/>
                        <text x="24" y="-18" text-anchor="middle" font-size="10">🔴</text>` : ''}
            </g>

            <!-- [거점 2] ⛏️ 어두운 광맥 갱도 (북쪽 산맥: 380, 140) -->
            <g class="map-pin" data-loc="mine" transform="translate(380, 140)" filter="url(#pinShadow)">
              <circle cx="0" cy="0" r="32" fill="#2c1e14" stroke="${emerald ? '#2ed573' : '#d4af37'}" stroke-width="${emerald ? '3.5' : '2.5'}"/>
              <text x="0" y="8" text-anchor="middle" font-size="28">⛏️</text>
              <rect x="-55" y="38" width="110" height="24" rx="5" fill="#1c1308" stroke="${emerald ? '#2ed573' : '#d4af37'}" stroke-width="1.5"/>
              <text x="0" y="54" text-anchor="middle" fill="${emerald ? '#2ed573' : '#ffd152'}" font-size="11" font-weight="900">
                ${emerald ? '✅ 2. 갱도 (에메랄드)' : '2. 어두운 광맥 갱도'}
              </text>
              ${emerald ? `<circle cx="24" cy="-22" r="10" fill="#27ae60" stroke="#fff" stroke-width="1.5"/>
                           <text x="24" y="-18" text-anchor="middle" font-size="10">🟢</text>` : ''}
            </g>

            <!-- [거점 3] 💎 빛나는 다이아 동굴 (남서쪽 해안 암석: 270, 350) -->
            <g class="map-pin" data-loc="cave" transform="translate(270, 350)" filter="url(#pinShadow)">
              <circle cx="0" cy="0" r="32" fill="#2c1e14" stroke="${sapphire ? '#2ed573' : '#d4af37'}" stroke-width="${sapphire ? '3.5' : '2.5'}"/>
              <text x="0" y="8" text-anchor="middle" font-size="28">💎</text>
              <rect x="-55" y="38" width="110" height="24" rx="5" fill="#1c1308" stroke="${sapphire ? '#2ed573' : '#d4af37'}" stroke-width="1.5"/>
              <text x="0" y="54" text-anchor="middle" fill="${sapphire ? '#2ed573' : '#ffd152'}" font-size="11" font-weight="900">
                ${sapphire ? '✅ 3. 동굴 (사파이어)' : '3. 빛나는 다이아 동굴'}
              </text>
              ${sapphire ? `<circle cx="24" cy="-22" r="10" fill="#2980b9" stroke="#fff" stroke-width="1.5"/>
                            <text x="24" y="-18" text-anchor="middle" font-size="10">🔵</text>` : ''}
            </g>

            <!-- [최종 거점] 🏛️ 테론의 다이아몬드 금고 (섬 중앙 신전: 480, 260) -->
            <g class="map-pin ${vaultUnlocked ? 'vault-unlocked-glow' : ''}" data-loc="vault" transform="translate(480, 260)" filter="url(#pinShadow)">
              ${vaultUnlocked ? `
                <circle cx="0" cy="0" r="48" fill="rgba(245, 176, 65, 0.25)" stroke="#ffd152" stroke-width="2"/>
              ` : ''}
              <circle cx="0" cy="0" r="38" fill="${vaultUnlocked ? '#3d2a13' : '#1c140c'}"
                      stroke="${vaultUnlocked ? '#ffd152' : '#5c4324'}" stroke-width="${vaultUnlocked ? '4' : '2'}"/>
              <text x="0" y="10" text-anchor="middle" font-size="34">🏛️</text>
              <rect x="-70" y="44" width="140" height="26" rx="6"
                    fill="${vaultUnlocked ? '#2a1f14' : '#140f09'}"
                    stroke="${vaultUnlocked ? '#ffd152' : '#5c4324'}" stroke-width="1.8"/>
              <text x="0" y="61" text-anchor="middle" fill="${vaultUnlocked ? '#ffd152' : '#7f8c8d'}" font-size="11" font-weight="900">
                ${vaultUnlocked ? '⚔️ 최종 결전: 다이아 금고' : '🔒 금고 (원석 3개 필요)'}
              </text>
            </g>
          </g>
        </svg>

        <!-- 플로팅 줌 컨트롤 버튼 (+, -, 리셋) -->
        <div style="
          position: absolute; right: 14px; top: 14px; z-index: 15;
          display: flex; flex-direction: column; gap: 8px;
        ">
          <button type="button" class="map-zoom-btn" id="btn-zoom-in" title="지도 확대">＋</button>
          <button type="button" class="map-zoom-btn" id="btn-zoom-out" title="지도 축소">－</button>
          <button type="button" class="map-zoom-btn" id="btn-zoom-reset" title="원래 크기로 전체보기" style="font-size:0.95rem;">↺</button>
        </div>

        <!-- 하단 툴팁 안내 카드 -->
        <div id="map-tooltip" style="
          position: absolute; bottom: 58px; left: 50%; transform: translateX(-50%);
          width: max-content; max-width: 92%; text-align: center; line-height: 1.4;
          background: rgba(24, 18, 11, 0.95); border: 1.5px solid #d4af37; border-radius: 24px;
          padding: 6px 16px; color: #ffeaa7; font-size: 0.86rem; font-weight: 700;
          box-shadow: 0 4px 18px rgba(0,0,0,0.85); pointer-events: none; transition: opacity 0.2s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        ">
          🗺️ 지도의 거점 핀이나 아래 탭을 터치하여 모험을 시작하시오.
        </div>

        <!-- 하단 거점 원터치 퀵 선택 바 -->
        <div style="
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          width: 96%; max-width: 580px; z-index: 15;
          display: flex; justify-content: center; gap: 6px; flex-wrap: nowrap;
        ">
          <button type="button" class="quick-loc-btn ${ruby ? 'cleared' : 'active-target'}" data-loc="camp">
            🎪 1.야영지 ${ruby ? '✓' : ''}
          </button>
          <button type="button" class="quick-loc-btn ${emerald ? 'cleared' : 'active-target'}" data-loc="mine">
            ⛏️ 2.갱도 ${emerald ? '✓' : ''}
          </button>
          <button type="button" class="quick-loc-btn ${sapphire ? 'cleared' : 'active-target'}" data-loc="cave">
            💎 3.동굴 ${sapphire ? '✓' : ''}
          </button>
          <button type="button" class="quick-loc-btn ${vaultUnlocked ? 'active-target' : ''}" data-loc="vault">
            ${vaultUnlocked ? '⚔️ 결전 금고' : '🔒 금고'}
          </button>
        </div>
      </div>
    </div>
  `;

  // 1. 닫기 버튼
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

  // 2. 거점 선택 함수
  function handleSelectLoc(loc) {
    if (loc === 'vault' && !vaultUnlocked) {
      playSfx('error');
      if (tooltip) {
        tooltip.innerHTML = '⚠️ <strong style="color:#e74c3c;">봉인됨!</strong> 3대 원석을 모두 모아야 합니다.';
      }
      return;
    }
    playSfx('click');
    if (onSelectLocation) onSelectLocation(loc);
  }

  // 핀 이벤트 바인딩
  root.querySelectorAll('.map-pin').forEach((pin) => {
    const loc = pin.dataset.loc;
    pin.addEventListener('mouseenter', () => {
      if (locDescs[loc] && tooltip) tooltip.textContent = locDescs[loc];
    });
    pin.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.textContent = '🗺️ 지도의 거점 핀이나 아래 탭을 터치하여 모험을 시작하시오.';
    });
    pin.addEventListener('click', () => handleSelectLoc(loc));
  });

  // 하단 퀵 선택 바 이벤트 바인딩
  root.querySelectorAll('.quick-loc-btn').forEach((btn) => {
    const loc = btn.dataset.loc;
    btn.addEventListener('click', () => handleSelectLoc(loc));
  });

  // 3. 줌 & 드래그(Pan) 엔진
  const zoomGroup = root.querySelector('#map-zoom-group');
  const viewport = root.querySelector('#map-viewport');
  let scale = 1.0;
  let panX = 0;
  let panY = 0;

  function updateTransform() {
    // 960x520 기준 중앙(480, 260) 중심으로 확대/축소
    zoomGroup.setAttribute('transform', `translate(${panX}, ${panY}) translate(480, 260) scale(${scale}) translate(-480, -260)`);
  }

  function setZoom(nextScale) {
    scale = Math.min(3.2, Math.max(1.0, nextScale));
    if (scale === 1.0) {
      panX = 0;
      panY = 0;
    }
    updateTransform();
  }

  root.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
    playSfx('click');
    setZoom(scale * 1.3);
  });
  root.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
    playSfx('click');
    setZoom(scale / 1.3);
  });
  root.querySelector('#btn-zoom-reset')?.addEventListener('click', () => {
    playSfx('click');
    setZoom(1.0);
  });

  // 마우스 휠 줌
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom(scale * factor);
  }, { passive: false });

  // 터치 & 마우스 드래그(Pan) 처리
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialPanX = 0;
  let initialPanY = 0;
  let initialDist = 0;
  let initialScale = 1.0;

  viewport.addEventListener('pointerdown', (e) => {
    // 핀이나 버튼 클릭은 드래그로 오인하지 않도록
    if (e.target.closest('.map-pin') || e.target.closest('button')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialPanX = panX;
    initialPanY = panY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panX = initialPanX + dx;
    panY = initialPanY + dy;
    updateTransform();
  });

  const endDrag = () => {
    if (isDragging) {
      isDragging = false;
      if (viewport) viewport.style.cursor = 'grab';
    }
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // 모바일 2손가락 핀치 줌 지원
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialScale = scale;
    }
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialDist > 0) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / initialDist;
      setZoom(initialScale * ratio);
    }
  }, { passive: false });
}
