const albums = [
  {
    title: "Album 1",
    artist: "Artist Name",
    ageRating: "PG",
    description: "This is a description of Album 1. You can write a paragraph or two here about the album, its style, or any background info.",
    cover: "https://placehold.co/400x400?text=Album+1",
    songs: [
      { title: "Song 1", artist: "Artist 1", description: "A great intro track.", file: "music/song1.mp3" },
      { title: "Song 2", artist: "Artist 1", description: "The follow-up hit.", file: "music/song2.mp3" }
    ]
  },
  {
    title: "Album 2",
    cover: "https://placehold.co/300x300?text=Album+2",
    songs: [
      // Add more songs here
    ]
  }
];

let currentAlbum = null;
let currentSong = 0;

const albumList = document.getElementById('album-list');
const albumView = document.getElementById('album-view');
const backBtn = document.getElementById('back');
const albumCover = document.getElementById('album-cover');
const albumTitle = document.getElementById('album-title');
const songList = document.getElementById('song-list');
const audio = document.getElementById('audio');
const nowPlaying = document.getElementById('now-playing');

function showAlbums() {
  albumList.innerHTML = '';
  albums.forEach((album, idx) => {
    const div = document.createElement('div');
    div.className = 'album-card';
    div.innerHTML = `
      <div class="album-card-img">
        <img src="${album.cover}" alt="${album.title}" />
      </div>
      <div class="album-card-info">
        <div class="album-name">${album.title}</div>
        <div class="album-artist"><strong>Artist:</strong> ${album.artist || 'Unknown'}</div>
        <div class="album-age"><strong>Age Rating:</strong> ${album.ageRating || 'N/A'}</div>
        <div class="album-desc">${album.description || ''}</div>
      </div>
    `;
    div.onclick = () => showAlbum(idx);
    albumList.appendChild(div);
  });
  albumList.style.display = 'flex';
  albumView.style.display = 'none';
  document.querySelector('header').style.display = '';
}

function isMobile() {
  return window.innerWidth <= 700;
}

function showAlbum(idx) {
  currentAlbum = idx;
  albumList.style.display = 'none';
  albumView.style.display = 'block';
  document.querySelector('header').style.display = 'none';

  const album = albums[idx];
  albumCover.src = album.cover;
  albumCover.style.width = "260px";
  albumCover.style.height = "260px";
  albumTitle.textContent = album.title;

  document.getElementById('album-play').onclick = () => playSong(0);

  songList.innerHTML = '';
  album.songs.forEach((song, sidx) => {
    const tr = document.createElement('tr');
    if (isMobile()) {
      // Always render 6 <td>s to match the table headers
      tr.innerHTML = `
        <td></td>
        <td style="text-align:center;">${song.title}</td>
        <td></td>
        <td></td>
        <td id="duration-${sidx}" style="text-align:center;">
          <span class="mobile-duration">--:--</span>
        </td>
        <td style="text-align:center;">
          <button class="song-play-btn" title="Play" onclick="playSongFromTable(${sidx})">▶</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${sidx + 1}</td>
        <td>${song.title}</td>
        <td>${song.artist || ""}</td>
        <td>${song.description || ""}</td>
        <td id="duration-${sidx}">--:--</td>
        <td class="play-cell">
          <button class="song-play-btn" title="Play" onclick="playSongFromTable(${sidx})">▶</button>
        </td>
      `;
    }
    songList.appendChild(tr);

    // Dynamically load duration
    const tempAudio = new Audio(song.file);
    tempAudio.addEventListener('loadedmetadata', function() {
      const mins = Math.floor(tempAudio.duration / 60);
      const secs = Math.floor(tempAudio.duration % 60).toString().padStart(2, '0');
      if (isMobile()) {
        tr.querySelector('.mobile-duration').textContent = `${mins}:${secs}`;
      } else {
        document.getElementById(`duration-${sidx}`).textContent = `${mins}:${secs}`;
      }
    });
  });
}

// Helper for play button in table (needed for inline onclick)
window.playSongFromTable = function(sidx) {
  playSong(sidx);
};
 
function playSong(sidx) {
  currentSong = sidx;
  const song = albums[currentAlbum].songs[sidx];
  audio.src = song.file;
  audio.play();
  nowPlaying.textContent = `Now Playing: ${song.title}`;
}

backBtn.onclick = showAlbums;

// --- Animated, audio-reactive background ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Web Audio API setup
let audioCtx, analyser, source, dataArray;

function setupAudioAnalyser() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
}

// Animate background based on audio
function animateBg() {
  requestAnimationFrame(animateBg);

  let avg = 0;
  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  }

  // Animate color and gradients based on time and beat
  const t = Date.now() / 1000;
  const beat = 0.5 + Math.min(1.5, avg / 80); // More aggressive
  const hueBase = ((t * 20) + avg * 2) % 360;
  const hueAccent = (hueBase + 60) % 360;
  const yellow = "#FFCB00";
  const dark = "#111417";
  const grey = "#23282b";

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Deep radial gradient (center glow)
  const radial = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.1 * beat,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  radial.addColorStop(0, `hsla(${hueBase}, 100%, ${18 + beat * 10}%, 0.85)`);
  radial.addColorStop(0.4, `hsla(${hueAccent}, 80%, 10%, 0.7)`);
  radial.addColorStop(1, `${dark}`);

  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Animated angled linear gradient (adds "3D" sweep)
  const grad = ctx.createLinearGradient(
    0, canvas.height * (0.2 + 0.1 * Math.sin(t * 0.7)),
    canvas.width, canvas.height * (0.8 + 0.1 * Math.cos(t * 0.9))
  );
  grad.addColorStop(0, `hsla(${hueAccent}, 100%, 12%, 0.7)`);
  grad.addColorStop(0.5, `hsla(${hueBase}, 100%, ${12 + beat * 10}%, 0.3)`);
  grad.addColorStop(1, `${grey}CC`);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // 3. Moving "spotlight" (adds highlight and depth)
  const spotX = canvas.width / 2 + Math.sin(t * 0.8) * canvas.width * 0.18;
  const spotY = canvas.height / 2 + Math.cos(t * 0.6) * canvas.height * 0.18;
  const spot = ctx.createRadialGradient(
    spotX, spotY, 0,
    spotX, spotY, canvas.width * (0.18 + 0.08 * Math.sin(t * 1.3 + avg / 50))
  );
  spot.addColorStop(0, `rgba(255,203,0,${0.18 + 0.18 * beat})`);
  spot.addColorStop(1, "rgba(255,203,0,0)");
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // 4. Strong vignette for 3D depth
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2.1,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.05
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
animateBg();

// Start analyser when audio is played
audio.addEventListener('play', () => {
  setupAudioAnalyser();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});

// Initialize the album list on page load
showAlbums();