import { formatDialogueHtml } from '../engine/dialogue.js';

export function createBacklog(container) {
  let overlay = document.getElementById('backlog-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'backlog-overlay';
    overlay.style.cssText = `
      position: absolute; inset: 0; z-index: 50;
      background: rgba(10, 8, 5, 0.94);
      backdrop-filter: blur(14px);
      display: none; flex-direction: column;
      border: 2px solid rgba(245, 176, 65, 0.4);
      border-radius: 8px; overflow: hidden;
      box-shadow: 0 16px 60px rgba(0,0,0,0.9);
      animation: fadeIn 0.2s ease;
    `;
    container.appendChild(overlay);
  }

  function getSpeakerColor(name) {
    switch (name) {
      case '폴리곤': return '#5dade2';
      case '이리스': return '#f48fb1';
      case '테론': return '#ff9f43';
      case '소폴로스': return '#b388ff';
      case '탈레스': return '#ffd152';
      case '피타고라스': return '#ffd152';
      case '광부': return '#a4b0be';
      case '피캐스': return '#1dd1a1';
      default: return '#f5b041';
    }
  }

  function open(history = []) {
    overlay.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 24px; border-bottom:1.5px solid rgba(245, 176, 65, 0.3); background:rgba(20, 15, 10, 0.8);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.3rem;">📜</span>
          <span style="font-weight:800; font-size:1.15rem; color:#ffd152; letter-spacing:0.5px;">대사 다시보기 (Backlog)</span>
          <span style="font-size:0.85rem; color:#888; margin-left:6px;">총 ${history.length}개의 대화</span>
        </div>
        <button type="button" id="backlog-close-btn" style="background:rgba(255,255,255,0.08); border:1px solid rgba(245,176,65,0.4); color:#ffd152; border-radius:6px; padding:6px 14px; font-weight:700; font-size:0.95rem; cursor:pointer; transition:all 0.15s;" title="닫기 (ESC)">
          ✕ 닫기
        </button>
      </div>
      <div id="backlog-list" style="flex:1; overflow-y:auto; padding:20px 28px; display:flex; flex-direction:column; gap:18px;"></div>
      <div style="padding:10px 20px; text-align:right; border-top:1px solid rgba(255,255,255,0.06); font-size:0.8rem; color:#777;">
        [ESC] 또는 [닫기]를 누르면 돌아갑니다.
      </div>
    `;

    const listEl = overlay.querySelector('#backlog-list');

    if (history.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; color:#888; margin:auto; font-size:1.05rem;">아직 지나간 대사 기록이 없습니다.</div>`;
    } else {
      history.forEach((item, idx) => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = `
          display: flex; gap: 14px; align-items: flex-start;
          padding-bottom: 14px; border-bottom: 1px dashed rgba(255,255,255,0.08);
          line-height: 1.6;
        `;

        const speakerColor = getSpeakerColor(item.speaker);
        const htmlText = formatDialogueHtml(item.text);

        itemEl.innerHTML = `
          <div style="min-width:96px; text-align:right;">
            <span style="display:inline-block; font-weight:800; font-size:0.95rem; color:${speakerColor}; background:rgba(0,0,0,0.35); padding:2px 8px; border-radius:4px; border:1px solid ${speakerColor}44;">
              ${item.speaker || '내레이션'}
            </span>
          </div>
          <div style="flex:1; font-size:1.1rem; color:#f0e6d2; word-break:keep-all;">
            ${htmlText}
          </div>
        `;
        listEl.appendChild(itemEl);
      });

      // 최신 대사(스크롤 맨 아래)로 즉시 이동
      requestAnimationFrame(() => {
        listEl.scrollTop = listEl.scrollHeight;
      });
    }

    overlay.querySelector('#backlog-close-btn').addEventListener('click', close);
    overlay.style.display = 'flex';
  }

  function close() {
    overlay.style.display = 'none';
  }

  function isOpen() {
    return overlay.style.display === 'flex';
  }

  return { open, close, isOpen };
}
