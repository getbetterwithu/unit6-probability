import { playSfx, playBgm } from '../engine/sound.js';

export function mountEndingJournal(root, { onRestart, onGoMinigames }) {
  playBgm('ending');

  root.innerHTML = `
    <div class="ending-journal-container" style="position:relative; width:min(860px, 96%); max-height:90vh; background:#1e1610; border:3px solid #d4af37; border-radius:16px; padding:28px 32px; color:#f5eedb; box-shadow:0 20px 80px rgba(0,0,0,0.95); overflow-y:auto; animation:fadeIn 0.5s ease;">
      <!-- 상단 인장 및 타이틀 -->
      <div style="text-align:center; border-bottom:2px solid rgba(245,176,65,0.3); padding-bottom:18px; margin-bottom:22px; position:relative;">
        <span style="font-size:38px;">📜</span>
        <h1 style="font-size:2rem; font-weight:900; color:#ffd152; margin:8px 0 6px; letter-spacing:1px; text-shadow:0 0 20px rgba(245,176,65,0.4);">
          피타고라스 학당 수학 모험록
        </h1>
        <p style="font-size:1.05rem; color:#ffeaa7; margin:0;">
          중학교 2학년 수학 제6단원 · 경우의 수와 확률 완결 수료증
        </p>

        <!-- 합격 낙관 도장 -->
        <div style="position:absolute; right:10px; top:10px; border:3px solid #c0392b; color:#c0392b; font-weight:900; font-size:1.15rem; padding:6px 14px; border-radius:10px; transform:rotate(-8deg); box-shadow:0 0 12px rgba(192,57,43,0.4);">
          💮 완전 정복<br><span style="font-size:0.8rem;">PYTHAGORAS</span>
        </div>
      </div>

      <!-- 탐험가 인적 사항 -->
      <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.35); padding:12px 20px; border-radius:8px; border:1px solid #5c4324; margin-bottom:24px; font-size:0.95rem;">
        <div><strong>탐험 대원:</strong> <span style="color:#5dade2;">폴리곤</span> & <span style="color:#f48fb1;">이리스</span></div>
        <div><strong>인도자:</strong> <span style="color:#ffd152;">탈레스 & 피타고라스</span></div>
        <div><strong>최종 상태:</strong> <span style="color:#2ecc71; font-weight:800;">다이아 금고 영구 봉인 성공</span></div>
      </div>

      <!-- 6대 챕터 탐험 발자취 (타임라인) -->
      <h3 style="color:#ffd152; font-size:1.2rem; margin:0 0 14px; border-left:4px solid #d4af37; padding-left:10px;">
        여정의 발자취 (Chronicle)
      </h3>

      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:28px;">
        <div style="background:#261a11; border-left:3px solid #f39c12; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#ffd152; font-size:0.95rem;">제1장 · 피타고라스 학당의 밀명</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">테론의 제안과 고대 파피루스 수호 임무 수락.</div>
        </div>

        <div style="background:#261a11; border-left:3px solid #f39c12; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#ffd152; font-size:0.95rem;">제2장 · 소폴로스의 야영지 (합의 법칙 & 정오각형)</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">네모로직 지도 복원 완수, 정오각형 제단 룬 이동 확률(7/36) 돌파 및 🔴 루비 원석 확보.</div>
        </div>

        <div style="background:#261a11; border-left:3px solid #f39c12; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#ffd152; font-size:0.95rem;">제3장 · 어두운 광맥 갱도 (곱의 법칙 & 일차방정식)</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">오륜 한붓그리기 선로 연결, 일차방정식 석문 해제(5/36) 통과 및 🟢 에메랄드 원석 확보.</div>
        </div>

        <div style="background:#261a11; border-left:3px solid #f39c12; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#ffd152; font-size:0.95rem;">제4장 · 빛나는 다이아 동굴 (정령 잡기 & 곱셈 확률)</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">피캐스의 신비한 정령 3단계 포획, 두 주사위 곱 짝수 확률(3/4) 해결 및 🔵 사파이어 원석 확보.</div>
        </div>

        <div style="background:#261a11; border-left:3px solid #f39c12; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#ffd152; font-size:0.95rem;">제5장 · 학당 서고의 결전 준비</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">15초 스피드 암산 10문제 돌파, 파피루스 전개도 주사위 확률(5/36) 검증 완수.</div>
        </div>

        <div style="background:#261a11; border-left:3px solid #2ecc71; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#2ecc71; font-size:0.95rem;">제6장 · 다이아 금고 결전 (논리 반박 & 금고 영구 봉인)</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">직육면체 주사위의 1:1:2.5 편향 궤변 논파, 3중 밸브 및 빗장 핀 확률 완벽 계산으로 금고 안치 완료.</div>
        </div>
      </div>

      <!-- 탈레스 스승의 격려사 -->
      <div style="background:rgba(212,175,55,0.12); border:1.5px solid #d4af37; border-radius:10px; padding:16px; margin-bottom:24px; text-align:center;">
        <p style="font-size:1.05rem; font-style:italic; color:#ffeaa7; margin:0; line-height:1.6;">
          "수학은 단순한 계산이 아니라, 세상의 거짓과 혼란 속에서 진실의 균형을 찾는 빛이다.<br>그대들의 지혜로 학당의 파피루스는 영원히 보존될 것이다."
        </p>
        <span style="display:block; margin-top:8px; font-weight:800; font-size:0.9rem; color:#ffd152;">— 스승 탈레스 & 피타고라스 —</span>
      </div>

      <!-- 하단 버튼 바 -->
      <div style="display:flex; gap:14px; justify-content:center;">
        <button type="button" id="journal-btn-restart" style="background:#2a1f14; color:#ffd152; border:1.5px solid #d4af37; border-radius:8px; padding:12px 22px; font-size:1rem; font-weight:800; cursor:pointer;">
          🔄 처음부터 다시 하기
        </button>
        <button type="button" id="journal-btn-games" style="background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; border-radius:8px; padding:12px 26px; font-size:1.05rem; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4);">
          🎲 미니게임 체험관 가기 ▶
        </button>
      </div>
    </div>
  `;

  root.querySelector('#journal-btn-restart').addEventListener('click', () => {
    playSfx('click');
    if (onRestart) onRestart();
  });

  root.querySelector('#journal-btn-games').addEventListener('click', () => {
    playSfx('click');
    if (onGoMinigames) onGoMinigames();
    else location.href = 'games.html';
  });
}
