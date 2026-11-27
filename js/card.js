// ---------- 청첩장 ----------
function openCard() {
  $('game').classList.add('out');
  setTimeout(() => { running = false; $('game').hidden = true; $('game').classList.remove('out'); $('card').hidden = false; scrollTo(0, 0); }, 400);
}
function replay() { $('card').hidden = true; $('game').hidden = false; startGame(); }

function renderCard() {
  const C = CONFIG, d = new Date(C.date), Y = d.getFullYear(), M = d.getMonth(), D = d.getDate();
  const when = whenText();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dd = Math.round((new Date(Y, M, D) - today) / 864e5);
  let cal = [...'일월화수목금토'].map((w, i) => `<b class="${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</b>`).join('');
  cal += '<span></span>'.repeat(new Date(Y, M, 1).getDay());
  for (let i = 1, n = new Date(Y, M + 1, 0).getDate(); i <= n; i++) {
    const w = new Date(Y, M, i).getDay();
    cal += `<span class="${i === D ? 'on' : w === 0 ? 'sun' : w === 6 ? 'sat' : ''}">${i}</span>`;
  }
  const q = encodeURIComponent(C.address);
  const accs = Object.entries(C.accounts).map(([side, list]) => `
    <details><summary>${side} 계좌번호</summary>
      ${list.map(([who, bank, num]) => `<div class="acc"><div>${who}<small>${bank} ${num}</small></div>
        <button class="btn ghost sm" data-copy="${bank} ${num}">복사</button></div>`).join('')}
    </details>`).join('');
  const gal = C.photos.length
    ? C.photos.map((src, i) => `<button class="ph" data-i="${i}"><img src="${src}" loading="lazy" alt="웨딩 사진 ${i + 1}"></button>`).join('')
    : Array.from({ length: 6 }, (_, i) => `<div class="ph ph-empty">PHOTO ${i + 1}</div>`).join('');
  const cts = Object.entries(C.contacts).map(([side, list]) => `<div class="ct"><h3>${side}</h3>
      ${list.map(([rel, name, tel]) => `<div class="acc"><div>${rel} ${name}<small>${tel}</small></div>
        <span class="row tight"><a class="btn sm" href="tel:${tel}">전화</a><a class="btn ghost sm" href="sms:${tel}">문자</a></span></div>`).join('')}
    </div>`).join('');
  const seg = (name, opts) => `<div class="seg">${opts.map((o, i) => `<label><input type="radio" name="${name}" value="${o}"${i ? '' : ' checked'}><span>${o}</span></label>`).join('')}</div>`;

  $('card').innerHTML = `
    <div class="hero">
      <canvas id="couple" width="40" height="24"></canvas>
      <p class="eyebrow">WEDDING INVITATION</p>
      <h1>${C.groom} <span>♥</span> ${C.bride}</h1>
      <p>${when}</p>
      <p>${C.venue}</p>
      <p class="dday">${dd > 0 ? `D-${dd}` : dd === 0 ? 'D-DAY' : '감사합니다'}</p>
    </div>
    <section class="box px"><h2>초대합니다</h2>
      <p class="msg">${C.message}</p>
      <p class="parents">${C.groomParents}의 ${C.groomRel} <b>${C.groom.slice(1)}</b><br>${C.brideParents}의 ${C.brideRel} <b>${C.bride.slice(1)}</b></p>
    </section>
    <section class="box px"><h2>갤러리</h2>
      ${C.photos.length ? '' : '<p class="note">CONFIG.photos에 사진을 넣으면 여기에 보여요</p>'}
      <div class="gal">${gal}</div>
    </section>
    <section class="box px"><h2>예식 일시</h2>
      <p style="margin:0;font-size:14px">${when}</p>
      <div class="cal">${cal}</div>
    </section>
    <section class="box px"><h2>오시는 길</h2>
      <p style="margin:0">${C.venue}</p>
      <p class="addr">${C.address}</p>
      <div class="row">
        <a class="btn sm" href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">네이버지도</a>
        <a class="btn sm" href="https://map.kakao.com/link/search/${q}" target="_blank" rel="noopener">카카오맵</a>
        <button class="btn ghost sm" data-copy="${C.address}">주소 복사</button>
      </div>
      <dl class="tr">${C.transport.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    </section>
    <section class="box px"><h2>연락하기</h2>${cts}</section>
    <section class="box px"><h2>참석 여부</h2>
      <p class="note">원활한 준비를 위해 참석 여부를 알려주세요</p>
      <form id="rsvp" class="form">
        ${seg('side', ['신랑측', '신부측'])}
        ${seg('attend', ['참석', '불참'])}
        <input id="rsvpName" name="name" required maxlength="30" placeholder="성함" autocomplete="name">
        <label class="fld">본인 포함 인원 <input id="rsvpCount" name="count" type="number" min="1" max="10" value="1"></label>
        ${seg('meal', ['식사 예정', '식사 안 함', '미정'])}
        <button class="btn">참석 여부 전달하기</button>
      </form>
    </section>
    <section class="box px"><h2>마음 전하실 곳</h2>${accs}</section>
    <section class="box px"><h2>방명록</h2>
      <form id="gb" class="form">
        <input id="gbName" name="name" required maxlength="30" placeholder="이름">
        <textarea id="gbMsg" name="msg" required maxlength="300" rows="3" placeholder="축하 메시지를 남겨주세요"></textarea>
        <button class="btn">남기기</button>
      </form>
      <ul id="gbList" class="gb"></ul>
    </section>
    <footer class="row">
      <button class="btn" id="share">청첩장 공유하기</button>
      <button class="btn ghost" id="replay">🎮 다시 플레이</button>
    </footer>`;
  const c = $('couple').getContext('2d');
  spr(c, groomRows('idle'), 5, 22 - GH); spr(c, HEART, 16, 1); spr(c, BRIDE, 23, 6);
  c.fillStyle = '#3fae5a'; c.fillRect(0, 22, 40, 2);
  $('replay').onclick = replay;
  $('rsvp').onsubmit = e => submit(e, d => d, '참석 여부가 전달되었어요. 감사합니다!');
  $('gb').onsubmit = e => submit(e, d => { if (!C.sheetUrl) lsSet([{ t: Date.now(), ...d }, ...lsGet()]); }, '축하 메시지가 등록되었어요', loadGb);
  loadGb();
  $('share').onclick = () => navigator.share
    ? navigator.share({ title: `${C.groom} ♥ ${C.bride} 결혼합니다`, url: location.href }).catch(e => { if (e.name !== 'AbortError') copy(location.href, '링크가 복사되었습니다'); })
    : copy(location.href, '링크가 복사되었습니다');
}

function toast(m) { const el = $('toast'); el.textContent = m; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 1600); }
function copy(s, msg = '복사되었습니다') {
  if (navigator.clipboard && isSecureContext) return navigator.clipboard.writeText(s).then(() => toast(msg), () => toast('복사 실패'));
  const ta = Object.assign(document.createElement('textarea'), { value: s }); document.body.append(ta); ta.select();
  document.execCommand('copy'); ta.remove(); toast(msg);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy);
  const p = e.target.closest('.ph[data-i]'); if (p) lbShow(+p.dataset.i);
});

// 사진 크게 보기 (좌우 스와이프)
let lbI = 0, lbX = 0;
function lbShow(i) {
  const P = CONFIG.photos; lbI = (i + P.length) % P.length;
  $('lbImg').src = P[lbI]; $('lbImg').alt = `웨딩 사진 ${lbI + 1}`; $('lbCount').textContent = `${lbI + 1} / ${P.length}`; $('lb').hidden = false;
}
$('lbPrev').onclick = () => lbShow(lbI - 1);
$('lbNext').onclick = () => lbShow(lbI + 1);
$('lbClose').onclick = () => { $('lb').hidden = true; };
$('lb').addEventListener('pointerdown', e => { lbX = e.clientX; });
$('lb').addEventListener('pointerup', e => { const dx = e.clientX - lbX; if (Math.abs(dx) > 40) lbShow(lbI + (dx < 0 ? 1 : -1)); });
addEventListener('keydown', e => { if ($('lb').hidden) return; if (e.key === 'Escape') $('lb').hidden = true; if (e.key === 'ArrowLeft') lbShow(lbI - 1); if (e.key === 'ArrowRight') lbShow(lbI + 1); });

// 참석 여부·방명록: 구글 시트(Apps Script)로 전송. sheetUrl이 없으면 미리보기 모드(방명록만 이 기기에 저장)
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = 'wedding-guestbook';
function lsGet() { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { return []; } }
function lsSet(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {} }

async function submit(e, local, okMsg, after) {
  e.preventDefault();
  const form = e.target, btn = form.querySelector('button:last-child');
  const d = Object.fromEntries(new FormData(form));
  btn.disabled = true;
  try {
    local(d);
    // ponytail: no-cors라 응답을 읽을 수 없음 → 네트워크 오류만 실패로 처리. 시트에서 실제 기록을 확인하세요
    if (CONFIG.sheetUrl) await fetch(CONFIG.sheetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: form.id, ...d }) });
    toast(CONFIG.sheetUrl || form.id === 'gb' ? okMsg : '미리보기 모드라 저장되지 않았어요');
    form.reset();
    if (after) await after();
  } catch (err) { toast('전송하지 못했어요. 잠시 후 다시 시도해주세요'); }
  btn.disabled = false;
}

async function loadGb() {
  let list = lsGet();
  if (CONFIG.sheetUrl) {
    try { list = await (await fetch(CONFIG.sheetUrl)).json(); }
    catch (e) { $('gbList').innerHTML = '<li class="note">방명록을 불러오지 못했어요</li>'; return; }
  }
  $('gbList').innerHTML = list.length
    ? list.map(g => `<li><b>${esc(g.name)}</b><time>${new Date(g.t).toLocaleDateString('ko-KR')}</time><p>${esc(g.msg)}</p></li>`).join('')
    : '<li class="note">첫 축하 메시지를 남겨주세요!</li>';
}

renderCard();
startGame();
