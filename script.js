/* ============================================================
   Localabs — scroll-driven dark band + parallax + reveal + counters
   ============================================================ */

(function () {
  const root = document.documentElement;
  const privacyAnchor = document.querySelector('.privacy-anchor');
  const nav = document.querySelector('.nav');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */
  function clamp01(t) { return Math.max(0, Math.min(1, t)); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /* ----------------------------------------------------------
     Parallax elements
     ----------------------------------------------------------
     Anything with data-parallax="0.4" gets translated vertically
     by `speed * scrolledIntoViewport` px. Negative speeds drift
     UP relative to the page; positive drift DOWN slower than the
     page (i.e. behind the scroll).

     data-parallax-axis="x" switches to horizontal drift.
     data-parallax-rotate="6" adds rotation as you scroll.
     data-parallax-scale="0.05" adds tiny zoom-in/out around 1.0.
     ---------------------------------------------------------- */
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  function updateParallax() {
    if (prefersReducedMotion) return;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Center of element relative to viewport center, normalized
      // to [-1, +1] across one full screen above/below.
      const center = rect.top + rect.height / 2;
      const norm = (center - vh / 2) / vh; // < 0 above center, > 0 below
      const speed = parseFloat(el.dataset.parallax || '0');
      const axis = el.dataset.parallaxAxis || 'y';
      const rotateAmt = parseFloat(el.dataset.parallaxRotate || '0');
      const scaleAmt = parseFloat(el.dataset.parallaxScale || '0');

      const offset = -norm * vh * speed * 0.18;
      const rotate = norm * rotateAmt;
      const scale = 1 + (norm * scaleAmt);

      const translate = axis === 'x'
        ? `translateX(${offset.toFixed(1)}px)`
        : `translateY(${offset.toFixed(1)}px)`;
      el.style.transform =
        `${translate} rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
  }

  /* ----------------------------------------------------------
     Dark band — gradual interpolation around .privacy-anchor
     ----------------------------------------------------------
     Bumped fade distance from 0.70vh → 1.40vh and shifted the
     trigger earlier (1.10vh from top instead of 0.85) so the
     light → dark transition spans roughly 2× the previous
     scroll distance. Same band shape, just slower / more
     cinematic.
     ---------------------------------------------------------- */
  let lastDark = 0;
  let lastScroll = window.scrollY;
  let navHidden = false;

  function updateDark() {
    if (!privacyAnchor) return;
    const rect = privacyAnchor.getBoundingClientRect();
    const vh = window.innerHeight;
    const fadeIn = clamp01((vh * 1.10 - rect.top) / (vh * 1.40));
    const fadeOut = clamp01((rect.bottom + vh * 0.10) / (vh * 1.40));
    const dark = easeInOut(Math.min(fadeIn, fadeOut));
    if (Math.abs(dark - lastDark) > 0.003) {
      root.style.setProperty('--dark', dark.toFixed(3));
      root.setAttribute('data-dark', dark > 0.5 ? '1' : '0');
      lastDark = dark;
    }
  }

  function updateNav() {
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

  function update() {
    updateDark();
    updateNav();
    updateParallax();
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

  /* ----------------------------------------------------------
     Reveal on scroll
     ----------------------------------------------------------
     `.reveal` keeps the original behavior. New variants:
       .reveal-left        slide in from the left
       .reveal-right       slide in from the right
       .reveal-scale       scale up from 92%
       .reveal-blur        unblur on enter
       .reveal-tilt        slight 3D tilt-correction on enter
     Stagger: a parent `.stagger-children` automatically applies
     incremental delays to its direct `.reveal*` children.
     ---------------------------------------------------------- */
  document.querySelectorAll('.stagger-children').forEach((parent) => {
    const kids = parent.querySelectorAll(':scope > .reveal, :scope > .reveal-left, :scope > .reveal-right, :scope > .reveal-scale, :scope > .reveal-blur, :scope > .reveal-tilt');
    kids.forEach((el, i) => {
      // Don't override an explicit delay-N class.
      const hasExplicit = Array.from(el.classList).some((c) => /^delay-\d+$/.test(c));
      if (!hasExplicit) {
        el.style.transitionDelay = `${(i * 70).toFixed(0)}ms`;
      }
    });
  });

  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, .reveal-tilt');
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

  /* ----------------------------------------------------------
     Counter animation
     ----------------------------------------------------------
     Any element with data-count="42" (or "12.5" / "42K") ticks
     up from 0 when scrolled into view. The DOM text gets the
     final string when done; intermediate frames show the integer
     part formatted with commas. Suffixes ("B", "%", "+") are
     detected from non-digit characters at the end of the raw
     attribute and preserved verbatim.
     ---------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      counterIO.unobserve(el);
      const raw = el.dataset.count.trim();
      // Split into prefix + number + suffix so values like "~12s",
      // "$1.5K", or "4B" all animate cleanly without losing their
      // non-numeric ornaments.
      const match = raw.match(/^(\D*)([\d,.]+)(.*)$/);
      if (!match) { el.textContent = raw; return; }
      const prefix = match[1];
      const target = parseFloat(match[2].replace(/,/g, ''));
      const suffix = match[3];
      if (Number.isNaN(target)) { el.textContent = raw; return; }
      const isInt = !match[2].includes('.');
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const t = clamp01((now - start) / duration);
        const v = target * easeOutCubic(t);
        if (isInt) {
          el.textContent = prefix + Math.round(v).toLocaleString() + suffix;
        } else {
          el.textContent = prefix + v.toFixed(1) + suffix;
        }
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  counters.forEach((el) => counterIO.observe(el));

  /* ----------------------------------------------------------
     Hero pointer parallax (kept from previous version)
     ---------------------------------------------------------- */
  const stage = document.querySelector('.hero-stage');
  if (stage && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    const chip = stage.querySelector('.hero-chip');
    const phone = stage.querySelector('.hero-phone');
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (chip) chip.style.transform = `translate(${x * -16}px, ${y * -16}px) rotate(${-3 + x * 4}deg)`;
      if (phone) phone.style.transform = `rotate(${4 + x * -2}deg) translate(${x * 12}px, ${y * 8}px)`;
    });
    stage.addEventListener('mouseleave', () => {
      if (chip) chip.style.transform = '';
      if (phone) phone.style.transform = '';
    });
  }

  /* ----------------------------------------------------------
     Magnetic buttons — subtle cursor pull
     ----------------------------------------------------------
     Any element with `.magnetic` follows the pointer with a soft
     spring while hovered. Disabled on touch and on
     prefers-reduced-motion. The transform is reset on mouseleave
     so the button always settles back to its layout position.
     ---------------------------------------------------------- */
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic || '14');
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ----------------------------------------------------------
     FAQ accordion — single-open
     ---------------------------------------------------------- */
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
