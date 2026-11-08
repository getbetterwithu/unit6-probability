export function mountPathLink(root, { onDone }) {
  root.innerHTML = `
    <div class="popup path-pop">
      <p class="dice-hint">점을 하나 고른 뒤, 붙은 선을 차례로 누르시오.</p>
      <svg id="path-svg" viewBox="16 4 350 160"></svg>
      <p class="dice-readout"><span id="path-count">시작 점을 누르시오.</span> <button type="button" id="path-reset" style="margin-left:8px;background:#3a2a1c;color:#f0e6d2;border:1px solid #e5a93b;border-radius:8px;padding:2px 8px;">다시</button></p>
    </div>`;
  const svg = root.querySelector('#path-svg');
  const rings = [
    { x: 70, y: 58, r: 46, color: '#1565C0' },
    { x: 178, y: 58, r: 46, color: '#111' },
    { x: 286, y: 58, r: 46, color: '#C62828' },
    { x: 124, y: 104, r: 46, color: '#F9A825' },
    { x: 232, y: 104, r: 46, color: '#2E7D32' },
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
      const a1 = Math.atan2(a.y - ring.y, a.x - ring.x);
      const a2 = Math.atan2(b.y - ring.y, b.x - ring.x);
      let sweep = a2 - a1;
      if (sweep <= 0) sweep += Math.PI * 2;
      edges.push({ a, b, ring: ri, sweep, a1, used: false });
    }
  });
  function arcPath(e) {
    const ring = rings[e.ring];
    const large = e.sweep > Math.PI ? 1 : 0;
    return `M ${e.a.x} ${e.a.y} A ${ring.r} ${ring.r} 0 ${large} 1 ${e.b.x} ${e.b.y}`;
  }
  let tip = null;
  let trail = [];
  let used = 0;
  let done = false;
  function canTake(e) {
    if (e.used || done || !tip) return false;
    return e.a === tip || e.b === tip;
  }
  function directed(e, from) {
    const ring = rings[e.ring];
    const large = e.sweep > Math.PI ? 1 : 0;
    if (from === e.a) return `M ${e.a.x} ${e.a.y} A ${ring.r} ${ring.r} 0 ${large} 1 ${e.b.x} ${e.b.y}`;
    return `M ${e.b.x} ${e.b.y} A ${ring.r} ${ring.r} 0 ${large} 0 ${e.a.x} ${e.a.y}`;
  }
  function draw() {
    let html = `<defs>
      <marker id="arr-old" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#6A1B9A"/></marker>
      <marker id="arr-now" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#E65100"/></marker>
    </defs>`;
    html += rings.map((r) => `<circle cx="${r.x}" cy="${r.y}" r="${r.r}" fill="none" stroke="${r.color}" stroke-width="3" pointer-events="none"/>`).join('');
    edges.forEach((e, i) => {
      const ok = canTake(e);
      html += `<path class="arc" data-i="${i}" d="${arcPath(e)}" fill="none" stroke="transparent" stroke-width="14" style="cursor:${ok ? 'pointer' : 'default'}"/>`;
    });
    trail.forEach((step, n) => {
      const last = n === trail.length - 1;
      html += `<path d="${directed(step.edge, step.from)}" fill="none" stroke="${last ? '#E65100' : '#6A1B9A'}" stroke-width="2.5" marker-end="url(#${last ? 'arr-now' : 'arr-old'})" pointer-events="none"/>`;
    });
    pts.forEach((p, i) => {
      const on = tip === p;
      html += `<circle class="pt" data-i="${i}" cx="${p.x}" cy="${p.y}" r="${on ? 7 : 5}" fill="${on ? '#E65100' : '#fff'}" stroke="#111" stroke-width="2" style="cursor:${tip ? 'default' : 'pointer'}"/>`;
    });
    svg.innerHTML = html;
    if (done) return;
    if (!tip) {
      svg.querySelectorAll('.pt').forEach((c) => {
        c.addEventListener('click', () => {
          tip = pts[Number(c.dataset.i)];
          root.querySelector('#path-count').textContent = '붙은 선을 누르시오.';
          draw();
        });
      });
    }
    svg.querySelectorAll('.arc').forEach((path) => {
      path.addEventListener('click', () => take(edges[Number(path.dataset.i)]));
    });
  }
  function take(e) {
    if (!canTake(e)) return;
    const from = tip;
    tip = e.a === from ? e.b : e.a;
    trail.push({ edge: e, from });
    e.used = true;
    used += 1;
    if (used === edges.length) {
      done = true;
      root.querySelector('#path-count').textContent = '한 번에 그렸다.';
      const btn = root.querySelector('#path-reset');
      btn.textContent = '성공';
      btn.style.background = '#E65100';
      btn.style.color = '#fff';
      btn.style.borderColor = '#E65100';
      draw();
      if (onDone) onDone();
      return;
    }
    const next = edges.some(canTake);
    root.querySelector('#path-count').textContent = next
      ? `지난 선 ${used} / ${edges.length}`
      : '막혔다. 다시 시작하시오.';
    draw();
  }
  draw();
  root.querySelector('#path-reset').addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (done) return;
    edges.forEach((e) => { e.used = false; });
    tip = null;
    trail = [];
    used = 0;
    done = false;
    root.querySelector('#path-count').textContent = '시작 점을 누르시오.';
    draw();
  });
}
