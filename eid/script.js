const body = document.body;
const altGreeting = document.getElementById("altGreeting");
const eidTitle = document.getElementById("eidTitle");
const cipherText = document.getElementById("cipherText");

const greetings = [
  "Eid Mubarak. The light still returns.",
  "Eid Saeed. Even hidden wounds can heal.",
  "BarakAllahu lakum fi Eid. Guard the heart, keep it soft.",
  "The darkest hour still carries a promise of dawn."
];

const cipherLines = [
  "... - .... . / -- --- --- -. / .. ... / -. --- - / .... .. -.. .. -. --.",
  "The moon is not hiding.",
  "It waits for your eyes to adjust.",
  "Deeper meaning: darkness is not always danger; sometimes it is reflection."
];

let greetingIndex = 0;
let cipherIndex = 0;

document.getElementById("toggleGlow").addEventListener("click", () => {
  body.classList.toggle("neon-off");
});

document.getElementById("flipGreeting").addEventListener("click", () => {
  greetingIndex = (greetingIndex + 1) % greetings.length;
  altGreeting.textContent = greetings[greetingIndex];
  if (Math.random() > 0.5) {
    eidTitle.classList.add("glitch");
    setTimeout(() => {
      eidTitle.classList.remove("glitch");
    }, 900);
  }
});

document.getElementById("sparkle").addEventListener("click", () => {
  for (let i = 0; i < 24; i += 1) {
    spawnFirefly();
  }
});

document.getElementById("decodeCipher").addEventListener("click", () => {
  cipherIndex = (cipherIndex + 1) % cipherLines.length;
  cipherText.textContent = cipherLines[cipherIndex];
});

function spawnFirefly() {
  const fly = document.createElement("span");
  fly.className = "firefly";
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  fly.style.left = `${x}px`;
  fly.style.top = `${y}px`;
  fly.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
  fly.style.setProperty("--dy", `${(Math.random() - 0.5) * 240}px`);
  document.body.appendChild(fly);
  setTimeout(() => fly.remove(), 1450);
}

const sky = document.getElementById("sky");
const ctx = sky.getContext("2d");
const stars = [];

function resizeCanvas() {
  sky.width = window.innerWidth;
  sky.height = window.innerHeight;
}

function buildStars() {
  stars.length = 0;
  const count = Math.max(80, Math.floor((window.innerWidth * window.innerHeight) / 9000));
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * sky.width,
      y: Math.random() * sky.height,
      r: Math.random() * 1.6 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.03 + 0.005
    });
  }
}

function drawSky() {
  ctx.clearRect(0, 0, sky.width, sky.height);

  for (const star of stars) {
    star.twinkle += star.speed;
    const alpha = 0.25 + (Math.sin(star.twinkle) + 1) * 0.35;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 248, 218, ${alpha.toFixed(3)})`;
    ctx.fill();
  }

  requestAnimationFrame(drawSky);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  buildStars();
});

resizeCanvas();
buildStars();
drawSky();

altGreeting.textContent = greetings[0];
cipherText.textContent = cipherLines[0];
