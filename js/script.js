(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 600px)').matches;

  var welcome = $('welcome'), buttons = $('buttons');
  var yesBtn = $('yesBtn'), yesWrap = $('yesWrap');
  var noBtn = $('noBtn'), noWrap = $('noWrap'), bubble = $('noBubble');
  var thanks = $('thanks'), canvas = $('confetti');
  var letterSection = $('letter-section');

  /* ================= Music ================= */
  var bgm = $('bgm'), musicBtn = $('musicBtn');
  var musicOn = $('musicOn'), musicOff = $('musicOff');
  var userPaused = false, musicFailed = false;

  function setMusicUI(playing) {
    musicOn.style.display = playing ? '' : 'none';
    musicOff.style.display = playing ? 'none' : '';
    musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }
  function failMusic() {
    musicFailed = true;
    musicBtn.classList.add('nomusic');
  }
  function tryPlay() {
    if (musicFailed || userPaused || !bgm.paused) return;
    try {
      var p = bgm.play();
      if (p && p.catch) p.catch(function () { /* blocked or unavailable: stay silent */ });
    } catch (e) { /* ignore */ }
  }
  bgm.volume = 0.4;
  bgm.addEventListener('error', failMusic);
  bgm.addEventListener('play', function () { setMusicUI(true); });
  bgm.addEventListener('pause', function () { setMusicUI(false); });
  setMusicUI(false);

  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) {
    window.addEventListener(ev, function once() {
      tryPlay();
      if (!bgm.paused || musicFailed) {
        ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (e2) { window.removeEventListener(e2, once, true); });
      }
    }, true);
  });
  musicBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (musicFailed) return;
    if (bgm.paused) { userPaused = false; tryPlay(); }
    else { userPaused = true; bgm.pause(); }
  });

  /* ================= Background layers ================= */
  (function layers() {
    var i, el;
    // twinkling stars
    var stars = $('stars'), sn = isMobile ? 16 : 34;
    for (i = 0; i < sn; i++) {
      var ss = 6 + Math.random() * 10;
      el = document.createElement('span');
      el.className = 'star';
      el.style.left = (Math.random() * 100) + '%';
      el.style.top = (Math.random() * 65) + '%';
      el.style.width = el.style.height = ss + 'px';
      el.style.setProperty('--t', (2 + Math.random() * 4) + 's');
      el.style.animationDelay = (-Math.random() * 5) + 's';
      el.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>';
      stars.appendChild(el);
    }
    if (reduce) return;
    // dust
    var dust = $('dust'), dn = isMobile ? 22 : 50;
    for (i = 0; i < dn; i++) {
      var ds = 1.5 + Math.random() * 2.5;
      el = document.createElement('span');
      el.className = 'dust';
      el.style.left = (Math.random() * 100) + '%';
      el.style.width = el.style.height = ds + 'px';
      el.style.animationDuration = (14 + Math.random() * 18) + 's';
      el.style.animationDelay = (-Math.random() * 30) + 's';
      el.style.setProperty('--o', (0.2 + Math.random() * 0.5).toFixed(2));
      el.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
      dust.appendChild(el);
    }
    // floating crosses, notes, microphones, gifts
    var box = $('particles'), count = isMobile ? 10 : 22;
    var kinds = ['i-cross', 'i-note', 'i-mic', 'i-gift'];
    for (i = 0; i < count; i++) {
      var k = kinds[i % kinds.length];
      var size = 16 + Math.random() * 24;
      el = document.createElement('span');
      el.className = 'particle';
      el.style.left = (Math.random() * 100) + '%';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.animationDuration = (22 + Math.random() * 24) + 's';
      el.style.animationDelay = (-Math.random() * 40) + 's';
      el.style.setProperty('--o', (0.07 + Math.random() * 0.13).toFixed(2));
      el.style.setProperty('--dx', ((Math.random() - 0.5) * 100) + 'px');
      el.style.setProperty('--r0', (Math.random() * 40 - 20) + 'deg');
      el.style.setProperty('--r1', (Math.random() * 100 - 50) + 'deg');
      el.innerHTML = '<svg viewBox="' + (k === 'i-cross' ? '0 0 24 32' : '0 0 24 24') + '"><use href="#' + k + '"/></svg>';
      box.appendChild(el);
    }
  })();

  /* ================= NO button ================= */
  var messages = ['pagdali', '1k nana dayun', 'bless and love brader', 'gaya oi',
    '1k nana ba', 'yes na dayun oi bogo', 'donate na dira'];
  var lastMsg = -1, moved = false, answered = false, lastEscape = 0, bubbleTimer;
  var MARGIN = 8, EDGE = 16;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function startMoving() {
    if (moved) return;
    moved = true;
    var r = noBtn.getBoundingClientRect();
    noWrap.style.width = r.width + 'px';
    noWrap.style.height = r.height + 'px';
    noBtn.classList.add('moving');
    noBtn.style.left = r.left + 'px';
    noBtn.style.top = r.top + 'px';
    welcome.appendChild(noBtn); // outside the card so position:fixed is relative to the viewport
    void noBtn.offsetWidth;
  }

  function showBubble() {
    var idx;
    do { idx = Math.floor(Math.random() * messages.length); } while (idx === lastMsg);
    lastMsg = idx;
    bubble.classList.remove('show');
    bubble.textContent = messages[idx];
    void bubble.offsetWidth; // restart the pop animation
    var bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    var vw = window.innerWidth, left, top;
    if (vw <= 600) {            // toast, top-center
      left = (vw - bw) / 2;
      top = 64;
    } else {                    // next to NO's new position
      var r = noBtn.getBoundingClientRect();
      left = clamp(r.left + r.width / 2 - bw / 2, MARGIN, vw - bw - MARGIN);
      top = r.top - bh - 12;
      if (top < MARGIN) top = r.bottom + 12;
    }
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, 1500);
  }

  function overlapsYes(x, y, w, h) {
    var r = yesRect(), pad = 8;
    return x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad;
  }

  function escapeNo(px, py) {
    if (answered) return;
    var now = Date.now();
    if (now - lastEscape < 140) return;
    lastEscape = now;
    startMoving();
    growYes(); // grow first so the overlap check uses YES's new size

    var w = noBtn.offsetWidth, h = noBtn.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight;
    var minX = EDGE, minY = EDGE;
    var maxX = Math.max(minX, vw - w - EDGE), maxY = Math.max(minY, vh - h - EDGE);
    var curX = parseFloat(noBtn.style.left) || 0, curY = parseFloat(noBtn.style.top) || 0;
    var cx = curX + w / 2, cy = curY + h / 2;
    var small = vw <= 600;
    var lo = small ? 60 : 80, hi = small ? 110 : 160;
    var away = px != null ? Math.atan2(cy - py, cx - px) : Math.random() * Math.PI * 2;

    function valid(x, y) {
      return x >= minX && x <= maxX && y >= minY && y <= maxY && !overlapsYes(x, y, w, h);
    }

    var x = null, y = null, i, ang, d, nx, ny;
    for (i = 0; i < 10; i++) {
      // prefer directions away from the pointer; widen the spread on later attempts
      var spread = px != null ? Math.min(Math.PI, 0.9 + i * 0.3) : Math.PI;
      ang = away + (Math.random() * 2 - 1) * spread;
      d = lo + Math.random() * (hi - lo);
      nx = curX + Math.cos(ang) * d;
      ny = curY + Math.sin(ang) * d;
      if (valid(nx, ny)) { x = nx; y = ny; break; }
    }
    if (x === null) { // step toward the screen center
      var tc = Math.atan2(vh / 2 - cy, vw / 2 - cx);
      d = lo + Math.random() * (hi - lo);
      nx = clamp(curX + Math.cos(tc) * d, minX, maxX);
      ny = clamp(curY + Math.sin(tc) * d, minY, maxY);
      if (valid(nx, ny)) { x = nx; y = ny; }
    }
    if (x === null) { // nearest uncovered corner / edge midpoint
      var xs = [minX, (minX + maxX) / 2, maxX], ys = [minY, (minY + maxY) / 2, maxY];
      var best = null, bestD = Infinity;
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
        if (a === 1 && b === 1) continue;
        if (overlapsYes(xs[a], ys[b], w, h)) continue;
        var dd = Math.hypot(xs[a] - curX, ys[b] - curY);
        if (dd < bestD) { bestD = dd; best = [xs[a], ys[b]]; }
      }
      if (best) { x = best[0]; y = best[1]; }
      else { x = clamp(curX, minX, maxX); y = clamp(curY, minY, maxY); }
    }

    noBtn.style.setProperty('--rot', (Math.random() * 16 - 8).toFixed(1) + 'deg');
    noBtn.style.left = x + 'px';
    noBtn.style.top = y + 'px';
    showBubble();
  }

  function keepNoInside() {
    if (!moved || answered) return;
    var w = noBtn.offsetWidth, h = noBtn.offsetHeight;
    noBtn.style.left = clamp(parseFloat(noBtn.style.left) || 0, EDGE, Math.max(EDGE, window.innerWidth - w - EDGE)) + 'px';
    noBtn.style.top = clamp(parseFloat(noBtn.style.top) || 0, EDGE, Math.max(EDGE, window.innerHeight - h - EDGE)) + 'px';
  }

  document.addEventListener('mousemove', function (e) {
    if (answered) return;
    var r = noBtn.getBoundingClientRect();
    var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    if (Math.hypot(dx, dy) < 60) escapeNo(e.clientX, e.clientY);
  });
  function block(e) {
    e.preventDefault();
    e.stopPropagation();
    var p = (e.touches && e.touches[0]) || e;
    escapeNo(p.clientX, p.clientY);
  }
  noBtn.addEventListener('mousedown', block);
  noBtn.addEventListener('click', block);
  noBtn.addEventListener('touchstart', block, { passive: false });
  noBtn.addEventListener('touchend', function (e) { e.preventDefault(); }, { passive: false });
  noBtn.addEventListener('focus', function () { escapeNo(null, null); });

  /* ================= YES button growth ================= */
  var yesScale = 1;

  function maxScale() {
    var w = yesWrap.offsetWidth, h = yesWrap.offsetHeight;
    return Math.max(1, Math.min(0.95 * window.innerWidth / w, 0.9 * window.innerHeight / h));
  }

  // Where YES will be once its transform settles (getBoundingClientRect lags mid-transition)
  function yesTransform() {
    var r = yesWrap.getBoundingClientRect();
    var w = r.width * yesScale, h = r.height * yesScale;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var vw = window.innerWidth, vh = window.innerHeight;
    var tx = 0, ty = 0;
    if (yesScale > 1) {
      tx = clamp(cx, w / 2 + 4, vw - w / 2 - 4) - cx;
      ty = clamp(cy, h / 2 + 4, vh - h / 2 - 4) - cy;
    }
    return { tx: tx, ty: ty, left: cx + tx - w / 2, top: cy + ty - h / 2, right: cx + tx + w / 2, bottom: cy + ty + h / 2 };
  }
  function yesRect() { return yesTransform(); }

  function applyYes() {
    var t = yesTransform();
    yesBtn.style.transform = 'translate(' + t.tx + 'px,' + t.ty + 'px) scale(' + yesScale + ')';
    welcome.classList.toggle('yes-big', yesScale > 1.8);
    yesBtn.classList.toggle('big', yesScale > 1);
  }

  function growYes() {
    yesScale = Math.min(yesScale + 0.25 + Math.random() * 0.1, maxScale());
    applyYes();
  }

  window.addEventListener('resize', function () {
    keepNoInside();
    if (!answered) { yesScale = Math.min(yesScale, maxScale()); applyYes(); }
  });
  window.addEventListener('scroll', function () { if (!answered && yesScale > 1) applyYes(); }, { passive: true });

  /* ================= YES click ================= */
  yesBtn.addEventListener('click', function () {
    if (answered) return;
    answered = true;
    tryPlay();
    bubble.classList.remove('show');

    noBtn.classList.add('gone');
    setTimeout(function () { noBtn.remove(); noWrap.remove(); }, 450);

    yesScale = 1;
    yesBtn.style.transform = 'translate(0,0) scale(1)';
    welcome.classList.remove('yes-big');

    setTimeout(function () { buttons.classList.add('fade'); }, 650);
    setTimeout(showThanks, 1000);
  });

  /* ================= Thank-you + confetti ================= */
  var raf;

  function showThanks() {
    thanks.classList.add('show');
    thanks.setAttribute('aria-hidden', 'false');
    startConfetti();
    setTimeout(function () {
      thanks.classList.remove('show');
      thanks.setAttribute('aria-hidden', 'true');
      setTimeout(function () { cancelAnimationFrame(raf); }, 700);
      revealLetter();
    }, 2900);
  }

  function startConfetti() {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.width = window.innerWidth * dpr;
    var H = canvas.height = window.innerHeight * dpr;
    var colors = ['#D4A940', '#B8892B', '#F5F1E8', '#FFFFFF', '#E8C566'];
    var n = reduce ? 40 : (isMobile ? 90 : 170);
    var pieces = [];
    for (var i = 0; i < n; i++) {
      var star = i % 4 === 0;
      var burst = i % 2 === 0;
      pieces.push({
        x: burst ? W / 2 + (Math.random() - 0.5) * W * 0.3 : Math.random() * W,
        y: burst ? H * 0.55 : -Math.random() * H * 0.5,
        vx: burst ? (Math.random() - 0.5) * 16 * dpr : (Math.random() - 0.5) * 2 * dpr,
        vy: burst ? -(8 + Math.random() * 12) * dpr : (2 + Math.random() * 3) * dpr,
        g: burst ? 0.28 * dpr : 0.03 * dpr,
        s: (star ? 10 + Math.random() * 12 : 6 + Math.random() * 9) * dpr,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        c: colors[Math.floor(Math.random() * colors.length)],
        star: star
      });
    }
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < pieces.length; j++) {
        var p = pieces[j];
        p.vy += p.g; p.vx *= 0.99;
        p.x += p.vx + Math.sin(p.y / 60) * 0.5 * dpr; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.star) drawStar(ctx, p.s); else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    })();
  }

  function drawStar(ctx, s) {
    var r = s / 2, ri = r * 0.42;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 === 0 ? r : ri, a = -Math.PI / 2 + i * Math.PI / 5;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ================= Letter reveal ================= */
  function revealLetter() {
    letterSection.hidden = false;
    void letterSection.offsetWidth;
    letterSection.classList.add('in');
    welcome.style.opacity = '0';
    setTimeout(function () {
      letterSection.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { welcome.style.display = 'none'; window.scrollTo(0, 0); }, reduce ? 0 : 1100);
    }, 200);
  }

  $('printBtn').addEventListener('click', function () { window.print(); });
})();
