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

  // popup per scrivere l'email
  const dialog = document.getElementById('mail-dialog');
  const mailForm = document.getElementById('mail-form');
  if (dialog && mailForm && typeof dialog.showModal === 'function') {
    const TO = 'youssef.cherkaoui@outlook.it';
    const body = mailForm.querySelector('#m-body');
    const error = mailForm.querySelector('#m-error');
    const copyBtn = mailForm.querySelector('[data-copy]');
    let opener = null;

    document.querySelectorAll('[data-mail]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        opener = link;
        error.textContent = '';
        body.removeAttribute('aria-invalid');
        dialog.showModal();
        mailForm.querySelector('#m-name').focus();
      });
    });

    dialog.addEventListener('close', () => { if (opener) opener.focus(); });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    mailForm.querySelector('[data-close]').addEventListener('click', () => dialog.close());

    const compose = () => {
      const name = mailForm.querySelector('#m-name').value.trim();
      const subject = mailForm.querySelector('#m-subject').value.trim() || 'Contatto dal portfolio';
      const text = body.value.trim();
      const signature = name ? `\n\n${name}` : '';
      return { subject, text: `Ciao Youssef,\n\n${text}${signature}` };
    };

    mailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!body.value.trim()) {
        error.textContent = 'Scrivi il messaggio prima di inviarlo.';
        body.setAttribute('aria-invalid', 'true');
        body.focus();
        return;
      }
      const { subject, text } = compose();
      const s = encodeURIComponent(subject);
      const b = encodeURIComponent(text);
      const via = e.submitter ? e.submitter.value : 'app';
      if (via === 'gmail') {
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${TO}&su=${s}&body=${b}`, '_blank', 'noopener');
      } else if (via === 'outlook') {
        window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${TO}&subject=${s}&body=${b}`, '_blank', 'noopener');
      } else {
        window.location.href = `mailto:${TO}?subject=${s}&body=${b}`;
      }
      dialog.close();
    });

    body.addEventListener('input', () => {
      if (body.value.trim()) { error.textContent = ''; body.removeAttribute('aria-invalid'); }
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(TO);
        copyBtn.textContent = 'Indirizzo copiato';
      } catch {
        copyBtn.textContent = TO;
      }
      setTimeout(() => { copyBtn.textContent = 'Copia indirizzo'; }, 2500);
    });
  }

})();
