const PAL = { h:'#3b2417', s:'#f7c9a0', k:'#1c1c2b', w:'#ffffff', r:'#e43b44', b:'#6b4226', v:'#d8e4ff', p:'#ff6b9a', g:'#3fae5a' };
const BODY = ["...hhhh...","..hhhhhh..","..hhhhhh..","..hsssss..","..skssks..","..ssssss..","...ssss...","..kkwwkk..",".kkkrrkkk.",".kkkwwkkk.",".kkkwwkkk.",".skkwwkks.","..kkkkkk..","..kkkkkk.."];
const LEGS = {
  idle: ["..kk..kk..","..kk..kk..","..kk..kk..",".bbb..bbb."],
  run1: ["..kk.kk...","..kk..kk..",".kk...kk..",".bb....bb."],
  run2: ["...kkk....","...kkk....","...kkk....","...bbbb..."],
  jump: ["..kk.kk...","..kk..kk..","..kk..kk..","..bb...bb."],
};
const GH = BODY.length + 4; // 신랑 키 18 (신부 16)
const BRIDE = ["....hhhh....","...hhhhhhv..","...hsssshvv.","...skssksvv.","...psssspvv.","....ssss.vv.","...wwwwww.v.","..swwwwwws..","..s.wwww.s..","...pppwww...","...pgpwww...","...wwwwwww..","..wwwwwwwww.","..wwwwwwwww.",".wwwwwwwwwww",".wwwwwwwwwww"];
const HEART = [".pp.pp.","pwppppp","ppppppp",".ppppp.","..ppp..","...p..."];

function spr(c, rows, x, y, s = 1) {
  x = Math.round(x); y = Math.round(y);
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const p = row[i]; if (p !== '.') { c.fillStyle = PAL[p]; c.fillRect(x + i * s, y + j * s, s, s); } } });
}
function whenText() {
  const d = new Date(CONFIG.date), h = d.getHours(), mi = d.getMinutes();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일 ${h < 12 ? '오전' : h < 17 ? '낮' : '저녁'} ${h % 12 || 12}시${mi ? ` ${mi}분` : ''}`;
}
const groomRows = legs => BODY.concat(LEGS[legs]);

// ---------- 게임 ----------
const W = 180, H = 320, GROUND = 250;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function resize() {
  const dpr = devicePixelRatio || 1;
  const cons = $('game').classList.contains('console'); // 게임기 모드는 아래 버튼 자리를 남김
  const aw = cons ? Math.min(innerWidth - 56, 360) : innerWidth, ah = cons ? innerHeight - 250 : innerHeight;
  const S = Math.max(1, Math.floor(Math.min(aw / W, ah / H) * dpr));
  cv.width = W * S; cv.height = H * S;
  cv.style.width = W * S / dpr + 'px'; cv.style.height = H * S / dpr + 'px';
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

// 배경 테마 (모드마다 하나씩)
const THEMES = {
  sunset: { sky: ['#1d1b4b','#2e2a6b','#55418c','#8c4f9e','#d0679b','#f59a8f','#ffc58a'], stars: true, cloud: '#ffe3ef', land: 'city',
            ground: ['#3fae5a', '#2a7a3f', '#8a5a3c', '#6b4226'] },
  spring: { sky: ['#4fa9f0','#62b6f3','#78c2f5','#92cff7','#acdbf8','#c6e7fa','#e2f3fc'], stars: false, cloud: '#ffffff', land: 'hills',
            ground: ['#7bd35b', '#4aa04a', '#9a6a44', '#7a5032'] },
  night:  { sky: ['#0b0b24','#111236','#171a48','#1e2459','#262f6b','#2f3b7c','#3a488c'], stars: true, cloud: '#4a5a98', land: 'sea',
            ground: ['#f2d59a', '#d9b673', '#e8c98a', '#cfa968'] },
};
// 하늘은 테마마다 한 번만 그려둠 (밴드 + 디더링)
for (const th of Object.values(THEMES)) {
  const c = th.img = document.createElement('canvas'); c.width = W; c.height = GROUND;
  const s = c.getContext('2d'), bh = GROUND / th.sky.length;
  th.sky.forEach((col, i) => { s.fillStyle = col; s.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh)); });
  for (let i = 1; i < th.sky.length; i++) { s.fillStyle = th.sky[i]; const y = Math.floor(i * bh);
    for (let x = 0; x < W; x += 2) { s.fillRect(x, y - 2, 1, 1); s.fillRect(x + 1, y - 1, 1, 1); } }
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STARS = Array.from({ length: 24 }, () => [rnd() * W | 0, rnd() * 90 | 0]);
const CITY = []; for (let x = 0; x < W + 40;) { const w = 14 + (rnd() * 12 | 0); CITY.push({ x, w, h: 30 + (rnd() * 45 | 0), lit: rnd() * 1000 | 0 }); x += w + 2; }
const CITY_W = CITY[CITY.length - 1].x + CITY[CITY.length - 1].w + 2;
const mod = (a, n) => ((a % n) + n) % n;

// sx: 가로 스크롤, oy: 세로로 올라간 만큼 (오르기 모드)
function drawBg(th, sx, oy) {
  ctx.fillStyle = th.sky[th.sky.length - 1]; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(th.img, 0, 0);
  if (th.stars) for (const [x, y] of STARS) if ((x + y + (t >> 4)) % 5) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1); }
  if (th.land === 'sea') { // 달
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(134, 34, 14, 14); ctx.fillRect(132, 37, 18, 8); ctx.fillRect(137, 32, 8, 18);
    ctx.fillStyle = '#e8dca0'; ctx.fillRect(138, 38, 3, 3); ctx.fillRect(143, 43, 2, 2);
  }
  ctx.fillStyle = th.cloud;
  for (let i = 0; i < 4; i++) {
    const x = mod(i * 70 - sx * .2, W + 40) - 30, y = mod(40 + i * 50 + oy * .3, GROUND + 40) - 20;
    ctx.fillRect(x, y, 26, 4); ctx.fillRect(x + 4, y - 3, 12, 3); ctx.fillRect(x + 14, y - 5, 8, 5);
  }
  const base = GROUND + oy * .5;
  if (th.land === 'city' && base - 80 < H) {
    const co = mod(sx * .4, CITY_W);
    for (const b of CITY) for (const k of [0, CITY_W]) {
      const x = b.x - co + k; if (x > W || x + b.w < 0) continue;
      ctx.fillStyle = '#3a2f6b'; ctx.fillRect(x, base - b.h, b.w, H);
      ctx.fillStyle = '#ffd34d';
      for (let wy = base - b.h + 4; wy < Math.min(base, H) - 4; wy += 6) for (let wx = 3; wx < b.w - 3; wx += 5) if ((b.lit + wx * 7 + wy * 3) % 4 === 0) ctx.fillRect(x + wx, wy, 2, 2);
    }
  }
  if (th.land === 'hills' && base - 70 < H) { // 언덕 두 겹 + 벚꽃나무
    for (const [col, sp, amp, lift] of [['#9fd6a0', .2, 14, 55], ['#5fb96a', .4, 10, 32]]) {
      ctx.fillStyle = col;
      for (let x = 0; x < W; x++) { const u = x + sx * sp - oy * .1; ctx.fillRect(x, Math.round(base - lift - amp * Math.sin(u / 23) - 6 * Math.sin(u / 9)), 1, H); }
    }
    for (let i = 0; i < 3; i++) {
      const x = mod(i * 75 + 20 - sx * .4, W + 40) - 20, y = base - 30;
      ctx.fillStyle = '#7a5032'; ctx.fillRect(x + 6, y, 3, 14);
      ctx.fillStyle = '#ffb7cf'; ctx.fillRect(x, y - 8, 15, 9); ctx.fillRect(x + 2, y - 11, 11, 3);
      ctx.fillStyle = '#ff8fb3'; ctx.fillRect(x + 3, y - 6, 2, 2); ctx.fillRect(x + 10, y - 3, 2, 2);
    }
  }
  if (th.land === 'sea' && base - 50 < H) { // 수평선 + 반짝이는 물결
    const sea = base - 48;
    ctx.fillStyle = '#1b2a6b'; ctx.fillRect(0, sea, W, H);
    ctx.fillStyle = '#fff6c8';
    for (let y = sea + 4; y < Math.min(base, H); y += 7) {
      const w = 3 + ((y >> 2) % 3) * 2, o = mod(sx * .3 + y * 13 + (t >> 2), 40);
      for (let x = -o; x < W; x += 40) ctx.fillRect(x, y, w, 1);
    }
    ctx.fillStyle = '#4a5ba8'; ctx.fillRect(0, sea, W, 1);
  }
  const g = GROUND + oy, [top, edge, soil, dot] = th.ground;
  if (g < H) {
    ctx.fillStyle = top; ctx.fillRect(0, g, W, 3);
    ctx.fillStyle = edge; ctx.fillRect(0, g + 3, W, 2);
    ctx.fillStyle = soil; ctx.fillRect(0, g + 5, W, H);
    ctx.fillStyle = dot;
    for (let row = 0; row < 8; row++) for (let x = -mod(sx + row * 8, 16); x < W; x += 16) ctx.fillRect(x, g + 9 + row * 8, 6, 2);
  }
  if (th.land === 'hills') { // 흩날리는 벚꽃잎
    ctx.fillStyle = '#ffc4d8';
    for (let i = 0; i < 14; i++) {
      const x = mod(i * 41 - t * .4 - sx * .5, W), y = mod(i * 67 + t * .6 + oy * .5, H);
      ctx.fillRect(Math.round(x + 2 * Math.sin((t + i * 20) / 30)), Math.round(y), 2, 1);
    }
  }
}
function block(x, y, w, h, c) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#1c1c2b'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + w - 2, y + 1, 2, h - 1);
}
// 테두리 없는 글씨 (종이·말풍선 위): say = 왼쪽 정렬, ink = 가운데 정렬
function say(s, x, y, size = 10, c = '#fff', font = 'Galmuri11') {
  ctx.font = `${size}px ${font}, monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = c; ctx.fillText(s, x, y);
}
function ink(s, x, y, size = 10, c = '#2b2340', font = 'Galmuri11') {
  ctx.font = `${size}px ${font}, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c; ctx.fillText(s, x, y);
}
function wrap(s, maxW, size, font = 'Galmuri11') { // 글자 단위 줄바꿈
  ctx.font = `${size}px ${font}, monospace`;
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const ch of para) { if (line && ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch === ' ' ? '' : ch; } else line += ch; }
    out.push(line);
  }
  return out;
}
function txt(s, x, y, size = 10, c = '#fff', font = 'Galmuri11') {
  ctx.font = `${size}px ${font}, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#1c1c2b'; ctx.strokeText(s, x, y); ctx.fillStyle = c; ctx.fillText(s, x, y);
}

// 공용 상태: gx = 신랑 왼쪽 x, fy = 신랑 발 y(화면 기준), bride = {x, y(발)} 또는 null
let mode, modeName, state, t, playT, endT, meetT, shake, parts, inv, hits, got, gx, fy, legs, bride, running = false;
let holdX = null, keyDir = 0;

const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
const groomHit = (x, y, w, h) => overlap(gx + 2, fy - GH + 3, 6, GH - 3, x, y, w, h);
function hit() { if (inv) return; hits++; inv = 60; shake = 10; beep(200, 60, .25, .07); }
function grab(h, x, y) { h.on = false; got++; beep(880, 1320, .1); burst(x, y, 8, ['#ff6b9a', '#fff']); }
function burst(x, y, n, colors) {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 3, vy: -Math.random() * 3 - 1, life: 60 + Math.random() * 40, c: colors[i % colors.length] });
}
const runLegs = () => (t >> 3) % 2 ? 'run1' : 'run2';

const MODES = {
  // ===== 1. 달리기: 탭해서 점프로 고난 넘기 =====
  run: {
    name: '달리기', game: true, theme: THEMES.sunset, sub: '고난을 넘어 신부에게!', hint: '탭 = 점프', tip: '탭해서 점프!',
    reset() {
      this.dist = 0; this.gy = 0; this.vy = 0; this.buf = 0; this.air = false; gx = 36; fy = GROUND;
      this.end = CONFIG.course[CONFIG.course.length - 1].x + 200;
      this.hearts = CONFIG.course.map(o => ({ x: o.x + o.w / 2 - 3, y: GROUND - o.h - 24, on: true }));
    },
    press() { this.buf = 8; }, // ponytail: 착지 직전 탭도 점프로 인정 (8프레임 버퍼)
    phys() {
      if (this.buf > 0) this.buf--;
      if (!this.air && this.buf > 0 && state === 'play') { this.vy = -4.4; this.air = true; this.buf = 0; beep(300, 600, .12); }
      if (this.air) { this.vy += .25; this.gy -= this.vy; if (this.gy <= 0) { this.gy = 0; this.vy = 0; this.air = false; } }
      fy = GROUND - this.gy;
      const bx = this.end - this.dist; bride = bx < W + 20 ? { x: bx, y: GROUND } : null;
    },
    step() {
      this.dist += 1.7; this.phys(); legs = this.air ? 'jump' : runLegs();
      for (const o of CONFIG.course) { const sx = o.x - this.dist; if (groomHit(sx + 1, GROUND - o.h + 1, o.w - 2, o.h)) hit(); }
      for (const h of this.hearts) { const sx = h.x - this.dist; if (h.on && groomHit(sx, h.y, 7, 6)) grab(h, sx + 3, h.y + 3); }
      return this.end - this.dist <= 120;
    },
    endStep() { this.phys(); },
    progress() { return this.dist / (this.end - 120); },
    draw() {
      drawBg(this.theme, this.dist, 0);
      for (const o of CONFIG.course) {
        const sx = o.x - this.dist; if (sx > W + 40 || sx + o.w < -40) continue;
        block(sx, GROUND - o.h, o.w, o.h, o.c);
        txt(o.t, sx + o.w / 2, GROUND - o.h - 8, 9, '#fff', 'Galmuri9');
      }
      for (const h of this.hearts) if (h.on) spr(ctx, HEART, h.x - this.dist, h.y + (t >> 3) % 2);
    },
  },

  // ===== 2. 오르기: 고난 발판을 밟고 튀어 올라 꼭대기 신부에게 =====
  climb: {
    name: '오르기', game: true, theme: THEMES.spring, sub: '고난을 밟고 올라 신부에게!', hint: '화면 왼쪽·오른쪽을 꾹', tip: '왼쪽·오른쪽을 꾹 눌러 이동',
    reset() {
      seed = 11;
      const C = CONFIG.course, N = C.length * 3 + 1, gap = 42;
      this.plats = [{ y: GROUND, x: 0, w: W, ground: true }];
      for (let i = 1; i <= N; i++) {
        const prev = this.plats[i - 1], top = i === N, w = top ? W : 30, o = i % 3 === 0 && !top ? C[i / 3 - 1] : null;
        // ponytail: 다음 발판은 이전 발판에서 ±60px 안에 둬서 항상 닿을 수 있게
        const x = top ? 0 : clamp((prev.ground ? W / 2 - 15 : prev.x) + rnd() * 120 - 60, 4, W - 4 - w);
        this.plats.push({ y: GROUND - i * gap, x, w, top, label: o && o.t, c: o ? o.c : '#f3d9b1' });
      }
      this.top = this.plats[N];
      this.hearts = this.plats.filter((p, i) => i % 3 === 1 && !p.top).map(p => ({ x: p.x + p.w / 2 - 3, y: p.y - 30, on: true }));
      this.y = GROUND; this.vy = 0; this.cam = 0; this.best = 0; this.last = this.plats[0]; gx = W / 2 - 5; fy = GROUND;
    },
    view() {
      fy = this.y - this.cam;
      const sy = this.top.y - this.cam; bride = sy > -20 ? { x: W / 2 + 24, y: sy } : null;
    },
    step() {
      const d = keyDir || (holdX === null ? 0 : holdX < W / 2 ? -1 : 1);
      gx = clamp(gx + d * 2, 0, W - 10);
      const prevY = this.y; this.vy += .2; this.y += this.vy;
      if (this.vy > 0) for (const p of this.plats) {
        if (prevY <= p.y && this.y >= p.y && gx + 8 > p.x && gx + 2 < p.x + p.w) {
          this.y = p.y; this.last = p;
          if (p.top) { this.vy = 0; legs = 'idle'; this.view(); return true; }
          this.vy = -5.6; beep(300, 600, .08); break;
        }
      }
      if (this.y - this.cam > H + 10) { // 떨어지면 마지막 발판으로 복귀
        inv = 0; hit(); const p = this.last; this.y = p.y; this.vy = -5.6; gx = clamp(p.x + p.w / 2 - 5, 0, W - 10);
      }
      this.cam = Math.max(this.top.y - 100, Math.min(this.cam, this.y - 150));
      this.best = Math.max(this.best, (GROUND - this.y) / (GROUND - this.top.y));
      legs = this.vy < 0 ? 'jump' : 'run2';
      this.view();
      for (const h of this.hearts) if (h.on && groomHit(h.x, h.y - this.cam, 7, 6)) grab(h, h.x + 3, h.y - this.cam + 3);
      return false;
    },
    endStep() { this.view(); },
    progress() { return this.best; },
    draw() {
      drawBg(this.theme, 0, -this.cam);
      for (const p of this.plats) {
        const sy = p.y - this.cam; if (p.ground || sy < -20 || sy > H + 10) continue;
        if (p.top) {
          block(0, sy, W, 6, '#ff6b9a');
          ctx.fillStyle = '#e43b44'; ctx.fillRect(0, sy + 2, W, 2);
          txt('♥ 예식장 ♥', W / 2, sy + 16, 10, '#ffd34d');
        } else {
          block(p.x, sy, p.w, 5, p.c);
          if (p.label) txt(p.label, p.x + p.w / 2, sy + 13, 9, '#fff', 'Galmuri9');
        }
      }
      for (const h of this.hearts) if (h.on) spr(ctx, HEART, h.x, h.y - this.cam + (t >> 3) % 2);
    },
  },

  // ===== 3. 피하기: 떨어지는 고난을 좌우로 피하며 버티기 =====
  dodge: {
    name: '피하기', game: true, theme: THEMES.night, sub: '쏟아지는 고난을 피해라!', hint: '좌우로 드래그해서 이동', tip: '손가락으로 좌우 드래그!',
    LEN: 1200, // 20초
    reset() {
      seed = 23; this.f = 0; this.items = []; this.n = 0; this.next = 40; this.bx = W + 10; gx = W / 2 - 5; fy = GROUND;
      this.hearts = Array.from({ length: 8 }, (_, i) => ({ at: 90 + i * 140, x: 10 + rnd() * (W - 27), y: -10, on: true }));
    },
    step() {
      this.f++;
      const px = gx;
      gx = clamp(holdX !== null ? gx + clamp(holdX - 5 - gx, -3, 3) : gx + keyDir * 2.5, 0, W - 10);
      legs = Math.abs(gx - px) > .3 ? runLegs() : 'idle';
      if (this.f < this.LEN && --this.next <= 0) {
        const o = CONFIG.course[this.n++ % CONFIG.course.length];
        this.items.push({ ...o, x: rnd() * (W - o.w), y: -o.h, vy: 1.2 + this.f / 1000 });
        this.next = Math.max(18, 44 - (this.f / 40 | 0));
      }
      this.items = this.items.filter(it => {
        it.y += it.vy;
        if (groomHit(it.x + 1, it.y + 1, it.w - 2, it.h - 2)) { hit(); burst(it.x + it.w / 2, it.y + it.h / 2, 10, [it.c, '#fff']); return false; }
        if (it.y + it.h >= GROUND) { burst(it.x + it.w / 2, GROUND - 2, 4, ['#8a5a3c', '#fff']); return false; }
        return true;
      });
      for (const h of this.hearts) if (h.on && this.f >= h.at) {
        h.y += 1;
        if (groomHit(h.x, h.y, 7, 6)) grab(h, h.x + 3, h.y + 3);
        else if (h.y > GROUND) h.on = false;
      }
      if (this.f >= this.LEN && !this.items.length) { // 버티면 신부 등장
        this.bx -= .8; bride = { x: this.bx, y: GROUND };
        if (this.bx <= W - 40) return true;
      }
      return false;
    },
    progress() { return this.f / this.LEN; },
    draw() {
      drawBg(this.theme, t * .3, 0);
      for (const it of this.items) { block(it.x, it.y, it.w, it.h, it.c); txt(it.t, it.x + it.w / 2, it.y - 7, 9, '#fff', 'Galmuri9'); }
      for (const h of this.hearts) if (h.on && this.f >= h.at) spr(ctx, HEART, h.x, h.y);
    },
  },
  // ===== 4. 대화형 스토리: 말풍선으로 이야기, 탭하면 다음 대사 =====
  story: {
    name: '대화형 스토리', theme: THEMES.sunset, title: ['우리의', '이야기'], sub: '두 사람의 이야기를 들어주세요', hint: '탭해서 대화 넘기기', endText: '결혼합니다!',
    reset() { this.i = 0; this.ch = 0; this.done = false; gx = 30; fy = GROUND; bride = { x: 124, y: GROUND }; },
    press() {
      if (this.done) return;
      const s = CONFIG.story[this.i][1];
      if (this.ch < s.length) this.ch = s.length; // 글자 나오는 중이면 한 번에 다 보여주기
      else if (this.i + 1 >= CONFIG.story.length) this.done = true;
      else { this.i++; this.ch = 0; }
      beep(660, 660, .04);
    },
    step() {
      if (this.done) return true;
      const s = CONFIG.story[this.i][1], prev = this.ch | 0;
      this.ch = Math.min(this.ch + .5, s.length);
      if ((this.ch | 0) !== prev && prev % 3 === 0) beep(880, 880, .02, .02);
      const tx = 30 + (bride.x - 11 - 30) * this.i / Math.max(1, CONFIG.story.length - 1); // 대사마다 한 걸음씩 가까워짐
      if (Math.abs(gx - tx) > .6) { gx += Math.sign(tx - gx) * .6; legs = runLegs(); } else legs = 'idle';
      return false;
    },
    draw() {
      drawBg(this.theme, t * .2, 0);
      const [who, s] = CONFIG.story[this.i], name = who === '신랑' ? CONFIG.groom : who === '신부' ? CONFIG.bride : who;
      ctx.fillStyle = '#ff6b9a'; // 말하는 사람 머리 위 ▼
      const mark = x => { const y = fy - GH - 8 + ((t >> 4) % 2); ctx.fillRect(x - 3, y, 7, 2); ctx.fillRect(x - 2, y + 2, 5, 1); ctx.fillRect(x - 1, y + 3, 3, 1); ctx.fillRect(x, y + 4, 1, 1); };
      if (who !== '신부') mark(gx + 5);
      if (who !== '신랑') mark(bride.x + 6);
      ctx.fillStyle = '#1c1c2b'; ctx.fillRect(6, 262, 168, 52);
      ctx.fillStyle = '#fff'; ctx.fillRect(8, 264, 164, 1); ctx.fillRect(8, 311, 164, 1); ctx.fillRect(8, 264, 1, 48); ctx.fillRect(171, 264, 1, 48);
      ctx.font = '9px Galmuri9, monospace'; const nw = ctx.measureText(name).width + 10;
      ctx.fillStyle = '#1c1c2b'; ctx.fillRect(9, 252, nw + 2, 13); ctx.fillStyle = '#e8567a'; ctx.fillRect(10, 253, nw, 11);
      say(name, 15, 254, 9, '#fff', 'Galmuri9');
      let rem = this.ch | 0;
      wrap(s, 152, 10).slice(0, 3).forEach((line, k) => { if (rem > 0) say(line.slice(0, rem), 14, 271 + k * 13, 10); rem -= line.length; });
      if (this.ch >= s.length && (t >> 4) % 2) { ctx.fillStyle = '#fff'; ctx.fillRect(160, 303, 5, 1); ctx.fillRect(161, 304, 3, 1); ctx.fillRect(162, 305, 1, 1); }
    },
  },

  // ===== 5. 편지 봉투: 하트 실링을 누르면 봉투가 열리고 초대장이 올라옴 =====
  letter: {
    name: '편지 봉투', theme: THEMES.night, noTitle: true, noGroom: true, endText: null,
    reset() { this.open = -1; },
    press() { if (this.open < 0) { this.open = 0; beep(523, 1046, .2); burst(W / 2, 168, 16, ['#ff6b9a', '#fff']); } },
    step() { if (this.open >= 0) this.open++; return this.open > 100; },
    draw() {
      drawBg(this.theme, t * .2, 0);
      const ex = 25, ey = 130, ew = 130, eh = 84, cx = ex + ew / 2, f = this.open;
      const fh = Math.round(44 * Math.cos(clamp(f / 30, 0, 1) * Math.PI)); // 덮개: 44(닫힘) → -44(열림)
      const flap = () => { const n = Math.abs(fh); for (let r = 0; r <= n; r++) {
        const y = fh > 0 ? ey + r : ey - r, inset = Math.round(r * ew / 2 / Math.max(1, n));
        ctx.fillStyle = '#1c1c2b'; ctx.fillRect(ex + inset - 1, y, ew - 2 * inset + 2, 1);
        ctx.fillStyle = r === n ? '#1c1c2b' : '#f8e7d2'; ctx.fillRect(ex + inset, y, ew - 2 * inset, 1); } };
      txt('To. 소중한 분께', W / 2, 92, 12, '#ffd34d');
      block(ex, ey, ew, eh, '#e9c9a8');            // 봉투 뒷면
      if (fh < 0) flap();
      const ly = ey + 6 - clamp((f - 30) / 50, 0, 1) * 96; // 초대장이 올라옴
      if (f > 30) {
        block(ex + 10, ly, ew - 20, 110, '#ffffff');
        const d = new Date(CONFIG.date), p2 = n => String(n).padStart(2, '0');
        ink('WEDDING INVITATION', cx, ly + 14, 8, '#e8567a', 'Galmuri9');
        spr(ctx, HEART, cx - 3, ly + 24);
        ink(CONFIG.groom, cx, ly + 44, 11); ink('&', cx, ly + 58, 9, '#7a6f8f'); ink(CONFIG.bride, cx, ly + 72, 11);
        ink(`${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())}`, cx, ly + 90, 9, '#7a6f8f', 'Galmuri9');
      }
      block(ex, ey + 30, ew, eh - 30, '#f2d6b8');  // 앞주머니
      ctx.fillStyle = '#c9a582';
      for (let i = 0; i <= ew / 2; i++) { const y = ey + 30 + Math.round(i * 30 / (ew / 2)); ctx.fillRect(ex + i, y, 1, 1); ctx.fillRect(ex + ew - 1 - i, y, 1, 1); }
      if (fh >= 0) flap();
      if (f < 0) {
        const s = (t >> 4) % 2 ? 3 : 2, hw = 7 * s;
        spr(ctx, HEART, cx - hw / 2, ey + fh - 3 * s, s);
        if ((t >> 5) % 2) txt('하트 실링을 톡!', W / 2, ey + eh + 26, 11, '#fff');
      }
    },
  },

  // ===== 6. 스크래치 복권: 긁으면 날짜가 나오고 "당첨!" =====
  scratch: {
    name: '스크래치 복권', theme: THEMES.sunset, noTitle: true, noGroom: true, endText: '당첨!',
    AX: 26, AY: 150, AW: 128, AH: 50, // 긁는 영역 (2px 칸 64×25)
    reset() { this.cells = new Uint8Array(64 * 25); this.cleared = 0; this.done = false; this.wait = 0; this.lx = null; },
    rub(px, py) {
      const cx0 = Math.floor((px - this.AX) / 2), cy0 = Math.floor((py - this.AY) / 2);
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const cx = cx0 + dx, cy = cy0 + dy;
        if (dx * dx + dy * dy > 10 || cx < 0 || cy < 0 || cx >= 64 || cy >= 25) continue;
        const i = cy * 64 + cx; if (!this.cells[i]) { this.cells[i] = 1; this.cleared++; }
      }
    },
    drag(x, y) { // 빠르게 긁어도 끊기지 않게 이전 점과 이어서 지움
      if (this.done) return;
      if (this.lx !== null) { const n = Math.max(1, Math.hypot(x - this.lx, y - this.ly) / 2); for (let k = 0; k <= n; k++) this.rub(this.lx + (x - this.lx) * k / n, this.ly + (y - this.ly) * k / n); }
      else this.rub(x, y);
      this.lx = x; this.ly = y;
      if (t % 4 === 0) beep(1500 + Math.random() * 500, 1200, .03, .015);
    },
    release() { this.lx = null; },
    step() {
      if (!this.done && this.cleared > this.cells.length * .5) { this.done = true; this.cells.fill(1); beep(784, 1568, .3); }
      return this.done && ++this.wait > 30;
    },
    draw() {
      drawBg(this.theme, t * .2, 0);
      const { AX, AY, AW, AH } = this, d = new Date(CONFIG.date);
      block(12, 82, 156, 150, '#ffd34d'); ctx.fillStyle = '#fff7ea'; ctx.fillRect(16, 86, 148, 142);
      ink('♥ 축 결혼 복권 ♥', W / 2, 102, 12, '#e8567a');
      ink(`${CONFIG.groom} · ${CONFIG.bride}`, W / 2, 122, 9, '#7a6f8f', 'Galmuri9');
      ctx.fillStyle = '#fff'; ctx.fillRect(AX, AY, AW, AH);
      ink('당첨!', W / 2, AY + 15, 14, '#e8567a');
      ink(`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`, W / 2, AY + 36, 10);
      for (let i = 0; i < this.cells.length; i++) if (!this.cells[i]) {
        const cx = i % 64, cy = i / 64 | 0;
        ctx.fillStyle = (cx + cy) % 7 ? '#b8bcc8' : '#d5d9e3'; ctx.fillRect(AX + cx * 2, AY + cy * 2, 2, 2);
      }
      if (this.cleared < 40) ink('여기를 긁어주세요', W / 2, AY + AH / 2, 10, '#5b5f6e');
      ink('1등 상품: 저희 결혼식 초대권', W / 2, 214, 9, '#7a6f8f', 'Galmuri9');
      if (!this.done && (t >> 5) % 2) txt('손가락으로 쓱쓱 긁어주세요!', W / 2, 256, 10, '#fff');
    },
  },

  // ===== 7. 레트로 게임기: 십자키로 메뉴를 골라 보기 =====
  console: {
    name: '레트로 게임기', theme: THEMES.spring, noTitle: true, console: true,
    menu: ['청첩장 열기', '예식 안내', '오시는 길', '미니게임'],
    reset() { this.cur = 0; this.page = null; gx = W / 2 - 13; fy = GROUND; bride = { x: W / 2 + 2, y: GROUND }; },
    key(k) {
      beep(700, 700, .04);
      if (this.page) { if (k === 'a' || k === 'b') this.page = null; return; }
      if (k === 'up') this.cur = (this.cur + this.menu.length - 1) % this.menu.length;
      if (k === 'down') this.cur = (this.cur + 1) % this.menu.length;
      if (k !== 'a') return;
      if (this.cur === 0) openCard();
      if (this.cur === 1) this.page = ['예식 안내', whenText(), CONFIG.venue];
      if (this.cur === 2) this.page = ['오시는 길', CONFIG.venue, CONFIG.address, '지도는 청첩장 안에서 열 수 있어요'];
      if (this.cur === 3) begin(MODES.run); // 게임기 화면 안에서 달리기 게임
    },
    step() { legs = 'idle'; return false; },
    draw() {
      drawBg(this.theme, t * .3, 0);
      if (this.page) {
        block(12, 46, 156, 160, '#1c1c2b');
        txt(this.page[0], W / 2, 64, 12, '#ffd34d');
        let y = 88;
        for (const p of this.page.slice(1)) { for (const line of wrap(p, 136, 10)) { say(line, 22, y, 10); y += 14; } y += 8; }
        if ((t >> 5) % 2) txt('B: 뒤로', W / 2, 192, 9, '#c9c3e6', 'Galmuri9');
        return;
      }
      txt('WEDDING', W / 2, 48, 18, '#ffd34d');
      txt(`${CONFIG.groom} ♥ ${CONFIG.bride}`, W / 2, 72, 10);
      block(30, 92, 120, 104, '#1c1c2b');
      this.menu.forEach((m, i) => {
        const y = 110 + i * 22;
        say(m, 52, y - 5, 11, i === this.cur ? '#fff' : '#8f88b8');
        if (i === this.cur && (t >> 4) % 2) { ctx.fillStyle = '#ff6b9a'; ctx.fillRect(40, y - 3, 2, 7); ctx.fillRect(42, y - 2, 2, 5); ctx.fillRect(44, y - 1, 2, 3); }
      });
      txt('▲▼ 고르기 · A 확인', W / 2, 212, 9, '#fff', 'Galmuri9');
    },
  },
};

// 버전 고르기: CONFIG.game이 'pick'이면 왼쪽 위에 고르는 메뉴가 보임
function chosenMode() {
  if (MODES[CONFIG.game]) return CONFIG.game;
  const h = location.hash.slice(1);
  return MODES[modeName] ? modeName : MODES[h] ? h : 'run';
}
const pick = $('pick');
if (!MODES[CONFIG.game]) pick.innerHTML = Object.entries(MODES).map(([k, m]) => `<option value="${k}">${m.name}</option>`).join('');
pick.onchange = () => { modeName = pick.value; reset(); };

// 모드 하나를 처음 상태로 (게임기 안에서 미니게임을 켤 때도 사용)
function begin(m) {
  mode = m;
  state = m.noTitle ? 'play' : 'title'; t = 0; playT = 0; endT = 0; meetT = -1; shake = 0; parts = []; inv = 0; hits = 0; got = 0;
  legs = 'idle'; bride = null; holdX = null; gx = W / 2 - 5; fy = GROUND;
  m.reset();
  $('open').hidden = true; $('skip').hidden = !!MODES[modeName].console;
}
function reset() {
  modeName = chosenMode();
  pick.hidden = !!MODES[CONFIG.game]; pick.value = modeName;
  const cons = !!MODES[modeName].console;
  $('game').classList.toggle('console', cons); $('pad').hidden = !cons;
  resize();
  begin(MODES[modeName]);
}

// 소리
let AC, muted = false;
function beep(f1, f2, d, v = 0.05, delay = 0) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d);
  } catch (e) {}
}
function march() { // 결혼행진곡(바그너, 퍼블릭 도메인) 첫 소절
  [[392,.35],[523,.25],[523,.12],[523,.6],[392,.35],[587,.25],[494,.12],[523,.6]]
    .reduce((at, [f, d]) => (beep(f, f, d * .95, .05, at), at + d), 0);
}

// 입력
function press() {
  if (state === 'title') { state = 'play'; if (!MODES[modeName].console) pick.hidden = true; beep(440, 880, .15); return false; }
  if (state === 'play' && mode.press) mode.press();
  return true;
}
function padKey(k) { // 게임기 버튼
  if (mode.key) return mode.key(k);
  if (k === 'b') return reset(); // 미니게임 중 B = 메뉴로
  if (k === 'a' || k === 'up') press();
}
const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
const toY = e => { const r = cv.getBoundingClientRect(); return (e.clientY - r.top) / r.height * H; };
$('game').addEventListener('pointerdown', e => {
  if (e.target.closest('button, select')) return;
  e.preventDefault();
  if (mode.key) return; // 게임기 메뉴는 버튼으로만
  if (press()) { holdX = toX(e); if (mode.drag) mode.drag(holdX, toY(e)); }
});
$('game').addEventListener('pointermove', e => { if (holdX !== null) { holdX = toX(e); if (mode.drag) mode.drag(holdX, toY(e)); } });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('game').addEventListener(ev, () => { holdX = null; if (mode.release) mode.release(); });
for (const b of document.querySelectorAll('#pad [data-k]')) b.addEventListener('pointerdown', e => { e.preventDefault(); padKey(b.dataset.k); });
addEventListener('keydown', e => {
  if ($('game').hidden || e.target.closest && e.target.closest('select')) return;
  if (MODES[modeName].console) {
    const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'a', Space: 'a', KeyZ: 'a', Escape: 'b', KeyX: 'b', Backspace: 'b' }[e.code];
    if (k) { e.preventDefault(); if (!e.repeat) padKey(k); }
    return;
  }
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) press(); }
  if (e.code === 'ArrowLeft') keyDir = -1;
  if (e.code === 'ArrowRight') keyDir = 1;
});
addEventListener('keyup', e => { if ((e.code === 'ArrowLeft' && keyDir < 0) || (e.code === 'ArrowRight' && keyDir > 0)) keyDir = 0; });
$('sound').onclick = () => { muted = !muted; $('sound').textContent = muted ? '♪ OFF' : '♪ ON'; };
$('skip').onclick = () => openCard();
$('open').onclick = () => openCard();

function update() {
  t++;
  if (inv > 0) inv--;
  if (shake > 0) shake--;
  parts = parts.filter(p => (p.x += p.vx, p.y += p.vy, p.vy += .08, --p.life > 0));
  if (state === 'title') return;
  if (state === 'play') { playT++; if (mode.step()) { state = 'end'; $('skip').hidden = true; } return; }
  // 엔딩: 신부가 있으면 신랑이 옆으로 걸어감, 없으면 바로 축하
  endT++;
  if (mode.endStep) mode.endStep();
  const bx = bride ? bride.x : W / 2 - 6, by = bride ? bride.y : 150;
  const tx = gx < bx ? bx - 11 : bx + 13;
  if (meetT < 0 && bride && !mode.noGroom && Math.abs(gx - tx) > .8) { gx += Math.sign(tx - gx) * .8; legs = runLegs(); }
  else if (meetT < 0) { meetT = endT; legs = 'idle'; march(); burst(bx + 6, by - 20, 40, ['#ff6b9a', '#ffd34d', '#fff', '#7ec8e3']); }
  if (meetT >= 0 && endT - meetT === 100) $('open').hidden = false;
  if (meetT >= 0 && endT % 40 === 0) burst(bx + 2, by - 22, 6, ['#ff6b9a', '#fff']);
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() * 3 | 0) - 1, (Math.random() * 3 | 0) - 1);
  if (state === 'title') drawBg(mode.theme, t * .5, 0); else mode.draw();
  if (bride && !(state === 'title' && mode.game)) spr(ctx, BRIDE, bride.x, bride.y - 16);
  if (!mode.noGroom && !(inv > 0 && t % 6 < 3)) spr(ctx, groomRows(legs), gx, fy - GH);
  for (const p of parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }

  if (state === 'title') {
    const [a, b] = mode.title || [`신랑 ${CONFIG.groom.slice(1)}의`, '대모험'];
    txt(a, W / 2, 70, 12, '#ffd34d');
    txt(b, W / 2, 94, 22, '#fff');
    txt(mode.sub, W / 2, 124, 10, '#ffe3ef');
    if ((t >> 5) % 2) txt('화면을 톡! 눌러 시작', W / 2, 180, 11, '#fff');
    txt(mode.hint, W / 2, H - 40, 10, '#ffe3ef');
  } else if (mode.game) {
    ctx.fillStyle = '#1c1c2b'; ctx.fillRect(19, 13, 132, 6);
    ctx.fillStyle = '#ff6b9a'; ctx.fillRect(20, 14, 130 * clamp(mode.progress(), 0, 1), 4);
    spr(ctx, HEART, 152, 13);
    txt(`♥ ${got}/${mode.hearts.length}`, 24, 30, 9, '#fff', 'Galmuri9');
    if (state === 'play' && playT < 180) txt(mode.tip, W / 2, H - 40, 10, '#ffe3ef');
  }
  if (meetT >= 0 && mode.endText !== null) {
    txt(mode.endText || '드디어 만났다!', W / 2, 52, 16, '#ffd34d');
    if (mode.game) {
      txt(`하트 ${got}개 · 꽈당 ${hits}번`, W / 2, 74, 10, '#fff');
      if (got === mode.hearts.length && hits === 0) txt('★ 퍼펙트 신랑 ★', W / 2, 90, 10, '#ff6b9a');
    }
  }
  ctx.restore();
}

let last = 0, acc = 0;
function loop(ts) {
  if (!running) return;
  acc += Math.min(100, ts - (last || ts)); last = ts;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; } // 고주사율 폰에서도 같은 속도
  draw();
  requestAnimationFrame(loop);
}
function startGame() { reset(); running = true; last = 0; acc = 0; requestAnimationFrame(loop); }

