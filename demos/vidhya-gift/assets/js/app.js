const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    "Your sparkle is 70% science, 30% magic.",
    "Proof that kindness can be a superpower.",
    "If joy had a mascot, it would be you.",
    "Your laughter is the unofficial soundtrack.",
    "Caffeine? Optional. You? Essential.",
    "Doctor of brilliance, keeper of good vibes."
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
  const grid = document.querySelector("[data-gallery-grid]");
  if (!grid) return;

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

  function makePhotoFigure(item) {
    const figure = document.createElement("figure");
    figure.className = "photo-figure";

    const tile = document.createElement("div");
    tile.className = "photo-tile";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = "Loading…";
    tile.appendChild(label);

    const caption = document.createElement("figcaption");
    caption.className = "photo-caption";
    caption.textContent = prettifyTitle(item.title || item.file);

    const src = photoUrl(item.file);

    const img = new Image();
    img.onload = () => {
      tile.style.backgroundImage = `url(${src})`;
      tile.classList.add("loaded");
    };
    img.onerror = () => {
      tile.classList.add("missing");
      label.textContent = "Missing image";
    };
    img.src = src;

    figure.appendChild(tile);
    figure.appendChild(caption);
    return figure;
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
      grid.innerHTML = "";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "photo-tile missing";
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = "No photos yet — add some to /photos and regenerate photos.json.";
        empty.appendChild(label);
        grid.appendChild(empty);
        return;
      }

      items.forEach((item) => grid.appendChild(makePhotoFigure(item)));
    } catch (e) {
      grid.innerHTML = "";
      const fail = document.createElement("div");
      fail.className = "photo-tile missing";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = "Couldn’t load photos.json — run generate_photos_json.ps1.";
      fail.appendChild(label);
      grid.appendChild(fail);
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
initJokeRotator();
initReveal();
initGallery();
initConfetti();
