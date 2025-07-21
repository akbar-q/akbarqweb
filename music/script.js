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

// Enhanced dramatic background animation that actually works
function animateBg() {
  requestAnimationFrame(animateBg);

  let avg = 0;
  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  }

  // More dramatic animation parameters
  const t = Date.now() / 1000;
  const beat = 0.5 + Math.min(2.5, avg / 60); // Increased intensity
  const hueBase = ((t * 25) + avg * 3) % 360; // Faster color cycling
  const hueAccent = (hueBase + 120) % 360;
  const hueComplement = (hueBase + 240) % 360;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Enhanced deep space background
  const deepGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.9
  );
  deepGrad.addColorStop(0, `hsla(${hueBase}, 80%, ${8 + beat * 8}%, 0.95)`);
  deepGrad.addColorStop(0.4, `hsla(${hueAccent}, 70%, 6%, 0.8)`);
  deepGrad.addColorStop(0.8, `hsla(${hueComplement}, 60%, 4%, 0.7)`);
  deepGrad.addColorStop(1, '#000205');
  ctx.fillStyle = deepGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Central pulsing glow
  const centralGlow = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * (0.2 + beat * 0.3)
  );
  centralGlow.addColorStop(0, `rgba(255, 203, 0, ${0.4 + beat * 0.5})`);
  centralGlow.addColorStop(0.3, `hsla(${hueBase}, 100%, 50%, ${0.3 + beat * 0.4})`);
  centralGlow.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = centralGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 3. Dynamic wave patterns
  for (let wave = 0; wave < 2; wave++) {
    const waveOffset = wave * Math.PI;
    const waveSpeed = 1 + wave * 0.5;
    const waveHeight = (30 + beat * 50) * (1 + wave * 0.5);
    
    ctx.save();
    ctx.globalAlpha = 0.6 - wave * 0.2;
    ctx.strokeStyle = `hsla(${(hueBase + wave * 60) % 360}, 85%, 65%, ${0.8 - wave * 0.2})`;
    ctx.lineWidth = 4 + wave * 2;
    ctx.shadowBlur = 20 + wave * 10;
    ctx.shadowColor = ctx.strokeStyle;
    
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const y = canvas.height / 2 + 
        Math.sin((x / 100) + (t * waveSpeed) + waveOffset) * waveHeight * Math.sin(t * 1.5 + waveOffset) +
        Math.sin((x / 50) + (t * waveSpeed * 1.2) + waveOffset) * (waveHeight * 0.4) * beat;
      
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 4. Moving spotlight effect
  const spotX = canvas.width / 2 + Math.sin(t * 0.7) * canvas.width * 0.25;
  const spotY = canvas.height / 2 + Math.cos(t * 0.5) * canvas.height * 0.25;
  const spot = ctx.createRadialGradient(
    spotX, spotY, 0,
    spotX, spotY, canvas.width * (0.15 + 0.1 * Math.sin(t * 1.5 + avg / 40))
  );
  spot.addColorStop(0, `rgba(255,203,0,${0.3 + 0.4 * beat})`);
  spot.addColorStop(0.6, `hsla(${hueAccent}, 90%, 60%, ${0.2 + 0.3 * beat})`);
  spot.addColorStop(1, "rgba(0,0,0,0)");
  
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 5. Audio-reactive sparkles (simplified)
  if (beat > 1.2) {
    for (let i = 0; i < beat * 15; i++) {
      const sparkleX = Math.random() * canvas.width;
      const sparkleY = Math.random() * canvas.height;
      const sparkleSize = Math.random() * 4 + 1;
      const sparkleAlpha = Math.random() * (beat - 1);
      
      ctx.save();
      ctx.globalAlpha = sparkleAlpha;
      ctx.fillStyle = `hsla(${hueBase + Math.random() * 80}, 100%, 80%, ${sparkleAlpha})`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 6. Enhanced vignette
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.2,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.7, `rgba(0,0,0,${0.4 - beat * 0.1})`);
  vignette.addColorStop(1, 'rgba(0,0,0,0.9)');
  
  ctx.save();
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

// Handle window resize for responsive updates
window.addEventListener('resize', function() {
  // If we're viewing an album, refresh the layout
  if (albumView.style.display !== 'none' && currentAlbum !== null) {
    showAlbum(currentAlbum);
  }
});