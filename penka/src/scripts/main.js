// =========================================================
//  ПЕНКА — анимации и интерактив
//  GSAP + ScrollTrigger — анимации при скролле
//  Lenis — плавный скролл
// =========================================================
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

window.__siteReady = true;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- фото: если не загрузилось — остаётся мягкий фон ----------
$$('.media img').forEach((img) => {
  const fail = () => img.closest('.media')?.classList.add('img-fail');
  if (img.complete && img.naturalWidth === 0 && img.src) fail();
  img.addEventListener('error', fail);
});

// ---------- разбивка текста на слова ----------
$$('[data-split]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
});

// ---------- большое слово в подвале — на всю ширину ----------
function fitWords() {
  $$('[data-fit]').forEach((el) => {
    const parent = el.parentElement;
    const cs = getComputedStyle(parent);
    const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = '100px';
    el.style.width = 'max-content';
    const w = el.getBoundingClientRect().width;
    el.style.width = '';
    if (w > 0) el.style.fontSize = `${(100 * avail) / w * 0.98}px`;
  });
}
fitWords();
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitWords, 120);
});

// ---------- плавный скролл ----------
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

document.fonts?.ready.then(() => {
  fitWords();
  moveIndicator($('.tabs__btn.is-active'));
  ScrollTrigger.refresh();
});

// ---------- якорные ссылки ----------
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -40, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ---------- шапка прячется при скролле вниз ----------
const header = $('.header');
let lastY = 0;
const onScroll = (y) => {
  header.classList.toggle('is-hidden', y > lastY && y > 400);
  lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

// ---------- вкладки меню ----------
const indicator = $('.tabs__indicator');
function moveIndicator(btn) {
  if (!btn || !indicator) return;
  indicator.style.width = `${btn.offsetWidth}px`;
  indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
}
function activateTab(id) {
  const btn = $(`.tabs__btn[data-tab="${id}"]`);
  const panel = $(`.menu-panel[data-panel="${id}"]`);
  if (!btn || !panel) return;
  $$('.tabs__btn').forEach((b) => {
    const on = b === btn;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  $$('.menu-panel').forEach((p) => p.classList.toggle('is-active', p === panel));
  moveIndicator(btn);
  if (!reduceMotion) {
    gsap.fromTo($$('.card', panel), { y: 50, opacity: 0, rotate: () => gsap.utils.random(-6, 6) }, {
      y: 0, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.06, ease: 'back.out(1.6)',
    });
  }
  lenis?.resize();
  ScrollTrigger.refresh();
}
$$('.tabs__btn').forEach((b) => b.addEventListener('click', () => activateTab(b.dataset.tab)));
moveIndicator($('.tabs__btn.is-active'));
window.addEventListener('resize', () => moveIndicator($('.tabs__btn.is-active')));

// ---------- карта лояльности: штампы ----------
const stamps = $$('.stamp');
const stampCount = $('.js-stamps');
const stampMsg = $('.js-stamp-msg');
function updateStamps() {
  const n = stamps.filter((s) => s.classList.contains('is-on')).length;
  if (stampCount) stampCount.textContent = n;
  const left = stamps.length - n;
  if (!stampMsg) return;
  if (left === 0) stampMsg.textContent = 'Ура! Этот кофе — за наш счёт 🎉';
  else if (left === 1) stampMsg.textContent = 'Следующий кофе — в подарок!';
  else stampMsg.textContent = `Ещё ${left - 1} ${plural(left - 1)} до подарка`;
}
function plural(n) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'чашка';
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'чашки';
  return 'чашек';
}
stamps.forEach((s) => {
  s.addEventListener('click', () => {
    const on = !s.classList.contains('is-on');
    s.classList.toggle('is-on', on);
    s.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on && !reduceMotion) gsap.fromTo(s, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' });
    updateStamps();
  });
});

// ---------- адреса: клик по карточке меняет карту ----------
const mapFrame = $('.places__map iframe');
$$('.place__show').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.place').forEach((p) => p.classList.toggle('is-active', p === btn.closest('.place')));
    if (mapFrame && mapFrame.src !== btn.dataset.map) {
      mapFrame.style.opacity = '0.3';
      mapFrame.src = btn.dataset.map;
      mapFrame.addEventListener('load', () => (mapFrame.style.opacity = '1'), { once: true });
    }
  });
});

// ---------- запуск анимаций ----------
if (reduceMotion) {
  $('.preloader')?.remove();
  document.body.classList.remove('is-loading');
  stamps.slice(0, 3).forEach((s) => s.classList.add('is-on'));
  updateStamps();
} else {
  initAnimations();
}

function initAnimations() {
  // ---------- прелоадер: слово наполняется кофе ----------
  const word = $('.preloader__word');
  const countEl = $('.js-count');
  const fill = { v: 0 };
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });

  intro
    .from(word, { scale: 0.8, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' })
    .to(fill, {
      v: 100,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        word.style.setProperty('--fill', `${fill.v}%`);
        countEl.textContent = Math.round(fill.v);
      },
    }, 0.2)
    .to(word, { scale: 1.15, rotate: -4, duration: 0.4, ease: 'back.in(2)' }, '+=0.1')
    .to('.preloader', { yPercent: -100, borderBottomLeftRadius: '50% 20%', borderBottomRightRadius: '50% 20%', duration: 1, ease: 'expo.inOut' }, '-=0.1')
    .add(() => {
      $('.preloader')?.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
    })
    .from('.header__pill', { y: -80, duration: 1, ease: 'back.out(1.4)' }, '-=0.5')
    .from('.hero__title .line__in', { yPercent: 110, duration: 1.2 }, '<')
    .from('.hero__lead .line__in', { yPercent: 110, duration: 1.1, stagger: 0.1 }, '<0.15')
    .fromTo('.hero__lead mark', { '--mark': 0 }, { '--mark': 1, duration: 0.8, ease: 'power3.inOut' }, '-=0.4')
    .from('.hero__arch', { y: 120, rotate: 6, opacity: 0, duration: 1.3, ease: 'expo.out' }, '<-0.6')
    .from('.hero__badge', { scale: 0, rotate: -180, duration: 1.2, ease: 'back.out(1.6)' }, '<0.4')
    .from('.hero .sticker', { scale: 0, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'back.out(2.2)' }, '<0.2')
    .from(['.hero__tag', '.hero__btns', '.hero__stats li'], { y: 24, opacity: 0, duration: 0.9, stagger: 0.07, clearProps: 'transform,opacity' }, '<');

  // наклейки и фото первого экрана при скролле
  gsap.to('.hero__arch', {
    y: 80, rotate: -3, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // ---------- ленты разъезжаются при скролле ----------
  gsap.fromTo('.ribbon--a', { xPercent: 4 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.ribbon--b', { xPercent: -4 }, { xPercent: 4, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: true } });
  if (lenis) {
    const tracks = $$('.ribbon__track');
    lenis.on('scroll', ({ velocity }) => {
      const rate = 1 + Math.min(Math.abs(velocity) / 6, 5);
      tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = rate)));
    });
  }

  // ---------- общие появления ----------
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out', overwrite: true }),
  });
  $$('.h2').forEach((el) => {
    gsap.from(el, { y: 60, opacity: 0, rotate: -2, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // ---------- карточки меню выпрыгивают ----------
  gsap.from('.menu-panel.is-active .card', {
    y: 80, opacity: 0, rotate: () => gsap.utils.random(-8, 8), duration: 1, stagger: 0.08, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '.menu-sec', start: 'top 70%' },
  });

  // ---------- процесс: горизонтальная лента, пока секция закреплена ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (hover: hover)', () => {
    const track = $('.process__track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const st = {
      trigger: '.process',
      pin: '.process__pin',
      start: 'top top',
      end: () => '+=' + distance(),
      scrub: 1,
      invalidateOnRefresh: true,
    };
    const tween = gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: st });
    gsap.to('.process__progress span', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + distance(), scrub: true },
    });
    return () => tween.kill();
  });
  mm.add('(max-width: 900px), (hover: none)', () => {
    gsap.from('.step', { x: 80, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.process__track', start: 'top 85%' } });
  });

  // ---------- карта лояльности: штампы «ставятся» сами ----------
  gsap.from('.stamp-card', {
    y: 100, rotate: 12, opacity: 0, duration: 1.2, ease: 'back.out(1.4)',
    scrollTrigger: { trigger: '.loyalty', start: 'top 70%' },
  });
  ScrollTrigger.create({
    trigger: '.stamp-card',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      stamps.slice(0, 3).forEach((s, i) => {
        setTimeout(() => {
          s.classList.add('is-on');
          s.setAttribute('aria-pressed', 'true');
          gsap.fromTo(s, { scale: 1.3 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' });
          updateStamps();
        }, 600 + i * 350);
      });
    },
  });

  // ---------- атмосфера ----------
  $$('[data-split]').forEach((el) => {
    gsap.from($$('.w > span', el), {
      yPercent: 110, duration: 1, stagger: 0.035, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
  gsap.from('.vibe__item', {
    scale: 0.85, opacity: 0, rotate: () => gsap.utils.random(-5, 5), duration: 1.1, stagger: 0.1, ease: 'back.out(1.4)',
    scrollTrigger: { trigger: '.vibe__grid', start: 'top 80%' },
  });

  // ---------- адреса ----------
  gsap.from('.place', {
    x: -60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.places__grid', start: 'top 80%' },
  });

  // ---------- подвал: буквы прыгают ----------
  gsap.from('.footer__char > span', {
    yPercent: 100, duration: 1, stagger: 0.07, ease: 'back.out(1.8)',
    scrollTrigger: { trigger: '.footer__word', start: 'top 95%' },
  });

  if (finePointer) {
    initCursor();
    initMagnetic();
    initTilt();
    initStickers();
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

function initCursor() {
  const cursor = $('.cursor');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power3' });
  window.addEventListener('mousemove', (e) => {
    cursor.classList.add('is-active');
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  $$('a, button, .card').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
}

function initMagnetic() {
  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

// карточки меню наклоняются за курсором
function initTilt() {
  $$('.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: px * 12, rotateX: -py * 12, transformPerspective: 800, duration: 0.5, ease: 'power3.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

// наклейки на первом экране сдвигаются за мышью
function initStickers() {
  const items = $$('.hero .sticker[data-depth]');
  window.addEventListener('mousemove', (e) => {
    const cx = e.clientX / window.innerWidth - 0.5;
    const cy = e.clientY / window.innerHeight - 0.5;
    items.forEach((el) => {
      const d = parseFloat(el.dataset.depth) || 0;
      gsap.to(el, { '--tx': `${cx * d}px`, '--ty': `${cy * d}px`, duration: 0.8, ease: 'power3.out' });
    });
  });
}
