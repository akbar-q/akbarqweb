const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ensureSparkleLayer() {
  let layer = document.querySelector(".sparkle-layer");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.className = "sparkle-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function initSparkles() {
  if (reduceMotion) return;
  const layer = ensureSparkleLayer();

  function spawn(x, y, size) {
    const s = document.createElement("div");
    s.className = "sparkle";
    const px = Math.max(8, Math.min(window.innerWidth - 8, x));
    const py = Math.max(8, Math.min(window.innerHeight - 8, y));
    const wh = Math.max(10, Math.min(22, size));
    s.style.left = `${px}px`;
    s.style.top = `${py}px`;
    s.style.width = `${wh}px`;
    s.style.height = `${wh}px`;
    layer.appendChild(s);
    window.setTimeout(() => s.remove(), 950);
  }

  // gentle ambient sparkles
  const ambient = () => {
    spawn(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 10 + Math.random() * 12);
    const nextIn = 700 + Math.floor(Math.random() * 1400);
    window.setTimeout(ambient, nextIn);
  };
  window.setTimeout(ambient, 900);

  // sparkle trail on pointer move (throttled)
  let last = 0;
  window.addEventListener(
    "pointermove",
    (e) => {
      const now = performance.now();
      if (now - last < 80) return;
      last = now;
      spawn(e.clientX + (Math.random() * 10 - 5), e.clientY + (Math.random() * 10 - 5), 10 + Math.random() * 10);
    },
    { passive: true }
  );

  // sparkle burst on click/tap
  window.addEventListener(
    "pointerdown",
    (e) => {
      for (let i = 0; i < 7; i += 1) {
        spawn(e.clientX + (Math.random() * 30 - 15), e.clientY + (Math.random() * 30 - 15), 10 + Math.random() * 12);
      }
    },
    { passive: true }
  );
}

function initPageTransitions() {
  // fade in
  if (!reduceMotion) {
    window.requestAnimationFrame(() => {
      document.body.classList.add("is-enter");
    });
  } else {
    document.body.classList.add("is-enter");
  }

  if (reduceMotion) return;

  function isSameOriginLink(a) {
    try {
      const url = new URL(a.href, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    if (!a.getAttribute("href")) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!isSameOriginLink(a)) return;

    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    // let lightbox / gallery clicks through (they're not anchors)
    e.preventDefault();

    const navigate = () => {
      window.location.href = a.href;
    };

    // If ViewTransition API exists, rely on browser. Otherwise do manual fade.
    if ("startViewTransition" in document) {
      navigate();
      return;
    }

    document.body.classList.add("is-leaving");
    window.setTimeout(navigate, 200);
  });
}

function initWomenInScienceDayPopup() {
  // Home page only
  const path = (window.location.pathname || "").toLowerCase();
  if (!(path.endsWith("/vidhya-gift/") || path.endsWith("/vidhya-gift/index.html"))) return;

  const now = new Date();
  const isFeb11 = now.getMonth() === 1 && now.getDate() === 11;
  if (!isFeb11) return;

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const key = `vidhyaGift.wisday.dismissed.${y}-${m}-${d}`;

  try {
    if (localStorage.getItem(key) === "1") return;
  } catch {
    // ignore
  }

  const overlay = document.createElement("div");
  overlay.className = "wisday";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Happy Women in Science Day");

  const card = document.createElement("div");
  card.className = "wisday-card";

  const top = document.createElement("div");
  top.className = "wisday-top";
  const title = document.createElement("h2");
  title.className = "wisday-title";
  title.textContent = "Happy Women in Science Day";
  top.appendChild(title);

  const body = document.createElement("div");
  body.className = "wisday-body";
  const p1 = document.createElement("p");
  p1.textContent = "Today, we celebrate the women who turn curiosity into discovery — and courage into progress.";
  const p2 = document.createElement("p");
  p2.textContent = "Dr Vidhya, thank you for being a bright example of brilliance with heart.";
  body.appendChild(p1);
  body.appendChild(p2);

  const actions = document.createElement("div");
  actions.className = "wisday-actions";

  const confetti = document.createElement("button");
  confetti.type = "button";
  confetti.className = "button secondary";
  confetti.textContent = "Celebrate";
  confetti.addEventListener("click", () => {
    const trigger = document.querySelector("[data-confetti]");
    if (trigger) trigger.click();
  });

  const close = document.createElement("button");
  close.type = "button";
  close.className = "button";
  close.textContent = "Close";

  const dismiss = () => {
    overlay.remove();
    try {
      localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  };

  close.addEventListener("click", dismiss);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) dismiss();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.contains(overlay)) dismiss();
  });

  actions.appendChild(confetti);
  actions.appendChild(close);

  card.appendChild(top);
  card.appendChild(body);
  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

function initFloatingStickers() {
  if (reduceMotion) return;
  const layer = document.querySelector(".floating-stickers");
  if (!layer) return;

  const colors = ["#ff83b7", "#8df0d5", "#fff2a8", "#a8d7ff", "#ffb39b"];

  for (let i = 0; i < 12; i += 1) {
    const sticker = document.createElement("div");
    sticker.className = "floating-sticker";
    const size = 60 + Math.random() * 90;
    sticker.style.width = `${size}px`;
    sticker.style.height = `${size}px`;
    sticker.style.left = `${Math.random() * 100}%`;
    sticker.style.top = `${Math.random() * 100}%`;
    sticker.style.animationDuration = `${6 + Math.random() * 6}s`;
    sticker.style.background = colors[i % colors.length];
    layer.appendChild(sticker);
  }
}

function initJokeRotator() {
  const target = document.querySelector("[data-joke]");
  if (!target) return;

  const jokes = [
    "You make the hard parts feel gentle.",
    "Kindness, but make it legendary.",
    "Your calm is a lighthouse.",
    "Learning with you feels like sunrise.",
    "Your laughter turns nerves into courage.",
    "Brilliant mind. Golden heart."
  ];

  let index = Math.floor(Math.random() * jokes.length);
  target.textContent = jokes[index];

  const button = document.querySelector("[data-joke-button]");
  if (!button) return;

  button.addEventListener("click", () => {
    index = (index + 1) % jokes.length;
    target.textContent = jokes[index];
  });
}

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.2 }
  );

  items.forEach((item) => observer.observe(item));
}

function initGallery() {
  const feed = document.querySelector("[data-ig-feed]");
  if (!feed) return;

  const storagePrefix = "vidhyaGift.likes.";

  function prettifyTitle(input) {
    if (!input) return "";
    let s = String(input);
    s = s.replace(/\.[^./\\]+$/g, "");
    s = s.replace(/[_-]+/g, " ");
    s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  function photoUrl(fileName) {
    return `./photos/${encodeURIComponent(fileName)}`;
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function getStoredState(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function setStoredState(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  function ensureLightbox() {
    let lb = document.querySelector("[data-lightbox]");
    if (lb) return lb;

    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("data-lightbox", "");
    lb.hidden = true;

    const card = document.createElement("div");
    card.className = "lightbox-card";

    const top = document.createElement("div");
    top.className = "lightbox-top";

    const title = document.createElement("h3");
    title.className = "lightbox-title";
    title.textContent = "";

    const close = document.createElement("button");
    close.className = "lightbox-close";
    close.type = "button";
    close.textContent = "Close";

    const img = document.createElement("img");
    img.className = "lightbox-img";
    img.alt = "";

    close.addEventListener("click", () => {
      lb.hidden = true;
      img.src = "";
    });

    lb.addEventListener("click", (e) => {
      if (e.target === lb) close.click();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lb.hidden) close.click();
    });

    top.appendChild(title);
    top.appendChild(close);
    card.appendChild(top);
    card.appendChild(img);
    lb.appendChild(card);
    document.body.appendChild(lb);

    lb._set = ({ src, titleText }) => {
      title.textContent = titleText || "";
      img.src = src;
      img.alt = titleText || "Photo";
      lb.hidden = false;
    };

    return lb;
  }

  function formatLikes(n) {
    return `${n.toLocaleString()} likes`;
  }

  function makeCard(item) {
    const titleText = prettifyTitle(item.title || item.file);
    const src = photoUrl(item.file);
    const key = `${storagePrefix}${item.file}`;

    const seed = hashString(item.file);
    const base = 18 + (seed % 260);

    const state = getStoredState(key, { liked: false, likes: base });
    if (typeof state.likes !== "number" || state.likes < 0) state.likes = base;
    state.liked = Boolean(state.liked);

    const card = document.createElement("article");
    card.className = "ig-card";

    const head = document.createElement("div");
    head.className = "ig-head";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "ig-title";
    title.textContent = titleText;
    const meta = document.createElement("div");
    meta.className = "ig-meta";
    meta.textContent = "Tap to view full screen";
    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    head.appendChild(titleWrap);

    const imageWrap = document.createElement("div");
    imageWrap.className = "ig-imageWrap";

    const img = document.createElement("img");
    img.className = "ig-image";
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = titleText;
    img.src = src;
    imageWrap.appendChild(img);

    const actions = document.createElement("div");
    actions.className = "ig-actions";

    const likeBtn = document.createElement("button");
    likeBtn.className = "likeBtn";
    likeBtn.type = "button";
    likeBtn.textContent = state.liked ? "Liked" : "Like";
    if (state.liked) likeBtn.classList.add("is-liked");

    const likeCount = document.createElement("div");
    likeCount.className = "likeCount";
    likeCount.innerHTML = `<b>♡</b> <span>${formatLikes(state.likes)}</span>`;
    const likeCountSpan = likeCount.querySelector("span");

    function setLikes(nextLikes) {
      state.likes = Math.max(0, Math.floor(nextLikes));
      likeCountSpan.textContent = formatLikes(state.likes);
      setStoredState(key, state);
    }

    likeBtn.addEventListener("click", () => {
      state.liked = !state.liked;
      likeBtn.textContent = state.liked ? "Liked" : "Like";
      likeBtn.classList.toggle("is-liked", state.liked);
      setLikes(state.likes + (state.liked ? 1 : -1));
    });

    const lb = ensureLightbox();
    img.addEventListener("click", () => {
      lb._set({ src, titleText });
    });

    actions.appendChild(likeBtn);
    actions.appendChild(likeCount);

    card.appendChild(head);
    card.appendChild(imageWrap);
    card.appendChild(actions);

    if (!reduceMotion) {
      const bump = () => {
        const chance = (hashString(item.file + String(Date.now())) % 100) / 100;
        if (chance > 0.55) setLikes(state.likes + 1);
        const nextIn = 2600 + Math.floor(Math.random() * 6200);
        window.setTimeout(bump, nextIn);
      };
      const startIn = 1200 + Math.floor((seed % 7) * 500);
      window.setTimeout(bump, startIn);
    }

    return card;
  }

  async function loadManifest() {
    const cacheBust = Date.now();
    const res = await fetch(`./photos/photos.json?v=${cacheBust}`);
    if (!res.ok) throw new Error("manifest fetch failed");
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((x) => x && typeof x.file === "string" && x.file.trim().length)
      .map((x) => ({ file: x.file.trim(), title: typeof x.title === "string" ? x.title : "" }));
  }

  (async () => {
    try {
      const items = await loadManifest();
      feed.innerHTML = "";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "photo-tile missing";
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = "No photos yet — add some to /photos and regenerate photos.json.";
        empty.appendChild(label);
        feed.appendChild(empty);
        return;
      }

      items.forEach((item) => feed.appendChild(makeCard(item)));
    } catch {
      feed.innerHTML = "";
      const fail = document.createElement("div");
      fail.className = "photo-tile missing";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = "Couldn’t load photos.json — run generate_photos_json.ps1.";
      fail.appendChild(label);
      feed.appendChild(fail);
    }
  })();
}

function initConfetti() {
  const button = document.querySelector("[data-confetti]");
  if (!button) return;

  button.addEventListener("click", () => {
    const layer = document.createElement("div");
    layer.className = "confetti";
    document.body.appendChild(layer);

    const colors = ["#ff83b7", "#8df0d5", "#fff2a8", "#a8d7ff", "#ffb39b"];

    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${10 + Math.random() * 80}%`;
      piece.style.top = `${Math.random() * 10}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.transform = `rotate(${Math.random() * 80}deg)`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      layer.appendChild(piece);
    }

    window.setTimeout(() => {
      layer.remove();
    }, 1800);
  });
}

initFloatingStickers();
initPageTransitions();
initSparkles();
initJokeRotator();
initReveal();
initGallery();
initConfetti();
initWomenInScienceDayPopup();
