/**
 * widgets/ending-journal.js
 * 피타고라스 학당 수학 모험 완결 수료증 (A4 상장 규격)
 * - A4 세로 1장 완벽 출력용 상장 디자인 (@media print, print-color-adjust: exact)
 * - 이미지(PNG) 저장 (Canvas 기반 1200x820 초고화질 상장 렌더링)
 * - PDF 저장 / 인쇄 (A4 단 1장 완벽 상장 레이아웃)
 * - 내 이메일로 수료증 사본 받기 (GAS clasp 연동)
 * - '여사건' 고교 용어 영구 삭제, TMI 분수(7/36 등) 완전 배제
 * - 하단 재접속 QR코드, 접속 주소, BetterwithU 공식 푸터, 문의 링크 마스킹
 * - 선행 저장/발송 시 '처음부터 다시 하기' 잠금 해제 & 완전 초기화
 */

import { playSfx } from '../engine/sound.js';

// Google Apps Script clasp 배포 Web App URL
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxT5_FPxPV-9dzGtXhaV3VIp8Nhv_XwKEla6ixOtU9CMjD2gfMi-9CBQe6SgnkUwMEmcw/exec';

/**
 * 순수 HTML5 Canvas를 이용해 1200x850 해상도의 고화질 황금 상장 이미지를 실시간 렌더링하여 다운로드합니다.
 */
function downloadCertificateImage(studentName, clearDate, certNumber, siteUrl) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // 1. 배경: 고급 아이보리/고문서 양장지 텍스처
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 850);
  bgGrad.addColorStop(0, '#0d1117');
  bgGrad.addColorStop(0.5, '#161d27');
  bgGrad.addColorStop(1, '#090d13');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 850);

  // 2. 2중 황금 상장 테두리 (Golden Diploma Frame)
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, 1128, 778);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, 1104, 754);

  // 4대 모서리 기하학 장식
  const corners = [[56, 56], [1144, 56], [56, 794], [1144, 794]];
  ctx.fillStyle = '#ffd152';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. 상단 헤더 문양 및 공식 상장 타이틀
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 15px sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('✦ ACADEMIA PYTHAGORICA ✦', 600, 95);

  ctx.fillStyle = '#ffd152';
  ctx.font = '900 44px sans-serif';
  ctx.letterSpacing = '6px';
  ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
  ctx.shadowBlur = 14;
  ctx.fillText('수  료  증', 600, 155);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 14px sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 600, 182);

  ctx.fillStyle = '#8b949e';
  ctx.font = '13px monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText(`발급 인증 번호: ${certNumber}`, 600, 212);

  // 상단 구분선
  const lineGrad = ctx.createLinearGradient(220, 225, 980, 225);
  lineGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
  lineGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.8)');
  lineGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, 228);
  ctx.lineTo(980, 228);
  ctx.stroke();

  // 4. 수여 대상자
  ctx.fillStyle = '#ffd152';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('명 예  수 학  대 원', 600, 270);

  ctx.fillStyle = '#58a6ff';
  ctx.font = '900 40px sans-serif';
  ctx.fillText(`${studentName}  대원`, 600, 320);

  // 5. 공인 수여 문구
  ctx.fillStyle = '#f0f6fc';
  ctx.font = '18px sans-serif';
  ctx.fillText('위 사람은 중학교 2학년 수학 제6단원 「경우의 수와 확률」의', 600, 370);
  ctx.fillText('모든 모험 시련을 우수한 수학적 탐구력과 논리적 추론으로 완수하였기에', 600, 400);
  ctx.fillText('피타고라스 학당의 명예 대원으로 공인하며 본 수료증을 수여합니다.', 600, 430);

  // 6. 단원별 해결 과제 (여사건 X, TMI 분수 X)
  ctx.fillStyle = 'rgba(22, 27, 34, 0.85)';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(140, 460, 920, 110, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd152';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('• 제1·2장 · 페르시아 대상 : 사막 갈림길 경로 선택, 비밀번호 암호 해독', 170, 492);
  ctx.fillText('• 제3·4장 · 알렉산드리아 : 이웃한 자리배치, 자격별 대표 선출', 170, 517);
  ctx.fillText('• 제5장 · 학당 서고 : 과녁 적중 확률, 특수 전개도 주사위의 곱', 170, 542);
  ctx.fillText('• 제6장 · 다이아 금고 : 편향 주사위 복합 확률, 다중 빗장 핀 잠금', 170, 567);

  // 7. 격언 및 스승 서명
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffeaa7';
  ctx.font = 'italic 16px sans-serif';
  ctx.fillText('"수학은 단순한 계산이 아니라, 세상의 거짓과 혼란 속에서 진실의 균형을 찾는 빛이다."', 600, 615);
  ctx.fillStyle = '#ffd152';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('— 스승 탈레스 & 피타고라스 —', 600, 642);

  // 8. 붉은색 공식 낙관 직인 (주작 도장)
  ctx.save();
  ctx.translate(940, 640);
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.strokeRect(-36, -36, 72, 72);
  ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-31, -31, 62, 62);
  ctx.fillStyle = '#e74c3c';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('피타고라스', 0, -12);
  ctx.fillText('학당총장', 0, 7);
  ctx.fillText('인 (印)', 0, 24);
  ctx.restore();

  // 9. 하단 발급 정보 및 BetterwithU 푸터
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8b949e';
  ctx.font = '13px sans-serif';
  ctx.fillText(`수료 일시 : ${clearDate} · 피타고라스 학당`, 70, 745);
  ctx.fillText(`접속 웹 주소 : ${siteUrl}`, 70, 770);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Designed & Developed by BetterwithU', 1130, 745);
  ctx.fillStyle = '#8b949e';
  ctx.font = '12px sans-serif';
  ctx.fillText('공식 수료 인증 (Official Educational Diploma)', 1130, 770);

  // 다운로드
  const sanitizedName = studentName.replace(/[^a-zA-Z0-9가-힣]/g, '_') || '대원';
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `피타고라스_학당_수료증_${sanitizedName}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }, 'image/png');
}

/**
 * 엔딩 모험록 및 상장 위젯을 마운트합니다.
 */
export function mountEndingJournal(container, onRestart, onGoMinigames) {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'ending-journal-root';
  root.style.cssText = `
    position: absolute; inset: 0; z-index: 50;
    background: radial-gradient(circle at 50% 25%, #181c24, #080b10 90%);
    overflow-y: auto; overflow-x: hidden;
    padding: 24px 16px 80px; box-sizing: border-box;
    display: flex; justify-content: center;
  `;
  container.appendChild(root);

  const studentName = localStorage.getItem('u6_player_name') || '67 대원';
  const clearDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const certNumber = '제 PYTH-2026-' + Math.floor(1000 + Math.random() * 9000) + ' 호';
  const currentUrl = window.location.href.split('?')[0];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;

  root.innerHTML = `
    <style>
      /* ============================================================== */
      /* A4 가로 1장 완벽 상장 인쇄 스타일 (@media print)                */
      /* ============================================================== */
      @page {
        size: A4 landscape;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important; padding: 0 !important;
          background: #0d1117 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          width: 297mm !important; height: 210mm !important;
          overflow: hidden !important;
        }
        body * { visibility: hidden !important; }
        #ending-journal-root, #ending-journal-root * { visibility: visible !important; }
        #ending-journal-root {
          position: absolute !important; left: 0 !important; top: 0 !important;
          width: 297mm !important; height: 210mm !important;
          background: #0d1117 !important; color: #f0f6fc !important;
          padding: 8mm 10mm !important; margin: 0 !important;
          box-sizing: border-box !important;
          display: flex !important; justify-content: center !important; align-items: center !important;
          overflow: hidden !important;
        }
        .diploma-card {
          width: 100% !important; max-width: calc(297mm - 20mm) !important;
          height: calc(210mm - 16mm) !important; max-height: calc(210mm - 16mm) !important;
          box-sizing: border-box !important;
          border: 3.5px solid #d4af37 !important;
          background: #0d1117 !important; color: #f0f6fc !important;
          box-shadow: none !important;
          padding: 16px 26px 14px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          display: flex !important; flex-direction: column !important; justify-content: space-between !important;
        }
        .no-print { display: none !important; }
      }

      .action-btn {
        transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
      }
      .action-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.1);
      }
      .action-btn:active {
        transform: translateY(0);
      }
    </style>

    <!-- [황금 상장 본체 (화면 및 PDF 인쇄 공용 - 가로형 상장 비율)] -->
    <div style="max-width: 940px; width: 100%; display: flex; flex-direction: column; align-items: center;">

      <div class="diploma-card" style="
        width: 100%; box-sizing: border-box;
        background: linear-gradient(150deg, #131922, #0a0d13 95%);
        border: 3.5px solid #d4af37; border-radius: 12px;
        box-shadow: 0 16px 50px rgba(0,0,0,0.85), 0 0 35px rgba(212,175,55,0.25);
        padding: 26px 32px 20px; color: #f0f6fc; position: relative;
      ">
        <!-- 안쪽 보조 황금 테두리 -->
        <div style="
          position: absolute; inset: 6px; border: 1.5px solid rgba(212,175,55,0.45);
          border-radius: 8px; pointer-events: none;
        "></div>

        <!-- 4대 모서리 기하학 장식 원 -->
        <div style="position:absolute; top:12px; left:12px; width:8px; height:8px; background:#ffd152; border-radius:50%;"></div>
        <div style="position:absolute; top:12px; right:12px; width:8px; height:8px; background:#ffd152; border-radius:50%;"></div>
        <div style="position:absolute; bottom:12px; left:12px; width:8px; height:8px; background:#ffd152; border-radius:50%;"></div>
        <div style="position:absolute; bottom:12px; right:12px; width:8px; height:8px; background:#ffd152; border-radius:50%;"></div>

        <!-- 1. 상단 공식 헤더 및 상장 타이틀 -->
        <div style="text-align:center; margin-bottom: 20px;">
          <div style="font-size: 0.8rem; letter-spacing: 5px; color: #d4af37; font-weight: bold; margin-bottom: 6px;">
            ✦ ACADEMIA PYTHAGORICA ✦
          </div>
          <h1 style="
            margin: 0; font-size: 2.25rem; font-weight: 900; letter-spacing: 6px; color: #ffd152;
            text-shadow: 0 0 16px rgba(245,176,65,0.5);
          ">
            수 료 증
          </h1>
          <div style="font-size: 0.78rem; letter-spacing: 3px; color: #c9d1d9; font-weight: bold; margin-top: 4px;">
            CERTIFICATE OF ACHIEVEMENT
          </div>
          <div style="font-size: 0.82rem; color: #8b949e; margin-top: 8px;">
            발급 인증 번호 : <span style="color: #ffd152; font-family: monospace;">${certNumber}</span>
          </div>
        </div>

        <!-- 황금 구분선 -->
        <div style="height: 1.5px; background: linear-gradient(90deg, transparent, #d4af37 20%, #d4af37 80%, transparent); margin-bottom: 22px;"></div>

        <!-- 2. 수여자 정보 -->
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="font-size: 1.05rem; color: #ffd152; font-weight: bold; margin-bottom: 4px;">
            명 예 수 학 대 원
          </div>
          <div style="font-size: 1.85rem; color: #58a6ff; font-weight: 900; letter-spacing: 1px;">
            ${studentName}
          </div>
        </div>

        <!-- 3. 공인 수여 본문 문구 -->
        <div style="text-align: center; margin-bottom: 24px; line-height: 1.8; color: #f0f6fc; font-size: 0.98rem;">
          위 사람은 중학교 2학년 수학 제6단원 <strong>「경우의 수와 확률」</strong>의<br>
          모든 모험 시련을 뛰어난 수학적 탐구력과 논리적 추론으로 완수하였기에<br>
          피타고라스 학당의 명예 대원으로 공인하며 본 수료증을 수여합니다.
        </div>

        <!-- 4. 단원별 해결 과제 (여사건 X, TMI 분수 X) -->
        <div style="
          background: rgba(22, 27, 34, 0.75); border: 1.2px solid rgba(212,175,55,0.35);
          border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 0.86rem;
        ">
          <div>
            <span style="color:#e74c3c; font-weight:800;">• 제1·2장 (경우의 수):</span>
            <span style="color:#c9d1d9;"> 사막 갈림길 경로, 비밀번호 해독</span>
          </div>
          <div>
            <span style="color:#3498db; font-weight:800;">• 제3·4장 (순서와 대표):</span>
            <span style="color:#c9d1d9;"> 이웃한 자리배치, 자격별 대표 선출</span>
          </div>
          <div>
            <span style="color:#f1c40f; font-weight:800;">• 제5장 (확률의 뜻과 성질):</span>
            <span style="color:#c9d1d9;"> 과녁 적중 확률, 특수 전개도 주사위</span>
          </div>
          <div>
            <span style="color:#2ecc71; font-weight:800;">• 제6장 (확률의 계산):</span>
            <span style="color:#c9d1d9;"> 편향 주사위 검증, 다중 빗장 잠금</span>
          </div>
        </div>

        <!-- 5. 스승 격언 및 공식 직인(도장) -->
        <div style="
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: rgba(0,0,0,0.35); border-left: 3px solid #d4af37;
          border-radius: 0 8px 8px 0; margin-bottom: 22px;
        ">
          <div style="flex: 1; padding-right: 12px;">
            <div style="font-size: 0.88rem; font-style: italic; color: #ffeaa7; line-height: 1.5;">
              "수학은 단순한 계산이 아니라, 세상의 거짓과 혼란 속에서 진실의 균형을 찾는 빛이다."
            </div>
            <div style="font-size: 0.82rem; color: #ffd152; font-weight: bold; margin-top: 4px;">
              — 스승 탈레스 &amp; 피타고라스 —
            </div>
            <div style="font-size: 0.8rem; color: #8b949e; margin-top: 4px;">
              수료 일시 : ${clearDate}
            </div>
          </div>

          <!-- 붉은색 공식 낙관 직인 -->
          <div style="
            width: 66px; height: 66px; border: 2.5px solid #e74c3c; border-radius: 6px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #e74c3c; font-weight: 900; font-size: 11px; line-height: 1.25;
            background: rgba(231,76,60,0.06); box-shadow: 0 0 10px rgba(231,76,60,0.25);
            flex-shrink: 0;
          ">
            <span>피타고라스</span>
            <span>학당총장</span>
            <span>인 (印)</span>
          </div>
        </div>

        <!-- 6. [하단 상장 푸터] QR코드, 접속 주소, BetterwithU 공식 푸터 및 문의 링크 (인쇄·화면 공통) -->
        <div style="
          border-top: 1px solid rgba(212,175,55,0.35); padding-top: 14px;
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
        ">
          <!-- 좌측: 모험 재접속 QR코드 및 주소 -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${qrUrl}" alt="접속 QR코드" class="qr-img" style="
              width: 58px; height: 58px; border: 1.5px solid #d4af37; border-radius: 6px;
              background: #fff; padding: 2px; box-sizing: border-box;
            "/>
            <div>
              <div style="font-size: 0.82rem; font-weight: bold; color: #ffd152;">
                📱 모험 다시 접속 및 출처
              </div>
              <div style="font-size: 0.75rem; color: #8b949e; word-break: break-all;">
                ${currentUrl}
              </div>
            </div>
          </div>

          <!-- 우측: BetterwithU 제작자 푸터 및 마스킹된 교육 문의 링크 -->
          <div style="text-align: right;">
            <div style="font-size: 0.85rem; color: #c9d1d9;">
              Designed &amp; Developed by <strong style="color: #ffd152; font-weight: 800;">BetterwithU</strong>
            </div>
            <div style="margin-top: 4px;">
              <button type="button" id="btn-inquiry-mail" style="
                background: none; border: none; color: #58a6ff; font-size: 0.78rem;
                cursor: pointer; text-decoration: underline; padding: 0;
              ">
                📧 교육 문의 및 피드백 보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- [독립 조작 패널 (인쇄 시 숨김: no-print)]                        -->
      <!-- ============================================================== -->
      <div class="no-print" style="
        width: 100%; box-sizing: border-box; margin-top: 20px;
        background: rgba(13, 17, 23, 0.85); border: 1.5px solid #d4af37; border-radius: 12px;
        padding: 18px 20px;
      ">
        <div style="font-size: 0.95rem; font-weight: 800; color: #ffd152; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>📜 수료증 영구 소장 및 본인 사본 수령</span>
          <span style="font-size: 0.78rem; font-weight: normal; color: #8b949e;">(아래 중 하나를 완료하면 다시 하기가 활성화됩니다)</span>
        </div>
        <div style="font-size: 0.84rem; color: #8b949e; margin-bottom: 14px;">
          A4 규격 상장 PDF 저장, 고화질 이미지(PNG) 다운로드, 또는 학생 본인 이메일로 수료증 사본을 발송하세요.
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px;">
          <!-- 1. 이미지(PNG) 저장 버튼 -->
          <button type="button" id="journal-btn-img" class="action-btn" style="
            background: linear-gradient(135deg, #e67e22, #d35400); color: #fff;
            border: 1px solid #f39c12; border-radius: 8px; padding: 11px 14px; font-size: 0.92rem;
            font-weight: 800; cursor: pointer; box-shadow: 0 3px 10px rgba(230,126,34,0.35);
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            🖼️ 수료증 이미지(PNG) 저장
          </button>

          <!-- 2. PDF 저장 / 인쇄 버튼 -->
          <button type="button" id="journal-btn-print" class="action-btn" style="
            background: linear-gradient(135deg, #d4af37, #f39c12); color: #1c1308;
            border: 1px solid #ffd152; border-radius: 8px; padding: 11px 14px; font-size: 0.92rem;
            font-weight: 800; cursor: pointer; box-shadow: 0 3px 10px rgba(245,176,65,0.35);
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            📄 수료증 PDF 저장 / 인쇄
          </button>

          <!-- 3. 내 이메일로 수료증 사본 받기 -->
          <button type="button" id="journal-btn-mail-modal" class="action-btn" style="
            background: linear-gradient(135deg, #2980b9, #1f618d); color: #fff;
            border: 1px solid #5dade2; border-radius: 8px; padding: 11px 14px; font-size: 0.92rem;
            font-weight: 800; cursor: pointer; box-shadow: 0 3px 10px rgba(41,128,185,0.35);
            display: flex; align-items: center; justify-content: center; gap: 6px;
          ">
            ✉️ 내 이메일로 수료증 받기
          </button>
        </div>

        <!-- 피드백 배너 -->
        <div id="save-status-banner" style="display: none; margin-top: 14px; padding: 10px 14px; background: rgba(46,204,113,0.15); border: 1px solid #2ecc71; border-radius: 6px; color: #2ecc71; font-size: 0.88rem; font-weight: bold; text-align: center;">
        </div>
      </div>

      <!-- 하단 내비게이션 바 -->
      <div class="no-print" style="width: 100%; display:flex; flex-direction:column; align-items:center; gap:10px; margin-top: 18px;">
        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap; width:100%;">
          <button type="button" id="journal-btn-restart" disabled style="
            background:#161b22; color:#7f8c8d; border:1.5px solid #30363d;
            border-radius:8px; padding:12px 22px; font-size:1rem; font-weight:800; cursor:not-allowed;
            opacity: 0.45; transition: all 0.3s ease; flex: 1; max-width: 320px;
          " title="수료증을 이미지나 PDF로 저장하거나 본인 메일로 수령한 후에 다시 시작할 수 있습니다.">
            🔒 처음부터 다시 하기
          </button>
          <button type="button" id="journal-btn-games" class="action-btn" style="
            background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff;
            border:none; border-radius:8px; padding:12px 26px; font-size:1.02rem; font-weight:800;
            cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4); flex: 1; max-width: 260px;
          ">
            🎲 미니게임 체험관 가기 ▶
          </button>
        </div>
        <div id="restart-guide-text" style="font-size:0.8rem; color:#8b949e;">
          ※ 수료증을 이미지/PDF로 저장하거나 이메일로 수령해야 [처음부터 다시 하기]가 활성화됩니다.
        </div>
      </div>
    </div>

    <!-- [이메일 사본 발송 모달 (인쇄 시 숨김)] -->
    <div id="email-modal-overlay" class="no-print" style="
      display: none; position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
      align-items: center; justify-content: center; padding: 16px;
    ">
      <div style="
        background: #161b22; border: 2px solid #58a6ff; border-radius: 14px;
        max-width: 460px; width: 100%; padding: 24px; box-shadow: 0 12px 36px rgba(0,0,0,0.85);
        color: #f0f6fc; box-sizing: border-box;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0; font-size:1.15rem; color:#58a6ff; font-weight:800;">
            ✉️ 내 이메일로 수료증 사본 받기
          </h3>
          <button type="button" id="btn-modal-close" style="
            background:none; border:none; color:#8b949e; font-size:1.3rem; cursor:pointer; padding:0;
          ">✕</button>
        </div>

        <p style="font-size:0.88rem; color:#c9d1d9; line-height:1.5; margin:0 0 16px;">
          학생 본인의 이메일 주소를 입력하시면, 피타고라스 학당의 <strong>황금 상장 사본(공식 서식 포함)</strong>이 즉시 발송됩니다.
        </p>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:0.82rem; color:#8b949e; margin-bottom:6px;">수신 이메일 주소</label>
          <input type="email" id="input-recipient-email" placeholder="student@example.com" style="
            width:100%; box-sizing:border-box; padding:10px 14px; font-size:0.95rem;
            background:#0d1117; border:1px solid #30363d; border-radius:6px; color:#fff;
            outline:none;
          "/>
        </div>

        <div id="modal-msg" style="display:none; font-size:0.85rem; padding:8px 12px; border-radius:6px; margin-bottom:14px;"></div>

        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" id="btn-modal-cancel" style="
            background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:6px;
            padding:8px 16px; font-size:0.9rem; font-weight:600; cursor:pointer;
          ">취소</button>
          <button type="button" id="btn-modal-send" style="
            background:linear-gradient(135deg, #238636, #2ea043); color:#fff;
            border:none; border-radius:6px; padding:8px 20px; font-size:0.9rem; font-weight:800;
            cursor:pointer; box-shadow:0 2px 8px rgba(46,160,67,0.4);
          ">🚀 즉시 발송</button>
        </div>
      </div>
    </div>
  `;

  // 상태 관리
  let isSavedOrSent = false;
  const btnRestart = root.querySelector('#journal-btn-restart');
  const banner = root.querySelector('#save-status-banner');
  const guideText = root.querySelector('#restart-guide-text');

  function enableRestartButton(successText) {
    isSavedOrSent = true;
    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = successText;
    }
    if (guideText) {
      guideText.innerHTML = '✨ 수료증 저장이 확인되었습니다. 이제 새로운 모험을 시작할 수 있습니다!';
      guideText.style.color = '#2ecc71';
    }
    if (btnRestart) {
      btnRestart.disabled = false;
      btnRestart.style.opacity = '1';
      btnRestart.style.cursor = 'pointer';
      btnRestart.style.background = '#2a1f14';
      btnRestart.style.color = '#ffd152';
      btnRestart.style.borderColor = '#d4af37';
      btnRestart.title = '모든 데이터를 초기화하고 처음부터 다시 시작합니다.';
      btnRestart.innerHTML = '🔄 처음부터 다시 하기';
      btnRestart.style.boxShadow = '0 0 16px rgba(245,176,65,0.4)';
    }
  }

  // 1. 수료증 이미지(PNG) 저장
  root.querySelector('#journal-btn-img').addEventListener('click', () => {
    playSfx('click');
    downloadCertificateImage(studentName, clearDate, certNumber, currentUrl);
    enableRestartButton('🖼️ 황금 상장 이미지가 다운로드되었습니다. (소장 완료)');
  });

  // 2. 수료증 PDF 저장 / 인쇄 (A4 가로 1장 규격 & 파일명에 학생 이름 자동 반영)
  root.querySelector('#journal-btn-print').addEventListener('click', () => {
    playSfx('click');
    const originalTitle = document.title;
    const sanitizedName = studentName.replace(/[^a-zA-Z0-9가-힣]/g, '_') || '대원';
    // 브라우저 인쇄 다이얼로그의 기본 PDF 파일명으로 document.title이 사용됨
    document.title = `피타고라스_학당_수료증_${sanitizedName}`;
    window.print();
    enableRestartButton('📄 A4 가로 규격 황금 상장 PDF 저장 및 인쇄가 완료되었습니다.');
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  });

  // 3. 내 이메일로 수료증 받기 모달 제어
  const modalOverlay = root.querySelector('#email-modal-overlay');
  const inputEmail = root.querySelector('#input-recipient-email');
  const modalMsg = root.querySelector('#modal-msg');
  const btnModalSend = root.querySelector('#btn-modal-send');

  root.querySelector('#journal-btn-mail-modal').addEventListener('click', () => {
    playSfx('click');
    modalOverlay.style.display = 'flex';
    inputEmail.focus();
  });

  const closeModal = () => {
    modalOverlay.style.display = 'none';
    modalMsg.style.display = 'none';
  };
  root.querySelector('#btn-modal-close').addEventListener('click', closeModal);
  root.querySelector('#btn-modal-cancel').addEventListener('click', closeModal);

  // 이메일 즉시 발송 (GAS 웹앱 연동)
  btnModalSend.addEventListener('click', async () => {
    const email = inputEmail.value.trim();
    if (!email || !email.includes('@')) {
      modalMsg.style.display = 'block';
      modalMsg.style.background = 'rgba(231, 76, 60, 0.2)';
      modalMsg.style.border = '1px solid #e74c3c';
      modalMsg.style.color = '#e74c3c';
      modalMsg.textContent = '올바른 이메일 주소를 입력해 주세요.';
      return;
    }

    playSfx('click');
    btnModalSend.disabled = true;
    btnModalSend.textContent = '발송 중... ⏳';

    modalMsg.style.display = 'block';
    modalMsg.style.background = 'rgba(88, 166, 255, 0.15)';
    modalMsg.style.border = '1px solid #58a6ff';
    modalMsg.style.color = '#58a6ff';
    modalMsg.textContent = '황금 상장 사본을 발송하고 있습니다...';

    const payload = {
      email: email,
      studentName: studentName,
      certNumber: certNumber,
      clearDate: clearDate,
      siteUrl: currentUrl
    };

    try {
      await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      modalMsg.style.background = 'rgba(46, 204, 113, 0.2)';
      modalMsg.style.border = '1px solid #2ecc71';
      modalMsg.style.color = '#2ecc71';
      modalMsg.textContent = `✅ [${email}] 주소로 상장 사본이 성공적으로 발송되었습니다!`;
      btnModalSend.textContent = '발송 완료 ✓';

      enableRestartButton(`✉️ [${email}] 주소로 상장 사본이 발송되었습니다.`);

      setTimeout(() => {
        closeModal();
        btnModalSend.disabled = false;
        btnModalSend.textContent = '🚀 즉시 발송';
      }, 1600);

    } catch (err) {
      console.warn('GAS Mailer fetch fallback:', err);
      const subject = encodeURIComponent(`[피타고라스 학당 수료증 사본] ${studentName} 대원의 수학 모험 완결`);
      const body = encodeURIComponent(
        `[피타고라스 학당 수학 모험 수료증 사본]\n\n` +
        `■ 수료 대원: ${studentName}\n` +
        `■ 발급 번호: ${certNumber}\n` +
        `■ 수료 일자: ${clearDate}\n` +
        `■ 모험 접속 주소: ${currentUrl}\n\n` +
        `"수학은 단순한 계산이 아니라, 세상의 거짓과 혼란 속에서 진실의 균형을 찾는 빛이다."\n` +
        `— 스승 탈레스 & 피타고라스 —\n\n` +
        `Designed & Developed by BetterwithU`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      enableRestartButton(`✉️ [${email}] 메일 클라이언트로 수료증 사본이 생성되었습니다.`);
      closeModal();
      btnModalSend.disabled = false;
      btnModalSend.textContent = '🚀 즉시 발송';
    }
  });

  // 제작자 교육 문의 메일 (마스킹 - 화면 주소 미노출)
  root.querySelector('#btn-inquiry-mail').addEventListener('click', () => {
    playSfx('click');
    const targetEmail = 'june_wook@snu.ms.kr';
    const subject = encodeURIComponent(`[폴리곤과 운명의 주사위] 교육 문의 및 피드백`);
    window.location.href = `mailto:${targetEmail}?subject=${subject}`;
  });

  // 처음부터 다시 하기 (완전 데이터 초기화 & 확인 경고 팝업)
  btnRestart.addEventListener('click', () => {
    if (!isSavedOrSent) {
      alert('⚠️ 먼저 수료증을 이미지나 PDF로 저장하거나 본인 이메일로 수료증 사본을 발송해야 다시 시작할 수 있습니다.');
      return;
    }
    playSfx('click');
    if (confirm('⚠️ 지난 게임의 모든 데이터가 삭제됩니다. 정말로 처음부터 다시 시작하시겠습니까?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  });

  root.querySelector('#journal-btn-games').addEventListener('click', () => {
    playSfx('click');
    if (onGoMinigames) onGoMinigames();
    else location.href = 'games.html';
  });
}
