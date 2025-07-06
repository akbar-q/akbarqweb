const songs = [
  {
    title: "Song 1",
    file: "music/song1.mp3",
    cover: "https://placehold.co/300x300?text=Song+1"
  },
  {
    title: "Song 2",
    file: "music/song2.mp3",
    cover: "https://placehold.co/300x300?text=Song+2"
  }
  // Add more songs here
];

let currentSong = 0;

const audio = document.getElementById('audio');
const title = document.getElementById('title');
const cover = document.getElementById('cover');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playlist = document.getElementById('playlist');

function loadSong(index) {
  const song = songs[index];
  title.textContent = song.title;
  audio.src = song.file;
  cover.src = song.cover;
  updatePlaylist();
}

function playSong() {
  audio.play();
  playBtn.textContent = '⏸️';
}

function pauseSong() {
  audio.pause();
  playBtn.textContent = '▶️';
}

function playPause() {
  if (audio.paused) {
    playSong();
  } else {
    pauseSong();
  }
}

function prevSong() {
  currentSong = (currentSong - 1 + songs.length) % songs.length;
  loadSong(currentSong);
  playSong();
}

function nextSong() {
  currentSong = (currentSong + 1) % songs.length;
  loadSong(currentSong);
  playSong();
}

function updatePlaylist() {
  playlist.innerHTML = '';
  songs.forEach((song, idx) => {
    const li = document.createElement('li');
    li.textContent = song.title;
    if (idx === currentSong) li.classList.add('active');
    li.onclick = () => {
      currentSong = idx;
      loadSong(currentSong);
      playSong();
    };
    playlist.appendChild(li);
  });
}

playBtn.onclick = playPause;
prevBtn.onclick = prevSong;
nextBtn.onclick = nextSong;
audio.onended = nextSong;

loadSong(currentSong);