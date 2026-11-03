// =========================================================
//  ГРАФИТ — анимации и интерактив
//  GSAP + ScrollTrigger — анимации при скролле
//  Lenis — плавный «инерционный» скролл
// =========================================================
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

window.__grafitReady = true;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const html = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- фото: если не загрузилось — оставляем градиент ----------
$$('.media img').forEach((img) => {
  const fail = () => img.closest('.media')?.classList.add('img-fail');
  if (img.complete && img.naturalWidth === 0 && img.src) fail();
  img.addEventListener('error', fail);
});

// ---------- плавный скролл ----------
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

// якорные ссылки (#services и т.п.)
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ---------- разбивка текста на слова для анимации ----------
$$('[data-split]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
});

// ---------- шапка: прячется при скролле вниз ----------
const header = $('.header');
let lastY = 0;
const onScroll = (y) => {
  header.classList.toggle('is-scrolled', y > 40);
  const hide = y > lastY && y > 400 && !html.classList.contains('menu-open');
  header.classList.toggle('is-hidden', hide);
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
  const open = !html.classList.contains('menu-open');
  if (!open) return closeMenu();
  html.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  gsap.from('.menu__link', { yPercent: 60, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'power4.out', delay: 0.2 });
});

// ---------- окно записи (демо, пока нет реальной ссылки YCLIENTS) ----------
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

// ---------- если анимации отключены — просто показываем всё ----------
if (reduceMotion) {
  $('.preloader')?.remove();
  document.body.classList.remove('is-loading');
  $$('.js-counter').forEach((el) => (el.textContent = el.dataset.to));
} else {
  initAnimations();
}

function initAnimations() {
  // ---------- прелоадер + появление первого экрана ----------
  const count = { v: 0 };
  const countEl = $('.js-count');
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });

  intro
    .to(count, {
      v: 100,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: () => (countEl.textContent = Math.round(count.v)),
    })
    .to('.preloader__bar span', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
    .to('.preloader__inner', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power2.in' })
    .to('.preloader', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.15')
    .add(() => {
      $('.preloader')?.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
    })
    .from('.hero__title .line__in', { yPercent: 110, duration: 1.2, stagger: 0.1 }, '-=0.55')
    .to('.hero__img', { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out' }, '<')
    .from('.hero__img img', { scale: 1.35, duration: 1.8, ease: 'expo.out' }, '<')
    .from('.hero__accent', { yPercent: 60, opacity: 0, duration: 1.1 }, '-=1.1')
    .from(['.hero__eyebrow', '.hero__lead', '.hero__address', '.hero__btns', '.header'], {
      y: 24, opacity: 0, duration: 1, stagger: 0.07, clearProps: 'transform,opacity',
    }, '-=1')
    .from('.hero__scroll', { scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.6)' }, '-=0.8');

  // ---------- появление блоков при скролле ----------
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  });

  // фото «открываются» шторкой снизу
  $$('.media--reveal').forEach((el) => {
    if (el.classList.contains('hero__img')) return;
    gsap.to(el, {
      clipPath: 'inset(0% 0 0 0)',
      duration: 1.5,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
    const img = $('img', el);
    if (img && !img.dataset.parallax) {
      gsap.from(img, { scale: 1.3, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    }
  });

  // текст «О нас» — слова поднимаются по очереди
  $$('[data-split]').forEach((el) => {
    gsap.from($$('.w > span', el), {
      yPercent: 105,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.025,
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
  });

  // заголовки секций
  $$('.h2').forEach((el) => {
    gsap.from(el, {
      y: 60, opacity: 0, duration: 1.2, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
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

  // широкое фото под первым экраном — «приближается»
  gsap.fromTo('.hero__wide-img img', { scale: 1.3 }, {
    scale: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero__wide', start: 'top bottom', end: 'bottom 60%', scrub: true },
  });
  gsap.fromTo('.hero__wide-img', { clipPath: 'inset(0 8% 0 8% round 22px)' }, {
    clipPath: 'inset(0 0% 0 0% round 22px)',
    ease: 'none',
    scrollTrigger: { trigger: '.hero__wide', start: 'top bottom', end: 'top 30%', scrub: true },
  });

  // ---------- счётчики ----------
  $$('.js-counter').forEach((el) => {
    const obj = { v: 0 };
    el.textContent = '0';
    gsap.to(obj, {
      v: Number(el.dataset.to),
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // ---------- услуги: горизонтальная лента, пока секция закреплена ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (hover: hover)', () => {
    const track = $('.services__track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.services',
        pin: '.services__pin',
        start: 'top top',
        end: () => '+=' + distance(),
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    // капсулы чуть «качаются» при движении
    $$('.pill', track).forEach((pill, i) => {
      gsap.fromTo(pill, { y: i % 2 ? 40 : -20 }, {
        y: i % 2 ? -20 : 40,
        ease: 'none',
        scrollTrigger: { trigger: '.services', start: 'top top', end: () => '+=' + distance(), scrub: true },
      });
    });
    gsap.from('.services__line', { scaleX: 0, transformOrigin: 'left', scrollTrigger: { trigger: '.services', start: 'top 60%', end: 'top top', scrub: true } });
    return () => tween.kill();
  });

  mm.add('(max-width: 900px), (hover: none)', () => {
    gsap.from('.pill', {
      x: 80, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.services__track', start: 'top 85%' },
    });
  });

  // ---------- мастера ----------
  gsap.from('.master', {
    y: 80, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.masters__grid', start: 'top 80%' },
  });

  // ---------- галерея: колонки едут с разной скоростью ----------
  mm.add('(min-width: 701px)', () => {
    $$('.gallery__col').forEach((col) => {
      const speed = parseFloat(col.dataset.speed) || 0;
      gsap.fromTo(col, { yPercent: -speed / 2 }, {
        yPercent: speed / 2,
        ease: 'none',
        scrollTrigger: { trigger: '.gallery__cols', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });
  gsap.from('.gallery__item', {
    scale: 0.85, opacity: 0, duration: 1.2, stagger: 0.06, ease: 'power3.out',
    scrollTrigger: { trigger: '.gallery__cols', start: 'top 85%' },
  });

  // ---------- блок записи ----------
  gsap.from('.booking__title .line__in', {
    yPercent: 110, duration: 1.3, stagger: 0.12, ease: 'power4.out',
    scrollTrigger: { trigger: '.booking', start: 'top 65%' },
  });

  // ---------- подвал: буквы логотипа выезжают ----------
  gsap.from('.footer__char', {
    yPercent: 100, duration: 1.2, stagger: 0.06, ease: 'power4.out',
    scrollTrigger: { trigger: '.footer__logo', start: 'top 95%' },
  });

  // ---------- бегущая строка ускоряется при быстром скролле ----------
  if (lenis) {
    const tracks = $$('.marquee__track');
    lenis.on('scroll', ({ velocity }) => {
      const rate = 1 + Math.min(Math.abs(velocity) / 8, 4);
      tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = rate)));
    });
  }

  // ---------- десктопные эффекты (курсор, магнит, превью в прайсе) ----------
  if (finePointer) {
    initCursor();
    initMagnetic();
    initPricePreview();
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
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
    });
    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

function initPricePreview() {
  const box = $('.price-preview');
  const pimg = $('img', box);
  if (!box) return;
  const xTo = gsap.quickTo(box, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(box, 'y', { duration: 0.6, ease: 'power3' });
  const list = $('.price-list');

  list.addEventListener('mousemove', (e) => {
    xTo(e.clientX + 30);
    yTo(e.clientY - box.offsetHeight / 2);
  });
  $$('.price-row', list).forEach((row) => {
    row.addEventListener('mouseenter', () => {
      if (pimg.getAttribute('src') !== row.dataset.img) pimg.src = row.dataset.img;
      gsap.to(box, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: 'power3.out' });
    });
  });
  list.addEventListener('mouseleave', () => gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power3.in' }));
}
