/**
 * 피타고라스 학당 공식 상장 자동 발송 웹앱 (GAS)
 * 발신자: june_wook@snu.ms.kr (스크립트 배포자)
 * 수신자: 학생 본인 이메일 (사본 보관)
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'Pythagoras Academy Certificate Mailer',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Apps Script 권한 최초 1회 승인 및 발송 테스트용 함수
 * Apps Script 편집기에서 이 함수를 선택하고 [실행]을 누르면 권한 승인 창이 뜹니다.
 */
function testSend() {
  const email = 'june_wook@snu.ms.kr';
  GmailApp.sendEmail(
    email,
    '[피타고라스 학당] 권한 승인 및 메일 발송 테스트',
    '축하합니다! 이 메일이 도착했다면 피타고라스 학당 수료증 발송 권한이 정상 승인된 것입니다.\n이제 웹앱에서 학생들이 수료증을 자신의 이메일로 정상 수신할 수 있습니다!'
  );
  Logger.log('테스트 메일 발송 성공: ' + email);
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        if (e.parameter) {
          payload = e.parameter;
        }
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const recipient = (payload.email || payload.to || '').trim();
    const studentName = (payload.studentName || payload.name || '67 대원').trim();
    const certNumber = (payload.certNumber || '제 PYTH-2026-' + Math.floor(1000 + Math.random() * 9000) + ' 호');
    const clearDate = payload.clearDate || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const siteUrl = payload.siteUrl || 'http://localhost:8000/index.html';

    if (!recipient || recipient.indexOf('@') === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '유효한 이메일 주소를 입력해 주세요.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const subject = `[피타고라스 학당] ${studentName} 대원의 수학 모험 완결 수료증 사본`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>피타고라스 학당 수료증</title>
</head>
<body style="margin: 0; padding: 24px 8px; background-color: #0b0f19; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #f0f6fc;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 660px; margin: 0 auto; background: linear-gradient(150deg, #131922, #0a0d13); border: 3px solid #d4af37; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.85); overflow: hidden;">
    
    <!-- 상단 황금 배너 헤더 -->
    <tr>
      <td style="padding: 28px 24px 18px; text-align: center; border-bottom: 1.5px solid rgba(212,175,55,0.4);">
        <div style="font-size: 12px; color: #d4af37; letter-spacing: 4px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">
          ✦ ACADEMIA PYTHAGORICA ✦
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #ffd152; font-weight: 900; letter-spacing: 4px;">
          수  료  증
        </h1>
        <div style="font-size: 11px; letter-spacing: 2px; color: #c9d1d9; font-weight: bold; margin-top: 4px;">
          CERTIFICATE OF ACHIEVEMENT
        </div>
        <div style="font-size: 12px; color: #8b949e; margin-top: 8px;">
          발급 인증 번호: <span style="color: #ffd152; font-family: monospace;">${certNumber}</span>
        </div>
      </td>
    </tr>

    <!-- 본문 인증 영역 -->
    <tr>
      <td style="padding: 30px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <div style="font-size: 14px; color: #ffd152; font-weight: bold; margin-bottom: 4px;">
                명 예 수 학 대 원
              </div>
              <h2 style="margin: 8px 0; font-size: 30px; color: #58a6ff; font-weight: 900;">
                ${studentName}
              </h2>
              <p style="margin: 12px 0 0; font-size: 15px; color: #f0f6fc; line-height: 1.7;">
                위 사람은 중학교 2학년 수학 제6단원 <strong>「경우의 수와 확률」</strong>의<br>
                모든 모험 시련을 우수한 수학적 탐구력과 논리적 추론으로 완수하였기에<br>
                피타고라스 학당의 명예 대원으로 공인하며 본 수료증을 수여합니다.
              </p>
            </td>
          </tr>

          <!-- 단원별 해결 과제 (여사건 X, TMI 분수 X) -->
          <tr>
            <td style="padding: 14px 18px; background: rgba(22, 27, 34, 0.85); border: 1px solid rgba(212,175,55,0.3); border-radius: 8px;">
              <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #c9d1d9;">
                <tr>
                  <td width="50%"><strong style="color: #e74c3c;">• 제1·2장 (경우의 수):</strong> 사막 갈림길 경로, 비밀번호 해독</td>
                  <td width="50%"><strong style="color: #3498db;">• 제3·4장 (순서와 대표):</strong> 이웃한 자리배치, 자격별 대표 선출</td>
                </tr>
                <tr>
                  <td><strong style="color: #f1c40f;">• 제5장 (확률의 뜻과 성질):</strong> 과녁 적중 확률, 특수 전개도 주사위</td>
                  <td><strong style="color: #2ecc71;">• 제6장 (확률의 계산):</strong> 편향 주사위 검증, 다중 빗장 잠금</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 격언 인용구 카드 및 낙관 직인 -->
          <tr>
            <td style="padding-top: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 14px 18px; background: rgba(0, 0, 0, 0.4); border-left: 3px solid #d4af37; border-radius: 0 6px 6px 0;">
                    <p style="margin: 0; font-size: 13px; color: #ffeaa7; font-style: italic; line-height: 1.6;">
                      "수학은 단순한 계산이 아니라, 세상의 거짓과 혼란 속에서 진실의 균형을 찾는 빛이다."
                    </p>
                    <div style="margin-top: 6px; font-size: 12px; color: #ffd152; font-weight: bold;">
                      — 스승 탈레스 &amp; 피타고라스 —
                    </div>
                    <div style="margin-top: 4px; font-size: 11px; color: #8b949e;">
                      수료 일시 : ${clearDate}
                    </div>
                  </td>
                  <td width="80" align="right">
                    <div style="width: 60px; height: 60px; border: 2px solid #e74c3c; border-radius: 4px; text-align: center; color: #e74c3c; font-weight: 900; font-size: 10px; line-height: 1.3; padding-top: 6px; box-sizing: border-box; background: rgba(231,76,60,0.06);">
                      피타고라스<br>학당총장<br>인 (印)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- 하단 서명 및 푸터 -->
    <tr>
      <td style="padding: 18px 24px 22px; background-color: #0d1117; border-top: 1px solid rgba(212,175,55,0.3); text-align: center;">
        <div style="font-size: 12px; color: #8b949e; line-height: 1.6; margin-bottom: 10px;">
          본 메일은 피타고라스 학당 인터랙티브 웹앱에서 학생 본인의 수료증 보관 요청에 따라 발송되었습니다.<br>
          다시 접속하시려면 웹앱 주소(<a href="${siteUrl}" style="color: #ffd152; text-decoration: underline;">${siteUrl}</a>)로 접속하세요.
        </div>
        <div style="font-size: 11px; color: #6e7681; border-top: 1px solid #161b22; padding-top: 10px;">
          Designed &amp; Developed by <strong>BetterwithU</strong> · 교육 문의: <a href="mailto:june_wook@snu.ms.kr" style="color: #58a6ff; text-decoration: none;">관리자 메일 보내기</a>
        </div>
      </td>
    </tr>

  </table>
</body>
</html>
    `;

    GmailApp.sendEmail(recipient, subject, `${studentName} 대원의 수료증입니다. 본문 HTML을 확인해 주세요.`, {
      name: '피타고라스 학당 (BetterwithU)',
      htmlBody: htmlBody
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '수료증 메일이 성공적으로 발송되었습니다.',
      recipient: recipient,
      studentName: studentName
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
