/* ============================================================
   Localabs — scroll-driven dark transition + reveal anims
   ============================================================ */

(function () {
  const root = document.documentElement;
  const privacyAnchor = document.querySelector('.privacy-anchor');
  const nav = document.querySelector('.nav');

  // Anchored dark transition: dark mode is a BAND — light before privacy,
  // dark during, then back to light. Uses fade-in + fade-out clamps.
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp01(t) { return Math.max(0, Math.min(1, t)); }

  let lastDark = 0;
  let lastScroll = window.scrollY;
  let navHidden = false;

  function update() {
    // Dark transition based on privacy anchor position
    if (privacyAnchor) {
      const rect = privacyAnchor.getBoundingClientRect();
      const vh = window.innerHeight;
      // fadeIn: section enters from below, peaks dark at 0.15 vh from top
      const fadeIn = clamp01((vh * 0.85 - rect.top) / (vh * 0.70));
      // fadeOut: section exits past top, becomes light again as bottom moves up
      const fadeOut = clamp01((rect.bottom - vh * 0.15) / (vh * 0.70));
      const dark = easeInOut(Math.min(fadeIn, fadeOut));
      if (Math.abs(dark - lastDark) > 0.005) {
        root.style.setProperty('--dark', dark.toFixed(3));
        root.setAttribute('data-dark', dark > 0.6 ? '1' : '0');
        lastDark = dark;
      }
    }

    // Hide nav on scroll down, show on scroll up
    const y = window.scrollY;
    const diff = y - lastScroll;
    if (y < 80) {
      if (navHidden) { nav.classList.remove('hidden'); navHidden = false; }
    } else if (diff > 5 && !navHidden) {
      nav.classList.add('hidden'); navHidden = true;
    } else if (diff < -5 && navHidden) {
      nav.classList.remove('hidden'); navHidden = false;
    }
    lastScroll = y;
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));

  // Defensive fallback: anything already visible (or near-visible) on first
  // paint should reveal immediately, even if the IO callback is delayed.
  requestAnimationFrame(() => {
    const h = window.innerHeight;
    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < h * 1.05 && r.bottom > -50) el.classList.add('in');
    });
  });

  // Hero parallax — tilt chip / phone subtly with pointer
  const stage = document.querySelector('.hero-stage');
  if (stage && window.matchMedia('(pointer: fine)').matches) {
    const chip = stage.querySelector('.hero-chip');
    const phone = stage.querySelector('.hero-phone');
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (chip) chip.style.setProperty('--mx', `${x * -16}px`);
      if (chip) chip.style.setProperty('--my', `${y * -16}px`);
      if (chip) chip.style.transform = `translate(${x * -16}px, ${y * -16}px) rotate(${-3 + x * 4}deg)`;
      if (phone) phone.style.transform = `rotate(${4 + x * -2}deg) translate(${x * 12}px, ${y * 8}px)`;
    });
    stage.addEventListener('mouseleave', () => {
      if (chip) chip.style.transform = '';
      if (phone) phone.style.transform = '';
    });
  }

  // FAQ: close others when opening one (single-open accordion) + smooth height.
  // We wrap each .body's content in .inner so a CSS grid-template-rows
  // transition can animate it from 0fr → 1fr (smooth, GPU-friendly).
  document.querySelectorAll('.faq-item .body').forEach((b) => {
    if (b.firstElementChild && b.firstElementChild.classList.contains('inner')) return;
    const inner = document.createElement('div');
    inner.className = 'inner';
    while (b.firstChild) inner.appendChild(b.firstChild);
    b.appendChild(inner);
  });

  const faqItems = document.querySelectorAll('.faq-item details');
  faqItems.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        faqItems.forEach((o) => { if (o !== d) o.open = false; });
      }
    });
  });
})();
