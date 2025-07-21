const albums = [
  {
    title: "Cycle of Design",
    artist: "Akbar Q",
    ageRating: "All Ages",
    description: "An electronic journey through the engineering design process, where each track represents a different phase of bringing ideas to life through technology.",
    cover: "music/Cycle of Design/01.png",
    songs: [
      { title: "Power On", artist: "Akbar Q", description: "The beginning of every great design", file: "music/Cycle of Design/1. Power On.mp3", duration: null },
      { title: "Ground Loop", artist: "Akbar Q", description: "Finding stability in the chaos", file: "music/Cycle of Design/2. Ground Loop.mp3", duration: null },
      { title: "Clock Domain", artist: "Akbar Q", description: "Synchronizing the rhythm of innovation", file: "music/Cycle of Design/3. Clock Domain.mp3", duration: null },
      { title: "Printed Circuit Heart", artist: "Akbar Q", description: "The soul of electronic creation", file: "music/Cycle of Design/4. Printed Circuit Heart.mp3", duration: null },
      { title: "Logic High", artist: "Akbar Q", description: "When everything clicks into place", file: "music/Cycle of Design/5. Logic High.mp3", duration: null },
      { title: "Thermal Runaway", artist: "Akbar Q", description: "When things get too hot to handle", file: "music/Cycle of Design/6. Thermal Runaway.mp3", duration: null },
      { title: "Debug Mode", artist: "Akbar Q", description: "Finding and fixing the final pieces", file: "music/Cycle of Design/7. Debug Mode.mp3", duration: null }
    ]
  },
  {
    title: "Signal's Path",
    artist: "Akbar Q",
    ageRating: "All Ages", 
    description: "A forthcoming album exploring the journey of electrical signals through complex systems. Coming soon.",
    cover: "images/image2.png",
    songs: []
  }
];

let currentAlbum = null;
let currentSong = 0;
let isPlaying = false;
let isDragging = false;

const albumList = document.getElementById('album-list');
const albumView = document.getElementById('album-view');
const backBtn = document.getElementById('back');
const albumCover = document.getElementById('album-cover');
const albumTitle = document.getElementById('album-title');
const songList = document.getElementById('song-list');
const audio = document.getElementById('audio');
const nowPlaying = document.getElementById('now-playing');

// New player controls
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressFill = document.getElementById('progress-fill');
const progressHandle = document.getElementById('progress-handle');
const progressBar = document.querySelector('.progress-bar');
const currentTimeSpan = document.getElementById('current-time');
const totalTimeSpan = document.getElementById('total-time');

function showAlbums() {
  albumList.innerHTML = '';
  albums.forEach((album, idx) => {
    const div = document.createElement('div');
    div.className = 'album-card';
    
    // Add a badge for albums with no songs
    const comingSoonBadge = album.songs.length === 0 ? 
      '<div class="coming-soon-badge">Coming Soon</div>' : '';
    
    div.innerHTML = `
      ${comingSoonBadge}
      <div class="album-card-img">
        <img src="${album.cover}" alt="${album.title}" />
      </div>
      <div class="album-card-info">
        <div class="album-name">${album.title}</div>
        <div class="album-artist"><strong>Artist:</strong> ${album.artist || 'Unknown'}</div>
        <div class="album-age"><strong>Rating:</strong> ${album.ageRating || 'N/A'}</div>
        <div class="album-desc">${album.description || ''}</div>
        ${album.songs.length > 0 ? 
          `<div class="track-count">${album.songs.length} track${album.songs.length !== 1 ? 's' : ''}</div>` : 
          '<div class="track-count">No tracks available yet</div>'}
      </div>
    `;
    
    // Only make clickable if album has songs
    if (album.songs.length > 0) {
      div.onclick = () => showAlbum(idx);
    } else {
      div.style.cursor = 'default';
      div.style.opacity = '0.7';
    }
    
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
  
  // Adjust album cover size for mobile
  if (isMobile()) {
    albumCover.style.width = "220px";
    albumCover.style.height = "220px";
    
    // Update table headers for mobile
    const tableHead = document.getElementById('song-table-head');
    tableHead.innerHTML = `
      <tr>
        <th style="width: 15%;">#</th>
        <th style="width: 50%;">Track</th>
        <th style="width: 20%;">Time</th>
        <th style="width: 15%;"></th>
      </tr>
    `;
  } else {
    albumCover.style.width = "340px";
    albumCover.style.height = "340px";
    
    // Reset table headers for desktop
    const tableHead = document.getElementById('song-table-head');
    tableHead.innerHTML = `
      <tr>
        <th>#</th>
        <th>Title</th>
        <th class="desktop-only">Artist</th>
        <th class="desktop-only">Description</th>
        <th>Duration</th>
        <th></th>
      </tr>
    `;
  }
  
  albumTitle.textContent = album.title;

  // Update album play button to play first song
  document.getElementById('album-play').onclick = () => playSong(0);

  songList.innerHTML = '';
  album.songs.forEach((song, sidx) => {
    const tr = document.createElement('tr');
    if (isMobile()) {
      // Mobile: #, Title+Artist, Duration, Play (4 columns, optimized spacing)
      tr.innerHTML = `
        <td style="text-align:center; width: 15%;">${sidx + 1}</td>
        <td style="text-align:left; width: 50%; padding-left: 8px;">
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 0.9rem; line-height: 1.2;">${song.title}</div>
          <div style="font-size: 0.75rem; color: rgba(255, 203, 0, 0.7); line-height: 1;">${song.artist || 'Akbar Q'}</div>
        </td>
        <td id="duration-${sidx}" style="text-align:center; width: 20%; font-size: 0.85rem;">
          <span class="mobile-duration">--:--</span>
        </td>
        <td style="text-align:center; width: 15%;">
          <button class="song-play-btn mobile-play-btn" title="Play" onclick="playSongFromTable(${sidx})">▶</button>
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
        const durationSpan = tr.querySelector('.mobile-duration');
        if (durationSpan) durationSpan.textContent = `${mins}:${secs}`;
      } else {
        const durationElement = document.getElementById(`duration-${sidx}`);
        if (durationElement) durationElement.textContent = `${mins}:${secs}`;
      }
    });
  });
}

// Helper for play button in table (needed for inline onclick)
window.playSongFromTable = function(sidx) {
  playSong(sidx);
};

// Enhanced music player functions
function playSong(sidx) {
  if (currentAlbum === null) return;
  
  currentSong = sidx;
  const song = albums[currentAlbum].songs[sidx];
  
  audio.src = song.file;
  audio.play().then(() => {
    isPlaying = true;
    updatePlayPauseButton();
    updateNowPlaying();
    updateNavigationButtons();
    highlightCurrentSong();
  }).catch(error => {
    console.error('Error playing audio:', error);
  });
}

function togglePlayPause() {
  if (currentAlbum === null || albums[currentAlbum].songs.length === 0) return;
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    if (audio.src) {
      audio.play().then(() => {
        isPlaying = true;
      });
    } else {
      playSong(currentSong);
    }
  }
  updatePlayPauseButton();
}

function playNext() {
  if (currentAlbum === null) return;
  
  const albumSongs = albums[currentAlbum].songs;
  if (currentSong < albumSongs.length - 1) {
    playSong(currentSong + 1);
  }
}

function playPrevious() {
  if (currentAlbum === null) return;
  
  if (currentSong > 0) {
    playSong(currentSong - 1);
  }
}

function updatePlayPauseButton() {
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
}

function updateNowPlaying() {
  if (currentAlbum !== null && albums[currentAlbum].songs[currentSong]) {
    const song = albums[currentAlbum].songs[currentSong];
    nowPlaying.textContent = `${song.title} - ${song.artist || 'Akbar Q'}`;
  }
}

function updateNavigationButtons() {
  if (currentAlbum === null) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  
  const albumSongs = albums[currentAlbum].songs;
  prevBtn.disabled = currentSong === 0;
  nextBtn.disabled = currentSong >= albumSongs.length - 1;
}

function highlightCurrentSong() {
  // Remove previous highlights
  document.querySelectorAll('.song-table tr').forEach(row => {
    row.classList.remove('playing');
  });
  
  // Add highlight to current song
  const rows = document.querySelectorAll('.song-table tbody tr');
  if (rows[currentSong]) {
    rows[currentSong].classList.add('playing');
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
  if (isDragging) return;
  
  const progress = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${progress}%`;
  progressHandle.style.left = `${progress}%`;
  currentTimeSpan.textContent = formatTime(audio.currentTime);
}

function setProgress(e) {
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = (clickX / rect.width) * 100;
  const newTime = (percentage / 100) * audio.duration;
  
  audio.currentTime = newTime;
  progressFill.style.width = `${percentage}%`;
  progressHandle.style.left = `${percentage}%`;
}

// Event listeners for the new player
playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrevious);

// Progress bar interactions
progressBar.addEventListener('click', setProgress);

// Audio event listeners
audio.addEventListener('loadedmetadata', () => {
  totalTimeSpan.textContent = formatTime(audio.duration);
  updateProgress();
});

audio.addEventListener('timeupdate', updateProgress);

audio.addEventListener('ended', () => {
  isPlaying = false;
  updatePlayPauseButton();
  
  // Auto-play next song
  if (currentAlbum !== null && currentSong < albums[currentAlbum].songs.length - 1) {
    setTimeout(() => playNext(), 500); // Small delay for better UX
  }
});

audio.addEventListener('play', () => {
  isPlaying = true;
  updatePlayPauseButton();
  setupAudioAnalyser();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  updatePlayPauseButton();
});

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

// Enhanced but subtle background animation
function animateBg() {
  requestAnimationFrame(animateBg);

  let avg = 0;
  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  }

  const t = Date.now() / 1000;
  const beat = 0.3 + Math.min(1.2, avg / 80); // Reduced intensity
  const hueBase = ((t * 15) + avg * 1.5) % 360;
  const hueAccent = (hueBase + 120) % 360;
  const hueComplement = (hueBase + 240) % 360;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Subtle shifting background gradients
  const deepGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.9
  );
  deepGrad.addColorStop(0, `hsla(${hueBase}, 60%, ${6 + beat * 4}%, 0.8)`);
  deepGrad.addColorStop(0.5, `hsla(${hueAccent}, 50%, 4%, 0.7)`);
  deepGrad.addColorStop(1, '#000205');
  ctx.fillStyle = deepGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Subtle moving gradient overlay (no visible circle)
  const moveX = Math.sin(t * 0.3) * canvas.width * 0.15;
  const moveY = Math.cos(t * 0.2) * canvas.height * 0.15;
  
  const overlayGrad = ctx.createLinearGradient(
    canvas.width * 0.3 + moveX, 
    canvas.height * 0.3 + moveY,
    canvas.width * 0.7 - moveX, 
    canvas.height * 0.7 - moveY
  );
  overlayGrad.addColorStop(0, `hsla(${hueBase}, 70%, 20%, ${0.1 + beat * 0.05})`);
  overlayGrad.addColorStop(0.5, `hsla(${hueAccent}, 60%, 15%, ${0.08 + beat * 0.04})`);
  overlayGrad.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 3. Enhanced vignette
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.2,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.7, `rgba(0,0,0,${0.4 - beat * 0.05})`);
  vignette.addColorStop(1, 'rgba(0,0,0,0.9)');
  
  ctx.save();
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
animateBg();

// Initialize the album list on page load
showAlbums();

// Handle window resize for responsive updates
window.addEventListener('resize', function() {
  // If we're viewing an album, refresh the layout
  if (albumView.style.display !== 'none' && currentAlbum !== null) {
    showAlbum(currentAlbum);
  }
});