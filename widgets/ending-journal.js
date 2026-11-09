import { playSfx, playBgm } from '../engine/sound.js';

export function mountEndingJournal(root, { onRestart, onGoMinigames, playerName }) {
  playBgm('ending');

  const studentName = playerName || localStorage.getItem('u6_player_name') || '용감한 탐험가';
  const clearDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  root.innerHTML = `
    <div class="ending-journal-container" style="
      position:relative; width:min(900px, 96%); max-height:92vh; background:#1e1610;
      border:3px solid #d4af37; border-radius:16px; padding:28px 32px; color:#f5eedb;
      box-shadow:0 20px 80px rgba(0,0,0,0.95); overflow-y:auto; animation:fadeIn 0.5s ease;
    ">
      <style>
        @media print {
          body * { visibility: hidden; }
          .ending-journal-container, .ending-journal-container * { visibility: visible; }
          .ending-journal-container { position: absolute; left: 0; top: 0; width: 100% !important; max-height: none !important; box-shadow: none !important; border: 2px solid #000; background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
        }
      </style>

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

      <!-- 탐험가 인적 사항 (학생 이름 강조!) -->
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; background:rgba(0,0,0,0.4); padding:14px 20px; border-radius:8px; border:1px solid #5c4324; margin-bottom:24px; font-size:0.95rem;">
        <div><strong>수료 대원:</strong> <span style="color:#ffd152; font-weight:900; font-size:1.1rem; text-decoration:underline;">${studentName}</span> 대원</div>
        <div><strong>동료 대원:</strong> <span style="color:#5dade2;">폴리곤</span> & <span style="color:#f48fb1;">이리스</span></div>
        <div><strong>인도자:</strong> <span style="color:#ffd152;">탈레스 & 피타고라스</span></div>
        <div><strong>수료 일자:</strong> <span style="color:#bdc3c7;">${clearDate}</span></div>
      </div>

      <!-- 6대 챕터 탐험 발자취 (타임라인) -->
      <h3 style="color:#ffd152; font-size:1.2rem; margin:0 0 14px; border-left:4px solid #d4af37; padding-left:10px;">
        여정의 발자취 (Chronicle)
      </h3>

      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:28px;">
        <div style="background:#261a11; border-left:3px solid #f39c12; padding:10px 16px; border-radius:0 8px 8px 0;">
          <div style="font-weight:800; color:#ffd152; font-size:0.95rem;">제1장 · 피타고라스 학당의 밀명</div>
          <div style="font-size:0.85rem; color:#bdc3c7; margin-top:2px;">테론의 제안과 고대 파피루스 수호 임무 수락. 케팔로니아 탐험 지도 획득.</div>
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
          "수학은 단순한 계산이 아니라, 세상의 거짓과 혼란 속에서 진실의 균형을 찾는 빛이다.<br>
          <strong style="color:#ffd152;">${studentName}</strong> 대원과 학당 아이들의 지혜로 파피루스는 영원히 보존될 것이다."
        </p>
        <span style="display:block; margin-top:8px; font-weight:800; font-size:0.9rem; color:#ffd152;">— 스승 탈레스 & 피타고라스 —</span>
      </div>

      <!-- 결과 소장 및 공유 액션 바 (인쇄 / 메일 전송) -->
      <div class="no-print" style="
        background: rgba(0,0,0,0.5); border: 1.5px solid #5c4324; border-radius: 10px;
        padding: 14px 20px; margin-bottom: 24px; display: flex; flex-wrap: wrap;
        justify-content: space-between; align-items: center; gap: 12px;
      ">
        <div style="font-size:0.95rem; color:#bdc3c7;">
          📜 나만의 완결 수료증을 소장하거나 선생님/부모님께 결과를 전송하세요:
        </div>
        <div style="display:flex; gap:10px;">
          <button type="button" id="journal-btn-print" style="
            background: linear-gradient(135deg, #d4af37, #f39c12); color: #1c1308;
            border: none; border-radius: 6px; padding: 8px 16px; font-size: 0.95rem;
            font-weight: 800; cursor: pointer; box-shadow: 0 2px 8px rgba(245,176,65,0.4);
          ">
            🖨️ 수료증 인쇄 / PDF 저장
          </button>
          <button type="button" id="journal-btn-mail" style="
            background: #2a1f14; color: #ffeaa7; border: 1px solid #d4af37;
            border-radius: 6px; padding: 8px 16px; font-size: 0.95rem;
            font-weight: 800; cursor: pointer;
          ">
            ✉️ 결과 메일로 보내기
          </button>
        </div>
      </div>

      <!-- 하단 탐험 내비게이션 버튼 바 -->
      <div class="no-print" style="display:flex; gap:14px; justify-content:center;">
        <button type="button" id="journal-btn-restart" style="
          background:#2a1f14; color:#ffd152; border:1.5px solid #d4af37;
          border-radius:8px; padding:12px 22px; font-size:1rem; font-weight:800; cursor:pointer;
        ">
          🔄 처음부터 다시 하기
        </button>
        <button type="button" id="journal-btn-games" style="
          background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff;
          border:none; border-radius:8px; padding:12px 26px; font-size:1.05rem; font-weight:800;
          cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4);
        ">
          🎲 미니게임 체험관 가기 ▶
        </button>
      </div>
    </div>
  `;

  // 수료증 인쇄/PDF 저장 이벤트
  root.querySelector('#journal-btn-print').addEventListener('click', () => {
    playSfx('click');
    window.print();
  });

  // 이메일 전송 (mailto: 기본 메일 앱 연동)
  root.querySelector('#journal-btn-mail').addEventListener('click', () => {
    playSfx('click');
    const userEmail = prompt('결과를 전송받을 이메일 주소를 입력하세요:', '');
    if (userEmail && userEmail.includes('@')) {
      const subject = encodeURIComponent(`[피타고라스 학당] ${studentName} 대원의 수학 모험록 완결 수료증`);
      const body = encodeURIComponent(
        `축하합니다! ${studentName} 대원이 중학교 2학년 수학 제6단원 <폴리곤과 운명의 주사위(경우의 수와 확률)>의 모든 시험과 다이아몬드 금고 봉인을 완벽하게 완수하였습니다.\n\n` +
        `■ 수료 대원: ${studentName}\n` +
        `■ 수료 일자: ${clearDate}\n` +
        `■ 획득 원석: 루비(🔴), 에메랄드(🟢), 사파이어(🔵) 3대 원석 완전 정복\n` +
        `■ 최종 평가: 기하학의 진정한 수호자 (완전 정복 합격 낙관 수여)\n\n` +
        `— 피타고라스 학당 —`
      );
      window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
    } else if (userEmail) {
      alert('올바른 이메일 주소를 입력해 주세요.');
    }
  });

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
