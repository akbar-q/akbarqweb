(() => {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const tmpl = document.getElementById('cardTmpl');
  const galleryTab = document.getElementById('galleryTab');
  const galleryPanel = document.getElementById('gallery');
  const manifestoTab = document.getElementById('manifestoTab');
  const meditationsText = document.getElementById('meditationsText');
  const poetryText = document.getElementById('poetryText');

  // Shared welcome modal + audio
  const welcomeBtn = document.getElementById('welcomeBtn');
  const welcome = document.getElementById('welcome');
  const welcomeBackdrop = document.getElementById('welcomeBackdrop');
  const welcomeEnter = document.getElementById('welcomeEnter');
  const clubAudio = document.getElementById('clubAudio');
  const muteBtn = document.getElementById('muteBtn');

  const WELCOME_SEEN_KEY = 'cp_welcome_seen_v1';
  const AUDIO_STATE_KEY = 'cp_audio_state_v1';
  const AUDIO_TIME_KEY = 'cp_audio_time_v1';
  const AUDIO_MUTED_KEY = 'cp_audio_muted_v1';

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

  const markWelcomeSeen = () => {
    try {
      sessionStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      // ignore storage failures
    }
  };

  const startAudio = async () => {
    if (!clubAudio) return;
    try {
      try {
        const muted = localStorage.getItem(AUDIO_MUTED_KEY) === '1';
        clubAudio.muted = muted;
      } catch {
        // ignore storage failures
      }
      clubAudio.volume = 0.85;
      await clubAudio.play();
      try {
        localStorage.setItem(AUDIO_STATE_KEY, 'on');
      } catch {
        // ignore storage failures
      }
    } catch {
      // If playback fails, we still proceed; browser policy may require another gesture.
    }
  };

  const applyMutedState = (muted) => {
    if (clubAudio) clubAudio.muted = muted;
    if (muteBtn) muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  };

  const loadMutedState = () => {
    try {
      const muted = localStorage.getItem(AUDIO_MUTED_KEY) === '1';
      applyMutedState(muted);
    } catch {
      // ignore storage failures
    }
  };

  const toggleMuted = () => {
    const next = !(clubAudio?.muted ?? false);
    applyMutedState(next);
    try {
      localStorage.setItem(AUDIO_MUTED_KEY, next ? '1' : '0');
    } catch {
      // ignore storage failures
    }
  };

  const saveAudioTime = () => {
    if (!clubAudio) return;
    try {
      localStorage.setItem(AUDIO_TIME_KEY, String(clubAudio.currentTime || 0));
    } catch {
      // ignore storage failures
    }
  };

  welcomeBtn?.addEventListener('click', () => {
    openWelcome();
  });

  welcomeEnter?.addEventListener('click', async () => {
    await startAudio();
    markWelcomeSeen();
    closeWelcome();
  });

  welcomeBackdrop?.addEventListener('click', () => {
    markWelcomeSeen();
    closeWelcome();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      markWelcomeSeen();
      closeWelcome();
    }
  });

  muteBtn?.addEventListener('click', toggleMuted);
  loadMutedState();

  // Auto-open once per session
  try {
    const alreadySeen = sessionStorage.getItem(WELCOME_SEEN_KEY) === '1';
    if (!alreadySeen && welcome) {
      // Small delay so first paint happens before blur/overlay.
      setTimeout(() => {
        openWelcome();
        markWelcomeSeen();
      }, 220);
    }
  } catch {
    // If storage is blocked, still auto-open.
    if (welcome) setTimeout(openWelcome, 220);
  }

  // Attempt to resume audio across sub pages if previously started.
  try {
    const shouldResume = localStorage.getItem(AUDIO_STATE_KEY) === 'on';
    if (shouldResume && clubAudio) {
      const savedTime = Number(localStorage.getItem(AUDIO_TIME_KEY) || 0);
      if (!Number.isNaN(savedTime) && savedTime > 0) {
        clubAudio.currentTime = savedTime;
      }
      setTimeout(() => {
        startAudio();
      }, 250);
    }
  } catch {
    // ignore storage failures
  }

  window.addEventListener('pagehide', saveAudioTime);
  window.addEventListener('beforeunload', saveAudioTime);

  // Meditations & Poetry rotation
  const meditations = [
    'Elegance is not a costume but a posture of mind; one may borrow a jacket, but not composure.',
    'Time, when respected, becomes a collaborator; hurry is a theft we commit against ourselves.',
    'Taste is not a list of prohibitions; it is the practice of attention, quietly and repeatedly.',
    'The room learns who to welcome by how we enter it: unhurried, unannounced, unafraid of silence.',
    'Restraint is not absence; it is the deliberate placement of what remains.',
    'A well-set table is a small philosophy: every object knows its reason for being there.',
    'We dress for the occasion not to impress, but to align with what the moment asks of us.',
    'Conversation is a craft of timing; a pause can be as eloquent as a sentence.',
    'To be composed is to keep one’s edges neat even when the world insists on noise.',
    'We prefer the deliberate because the deliberate notices what the hurried cannot see.'
  ];

  const cycleText = (el, list, { random = false, interval = 10000 } = {}) => {
    if (!el || !Array.isArray(list) || list.length === 0) return;
    let index = 0;
    let lastIndex = -1;

    const pickNext = () => {
      if (random) {
        let next = Math.floor(Math.random() * list.length);
        if (list.length > 1) {
          while (next === lastIndex) next = Math.floor(Math.random() * list.length);
        }
        lastIndex = next;
        el.textContent = list[next];
      } else {
        el.textContent = list[index % list.length];
        index += 1;
      }
    };

    pickNext();
    setInterval(pickNext, interval);
  };

  cycleText(meditationsText, meditations, { random: false, interval: 10000 });
  cycleText(poetryText, meditations, { random: true, interval: 10000 });

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
