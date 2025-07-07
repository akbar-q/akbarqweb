const albums = [
  {
    title: "Album 1",
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
  albumList.innerHTML = ''; // <-- This line ensures the album cards are cleared before rendering
  albums.forEach((album, idx) => {
    const div = document.createElement('div');
    div.className = 'album-card';
    div.innerHTML = `
      <img src="${album.cover}" alt="${album.title}" />
      <div class="album-name">${album.title}</div>
    `;
    div.onclick = () => showAlbum(idx);
    albumList.appendChild(div);
  });
  albumList.style.display = 'flex';
  albumView.style.display = 'none';
  document.querySelector('header').style.display = ''; // Show header
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

  // Colors from your branding
  const dark = "#111417"; // nearly black
  const grey = "#23282b"; // deep grey
  const yellow = "#FFCB00"; // bright yellow

  // Fill background with deep black/grey gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, dark);
  grad.addColorStop(0.5, grey);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Light bar parameters
  const barCount = 5;
  const barLength = canvas.width * 0.38;
  const barThickness = 16 + avg / 12;
  const barSpacing = canvas.height / (barCount + 1);
  const pulse = 0.4 + Math.min(0.6, avg / 128);

  // Draw left and right light bars
  for (let i = 0; i < barCount; i++) {
    // Y position for each bar
    const y = barSpacing * (i + 1);

    // Animate color: pulse yellow on beat, otherwise white
    const glowColor = `rgba(255,203,0,${0.7 * pulse})`;

    // Left bar
    ctx.save();
    ctx.shadowColor = yellow;
    ctx.shadowBlur = 40 + avg / 2;
    ctx.fillStyle = glowColor;
    ctx.fillRect(40, y - barThickness / 2, barLength, barThickness);
    ctx.restore();

    // Right bar
    ctx.save();
    ctx.shadowColor = yellow;
    ctx.shadowBlur = 40 + avg / 2;
    ctx.fillStyle = glowColor;
    ctx.fillRect(canvas.width - 40 - barLength, y - barThickness / 2, barLength, barThickness);
    ctx.restore();
  }

  // Add a strong vignette for depth
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2.2,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.1
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
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