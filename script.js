/* =========================================================
   CHIPMATES — interactions & motion (calmer pass)
   ========================================================= */

// Boot sequence
//   1. Preloader fires `site:prepare` BEFORE it fades out → we set every
//      hero entrance element to its hidden/offset state. The preloader
//      stays in front while we do this, so the user never sees the snap.
//   2. Preloader finishes its fade and fires `site:ready` → we run init()
//      which plays the entrance timeline + binds scroll triggers.
let __preloaderDone = false;
let __preppedStates = false;
let __initRan = false;

function __tryInit() {
  if (__initRan) return;
  if (!__preloaderDone) return;
  if (!(window.gsap && window.ScrollTrigger && window.Lenis)) {
    requestAnimationFrame(__tryInit);
    return;
  }
  __initRan = true;
  // Wrap init in try/catch so a single broken animation never leaves
  // the page in a half-initialised state (with native scroll possibly
  // overridden by a half-set-up Lenis, etc.).
  try {
    init();
  } catch (err) {
    console.error('[chipmates] init failed, falling back to static page', err);
    // Make sure scroll is unlocked even if init blew up.
    document.documentElement.classList.remove('is-loading');
  }
}

// Set the entrance starting states. Runs while preloader is still
// covering the page so the snap-to-hidden is invisible.
function prepEntranceStates() {
  if (__preppedStates) return;
  if (!window.gsap) return;
  __preppedStates = true;
  gsap.set('.hero-char', { y: 80, scale: .92, opacity: 0 });
  gsap.set('.peek', { scale: 0, opacity: 0 });
  gsap.set('.peek-char-tl', { x: -120, opacity: 0 });
  gsap.set('.peek-char-tr', { x: 120, opacity: 0 });
  gsap.set('.peek-char-bl', { x: -120, y: 60, opacity: 0 });
  gsap.set('.peek-char-br', { x: 120, y: 60, opacity: 0 });
  gsap.set('.hero-title .word', { y: '110%', rotate: 6, opacity: 0 });
  gsap.set('.hero .eyebrow, .hero-sub, .hero-cta', { y: 30, opacity: 0 });
  gsap.set('.hero-tag', { scale: 0, rotate: -30, opacity: 0 });
}

document.addEventListener('site:prepare', prepEntranceStates);

document.addEventListener('site:ready', () => {
  __preloaderDone = true;
  __tryInit();
});

// Failsafe: if for some reason the preloader is missing or the events
// never fire (e.g. someone strips them out), still boot after window.load.
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!__initRan && !document.getElementById('preloader')) {
      prepEntranceStates();
      __preloaderDone = true;
      __tryInit();
    }
  }, 100);
});

function init() {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Lenis smooth scroll ---------------- */
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4, offset: -40 });
      }
    });
  });

  /* ---------------- HERO INTRO ---------------- */
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  gsap.set('.hero-char', { y: 80, scale: .92, opacity: 0 });
  tl.to('.hero-char', { y: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.4)' }, 0);

  gsap.set('.peek', { scale: 0, opacity: 0 });
  tl.to('.peek', {
    scale: 1, opacity: 1, duration: .9,
    stagger: { amount: .6, from: 'random' },
    ease: 'back.out(2)'
  }, .3);

  gsap.set('.peek-char-tl', { x: -120, opacity: 0 });
  gsap.set('.peek-char-tr', { x: 120, opacity: 0 });
  gsap.set('.peek-char-bl', { x: -120, y: 60, opacity: 0 });
  gsap.set('.peek-char-br', { x: 120, y: 60, opacity: 0 });
  tl.to('.peek-char-tl, .peek-char-tr, .peek-char-bl, .peek-char-br', {
    x: 0, y: 0, opacity: 1, duration: 1, stagger: .08, ease: 'back.out(1.6)'
  }, .4);

  gsap.set('.hero-title .word', { y: '110%', rotate: 6, opacity: 0 });
  tl.to('.hero-title .word', {
    y: 0, rotate: 0, opacity: 1, duration: .9, stagger: .08, ease: 'back.out(1.4)'
  }, .2);

  gsap.set('.hero .eyebrow, .hero-sub, .hero-cta', { y: 30, opacity: 0 });
  tl.to('.hero .eyebrow', { y: 0, opacity: 1, duration: .6 }, .1);
  tl.to('.hero-sub', { y: 0, opacity: 1, duration: .8 }, .8);
  tl.to('.hero-cta', { y: 0, opacity: 1, duration: .8 }, 1);

  gsap.fromTo('.hero-tag',
    { scale: 0, rotate: -30, opacity: 0 },
    { scale: 1, rotate: 8, opacity: 1, duration: .9, ease: 'back.out(2.2)', delay: 1.4 }
  );
  gsap.to('.hero-tag', {
    rotate: 11, duration: 3.4, ease: 'sine.inOut',
    yoyo: true, repeat: -1, delay: 2.4
  });

  /* idle bounces — halved amplitudes */
  gsap.to('.hero-char', {
    y: '-=10',
    duration: 3, ease: 'sine.inOut',
    yoyo: true, repeat: -1
  });
  document.querySelectorAll('.peek').forEach(el => {
    const dur = parseFloat(el.dataset.float || 5) + 1;
    gsap.to(el, {
      y: '-=7', rotate: '+=3',
      duration: dur, ease: 'sine.inOut',
      yoyo: true, repeat: -1, delay: Math.random()
    });
  });
  gsap.to('.peek-char-tl', { rotate: -8, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.peek-char-tr', { rotate: 7, duration: 4.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.peek-char-bl', { rotate: 6, duration: 3.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.peek-char-br', { rotate: -7, duration: 4.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  /* hero parallax on cursor — calmer */
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - .5);
    const y = (e.clientY / window.innerHeight - .5);
    gsap.to('.hero-char', { x: x * -16, y: y * -10, duration: 1, overwrite: 'auto' });
    gsap.to('.peek-char-tl, .peek-char-bl', { x: x * 12, duration: 1, overwrite: 'auto' });
    gsap.to('.peek-char-tr, .peek-char-br', { x: x * -12, duration: 1, overwrite: 'auto' });
  });

  /* ---------------- STAT COUNTER ---------------- */
  document.querySelectorAll('.stat-num[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 1.4, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.val); }
        });
      }
    });
  });

  /* ---------------- ADOPT-O-MATIC INTERACTION ---------------- */
  setupAdoptMachine();

  /* ---------------- CURSOR + CONFETTI ---------------- */
  setupCanvasFX();

  /* ---------------- MOBILE EARLY EXIT ---------------- */
  // On narrow viewports skip the heavy scroll-tied work. We deliberately
  // do NOT include `(hover: none)` here — that media query matches on
  // any Windows touchscreen laptop, so it would false-positive a real
  // desktop user with a touchscreen and downgrade their experience.
  // Width-based check is reliable and good enough.
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  if (isMobile) return;

  /* ---------------- TEXT REVEALS ---------------- */
  document.querySelectorAll('.reveal').forEach(el => {
    gsap.fromTo(el,
      { y: '110%', opacity: 0, rotate: 4 },
      {
        y: 0, opacity: 1, rotate: 0,
        duration: .9, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      }
    );
  });

  /* ---------------- ORBIT FLOAT IN ---------------- */
  gsap.fromTo('.orbit',
    { scale: 0, opacity: 0 },
    {
      scale: 1, opacity: 1, duration: .8, stagger: .08, ease: 'back.out(1.8)',
      scrollTrigger: { trigger: '.about', start: 'top 70%' }
    }
  );
  gsap.fromTo('.about-char img',
    { y: 80, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.2)',
      scrollTrigger: { trigger: '.about-char', start: 'top 75%' }
    }
  );

  /* ---------------- SQUAD CARDS REVEAL ---------------- */
  gsap.utils.toArray('.card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 80, opacity: 0, rotate: gsap.utils.random(-4, 4) },
      {
        y: 0, opacity: 1, rotate: 0,
        duration: .9, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: card, start: 'top 88%' }
      }
    );
    // gentler idle bounce on the chipmate inside
    gsap.to(card.querySelector('.card-img img'), {
      y: -4, rotate: i % 2 ? -1 : 1,
      duration: 3.2 + (i % 4) * 0.4,
      ease: 'sine.inOut',
      yoyo: true, repeat: -1,
      delay: Math.random()
    });
  });

  /* ---------------- ADOPT MACHINE REVEAL ---------------- */
  gsap.fromTo('.adopt-machine img',
    { y: 60, opacity: 0, rotate: -8 },
    {
      y: 0, opacity: 1, rotate: 0,
      duration: 1.2, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '.adopt-stage', start: 'top 70%' }
    }
  );
  gsap.fromTo('.adopt-result',
    { y: 40, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1, delay: .15,
      scrollTrigger: { trigger: '.adopt-stage', start: 'top 70%' }
    }
  );

  /* ---------------- HABITAT PARALLAX (untouched — you loved it) ---------------- */
  const habitatStage = document.querySelector('.habitat-stage');
  if (habitatStage) {
    gsap.to('.hab-bg', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.hab-mid', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.hab-fg', {
      yPercent: -28, ease: 'none',
      scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.hab-mothra', {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.hab-sleep, .hab-work', {
      yPercent: -18, ease: 'none',
      scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.hab-dance, .hab-drive', {
      yPercent: -36, ease: 'none',
      scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.fromTo('.hab-drive',
      { xPercent: 40 },
      {
        xPercent: -120, ease: 'none',
        scrollTrigger: { trigger: habitatStage, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  }

  /* ---------------- STICKERS REVEAL ---------------- */
  gsap.fromTo('.badge',
    { y: 60, opacity: 0, rotate: gsap.utils.random(-6, 6) },
    {
      y: 0, opacity: 1, rotate: 0, duration: .8, stagger: .08, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '.badges', start: 'top 80%' }
    }
  );
  gsap.fromTo('.sticker',
    { y: 40, opacity: 0, scale: .6 },
    {
      y: 0, opacity: 1, scale: 1, duration: .7, stagger: .04, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.sticker-grid', start: 'top 85%' }
    }
  );

  /* ---------------- FOOTER MAILBOX ENTRANCE ---------------- */
  gsap.fromTo('.footer-mailbox',
    { y: 80, rotate: -8, opacity: 0 },
    {
      y: 0, rotate: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.2)',
      scrollTrigger: { trigger: '.footer', start: 'top 70%' }
    }
  );

  /* ---------------- IDLE BOUNCES (gentler) ---------------- */
  gsap.to('.about-char img', {
    y: -8, rotate: 1,
    duration: 5.2, ease: 'sine.inOut',
    yoyo: true, repeat: -1
  });
  gsap.to('.adopt-machine img', {
    y: -5, rotate: .7,
    duration: 5.6, ease: 'sine.inOut',
    yoyo: true, repeat: -1
  });
  gsap.to('.footer-mailbox', {
    y: -8, rotate: 1.4,
    duration: 5.2, ease: 'sine.inOut',
    yoyo: true, repeat: -1
  });

  // orbits drift gently
  gsap.to('.orbit-1', { x: 11, y: -16, rotate: 7, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.orbit-2', { x: -14, y: 10, rotate: -6, duration: 5.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.orbit-3', { x: 10, y: -12, rotate: 8, duration: 6.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.orbit-4', { x: -11, y: 8, rotate: -7, duration: 4.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  // deco floaters drift in place — softer
  gsap.utils.toArray('.deco, .deco-dark').forEach(el => {
    gsap.to(el, {
      x: gsap.utils.random(-9, 9),
      y: gsap.utils.random(-11, 11),
      rotate: gsap.utils.random(-6, 6),
      duration: gsap.utils.random(4, 6.5),
      ease: 'sine.inOut',
      yoyo: true, repeat: -1,
      delay: Math.random() * 1.5
    });
  });

  /* ---------------- SCROLL-TIED PARALLAX (calmer) ---------------- */
  setupScrollFloaters();

  /* ---------------- MOUSE PARALLAX FOR ABOUT + ADOPT ---------------- */
  const aboutEl = document.querySelector('.about');
  if (aboutEl) {
    const aboutCharXTo = gsap.quickTo('.about-char img', 'xPercent', { duration: 1.2, ease: 'power3' });
    const orbit1XTo = gsap.quickTo('.orbit-1', 'xPercent', { duration: 1.4, ease: 'power3' });
    const orbit2XTo = gsap.quickTo('.orbit-2', 'xPercent', { duration: 1.4, ease: 'power3' });
    const orbit3XTo = gsap.quickTo('.orbit-3', 'xPercent', { duration: 1.4, ease: 'power3' });
    const orbit4XTo = gsap.quickTo('.orbit-4', 'xPercent', { duration: 1.4, ease: 'power3' });
    aboutEl.addEventListener('mousemove', e => {
      const r = aboutEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      aboutCharXTo(x * -1.5);
      orbit1XTo(x * 4);
      orbit2XTo(x * -4);
      orbit3XTo(x * 4);
      orbit4XTo(x * -4);
    });
  }

  const adoptEl = document.querySelector('.adopt');
  if (adoptEl) {
    const machineXTo = gsap.quickTo('.adopt-machine img', 'xPercent', { duration: 1.2, ease: 'power3' });
    adoptEl.addEventListener('mousemove', e => {
      const r = adoptEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      machineXTo(x * -2);
    });
  }
}

function setupScrollFloaters() {
  const scrubCfg = (trigger) => ({ trigger, start: 'top bottom', end: 'bottom top', scrub: true });

  // Hero peeks gently drift as you scroll past hero
  // (rotate is owned by the idle bounce — don't touch it here or they fight)
  gsap.utils.toArray('.peek').forEach(el => {
    gsap.to(el, {
      yPercent: gsap.utils.random(-90, 90),
      xPercent: gsap.utils.random(-40, 40),
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  // Hero peek-chars drift outward (calmer)
  gsap.to('.peek-char-tl', { xPercent: -34, yPercent: -20, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.peek-char-tr', { xPercent: 34, yPercent: -20, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.peek-char-bl', { xPercent: -24, yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.peek-char-br', { xPercent: 24, yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // About: orbits parallax — halved
  gsap.to('.orbit-1', { yPercent: -60, ease: 'none', scrollTrigger: scrubCfg('.about') });
  gsap.to('.orbit-2', { yPercent: 40, ease: 'none', scrollTrigger: scrubCfg('.about') });
  gsap.to('.orbit-3', { yPercent: -50, ease: 'none', scrollTrigger: scrubCfg('.about') });
  gsap.to('.orbit-4', { yPercent: 32, ease: 'none', scrollTrigger: scrubCfg('.about') });
  gsap.to('.about-char img', { yPercent: -10, ease: 'none', scrollTrigger: scrubCfg('.about') });

  // Squad decos — yPercent only (idle owns rotate)
  gsap.utils.toArray('.squad .deco').forEach(el => {
    gsap.to(el, {
      yPercent: gsap.utils.random(-90, 90),
      ease: 'none',
      scrollTrigger: scrubCfg('.squad')
    });
  });

  // Adopt decos — yPercent only (idle owns rotate)
  gsap.utils.toArray('.adopt .deco-dark').forEach(el => {
    gsap.to(el, {
      yPercent: gsap.utils.random(-110, 110),
      ease: 'none',
      scrollTrigger: scrubCfg('.adopt')
    });
  });
  gsap.to('.adopt-machine img', { yPercent: -8, ease: 'none', scrollTrigger: scrubCfg('.adopt') });

  // Stickerbook decos — yPercent only (idle owns rotate)
  gsap.utils.toArray('.stickers .deco').forEach(el => {
    gsap.to(el, {
      yPercent: gsap.utils.random(-90, 90),
      ease: 'none',
      scrollTrigger: scrubCfg('.stickers')
    });
  });
  gsap.utils.toArray('.sticker').forEach((el, i) => {
    gsap.to(el.querySelector('img'), {
      yPercent: (i % 3 - 1) * 18,
      rotate: i % 2 ? 6 : -6,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });
  gsap.utils.toArray('.badge').forEach((el, i) => {
    gsap.to(el.querySelector('img'), {
      yPercent: i % 2 ? -14 : 14,
      rotate: i % 2 ? -5 : 5,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });

  // Footer mailbox tilt — yPercent only (idle owns rotate)
  gsap.to('.footer-mailbox', {
    yPercent: -14,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 }
  });

  // Section headlines drift — halved
  gsap.utils.toArray('.section-head').forEach(el => {
    gsap.to(el, {
      yPercent: -5,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });
}

/* =========================================================
   ADOPT-O-MATIC
   ========================================================= */
const CHIPMATES = [
  { id: 'chip-o', name: 'CHIP-O', tag: 'CPU', role: 'the leader · keeps everything ticking', accent: '#3D5AFE', bg: '#DCE7FF' },
  { id: 'gigi',   name: 'GIGI',   tag: 'GPU', role: 'the show-off · paints the screen',      accent: '#FF4D9D', bg: '#FFD9E8' },
  { id: 'memsy',  name: 'MEMSY',  tag: 'RAM', role: 'the multitasker · holds your tabs',     accent: '#5FA01B', bg: '#E5FBC4' },
  { id: 'disko',  name: 'DISKO',  tag: 'FLOPPY', role: 'the historian · remembers everything', accent: '#C49500', bg: '#FFF3BC' },
  { id: 'cddy',   name: 'CDDY',   tag: 'CD-ROM', role: 'the dreamer · spins the rainbows',   accent: '#7A4DFF', bg: '#EDE5FF' },
  { id: 'porty',  name: 'PORTY',  tag: 'USB',    role: 'the runner · ferries the data',      accent: '#E0612A', bg: '#FFE0CC' },
  { id: 'clicky', name: 'CLICKY', tag: 'MOUSE',  role: 'the navigator · finds the way',      accent: '#5A6473', bg: '#ECEEF0' },
  { id: 'pixle',  name: 'PIXLE',  tag: 'MONITOR',role: 'the watcher · shows the show',       accent: '#8A7140', bg: '#F4EBD8' },
  { id: 'mo',     name: 'MO',     tag: 'MODEM',  role: 'the messenger · carries the signal', accent: '#D74A38', bg: '#FFD8D2' },
];

function setupAdoptMachine() {
  const lever = document.getElementById('pullLever');
  const card = document.getElementById('resultCard');
  const counter = document.getElementById('adoptCount');
  if (!lever || !card) return;

  let count = 0;
  let last = -1;

  lever.addEventListener('click', () => {
    let idx;
    do { idx = Math.floor(Math.random() * CHIPMATES.length); } while (idx === last && CHIPMATES.length > 1);
    last = idx;
    const c = CHIPMATES[idx];

    gsap.fromTo('.adopt-machine img',
      { x: 0, rotate: 0 },
      { x: 6, rotate: 2, duration: .06, yoyo: true, repeat: 7, ease: 'none' }
    );

    card.style.background = c.bg;
    card.innerHTML = `
      <div class="result-content" style="--accent:${c.accent}">
        <div class="ri-img"><img src="assets/${c.id}.png" alt="${c.name}"></div>
        <div class="ri-info">
          <span class="ri-num">#0${idx + 1} · ${c.tag}</span>
          <h3 class="ri-name">${c.name}</h3>
          <p class="ri-role">${c.role}</p>
          <span class="ri-stamp">★ ADOPTED</span>
        </div>
      </div>
    `;

    const img = card.querySelector('.ri-img img');
    const info = card.querySelector('.ri-info');
    gsap.fromTo(img,
      { y: -200, rotate: -20, opacity: 0, scale: .6 },
      { y: 0, rotate: 0, opacity: 1, scale: 1, duration: .9, ease: 'back.out(1.6)' }
    );
    gsap.fromTo(info.children,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: .6, stagger: .08, delay: .25, ease: 'power2.out' }
    );
    gsap.to(img, {
      y: -4, rotate: 1,
      duration: 3.4, ease: 'sine.inOut',
      yoyo: true, repeat: -1, delay: 1
    });

    count++;
    if (counter) counter.textContent = count;

    const r = card.getBoundingClientRect();
    burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 90, c.accent);
  });
}

/* =========================================================
   CANVAS — cursor sparkle + confetti (toned down)
   ========================================================= */
let canvas, ctx;
let cursorX = 0, cursorY = 0;
let particles = [];
let confettiPieces = [];
let sparkleImg, mailboxConfettiImg;

function setupCanvasFX() {
  canvas = document.getElementById('fx-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  sparkleImg = new Image();
  sparkleImg.src = 'assets/cursor-sparkle.png';
  mailboxConfettiImg = new Image();
  mailboxConfettiImg.src = 'assets/confetti-pack.png';

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (!isTouch) {
    window.addEventListener('mousemove', (e) => {
      cursorX = e.clientX; cursorY = e.clientY;
      // less frequent sparkles
      if (Math.random() < .22) {
        particles.push({
          x: cursorX + (Math.random() - .5) * 14,
          y: cursorY + (Math.random() - .5) * 14,
          vx: (Math.random() - .5) * 1,
          vy: (Math.random() - .5) * 1 - .3,
          size: 22 + Math.random() * 22,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - .5) * .1,
          life: 1
        });
      }
    });
  } else {
    document.body.style.cursor = 'auto';
  }

  window.celebrate = function (form) {
    const r = form.getBoundingClientRect();
    burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 120, '#FFD93D');
    const btn = form.querySelector('button');
    if (btn) {
      const oldHTML = btn.innerHTML;
      btn.innerHTML = 'YOU\'RE IN! ✦';
      btn.disabled = true;
      setTimeout(() => { btn.innerHTML = oldHTML; btn.disabled = false; form.reset(); }, 2600);
    }
  };

  requestAnimationFrame(loopFX);
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loopFX() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (sparkleImg && sparkleImg.complete && cursorX > 0) {
    const s = 48;
    ctx.save();
    ctx.translate(cursorX, cursorY);
    ctx.drawImage(sparkleImg, -s/2, -s/2, s, s);
    ctx.restore();
  }

  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.02;
    p.rot += p.vr;
    p.life -= 0.035;
    if (p.life <= 0) return false;
    if (sparkleImg && sparkleImg.complete) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      const s = p.size * p.life;
      ctx.drawImage(sparkleImg, -s/2, -s/2, s, s);
      ctx.restore();
    }
    return true;
  });

  confettiPieces = confettiPieces.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.18;
    p.vx *= 0.995;
    p.rot += p.vr;
    p.life -= 0.008;
    if (p.life <= 0 || p.y > window.innerHeight + 80) return false;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.shape === 0) {
      ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI * 2); ctx.fill();
    } else if (p.shape === 1) {
      ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
    } else if (p.shape === 2) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-p.size/2, 0);
      ctx.quadraticCurveTo(0, -p.size/2, p.size/2, 0);
      ctx.stroke();
    } else {
      const r1 = p.size/2, r2 = p.size/5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? r1 : r2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    return true;
  });

  requestAnimationFrame(loopFX);
}

const PALETTE = ['#3D5AFE', '#FF4D9D', '#9BE83F', '#FFD93D', '#FF6B5B', '#7A4DFF', '#1A1A2E'];

function burstConfetti(x, y, count, accent) {
  count = count || 80;
  const palette = accent ? [accent, ...PALETTE] : PALETTE;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 12;
    confettiPieces.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 8 + Math.random() * 14,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * .4,
      life: 1.2,
      shape: Math.floor(Math.random() * 4),
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }
}
