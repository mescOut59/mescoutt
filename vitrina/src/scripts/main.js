// =========================================================
//  ВИТРИНА — анимации и интерактив портфолио
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

// ---------- плавный скролл ----------
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
document.fonts?.ready.then(() => ScrollTrigger.refresh());

// ---------- якорные ссылки ----------
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -80, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ---------- шапка ----------
const header = $('.header');
let lastY = 0;
const onScroll = (y) => {
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > lastY && y > 500);
  lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

// ---------- вопросы: аккордеон ----------
$$('.faq-item').forEach((item) => {
  const btn = $('.faq-item__q', item);
  btn.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    $$('.faq-item.is-open').forEach((other) => {
      if (other === item) return;
      other.classList.remove('is-open');
      $('.faq-item__q', other).setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    setTimeout(() => {
      lenis?.resize();
      ScrollTrigger.refresh();
    }, 650);
  });
});

// ---------- меняющееся слово на первом экране ----------
function initRotator() {
  const words = $$('.rotator__word');
  if (words.length < 2) return;
  let current = 0;
  const next = () => {
    const from = words[current];
    current = (current + 1) % words.length;
    const to = words[current];
    gsap.to(from, { yPercent: -110, duration: 0.7, ease: 'power3.in', onComplete: () => from.classList.remove('is-active') });
    to.classList.add('is-active');
    gsap.fromTo(to, { yPercent: 110 }, { yPercent: 0, duration: 0.9, delay: 0.45, ease: 'power4.out' });
  };
  setInterval(next, 2600);
}

// ---------- запуск ----------
if (reduceMotion) {
  $('.preloader')?.remove();
  document.body.classList.remove('is-loading');
} else {
  initAnimations();
}

function initAnimations() {
  gsap.set('.rotator__word', { yPercent: 110 });
  gsap.set('.rotator__word.is-active', { yPercent: 0 });

  // ---------- прелоадер ----------
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('.preloader__char > span', { yPercent: 110, duration: 0.9, stagger: 0.05 })
    .to('.preloader__char > span', { yPercent: -110, duration: 0.6, stagger: 0.04, ease: 'power3.in' }, '+=0.35')
    .to('.preloader__panel', { scaleY: 0, transformOrigin: 'top', duration: 1, ease: 'expo.inOut' }, '-=0.25')
    .add(() => {
      $('.preloader')?.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
      initRotator();
    })
    .from('.hero__title .line__in', { yPercent: 110, duration: 1.2, stagger: 0.1 }, '-=0.55')
    .from(['.header', '.hero__top', '.hero__lead', '.hero__btns'], { y: 24, opacity: 0, duration: 1, stagger: 0.08, clearProps: 'transform,opacity' }, '<0.2')
    .from('.chip-work', { y: 30, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, '<0.2');

  // ---------- общие появления ----------
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out', overwrite: true }),
  });
  $$('.h2').forEach((el) => {
    gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // ---------- бегущая строка ускоряется от скролла ----------
  if (lenis) {
    const tracks = $$('.marquee__track');
    lenis.on('scroll', ({ velocity }) => {
      const rate = 1 + Math.min(Math.abs(velocity) / 7, 5);
      tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = rate)));
    });
  }

  // ---------- работы ----------
  const cards = $$('.work');
  const mm = gsap.matchMedia();

  // на компьютере: карточки накладываются, предыдущая уменьшается и темнеет
  mm.add('(min-width: 900px)', () => {
    cards.forEach((card, i) => {
      const nextCard = cards[i + 1];
      if (!nextCard) return;
      gsap.to(card, {
        scale: 0.9,
        filter: 'brightness(0.75)',
        ease: 'none',
        scrollTrigger: { trigger: nextCard, start: 'top bottom', end: 'top 20%', scrub: true },
      });
    });
  });

  // содержимое карточки появляется, когда она въезжает
  cards.forEach((card) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 75%' } });
    tl.from($$('.work__meta, .work__name, .work__desc, .work__tags, .work__soon, .btn--work', card), {
      y: 40, opacity: 0, duration: 1, stagger: 0.07, ease: 'power3.out',
    }).from($('.mock', card), { y: 80, rotate: 3, opacity: 0, duration: 1.3, ease: 'expo.out' }, 0.1);
  });

  // ---------- карточки «что получает бизнес» ----------
  gsap.from('.feature', {
    y: 60, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.features__grid', start: 'top 82%' },
  });
  gsap.from('.plan', {
    y: 60, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.booking__grid', start: 'top 82%' },
  });

  // ---------- процесс: линия прогресса и активные шаги ----------
  gsap.to('.steps__line span', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 65%', end: 'bottom 65%', scrub: true },
  });
  $$('.step').forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 65%',
      onEnter: () => step.classList.add('is-on'),
      onLeaveBack: () => step.classList.remove('is-on'),
    });
    gsap.from(step, { x: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: step, start: 'top 85%' } });
  });

  // ---------- вопросы ----------
  gsap.from('.faq-item', {
    y: 30, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out',
    scrollTrigger: { trigger: '.faq__list', start: 'top 85%' },
  });

  // ---------- контакт ----------
  gsap.from('.contact__title .line__in', {
    yPercent: 110, duration: 1.3, stagger: 0.12, ease: 'power4.out',
    scrollTrigger: { trigger: '.contact', start: 'top 70%' },
  });
  gsap.from('.contact-btn', {
    y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '.contact__btns', start: 'top 90%' },
  });

  if (finePointer) {
    initCursor();
    initMagnetic();
    initMockTilt();
    initFeatureFill();
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

// мини-превью чуть наклоняется и сдвигается за курсором
function initMockTilt() {
  $$('.work__visual').forEach((wrap) => {
    const mock = $('.mock', wrap);
    const inner = $('[data-mock-parallax]', wrap);
    wrap.addEventListener('mousemove', (e) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(mock, { rotateY: px * 8, rotateX: -py * 8, transformPerspective: 1200, duration: 0.6, ease: 'power3.out' });
      if (inner) gsap.to(inner, { x: px * -14, y: py * -10, duration: 0.8, ease: 'power3.out' });
    });
    wrap.addEventListener('mouseleave', () => {
      gsap.to(mock, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)' });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'power3.out' });
    });
  });
}

// заливка карточки начинается из точки, где курсор вошёл
function initFeatureFill() {
  $$('.feature').forEach((el) => {
    el.addEventListener('mouseenter', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}
