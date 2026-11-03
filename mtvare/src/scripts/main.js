// =========================================================
//  МТВАРЕ — анимации и интерактив
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
const html = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- фото: если не загрузилось — остаётся тёмный градиент ----------
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

// ---------- плавный скролл ----------
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

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
  btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  if (!reduceMotion) {
    gsap.fromTo($$('.menu-item', panel), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
  }
  lenis?.resize();
  ScrollTrigger.refresh();
}
$$('.tabs__btn').forEach((b) => b.addEventListener('click', () => activateTab(b.dataset.tab)));
moveIndicator($('.tabs__btn.is-active'));
window.addEventListener('resize', () => moveIndicator($('.tabs__btn.is-active')));
document.fonts?.ready.then(() => {
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
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -60, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ---------- шапка ----------
const header = $('.header');
let lastY = 0;
const onScroll = (y) => {
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > lastY && y > 500 && !html.classList.contains('menu-open'));
  lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

// ---------- мобильное меню ----------
const burger = $('.burger');
const menu = $('.menu');
function closeMenu() {
  if (!html.classList.contains('menu-open')) return;
  html.classList.remove('menu-open');
  burger?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-hidden', 'true');
  lenis?.start();
}
burger?.addEventListener('click', () => {
  if (html.classList.contains('menu-open')) return closeMenu();
  html.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  if (!reduceMotion) gsap.from('.menu__link', { yPercent: 60, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'power4.out', delay: 0.2 });
});

// ---------- окно брони (демо, пока ссылка — заглушка) ----------
const modal = $('.modal');
const openModal = () => {
  modal.hidden = false;
  lenis?.stop();
  $('.modal__close', modal)?.focus();
};
const closeModal = () => {
  modal.hidden = true;
  lenis?.start();
};
$$('.js-book').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const href = btn.getAttribute('href') || '';
    if (href.includes('n000000')) {
      e.preventDefault();
      closeMenu();
      openModal();
    } else {
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener');
    }
  });
});
$$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!modal.hidden) closeModal();
  closeMenu();
});

// ---------- тёплое свечение за курсором на первом экране ----------
const hero = $('.hero');
if (finePointer && hero) {
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
    hero.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
}

// ---------- запуск анимаций ----------
if (reduceMotion) {
  $('.preloader')?.remove();
  document.body.classList.remove('is-loading');
} else {
  initAnimations();
}

function initAnimations() {
  // ---------- прелоадер: рисуется луна, потом экран «схлопывается» в круг ----------
  const ring = $('.preloader .moon__ring');
  const len = ring ? 2 * Math.PI * 46 : 0;
  if (ring) gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set('.preloader .moon__shadow', { attr: { cx: 118, cy: 30 } });
  gsap.set('.hero__bg img', { scale: 1.2 });

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .to('.preloader .moon__ring', { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' })
    .to('.preloader .moon__shadow', { attr: { cx: 66, cy: 38 }, duration: 1.3, ease: 'power2.inOut' }, 0.15)
    .from('.preloader__name', { y: 30, opacity: 0, duration: 0.9 }, 0.3)
    .from('.preloader__meaning', { y: 20, opacity: 0, duration: 0.8 }, 0.5)
    .to('.preloader__inner', { scale: 0.9, opacity: 0, duration: 0.6, ease: 'power2.in' }, '+=0.25')
    .fromTo('.preloader', { clipPath: 'circle(75% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
    .add(() => {
      $('.preloader')?.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
    })
    .to('.hero__bg img', { scale: 1, duration: 2.4, ease: 'expo.out' }, '-=0.9')
    .from('.hero__char > span', { yPercent: 110, duration: 1.3, stagger: 0.06, ease: 'power4.out' }, '<0.1')
    .from('.hero__hand', { opacity: 0, rotate: -14, y: 20, duration: 1.1 }, '<0.3')
    .from(['.hero__kicker', '.hero__sub', '.hero__btns', '.header'], { y: 24, opacity: 0, duration: 1, stagger: 0.08, clearProps: 'transform,opacity' }, '<0.1')
    .from('.hours__title', { opacity: 0, y: 16, duration: 0.8 }, '<0.3')
    .from('.hours__item', { opacity: 0, y: 20, duration: 0.8, stagger: 0.05 }, '<0.1')
    .from('.hero .mountains path', { yPercent: 40, opacity: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out' }, '<');

  // ---------- первый экран при скролле ----------
  gsap.to('.hero__bg', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    y: -80,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // слои гор едут с разной скоростью
  $$('.mountains').forEach((m) => {
    $$('path[data-depth]', m).forEach((p) => {
      const depth = parseFloat(p.dataset.depth);
      gsap.fromTo(p, { y: 50 * depth }, {
        y: -40 * depth,
        ease: 'none',
        scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });

  // ---------- общие появления ----------
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  });

  $$('.media--reveal').forEach((el) => {
    gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  $$('.h2').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  $$('.hand').forEach((el) => {
    if (el.closest('.hero') || el.closest('.preloader') || el.closest('.modal')) return;
    gsap.from(el, { opacity: 0, x: -20, rotate: -10, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // ---------- параллакс фото ----------
  $$('[data-parallax]').forEach((img) => {
    const amount = parseFloat(img.dataset.parallax) || -10;
    gsap.fromTo(img, { yPercent: -amount / 2 }, {
      yPercent: amount / 2,
      ease: 'none',
      scrollTrigger: { trigger: img.closest('.media') || img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // ---------- коллаж «о нас»: маленькие фото плывут быстрее ----------
  $$('.collage [data-speed]').forEach((el) => {
    gsap.fromTo(el, { y: 0 }, {
      y: parseFloat(el.dataset.speed),
      ease: 'none',
      scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // большая фраза — слова поднимаются по очереди
  $$('[data-split]').forEach((el) => {
    gsap.from($$('.w > span', el), {
      yPercent: 110, duration: 1, stagger: 0.04, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // ---------- популярное ----------
  gsap.from('.dish', {
    y: 80, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.dishes', start: 'top 85%' },
  });

  // ---------- фирменное блюдо: кольцо вращается, тарелка чуть поворачивается ----------
  gsap.to('.signature__ring', {
    rotate: 200,
    ease: 'none',
    scrollTrigger: { trigger: '.signature', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.fromTo('.signature__dish', { rotate: -8, y: 60 }, {
    rotate: 6,
    y: -40,
    ease: 'none',
    scrollTrigger: { trigger: '.signature', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.from('.signature__dish', {
    scale: 0.7, opacity: 0, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.signature__visual', start: 'top 80%' },
  });

  // ---------- шеф ----------
  gsap.from('.chef__card', {
    x: 60, opacity: 0, duration: 1.3, ease: 'power3.out',
    scrollTrigger: { trigger: '.chef', start: 'top 75%' },
  });
  gsap.from('.chef__photo', {
    rotate: -20, y: 40, opacity: 0, duration: 1.2, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.chef__foot', start: 'top 90%' },
  });

  // ---------- контакты ----------
  gsap.from('.contacts__title .line__in', {
    yPercent: 110, duration: 1.3, stagger: 0.12, ease: 'power4.out',
    scrollTrigger: { trigger: '.contacts', start: 'top 70%' },
  });

  // ---------- ленты фото ускоряются от скорости скролла ----------
  if (lenis) {
    const tracks = $$('.gallery__track');
    lenis.on('scroll', ({ velocity }) => {
      const rate = 1 + Math.min(Math.abs(velocity) / 6, 5);
      tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = rate)));
    });
  }

  if (finePointer) {
    initCursor();
    initMagnetic();
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

function initCursor() {
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('mousemove', (e) => {
    cursor.classList.add('is-active');
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  $$('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      label.textContent = el.dataset.cursor;
      cursor.classList.add('is-label');
    });
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-label'));
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
