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
  playSong(sidx);
};nction playSong(sidx) {
  currentSong = sidx;
function playSong(sidx) {rentAlbum].songs[sidx];
  currentSong = sidx;le;
  const song = albums[currentAlbum].songs[sidx];
  audio.src = song.file; = `Now Playing: ${song.title}`;
  audio.play();
  nowPlaying.textContent = `Now Playing: ${song.title}`;
}ackBtn.onclick = showAlbums;

backBtn.onclick = showAlbums;showAlbums();