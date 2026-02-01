(() => {
  const root = document.documentElement;
  const page = document.getElementById('page');
  const envelope = document.querySelector('.envelope');
  const toggle = document.getElementById('toggleMotion');
  const acceptBtn = document.getElementById('acceptBtn');

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    root.classList.add('reduced-motion');
    toggle?.setAttribute('aria-pressed', 'true');
  }

  toggle?.addEventListener('click', () => {
    const reduced = root.classList.toggle('reduced-motion');
    toggle.setAttribute('aria-pressed', reduced ? 'true' : 'false');
  });

  // Mailto acceptance (prefilled, suitably pretentious)
  if (acceptBtn) {
    const subject = 'Acceptance — Club Pretentious Invitation';
    const body = [
      'President Qamar,',
      '',
      'With due appreciation for the club’s commendable restraint, I accept the invitation to attend Club Pretentious.',
      'I shall arrive punctually and appropriately attired in classical Western tailoring—quietly deliberate, never hurried, and entirely free of fast fashion.',
      '',
      'Kindly consider this my confirmation.',
      '',
      'With measured enthusiasm,',
      'Reshmi N.'
    ].join('\n');

    const href = `mailto:akbar@akbarq.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    acceptBtn.setAttribute('href', href);
  }

  // 3D tilt (politely ridiculous)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const animateTilt = () => {
    raf = 0;
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    envelope?.style.setProperty('--rx', `${currentX}deg`);
    envelope?.style.setProperty('--ry', `${currentY}deg`);

    if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
      raf = requestAnimationFrame(animateTilt);
    }
  };

  const onMove = (ev) => {
    if (!envelope || root.classList.contains('reduced-motion')) return;

    const rect = envelope.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top) / rect.height;

    targetX = clamp((0.5 - y) * 6.5, -6.5, 6.5);
    targetY = clamp((x - 0.5) * 9.0, -9.0, 9.0);

    if (!raf) raf = requestAnimationFrame(animateTilt);
  };

  const onLeave = () => {
    targetX = 0;
    targetY = 0;
    if (!raf) raf = requestAnimationFrame(animateTilt);
  };

  envelope?.addEventListener('mousemove', onMove);
  envelope?.addEventListener('mouseleave', onLeave);

  // Dust canvas
  const canvas = document.getElementById('dust');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let width = 0;
  let height = 0;

  const particles = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  const resize = () => {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    const count = Math.floor((width * height) / 22000);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(0.6, 1.8),
        a: rand(0.02, 0.14),
        vx: rand(-0.03, 0.07),
        vy: rand(-0.06, 0.05),
        tw: rand(0, Math.PI * 2),
        tws: rand(0.003, 0.012)
      });
    }
  };

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(34, now - last);
    last = now;

    ctx.clearRect(0, 0, width, height);

    const reduced = root.classList.contains('reduced-motion');

    // subtle top glow
    ctx.save();
    ctx.globalAlpha = 0.08;
    const g = ctx.createRadialGradient(width * 0.5, height * 0.22, 0, width * 0.5, height * 0.22, Math.max(width, height) * 0.55);
    g.addColorStop(0, 'rgba(241,227,181,1)');
    g.addColorStop(0.25, 'rgba(210,179,108,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    for (const p of particles) {
      const tw = Math.sin(p.tw) * 0.05;
      ctx.globalAlpha = reduced ? p.a * 0.6 : (p.a + tw);
      ctx.fillStyle = 'rgba(241,227,181,1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (!reduced) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.tw += p.tws * dt;
      }

      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }

    requestAnimationFrame(tick);
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(tick);

  // A tiny “grand entrance” nudge for the whole page
  // (kept subtle to avoid accessibility issues)
  setTimeout(() => {
    if (root.classList.contains('reduced-motion')) return;
    page?.animate(
      [
        { filter: 'saturate(1) contrast(1)', transform: 'translateY(0px)' },
        { filter: 'saturate(1.06) contrast(1.03)', transform: 'translateY(-2px)' },
        { filter: 'saturate(1) contrast(1)', transform: 'translateY(0px)' }
      ],
      { duration: 1200, easing: 'cubic-bezier(.2,.9,.2,1)' }
    );
  }, 900);
})();
