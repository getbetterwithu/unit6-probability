import { playSfx } from '../engine/sound.js';

export function mountPathLink(root, { onDone, onClose }) {
  root.innerHTML = `
    <div class="popup path-pop" style="position:relative; width:min(920px, 98%); background:#18120b; border:2.5px solid #d4af37; border-radius:14px; padding:18px 24px; color:#f5eedb;">
      <!-- 우측 상단 닫기 (잠시 접기) 버튼 -->
      <button type="button" id="path-btn-close" style="position:absolute; top:12px; right:14px; background:rgba(0,0,0,0.5); border:1px solid #d4af37; color:#ffeaa7; border-radius:6px; padding:4px 10px; font-size:0.85rem; cursor:pointer;" title="잠시 접어두기">
        ✕ 닫기
      </button>

      <div style="margin-bottom: 10px;">
        <span style="background:#d4af37; color:#1c1308; font-weight:800; font-size:0.85rem; padding:3px 10px; border-radius:4px;">🚂 광맥 갱도 한붓그리기</span>
        <p class="dice-hint" style="color:#bdc3c7; font-size:0.95rem; margin-top:6px;">시작점을 하나 고른 뒤, 이어진 5색 광맥 선로를 중복 없이 한 획으로 전부 연결하시오.</p>
      </div>

      <svg id="path-svg" viewBox="16 4 350 160" style="width:100%; height:280px; background:#0f0b07; border-radius:8px; border:1px solid #5c4324;"></svg>

      <div style="margin-top: 12px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="path-count" style="font-weight:700; color:#ffeaa7; font-size:1.05rem;">시작 점을 누르시오.</span>
          <button type="button" id="path-reset" style="background:#3a2a1c; color:#ffeaa7; border:1px solid #d4af37; border-radius:6px; padding:4px 12px; font-weight:700; cursor:pointer;">
            처음부터 다시
          </button>
        </div>
        <button type="button" id="path-complete-btn" style="display:none; background:linear-gradient(135deg, #27ae60, #2ecc71); color:#fff; border:none; border-radius:6px; padding:10px 20px; font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(46,204,113,0.4);">
          ✨ 갱도 선로 연결 완료 · 다음으로 ▶
        </button>
      </div>
    </div>`;

  // 닫기 버튼
  root.querySelector('#path-btn-close').addEventListener('click', () => {
    if (onClose) onClose();
  });

  const svg = root.querySelector('#path-svg');
  const countEl = root.querySelector('#path-count');
  const completeBtn = root.querySelector('#path-complete-btn');

  // 5색 링 (오륜기 광맥)
  const rings = [
    { name: '청옥 광맥', x: 70, y: 58, r: 46, color: '#1565C0' },
    { name: '흑철 광맥', x: 178, y: 58, r: 46, color: '#7f8c8d' },
    { name: '루비 광맥', x: 286, y: 58, r: 46, color: '#E74C3C' },
    { name: '황금 광맥', x: 124, y: 104, r: 46, color: '#F39C12' },
    { name: '비취 광맥', x: 232, y: 104, r: 46, color: '#27AE60' },
  ];

  function hits(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d >= a.r + b.r || d <= Math.abs(a.r - b.r)) return [];
    const h = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
    const px = a.x + (dx * h) / d;
    const py = a.y + (dy * h) / d;
    const lift = Math.sqrt(Math.max(0, a.r * a.r - h * h));
    const ox = (-dy * lift) / d;
    const oy = (dx * lift) / d;
    return [{ x: px + ox, y: py + oy }, { x: px - ox, y: py - oy }];
  }

  const pts = [];
  function addPt(p, ring) {
    let found = pts.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 2);
    if (!found) {
      found = { x: p.x, y: p.y, rings: [] };
      pts.push(found);
    }
    if (!found.rings.includes(ring)) found.rings.push(ring);
    return found;
  }

  for (let i = 0; i < rings.length; i++) {
    for (let j = i + 1; j < rings.length; j++) {
      hits(rings[i], rings[j]).forEach((p) => {
        addPt(p, i);
        addPt(p, j);
      });
    }
  }

  const edges = [];
  rings.forEach((ring, ri) => {
    const on = pts.filter((p) => p.rings.includes(ri));
    on.sort((a, b) => Math.atan2(a.y - ring.y, a.x - ring.x) - Math.atan2(b.y - ring.y, b.x - ring.x));
    for (let k = 0; k < on.length; k++) {
      const a = on[k];
      const b = on[(k + 1) % on.length];
      const sa = Math.atan2(a.y - ring.y, a.x - ring.x);
      let eb = Math.atan2(b.y - ring.y, b.x - ring.x);
      let span = eb - sa;
      while (span < 0) span += Math.PI * 2;
      while (span >= Math.PI * 2) span -= Math.PI * 2;
      edges.push({
        ring: ri,
        ringName: ring.name,
        ringColor: ring.color,
        a, b, sa,
        span,
        used: false,
      });
    }
  });

  let tip = null;
  let trail = [];
  let used = 0;
  let done = false;

  function arcPath(e) {
    const r = rings[e.ring];
    const large = e.span > Math.PI ? 1 : 0;
    return `M ${e.a.x} ${e.a.y} A ${r.r} ${r.r} 0 ${large} 1 ${e.b.x} ${e.b.y}`;
  }

  function canTake(e) {
    if (e.used) return false;
    if (!tip) return true;
    return e.a === tip || e.b === tip;
  }

  function draw() {
    let out = '<defs>';
    // 화이트/은빛 궤적 화살표 마커
    out += `
      <marker id="silver-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#ffffff"/>
      </marker>
    </defs>`;

    // 1단계: 5색 링 기본 선로
    edges.forEach((e, i) => {
      const ok = canTake(e);
      const stroke = e.ringColor;
      const w = ok ? 5 : 3;
      const opacity = e.used ? 0.2 : (ok ? 0.95 : 0.4);
      out += `<path d="${arcPath(e)}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${opacity}" data-i="${i}" class="arc" style="cursor:${ok ? 'pointer' : 'default'}"/>`;
    });

    // 2단계: 지나온 궤적 — 빨간 링 위에서도 칼같이 보이는 눈부신 화이트 실선 + 화살표!
    trail.forEach((t) => {
      const e = t.edge;
      out += `<path d="${arcPath(e)}" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" marker-mid="url(#silver-arrow)"/>`;
    });

    // 3단계: 꼭짓점 점
    pts.forEach((p, i) => {
      const isTip = tip === p;
      const r = isTip ? 6.5 : 4;
      const fill = isTip ? '#ffd152' : '#ffffff';
      out += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="#1c1308" stroke-width="2" data-i="${i}" class="pt" style="cursor:pointer"/>`;
    });

    svg.innerHTML = out;

    if (!done) {
      svg.querySelectorAll('.pt').forEach((c) => {
        c.addEventListener('click', () => {
          tip = pts[Number(c.dataset.i)];
          countEl.textContent = '붙어 있는 선로를 누르시오.';
          draw();
        });
      });
      svg.querySelectorAll('.arc').forEach((path) => {
        path.addEventListener('click', () => take(edges[Number(path.dataset.i)]));
      });
    }
  }

  function take(e) {
    if (!canTake(e)) return;
    playSfx('click');
    const from = tip;
    tip = e.a === from ? e.b : e.a;
    trail.push({ edge: e, from });
    e.used = true;
    used += 1;

    // 현재 선택한 선로 구간 실시간 색상 안내
    countEl.innerHTML = `<span style="color:${e.ringColor}; font-weight:800;">[${e.ringName}]</span> 통과! (진행: ${used} / ${edges.length})`;

    if (used === edges.length) {
      done = true;
      playSfx('correct');
      countEl.innerHTML = '🎉 <strong style="color:#2ecc71;">모든 광맥 갱도 선로가 한 획으로 연결되었습니다!</strong>';
      completeBtn.style.display = 'block';
      completeBtn.focus();
      draw();
      return;
    }

    const next = edges.some(canTake);
    if (!next) {
      countEl.textContent = '⚠️ 선로가 막혔습니다. [처음부터 다시]를 눌러보세요.';
    }
    draw();
  }

  draw();

  root.querySelector('#path-reset').addEventListener('click', () => {
    if (done) return;
    edges.forEach((e) => { e.used = false; });
    tip = null;
    trail = [];
    used = 0;
    done = false;
    countEl.textContent = '시작 점을 누르시오.';
    draw();
  });

  // 수동 완료 버튼 클릭 시에만 진행
  completeBtn.addEventListener('click', () => {
    if (onDone) onDone();
  });
}
