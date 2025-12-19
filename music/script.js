// Music data will be loaded from JSON file
let albums = [];

// Hardcoded encryption key for The Black Book album
const BLACK_BOOK_KEY = "darkbook2025";

// Decryption function for obfuscated titles
function decryptTitle(encryptedTitle, key = BLACK_BOOK_KEY) {
  try {
    // Base64 decode
    const decoded = atob(encryptedTitle);
    
    // Simple XOR cipher with key
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    return result;
  } catch (e) {
    return 'Unknown Track';
  }
}

// Get the display title for a song
function getDisplayTitle(song, album, forceReal = false) {
  // For albums with obfuscated titles
  if (album.obfuscateTitles) {
    if (forceReal && song.encryptedTitle) {
      // Show real title when playing (decrypt it)
      const decrypted = decryptTitle(song.encryptedTitle);
      console.log('Decrypting title:', song.encryptedTitle, '→', decrypted);
      return decrypted;
    } else if (song.obfuscatedTitle) {
      // Show obfuscated title in lists
      return song.obfuscatedTitle;
    } else {
      // Fallback for obfuscated albums
      return "Redacted";
    }
  }
  
  // For normal albums, use the regular title
  return song.title || 'Unknown Track';
}

// Load music data from JSON file
async function loadMusicData() {
  try {
    const response = await fetch('music-data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    albums = data.albums;
    console.log('Music data loaded successfully:', albums.length, 'albums');
    
    // Initialize the album list after data is loaded
    showAlbums();
  } catch (error) {
    console.error('Error loading music data:', error);
    // Fallback: show error message to user
    document.querySelector('.container').innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2 style="color: #FFB800;">Error Loading Music Data</h2>
        <p style="color: rgba(255, 255, 255, 0.8);">
          Unable to load music library. Please check that music-data.json is available.
        </p>
        <p style="color: rgba(255, 203, 0, 0.6); font-size: 0.9rem;">
          Error: ${error.message}
        </p>
      </div>
    `;
  }
}

let currentAlbum = null;
let currentSong = 0;
let isPlaying = false;
let isDragging = false;
let isShuffled = false;
let shuffledOrder = [];
let loopMode = 0; // 0: no loop, 1: loop album, 2: loop single track
let currentLyrics = null;
let lyricsVisible = false;

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
const shuffleBtn = document.getElementById('shuffle-btn');
const loopBtn = document.getElementById('loop-btn');
const lyricsBtn = document.getElementById('lyrics-btn');
const progressFill = document.getElementById('progress-fill');
const progressHandle = document.getElementById('progress-handle');
const progressBar = document.querySelector('.progress-bar');
const currentTimeSpan = document.getElementById('current-time');
const totalTimeSpan = document.getElementById('total-time');

// Lyrics elements
const lyricsPanel = document.getElementById('lyrics-panel');
const lyricsTitle = document.getElementById('lyrics-title');
const lyricsContent = document.getElementById('lyrics-content');
const closeLyricsBtn = document.getElementById('close-lyrics');

function showAlbums() {
  // Hide loading indicator
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
  
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

  // Initialize shuffle and loop buttons
  updateShuffleButton();
  updateLoopButton();
  
  // Ensure lyrics button has correct initial styling
  lyricsBtn.style.color = '#FFB800';
  lyricsBtn.style.backgroundColor = 'transparent';
  lyricsBtn.style.border = '1px solid rgba(255, 184, 0, 0.3)';
  lyricsBtn.style.opacity = '0.7';

  songList.innerHTML = '';
  album.songs.forEach((song, sidx) => {
    const tr = document.createElement('tr');
    
    // Use the getDisplayTitle function to get the appropriate title
    const displayTitle = getDisplayTitle(song, album, false);
    
    if (isMobile()) {
      // Mobile: #, Title+Artist, Duration, Play (4 columns, optimized spacing)
      tr.innerHTML = `
        <td style="text-align:center; width: 15%;">${sidx + 1}</td>
        <td style="text-align:left; width: 50%; padding-left: 8px;">
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 0.9rem; line-height: 1.2;">${displayTitle}</div>
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
        <td><strong>${displayTitle}</strong></td>
        <td>${song.artist || "Akbar Q"}</td>
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
    loadSongLyrics(song); // Load lyrics for the new song
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
  let nextIndex;
  
  if (isShuffled) {
    const currentShuffleIndex = shuffledOrder.indexOf(currentSong);
    if (currentShuffleIndex < shuffledOrder.length - 1) {
      nextIndex = shuffledOrder[currentShuffleIndex + 1];
    } else if (loopMode === 1) { // Loop album
      nextIndex = shuffledOrder[0];
    } else {
      return; // End of shuffled playlist
    }
  } else {
    if (currentSong < albumSongs.length - 1) {
      nextIndex = currentSong + 1;
    } else if (loopMode === 1) { // Loop album
      nextIndex = 0;
    } else {
      return; // End of album
    }
  }
  
  playSong(nextIndex);
}

function playPrevious() {
  if (currentAlbum === null) return;
  
  let prevIndex;
  
  if (isShuffled) {
    const currentShuffleIndex = shuffledOrder.indexOf(currentSong);
    if (currentShuffleIndex > 0) {
      prevIndex = shuffledOrder[currentShuffleIndex - 1];
    } else if (loopMode === 1) { // Loop album
      prevIndex = shuffledOrder[shuffledOrder.length - 1];
    } else {
      return; // Beginning of shuffled playlist
    }
  } else {
    if (currentSong > 0) {
      prevIndex = currentSong - 1;
    } else if (loopMode === 1) { // Loop album
      prevIndex = albums[currentAlbum].songs.length - 1;
    } else {
      return; // Beginning of album
    }
  }
  
  playSong(prevIndex);
}

function toggleShuffle() {
  if (currentAlbum === null) return;
  
  isShuffled = !isShuffled;
  
  if (isShuffled) {
    // Create shuffled order
    const albumLength = albums[currentAlbum].songs.length;
    shuffledOrder = Array.from({length: albumLength}, (_, i) => i);
    
    // Remove current song from array, shuffle the rest, then put current song at beginning
    shuffledOrder.splice(shuffledOrder.indexOf(currentSong), 1);
    for (let i = shuffledOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
    }
    shuffledOrder.unshift(currentSong);
  }
  
  updateShuffleButton();
}

function toggleLoop() {
  loopMode = (loopMode + 1) % 3; // Cycle through 0, 1, 2
  updateLoopButton();
}

function updateShuffleButton() {
  shuffleBtn.textContent = '⤮'; // This symbol should work consistently
  if (isShuffled) {
    shuffleBtn.style.setProperty('opacity', '1', 'important');
    shuffleBtn.style.setProperty('color', '#000000', 'important'); // Black text when active
    shuffleBtn.style.setProperty('background-color', '#FFB800', 'important'); // Solid yellow background when active
    shuffleBtn.style.setProperty('border', '1px solid #FFB800', 'important');
  } else {
    shuffleBtn.style.setProperty('opacity', '0.7', 'important');
    shuffleBtn.style.setProperty('color', '#FFB800', 'important'); // Yellow text when inactive
    shuffleBtn.style.setProperty('background-color', 'transparent', 'important'); // No fill when inactive
    shuffleBtn.style.setProperty('border', '1px solid rgba(255, 184, 0, 0.3)', 'important');
  }
  shuffleBtn.title = isShuffled ? 'Shuffle: On' : 'Shuffle: Off';
}

function updateLoopButton() {
  const loopIcons = ['⟲', '⟲', '1']; // Using different loop symbol that's more universally supported
  const loopTitles = ['Loop: Off', 'Loop: Album', 'Loop: Single Track'];
  
  loopBtn.textContent = loopIcons[loopMode];
  
  if (loopMode === 0) {
    loopBtn.style.setProperty('opacity', '0.7', 'important');
    loopBtn.style.setProperty('color', '#FFB800', 'important'); // Yellow text when inactive
    loopBtn.style.setProperty('background-color', 'transparent', 'important'); // No fill when inactive
    loopBtn.style.setProperty('border', '1px solid rgba(255, 184, 0, 0.3)', 'important');
  } else {
    loopBtn.style.setProperty('opacity', '1', 'important');
    loopBtn.style.setProperty('color', '#000000', 'important'); // Black text when active
    loopBtn.style.setProperty('background-color', '#FFB800', 'important'); // Solid yellow background when active
    loopBtn.style.setProperty('border', '1px solid #FFB800', 'important');
  }
  loopBtn.title = loopTitles[loopMode];
}

function updatePlayPauseButton() {
  // Use better spaced pause symbol that won't be converted to emoji on mobile
  playPauseBtn.textContent = isPlaying ? '❙❙' : '▶'; // Using better spaced pause bars
}

function updateNowPlaying() {
  if (currentAlbum !== null && albums[currentAlbum].songs[currentSong]) {
    const song = albums[currentAlbum].songs[currentSong];
    const album = albums[currentAlbum];
    console.log('updateNowPlaying called for:', song, 'Album obfuscates:', album.obfuscateTitles);
    // Show the real title when playing (forceReal = true)
    const realTitle = getDisplayTitle(song, album, true);
    console.log('Real title set to:', realTitle);
    nowPlaying.textContent = `${realTitle} - ${song.artist || 'Akbar Q'}`;
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
  
  // Update lyrics if visible
  if (lyricsVisible && currentLyrics) {
    updateLyricsHighlight(audio.currentTime);
  }
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

// ==================== LYRICS FUNCTIONALITY ====================

async function loadLyrics(lyricsFile) {
  if (!lyricsFile) return null;
  
  try {
    const response = await fetch(lyricsFile);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const lrcText = await response.text();
    return parseLRC(lrcText);
  } catch (error) {
    console.error('Error loading lyrics:', error);
    return null;
  }
}

function parseLRC(lrcText) {
  const lines = lrcText.split('\n');
  const lyrics = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/;
  
  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3]);
      const time = minutes * 60 + seconds + centiseconds / 100;
      const text = match[4].trim();
      
      if (text) { // Only add non-empty lines
        lyrics.push({ time, text });
      }
    }
  });
  
  return lyrics.sort((a, b) => a.time - b.time);
}

function displayLyrics() {
  if (!currentLyrics || currentLyrics.length === 0) {
    lyricsContent.innerHTML = '<div class="lyrics-error">No lyrics available for this track</div>';
    return;
  }
  
  lyricsContent.innerHTML = currentLyrics
    .map((lyric, index) => 
      `<div class="lyrics-line" data-time="${lyric.time}" data-index="${index}">${lyric.text}</div>`
    )
    .join('');
}

function updateLyricsHighlight(currentTime) {
  const lines = lyricsContent.querySelectorAll('.lyrics-line');
  let currentIndex = -1;
  
  // Find the current line
  for (let i = 0; i < currentLyrics.length; i++) {
    if (currentLyrics[i].time <= currentTime) {
      currentIndex = i;
    } else {
      break;
    }
  }
  
  // Update line classes
  lines.forEach((line, index) => {
    line.classList.remove('current', 'past');
    if (index === currentIndex) {
      line.classList.add('current');
      
      // Only auto-scroll if:
      // 1. Lyrics panel is visible
      // 2. User hasn't manually scrolled recently
      // 3. The current line is not already visible in the viewport
      if (lyricsVisible && !line.closest('.lyrics-content').hasAttribute('data-user-scrolled')) {
        const container = line.closest('.lyrics-content');
        const containerRect = container.getBoundingClientRect();
        const lineRect = line.getBoundingClientRect();
        
        // Only scroll if the line is not visible in the container
        const isVisible = (
          lineRect.top >= containerRect.top &&
          lineRect.bottom <= containerRect.bottom
        );
        
        if (!isVisible) {
          line.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else if (index < currentIndex) {
      line.classList.add('past');
    }
  });
}

function toggleLyrics() {
  lyricsVisible = !lyricsVisible;
  
  if (lyricsVisible) {
    lyricsPanel.style.display = 'block';
    lyricsBtn.style.setProperty('opacity', '1', 'important');
    lyricsBtn.style.setProperty('color', '#000000', 'important'); // Black text when active
    lyricsBtn.style.setProperty('background-color', '#FFB800', 'important'); // Solid yellow background when active
    lyricsBtn.style.setProperty('border', '1px solid #FFB800', 'important');
    displayLyrics();
    
    // Add scroll detection to prevent auto-scroll interference (only if not already added)
    if (!lyricsContent.hasAttribute('data-scroll-listener')) {
      let scrollTimeout;
      lyricsContent.addEventListener('scroll', function() {
        this.setAttribute('data-user-scrolled', 'true');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.removeAttribute('data-user-scrolled');
        }, 5000); // Increased to 5 seconds to give user more control
      });
      lyricsContent.setAttribute('data-scroll-listener', 'true');
    }
  } else {
    lyricsPanel.style.display = 'none';
    lyricsBtn.style.setProperty('opacity', '0.7', 'important');
    lyricsBtn.style.setProperty('color', '#FFB800', 'important'); // Yellow text when inactive
    lyricsBtn.style.setProperty('background-color', 'transparent', 'important'); // No fill when inactive
    lyricsBtn.style.setProperty('border', '1px solid rgba(255, 184, 0, 0.3)', 'important');
  }
}

function closeLyrics() {
  lyricsVisible = false;
  lyricsPanel.style.display = 'none';
  lyricsBtn.style.setProperty('opacity', '0.7', 'important');
  lyricsBtn.style.setProperty('color', '#FFB800', 'important'); // Yellow text when inactive
  lyricsBtn.style.setProperty('background-color', 'transparent', 'important'); // No fill when inactive
  lyricsBtn.style.setProperty('border', '1px solid rgba(255, 184, 0, 0.3)', 'important');
}

async function loadSongLyrics(song) {
  currentLyrics = null;
  
  if (song.lyrics) {
    lyricsContent.innerHTML = '<div class="lyrics-loading">Loading lyrics...</div>';
    currentLyrics = await loadLyrics(song.lyrics);
    
    // Show lyrics button if lyrics are available
    if (currentLyrics && currentLyrics.length > 0) {
      lyricsBtn.style.display = 'inline-block';
      
      // Show lyrics by default when available
      if (!lyricsVisible) {
        lyricsVisible = true;
        lyricsPanel.style.display = 'block';
        lyricsBtn.style.setProperty('opacity', '1', 'important');
        lyricsBtn.style.setProperty('color', '#000000', 'important');
        lyricsBtn.style.setProperty('background-color', '#FFB800', 'important');
        lyricsBtn.style.setProperty('border', '1px solid #FFB800', 'important');
        
        // Add scroll detection for auto-opened lyrics
        if (!lyricsContent.hasAttribute('data-scroll-listener')) {
          let scrollTimeout;
          lyricsContent.addEventListener('scroll', function() {
            this.setAttribute('data-user-scrolled', 'true');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              this.removeAttribute('data-user-scrolled');
            }, 5000); // Increased to 5 seconds
          });
          lyricsContent.setAttribute('data-scroll-listener', 'true');
        }
      }
      
      displayLyrics();
    } else {
      lyricsBtn.style.display = 'none';
      if (lyricsVisible) {
        lyricsContent.innerHTML = '<div class="lyrics-error">Failed to load lyrics</div>';
      }
    }
  } else {
    lyricsBtn.style.display = 'none';
    // Hide lyrics panel if no lyrics available
    if (lyricsVisible) {
      lyricsVisible = false;
      lyricsPanel.style.display = 'none';
    }
  }
}

// Event listeners for the new player
playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrevious);
shuffleBtn.addEventListener('click', toggleShuffle);
loopBtn.addEventListener('click', toggleLoop);
lyricsBtn.addEventListener('click', toggleLyrics);
closeLyricsBtn.addEventListener('click', closeLyrics);

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
  
  // Handle different loop modes
  if (loopMode === 2) { // Loop single track
    setTimeout(() => playSong(currentSong), 500);
  } else if (loopMode === 1 || (currentAlbum !== null && currentSong < albums[currentAlbum].songs.length - 1)) {
    // Loop album mode or auto-play next song
    setTimeout(() => playNext(), 500);
  }
  // If loopMode === 0 and it's the last song, just stop
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

// Enhanced background animation - more noticeable but not overwhelming
function animateBg() {
  requestAnimationFrame(animateBg);

  let avg = 0;
  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  }

  const t = Date.now() / 1000;
  const beat = 0.5 + Math.min(1.8, avg / 70); // Increased intensity
  const hueBase = ((t * 20) + avg * 2.5) % 360; // Faster color cycling
  const hueAccent = (hueBase + 120) % 360;
  const hueComplement = (hueBase + 240) % 360;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Dynamic background gradients
  const deepGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.9
  );
  deepGrad.addColorStop(0, `hsla(${hueBase}, 75%, ${8 + beat * 6}%, 0.9)`);
  deepGrad.addColorStop(0.4, `hsla(${hueAccent}, 65%, 6%, 0.8)`);
  deepGrad.addColorStop(0.8, `hsla(${hueComplement}, 55%, 4%, 0.75)`);
  deepGrad.addColorStop(1, '#000308');
  ctx.fillStyle = deepGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Central pulsing glow (more noticeable)
  const centralGlow = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * (0.25 + beat * 0.2)
  );
  centralGlow.addColorStop(0, `rgba(255, 203, 0, ${0.25 + beat * 0.3})`);
  centralGlow.addColorStop(0.4, `hsla(${hueBase}, 90%, 45%, ${0.2 + beat * 0.25})`);
  centralGlow.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = centralGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 3. Moving gradient layers (more visible)
  const moveX = Math.sin(t * 0.4) * canvas.width * 0.2;
  const moveY = Math.cos(t * 0.3) * canvas.height * 0.2;
  
  const overlayGrad = ctx.createLinearGradient(
    canvas.width * 0.2 + moveX, 
    canvas.height * 0.2 + moveY,
    canvas.width * 0.8 - moveX, 
    canvas.height * 0.8 - moveY
  );
  overlayGrad.addColorStop(0, `hsla(${hueBase}, 80%, 25%, ${0.15 + beat * 0.1})`);
  overlayGrad.addColorStop(0.5, `hsla(${hueAccent}, 70%, 20%, ${0.12 + beat * 0.08})`);
  overlayGrad.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 4. Audio-reactive sparkles (moderate intensity)
  if (beat > 0.8) {
    for (let i = 0; i < (beat - 0.5) * 12; i++) {
      const sparkleX = Math.random() * canvas.width;
      const sparkleY = Math.random() * canvas.height;
      const sparkleSize = Math.random() * 3 + 1;
      const sparkleAlpha = Math.random() * (beat - 0.5) * 0.6;
      
      ctx.save();
      ctx.globalAlpha = sparkleAlpha;
      ctx.fillStyle = `hsla(${hueBase + Math.random() * 60}, 95%, 75%, ${sparkleAlpha})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 5. Subtle moving spotlight (not too bright)
  const spotX = canvas.width / 2 + Math.sin(t * 0.6) * canvas.width * 0.2;
  const spotY = canvas.height / 2 + Math.cos(t * 0.4) * canvas.height * 0.2;
  const spot = ctx.createRadialGradient(
    spotX, spotY, 0,
    spotX, spotY, canvas.width * (0.12 + 0.08 * Math.sin(t * 1.2 + avg / 50))
  );
  spot.addColorStop(0, `rgba(255,203,0,${0.15 + 0.2 * beat})`);
  spot.addColorStop(0.7, `hsla(${hueAccent}, 85%, 50%, ${0.1 + 0.15 * beat})`);
  spot.addColorStop(1, "rgba(0,0,0,0)");
  
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 6. Enhanced vignette
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.2,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.7, `rgba(0,0,0,${0.35 - beat * 0.05})`);
  vignette.addColorStop(1, 'rgba(0,0,0,0.88)');
  
  ctx.save();
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
animateBg();

// Load music data and initialize the page
loadMusicData();

// Handle window resize for responsive updates
window.addEventListener('resize', function() {
  // If we're viewing an album, refresh the layout
  if (albumView.style.display !== 'none' && currentAlbum !== null) {
    showAlbum(currentAlbum);
  }
});
