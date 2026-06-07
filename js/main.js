/* Teide marketing site — progressive enhancement only.
   Everything degrades gracefully without JS; this just adds motion + nav. */
(() => {
  'use strict';

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Sticky nav: solidify after a small scroll ------------------------ */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---- Mobile menu toggle -------------------------------------------- */
    const toggle = nav.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('.nav-links a').forEach((a) =>
        a.addEventListener('click', () => {
          nav.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        })
      );
    }
  }

  /* ---- Scroll-reveal ----------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- Lizenzen: load full text on first expand (fallback link stays) --- */
  document.querySelectorAll('details.license-details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      const pre = d.querySelector('pre[data-license]');
      if (!pre || pre.dataset.loaded) return;
      pre.dataset.loaded = '1';
      fetch(pre.getAttribute('data-license'))
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((t) => {
          pre.textContent = t.trim();
        })
        .catch(() => {
          // Leave the visible fallback link in place; allow a retry next open.
          pre.dataset.loaded = '';
        });
    });
  });

  /* ---- Lightweight hero parallax (transform only, rAF-throttled) -------- */
  const layers = document.querySelectorAll('[data-parallax]');
  if (!reduceMotion && layers.length) {
    let ticking = false;
    const apply = () => {
      const y = window.scrollY;
      layers.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0;
        el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(apply);
          ticking = true;
        }
      },
      { passive: true }
    );
  }
})();
