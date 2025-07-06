const albums = [
  {
    title: "Album 1",
    cover: "https://placehold.co/300x300?text=Album+1",
    songs: [
      { title: "Song 1", file: "music/song1.mp3" },
      { title: "Song 2", file: "music/song2.mp3" }
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
      <img src="${album.cover}" alt="${album.title}" />
      <div class="album-name">${album.title}</div>
    `;
    div.onclick = () => showAlbum(idx);
    albumList.appendChild(div);
  });
  albumList.style.display = 'flex';
  albumView.style.display = 'none';
}

function showAlbum(idx) {
  currentAlbum = idx;
  albumList.style.display = 'none';
  albumView.style.display = 'block';
  const album = albums[idx];
  albumCover.src = album.cover;
  albumTitle.textContent = album.title;

  // Album play button
  document.getElementById('album-play').onclick = () => playSong(0);

  // Render song table
  songList.innerHTML = '';
  album.songs.forEach((song, sidx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sidx + 1}</td>
      <td>${song.title}</td>
      <td>${song.duration || '--:--'}</td>
      <td class="play-cell">
        <button class="song-play-btn" title="Play" onclick="playSongFromTable(${sidx})">▶</button>
      </td>
    `;
    songList.appendChild(tr);
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

showAlbums();