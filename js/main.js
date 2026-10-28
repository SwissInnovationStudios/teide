/* Teide marketing site — progressive enhancement only.
   Everything degrades gracefully without JS; this just adds motion + nav. */
(() => {
  'use strict';

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = year; });

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
      const closeMenu = () => {
        if (!nav.classList.contains('menu-open')) return;
        nav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      };
      nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', closeMenu));
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closeMenu();
        toggle.focus();
      });
    }
  }

  /* ---- Trailer: muted autoplay only while on screen ----------------------
     Self-hosted <video> (no YouTube iframe → no third-party request). The HTML
     ships with native controls so it works without JS; with JS we take over:
     play when ≥35 % visible, pause when scrolled away. Reduced motion keeps
     the poster + controls and never autoplays. */
  const trailers = document.querySelectorAll('video[data-autoplay]');
  if (trailers.length && !reduceMotion && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target;
          if (e.isIntersecting) {
            v.play().then(() => { v.controls = false; }).catch(() => { v.controls = true; });
          } else if (!v.paused) {
            v.pause();
          }
        }
      },
      { threshold: 0.35 }
    );
    trailers.forEach((v) => {
      v.muted = true;
      // Tap/click toggles play so a paused autoplay is never a dead poster.
      v.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
      vio.observe(v);
    });
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
