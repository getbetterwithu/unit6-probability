import { playSfx } from '../engine/sound.js';

export function mountPathLink(root, { onDone, onClose }) {
  root.innerHTML = `
    <div class="popup path-pop" style="position:relative; width:min(920px, 98%); background:#18120b; border:2.5px solid #d4af37; border-radius:14px; padding:18px 24px; color:#f5eedb;">
      <style>
        @keyframes lastEdgePulse {
          0%, 100% { stroke: #ffd152; stroke-width: 5.5px; opacity: 1; filter: drop-shadow(0 0 6px #ffd152); }
          50% { stroke: #f39c12; stroke-width: 3.5px; opacity: 0.4; filter: none; }
        }
        @keyframes startNodeGlow {
          0%, 100% { filter: drop-shadow(0 0 5px #ffd152); opacity: 1; }
          50% { filter: drop-shadow(0 0 10px #f1c40f); opacity: 0.4; }
        }
        .last-edge-blink {
          animation: lastEdgePulse 0.9s infinite ease-in-out;
        }
        .start-node-pulse {
          animation: startNodeGlow 1.2s infinite ease-in-out;
        }
      </style>

      <!-- 우측 상단 닫기 (잠시 접기) 버튼 -->
      <button type="button" id="path-btn-close" style="position:absolute; top:12px; right:14px; background:rgba(0,0,0,0.5); border:1px solid #d4af37; color:#ffeaa7; border-radius:6px; padding:4px 10px; font-size:0.85rem; cursor:pointer;" title="잠시 접어두기">
        ✕ 닫기
      </button>

      <div style="margin-bottom: 10px;">
        <span style="background:#d4af37; color:#1c1308; font-weight:800; font-size:0.85rem; padding:3px 10px; border-radius:4px;">🚂 광맥 갱도 한붓그리기</span>
        <p class="dice-hint" style="color:#bdc3c7; font-size:0.95rem; margin-top:6px;">
          반드시 <strong style="color:#ffd152;">출발점(원형 노드)</strong>을 먼저 클릭하여 시작한 뒤, 이어진 5색 선로를 중복 없이 한 획으로 전부 연결하시오.
        </p>
      </div>

      <svg id="path-svg" viewBox="16 4 350 160" style="width:100%; height:280px; background:#0f0b07; border-radius:8px; border:1px solid #5c4324;"></svg>

      <div style="margin-top: 12px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="path-count" style="font-weight:700; color:#ffeaa7; font-size:1.05rem;">📍 출발할 시작 점(원)을 클릭하시오.</span>
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
    { name: '청옥 광맥', x: 70, y: 58, r: 46, color: '#2980b9' },
    { name: '흑철 광맥', x: 178, y: 58, r: 46, color: '#95a5a6' },
    { name: '루비 광맥', x: 286, y: 58, r: 46, color: '#e74c3c' },
    { name: '황금 광맥', x: 124, y: 104, r: 46, color: '#f39c12' },
    { name: '비취 광맥', x: 232, y: 104, r: 46, color: '#27ae60' },
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

  // 시작점(tip)이 선택되지 않았을 때는 선을 절대 선택할 수 없음!
  function canTake(e) {
    if (e.used) return false;
    if (!tip) return false;
    return e.a === tip || e.b === tip;
  }

  // 선로 중간 지점 및 진행 방향 각도 계산
  function getArrowData(t) {
    const e = t.edge;
    const r = rings[e.ring];
    const midAngle = e.sa + e.span / 2;
    const mx = r.x + r.r * Math.cos(midAngle);
    const my = r.y + r.r * Math.sin(midAngle);

    // a에서 b로 진행하는 호 방향 (시계방향: 접선각도 midAngle + PI/2)
    const isClockwise = t.from === e.a;
    const heading = isClockwise ? (midAngle + Math.PI / 2) : (midAngle - Math.PI / 2);
    const deg = (heading * 180) / Math.PI;

    return { x: mx, y: my, deg };
  }

  function draw() {
    let out = '<defs></defs>';

    // 1단계: 아직 지나지 않은 남은 5색 선로
    edges.forEach((e, i) => {
      if (e.used) return; // 이미 사용된 선은 2단계/3단계에서 회색/깜빡임으로 그림
      const ok = canTake(e);
      const stroke = e.ringColor;
      const w = ok ? 4.5 : 2.5;
      const opacity = ok ? 1.0 : (tip ? 0.35 : 0.85);
      out += `<path d="${arcPath(e)}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${opacity}" data-i="${i}" class="arc" style="cursor:${ok ? 'pointer' : 'default'}"/>`;
    });

    // 2단계: 지나온 선들 (회색톤으로 명확히 구별!)
    trail.forEach((t, idx) => {
      const e = t.edge;
      const isLast = idx === trail.length - 1;

      if (isLast && !done) {
        // 제일 마지막에 선택한 선: 깜빡임(Blink) 효과로 현재 위치 강조!
        out += `<path d="${arcPath(e)}" fill="none" stroke="#ffd152" stroke-width="5" class="last-edge-blink"/>`;
      } else {
        // 이미 지나온 이전 선들: 차분한 회색톤으로 변경!
        out += `<path d="${arcPath(e)}" fill="none" stroke="#636e72" stroke-width="3.5" opacity="0.85"/>`;
      }

      // 4단계: 지나온 모든 선에 방향 화살표 및 순서 번호(1, 2, 3...) 배지 표시!
      const arr = getArrowData(t);
      const arrFill = isLast ? '#ffd152' : '#ffffff';
      const badgeFill = isLast ? '#ffd152' : '#1e1610';
      const textFill = isLast ? '#1c1308' : '#ffeaa7';
      out += `
        <g transform="translate(${arr.x}, ${arr.y}) rotate(${arr.deg})">
          <polygon points="-8,-4 6,0 -8,4 -4,0" fill="${arrFill}" stroke="#1c1308" stroke-width="1"/>
        </g>
        <g transform="translate(${arr.x}, ${arr.y})">
          <circle cx="0" cy="0" r="6.5" fill="${badgeFill}" stroke="#d4af37" stroke-width="1.2"/>
          <text x="0" y="3" text-anchor="middle" fill="${textFill}" font-size="8" font-weight="900">${idx + 1}</text>
        </g>
      `;
    });

    // 3단계: 노드 (꼭짓점 원형 점들)
    pts.forEach((p, i) => {
      const isTip = tip === p;
      const hasRings = p.rings.length;
      let r = 4.5;
      let fill = '#ffffff';
      let stroke = '#1c1308';
      let cls = 'pt';

      if (!tip && !done) {
        // 시작점 선택 전: 모든 노드가 출발 가능함을 펄스로 안내!
        r = 6;
        fill = '#ffd152';
        stroke = '#d4af37';
        cls += ' start-node-pulse';
      } else if (isTip) {
        // 현재 위치 tip
        r = 7.5;
        fill = '#2ecc71';
        stroke = '#ffffff';
      }

      out += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" data-i="${i}" class="${cls}" style="cursor:pointer"/>`;
    });

    svg.innerHTML = out;

    if (!done) {
      svg.querySelectorAll('.pt').forEach((c) => {
        c.addEventListener('click', () => {
          if (!tip) {
            tip = pts[Number(c.dataset.i)];
            countEl.innerHTML = '✨ 시작점 설정 완료! <strong style="color:#ffd152;">연결할 5색 선로</strong>를 누르시오.';
            playSfx('click');
            draw();
          }
        });
      });

      svg.querySelectorAll('.arc').forEach((path) => {
        path.addEventListener('click', () => {
          if (!tip) {
            countEl.innerHTML = '⚠️ <strong style="color:#e74c3c;">출발할 원형 점(노드)</strong>을 먼저 클릭해야 합니다!';
            playSfx('error');
            return;
          }
          take(edges[Number(path.dataset.i)]);
        });
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
    playSfx('click');
    edges.forEach((e) => { e.used = false; });
    tip = null;
    trail = [];
    used = 0;
    done = false;
    completeBtn.style.display = 'none';
    countEl.textContent = '📍 출발할 시작 점(원)을 클릭하시오.';
    draw();
  });

  // 수동 완료 버튼 클릭 시에만 진행
  completeBtn.addEventListener('click', () => {
    if (onDone) onDone();
  });
}
