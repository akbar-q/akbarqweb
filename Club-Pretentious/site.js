(() => {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const tmpl = document.getElementById('cardTmpl');
  const galleryTab = document.getElementById('galleryTab');
  const galleryPanel = document.getElementById('gallery');
  const manifestoTab = document.getElementById('manifestoTab');

  // Shared welcome modal + audio
  const welcomeBtn = document.getElementById('welcomeBtn');
  const welcome = document.getElementById('welcome');
  const welcomeBackdrop = document.getElementById('welcomeBackdrop');
  const welcomeEnter = document.getElementById('welcomeEnter');
  const clubAudio = document.getElementById('clubAudio');

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxOpen = document.getElementById('lightboxOpen');

  const syncTabs = () => {
    const hash = (location.hash || '').toLowerCase();
    const isGallery = hash === '#gallery';
    const isManifesto = hash === '#manifesto' || hash === '';
    galleryTab?.classList.toggle('nav__link--active', isGallery);
    manifestoTab?.classList.toggle('nav__link--active', isManifesto);
  };

  window.addEventListener('hashchange', syncTabs);
  syncTabs();

  galleryTab?.addEventListener('click', (e) => {
    // Ensure smooth behavior even if the browser doesn't scroll for hash changes.
    e.preventDefault();
    history.pushState(null, '', '#gallery');
    syncTabs();
    galleryPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  manifestoTab?.addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState(null, '', '#manifesto');
    syncTabs();
    document.getElementById('manifesto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const openWelcome = () => {
    if (!welcome) return;
    document.body.classList.add('welcome-open');
    welcome.classList.add('welcome--open');
    welcome.setAttribute('aria-hidden', 'false');
  };

  const closeWelcome = () => {
    if (!welcome) return;
    welcome.classList.remove('welcome--open');
    welcome.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('welcome-open');
  };

  const startAudio = async () => {
    if (!clubAudio) return;
    try {
      clubAudio.volume = 0.85;
      await clubAudio.play();
    } catch {
      // If playback fails, we still proceed; browser policy may require another gesture.
    }
  };

  welcomeBtn?.addEventListener('click', () => {
    openWelcome();
  });

  welcomeEnter?.addEventListener('click', async () => {
    await startAudio();
    closeWelcome();
  });

  welcomeBackdrop?.addEventListener('click', closeWelcome);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWelcome();
  });

  const openLightbox = (src, title) => {
    if (!lightbox || !lightboxImg || !lightboxTitle || !lightboxOpen) return;
    lightboxImg.src = src;
    lightboxImg.alt = title || '';
    lightboxTitle.textContent = title || 'Image';
    lightboxOpen.setAttribute('href', src);
    lightbox.classList.add('lightbox--open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.remove('lightbox--open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // prevent flash of old image on reopen
    lightboxImg.src = '';
  };

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxBackdrop?.addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  const toTitle = (fileBase) => {
    const cleaned = fileBase
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || fileBase;
  };

  const extractYear = (text) => {
    const match = text.match(/\b(19\d{2}|20\d{2})\b/);
    return match ? match[1] : null;
  };

  const extOf = (filename) => {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
  };

  const baseOf = (filename) => {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(0, i) : filename;
  };

  const safeSrc = (filename) => `images/${encodeURI(filename)}`;

  const renderCard = (filename) => {
    const node = tmpl.content.firstElementChild.cloneNode(true);
    const img = node.querySelector('.card__img');
    const name = node.querySelector('.card__name');
    const meta = node.querySelector('.card__meta');

    const base = baseOf(filename);
    const year = extractYear(base);
    const ext = extOf(filename);

    name.textContent = filename;
    meta.textContent = `${toTitle(base)}${year ? ` • ${year}` : ''} • ${ext.toUpperCase()} • loading…`;

    img.src = safeSrc(filename);
    img.alt = base;

    img.addEventListener('click', () => {
      openLightbox(safeSrc(filename), filename);
    });

    img.addEventListener('load', () => {
      meta.textContent = `${toTitle(base)}${year ? ` • ${year}` : ''} • ${ext.toUpperCase()} • ${img.naturalWidth}×${img.naturalHeight}`;
    });

    img.addEventListener('error', () => {
      meta.textContent = `${toTitle(base)}${year ? ` • ${year}` : ''} • ${ext.toUpperCase()} • failed to load`;
      node.style.opacity = '0.7';
    });

    return node;
  };

  const load = async () => {
    try {
      const res = await fetch('images/manifest.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
      const files = await res.json();

      if (!Array.isArray(files)) throw new Error('manifest is not an array');

      const onlyImages = files
        .filter((f) => typeof f === 'string')
        .filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));

      count.textContent = `${onlyImages.length} files`;

      const frag = document.createDocumentFragment();
      for (const file of onlyImages) frag.appendChild(renderCard(file));
      grid.replaceChildren(frag);
    } catch (err) {
      count.textContent = 'Could not load gallery';
      grid.textContent = 'Ensure images/manifest.json exists and is valid JSON.';
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  load();
})();
