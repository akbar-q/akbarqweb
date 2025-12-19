function spawnOrbs(count = 14) {
  const root = document.body;
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    const size = Math.random() * 60 + 20;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.left = `${Math.random() * 100}%`;
    orb.style.top = `${Math.random() * 100}%`;
    orb.style.animationDelay = `${Math.random() * 6}s`;
    orb.style.animationDuration = `${Math.random() * 8 + 8}s`;
    root.appendChild(orb);
  }
}

function whisper(textList) {
  const target = document.querySelector('.whisper');
  if (!target || !textList?.length) return;
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % textList.length;
    target.textContent = textList[idx];
  }, 1300);
}

function roulette(options) {
  if (!options?.length) return options;
  const order = [...options].sort(() => Math.random() - 0.5);
  return order;
}

function slotDance(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const chars = el.dataset.roll?.split('') ?? [];
  let i = 0;
  setInterval(() => {
    el.textContent = chars[Math.floor(Math.random() * chars.length)] ?? '0';
    i++;
    if (i % 13 === 0) {
      el.classList.toggle('flash');
    }
  }, 90);
}

function flashHints(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const hints = ['0 1 9', 'zero one nine', 'code=019', 'expiry whispers'];
  let i = 0;
  setInterval(() => {
    el.textContent = hints[i % hints.length];
    i++;
  }, 2400);
}

function randomFlash() {
  if (Math.random() < 0.15) {
    const flashes = ['flash-1.html', 'flash-2.html', 'flash-3.html', 'flash-4.html', 'flash-5.html'];
    window.location.href = flashes[Math.floor(Math.random() * flashes.length)];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  spawnOrbs(18);
  setTimeout(randomFlash, Math.random() * 5000 + 3000);
});

