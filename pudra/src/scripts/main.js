// =========================================================
//  PUDRA — анимации и интерактив
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
const CLIP_HIDDEN = 'inset(100% 0% 0% 0% round 20px)';
const CLIP_SHOWN = 'inset(0% 0% 0% 0% round 20px)';

// ---------- фото: если не загрузилось — остаётся мягкий градиент ----------
$$('.media img').forEach((img) => {
  const fail = () => img.closest('.media')?.classList.add('img-fail');
  if (img.complete && img.naturalWidth === 0 && img.src) fail();
  img.addEventListener('error', fail);
});

// ---------- большой логотип «pudra» — растягиваем точно на всю ширину ----------
function fitWordmarks() {
  $$('[data-fit]').forEach((el) => {
    const parent = el.parentElement;
    const cs = getComputedStyle(parent);
    const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = '100px';
    el.style.width = 'max-content';
    const w = el.getBoundingClientRect().width;
    el.style.width = '';
    if (w > 0) el.style.fontSize = `${(100 * avail) / w * 0.985}px`;
  });
}
fitWordmarks();
document.fonts?.ready.then(() => {
  fitWordmarks();
  ScrollTrigger.refresh();
});
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitWordmarks, 120);
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

// ---------- вкладки прайса ----------
const tabs = $('.tabs');
const indicator = $('.tabs__indicator');
function moveIndicator(btn) {
  if (!btn || !indicator) return;
  indicator.style.width = `${btn.offsetWidth}px`;
  indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
}
function activateTab(id, animate = true) {
  const btn = $(`.tabs__btn[data-tab="${id}"]`);
  const panel = $(`.price-panel[data-panel="${id}"]`);
  if (!btn || !panel) return;
  $$('.tabs__btn').forEach((b) => {
    const on = b === btn;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  $$('.price-panel').forEach((p) => p.classList.toggle('is-active', p === panel));
  moveIndicator(btn);
  if (animate && !reduceMotion) {
    gsap.fromTo($$('.price-item', panel), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
  }
  lenis?.resize();
  ScrollTrigger.refresh();
}
$$('.tabs__btn').forEach((b) => b.addEventListener('click', () => activateTab(b.dataset.tab)));
moveIndicator($('.tabs__btn.is-active'));
window.addEventListener('resize', () => moveIndicator($('.tabs__btn.is-active')));
document.fonts?.ready.then(() => moveIndicator($('.tabs__btn.is-active')));

// плитки услуг и карточки на первом экране открывают нужную вкладку прайса
$$('[data-tab]').forEach((el) => {
  if (el.classList.contains('tabs__btn')) return;
  el.addEventListener('click', () => activateTab(el.dataset.tab));
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
  if (!reduceMotion) gsap.from('.menu__link', { yPercent: 70, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'power4.out', delay: 0.25 });
});

// ---------- окно записи (демо, пока ссылка — заглушка) ----------
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

// ---------- слайдер отзывов ----------
const slides = $$('.review');
const counter = $('.js-current');
let current = 0;
let autoplay;
function showSlide(next) {
  next = (next + slides.length) % slides.length;
  if (next === current) return;
  const from = slides[current];
  const to = slides[next];
  current = next;
  if (counter) counter.textContent = String(next + 1).padStart(2, '0');
  if (reduceMotion) {
    from.classList.remove('is-active');
    to.classList.add('is-active');
    return;
  }
  gsap.to(from, {
    opacity: 0, y: -20, duration: 0.5, ease: 'power2.in',
    onComplete: () => from.classList.remove('is-active'),
  });
  to.classList.add('is-active');
  gsap.fromTo(to, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.35, ease: 'power3.out' });
}
const startAuto = () => {
  clearInterval(autoplay);
  autoplay = setInterval(() => showSlide(current + 1), 6500);
};
$('.js-next')?.addEventListener('click', () => { showSlide(current + 1); startAuto(); });
$('.js-prev')?.addEventListener('click', () => { showSlide(current - 1); startAuto(); });
if (slides.length > 1) startAuto();

// ---------- запуск анимаций ----------
if (reduceMotion) {
  $('.preloader')?.remove();
  document.body.classList.remove('is-loading');
  $$('.hl').forEach((el) => el.classList.add('is-on'));
} else {
  initAnimations();
}

function initAnimations() {
  // ---------- прелоадер ----------
  const count = { v: 0 };
  const countEl = $('.js-count');
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });

  gsap.set('.media--reveal', { clipPath: CLIP_HIDDEN });

  intro
    .to('.preloader__char > span', { y: 0, yPercent: 0, duration: 1, stagger: 0.07 })
    .to(count, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => (countEl.textContent = Math.round(count.v)) }, 0)
    .to('.preloader__char > span', { yPercent: -110, duration: 0.7, stagger: 0.05, ease: 'power3.in' }, '+=0.1')
    .to('.preloader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
    .add(() => {
      $('.preloader')?.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
    })
    .from('.hero__word .wordmark__char > span', { yPercent: 105, duration: 1.3, stagger: 0.07 }, '-=0.6')
    .to('.hero__img', { clipPath: CLIP_SHOWN, duration: 1.5, ease: 'expo.out' }, '<0.15')
    .from('.hero__img img', { scale: 1.3, duration: 2, ease: 'expo.out' }, '<')
    .from('.hero__inset', { y: 120, opacity: 0, rotate: -6, duration: 1.4, ease: 'expo.out' }, '<0.35')
    .from(['.hero__meta', '.hero__lead', '.hero__sub', '.hero__btns', '.mini-card', '.hero__socials', '.hero__book', '.header'], {
      y: 24, opacity: 0, duration: 1, stagger: 0.06, clearProps: 'transform,opacity',
    }, '<0.1');

  // ---------- первый экран при скролле ----------
  $$('.hero__word .wordmark__char').forEach((ch, i) => {
    gsap.to(ch, {
      yPercent: -(12 + ((i * 37) % 5) * 9),
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });
  gsap.to('.hero__inset', {
    y: -120,
    rotate: 4,
    ease: 'none',
    scrollTrigger: { trigger: '.hero__media', start: 'top 60%', end: 'bottom top', scrub: true },
  });

  // ---------- появление блоков ----------
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  });

  $$('.media--reveal').forEach((el) => {
    if (el.classList.contains('hero__img')) return;
    gsap.to(el, {
      clipPath: CLIP_SHOWN,
      duration: 1.6,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
    const img = $('img', el);
    if (img && !img.dataset.parallax) {
      gsap.from(img, { scale: 1.25, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    }
  });

  $$('.h2').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // подчёркивания в тексте «о нас» прорисовываются
  $$('.hl').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => setTimeout(() => el.classList.add('is-on'), i * 250),
    });
  });

  // ---------- параллакс ----------
  $$('[data-parallax]').forEach((img) => {
    const amount = parseFloat(img.dataset.parallax) || -10;
    gsap.fromTo(img, { yPercent: -amount / 2 }, {
      yPercent: amount / 2,
      ease: 'none',
      scrollTrigger: { trigger: img.closest('.media') || img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // ---------- плитки услуг ----------
  gsap.from('.tile', {
    y: 70, opacity: 0, scale: 0.94, duration: 1.2, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.bento', start: 'top 82%' },
  });

  // ---------- акции ----------
  gsap.from('.offer', {
    y: 80, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.offers__grid', start: 'top 82%' },
  });
  gsap.from('.offer__discount', {
    scale: 0.6, opacity: 0, duration: 1, stagger: 0.15, ease: 'back.out(1.8)',
    scrollTrigger: { trigger: '.offers__grid', start: 'top 70%' },
  });

  // ---------- мастера ----------
  gsap.from('.master', {
    y: 80, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.masters__grid', start: 'top 82%' },
  });

  // ---------- отзывы ----------
  gsap.from('.reviews__slider', {
    y: 50, opacity: 0, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.reviews', start: 'top 70%' },
  });

  // ---------- блок записи ----------
  gsap.from('.cta__title .line__in', {
    yPercent: 110, duration: 1.3, stagger: 0.12, ease: 'power4.out',
    scrollTrigger: { trigger: '.cta', start: 'top 75%' },
  });

  // ---------- подвал ----------
  gsap.fromTo('.footer__photo', { y: 60, rotate: 3 }, {
    y: -40,
    rotate: -2,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  gsap.from('.footer__word .wordmark__char > span', {
    yPercent: 100, duration: 1.3, stagger: 0.07, ease: 'power4.out',
    scrollTrigger: { trigger: '.footer__word', start: 'top 95%' },
  });

  // ---------- бегущая строка ускоряется при скролле ----------
  if (lenis) {
    const tracks = $$('.marquee__track');
    lenis.on('scroll', ({ velocity }) => {
      const rate = 1 + Math.min(Math.abs(velocity) / 8, 4);
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
