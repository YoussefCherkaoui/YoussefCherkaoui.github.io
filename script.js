(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // anno nel footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // entrate allo scroll, sfalsate dentro ogni sezione
  const revealed = document.querySelectorAll('[data-reveal]');
  document.querySelectorAll('section, header').forEach((sec) => {
    sec.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 8)));
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealed.forEach((el) => io.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('is-in'));
  }

  // progetti: schede che scorrono da sole, con pausa
  const work = document.querySelector('.work');
  const tabs = [...document.querySelectorAll('.work-tab')];
  const slides = [...document.querySelectorAll('.work-slide')];
  const toggle = document.querySelector('.work-toggle');
  const narrow = window.matchMedia('(max-width: 720px)');
  if (work && tabs.length) {
    let current = 0;
    let userPaused = false;
    let hover = false;
    let focusIn = false;
    let visible = false;

    const auto = () => !reduce && !narrow.matches && !userPaused;
    const held = () => hover || focusIn || !visible;

    const restartBar = () => {
      const bar = tabs[current].querySelector('.work-progress span');
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    };

    const select = (n, focus = false) => {
      current = (n + tabs.length) % tabs.length;
      tabs.forEach((t, i) => {
        const on = i === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      slides.forEach((sl, i) => sl.classList.toggle('is-active', i === current));
      if (focus) tabs[current].focus();
      restartBar();
    };

    const sync = () => {
      work.classList.toggle('is-auto', auto());
      work.classList.toggle('is-held', held());
      if (toggle) {
        toggle.hidden = reduce || narrow.matches;
        toggle.textContent = userPaused ? 'Riprendi lo scorrimento' : 'Metti in pausa';
        toggle.setAttribute('aria-pressed', String(userPaused));
      }
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.querySelector('.work-progress span').addEventListener('animationend', () => {
        if (auto() && i === current) select(current + 1);
      });
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select(current + 1, true); }
        if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select(current - 1, true); }
        if (k === 'Home') { e.preventDefault(); select(0, true); }
        if (k === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });

    const grid = work.querySelector('.work-grid');
    grid.addEventListener('mouseenter', () => { hover = true; sync(); });
    grid.addEventListener('mouseleave', () => { hover = false; sync(); });
    work.addEventListener('focusin', () => { focusIn = true; sync(); });
    work.addEventListener('focusout', (e) => { if (!work.contains(e.relatedTarget)) { focusIn = false; sync(); } });
    if (toggle) toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); restartBar(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(grid);
    } else { visible = true; }
    narrow.addEventListener('change', sync);
    sync();
    select(0);
  }

  // ritratto: leggera deriva legata allo scroll
  const drift = document.querySelector('[data-drift]');
  if (drift && !reduce) {
    let ticking = false;
    const update = () => {
      const r = drift.parentElement.getBoundingClientRect();
      const p = Math.min(Math.max(1 - (r.top + r.height) / (window.innerHeight + r.height), 0), 1);
      drift.style.transform = `scale(${1.12 - p * 0.1}) translateY(${(p - 0.5) * -4}%)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

})();
