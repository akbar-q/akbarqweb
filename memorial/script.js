const IMAGES_JSON = '/memorial/images.json';
let images = [];
let index = 0;
let playing = false;
let autoplayInterval = 5000;
let timer = null;
let chronological = true;

const currentEl = () => document.getElementById('current');
const captionEl = () => document.getElementById('caption');
const thumbsEl = () => document.getElementById('thumbs');

async function fetchImagesJson(){
  try{
    const r = await fetch(IMAGES_JSON, {cache: 'no-cache'});
    if(!r.ok) throw new Error('no json');
    const data = await r.json();
    if(Array.isArray(data)) return data;
  }catch(e){/* fallback */}
  return null;
}

async function tryDirectoryListing(){
  // Some hosts expose a directory listing; try to fetch and parse anchors
  try{
    const r = await fetch('/memorial/images/');
    if(!r.ok) throw new Error('no list');
    const txt = await r.text();
    const hrefs = Array.from(txt.matchAll(/href=\"([^\"<>]+)\"/ig)).map(m=>m[1]);
    const imgs = hrefs.filter(h=>/\.(jpe?g|png|gif|webp)$/i.test(h)).map(h=> (h.startsWith('http')||h.startsWith('/'))?h:('images/'+h));
    return imgs;
  }catch(e){return null}
}

function normalizeEntries(arr){
  // entries could be 'images/name.jpg' or 'name.jpg' or absolute paths
  return arr.map(p=>{
    if(p.startsWith('/memorial/')) return p;
    if(p.startsWith('http')) return p;
    if(p.startsWith('images/')) return '/memorial/'+p;
    if(p.startsWith('/')) return p;
    return '/memorial/images/'+p;
  });
}

function sortChronological(list){
  // basic filename sort with natural compare
  return list.slice().sort((a,b)=>{
    const an = a.split('/').pop(); const bn = b.split('/').pop();
    return an.localeCompare(bn, undefined, {numeric:true, sensitivity:'base'});
  });
}

function shuffleArray(a){
  const arr = a.slice();
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function renderThumbs(){
  const thumbs = thumbsEl(); if(!thumbs) return;
  thumbs.innerHTML='';
  images.forEach((src,i)=>{
    const img = document.createElement('img'); img.src = src; img.loading='lazy';
    img.addEventListener('click',()=>{ show(i); stop(); });
    if(i===index) img.classList.add('active');
    thumbs.appendChild(img);
  });
}

function show(i){
  if(!images.length) return;
  index = ((i%images.length)+images.length)%images.length;
  const src = images[index];
  currentEl().src = src;
  captionEl().textContent = src.split('/').pop();
  // update thumbs active
  const thumbImgs = thumbsEl().querySelectorAll('img');
  thumbImgs.forEach((t,ti)=> t.classList.toggle('active', ti===index));
  // preload next
  const nextIndex = (index+1)%images.length; const pre = new Image(); pre.src = images[nextIndex];
}

function next(){ show(index+1); }
function prev(){ show(index-1); }

function play(){ if(playing) return; playing=true; document.getElementById('play').textContent='Pause'; timer = setInterval(()=> next(), autoplayInterval); }
function stop(){ if(!playing) return; playing=false; document.getElementById('play').textContent='Play'; clearInterval(timer); timer=null; }

async function init(){
  // try json
  let list = await fetchImagesJson();
  if(!list || !list.length) list = await tryDirectoryListing();
  if(!list || !list.length){
    document.getElementById('caption').textContent = 'No images found. Put files into /memorial/images/ and run generate_images_json.ps1 to create images.json for best results.';
    return;
  }
  list = normalizeEntries(list);
  const chronologicalList = sortChronological(list);
  images = chronologicalList.slice();
  // attach UI
  document.getElementById('next').addEventListener('click',()=>{ next(); stop(); });
  document.getElementById('prev').addEventListener('click',()=>{ prev(); stop(); });
  document.getElementById('play').addEventListener('click',()=>{ playing?stop():play(); });
  document.getElementById('randomize').addEventListener('click',()=>{
    if(chronological){ images = shuffleArray(images); chronological=false; document.getElementById('randomize').textContent='Unrandom'; }
    else{ images = chronologicalList.slice(); chronological=true; document.getElementById('randomize').textContent='Random'; }
    show(0); renderThumbs();
  });
  document.getElementById('autoplayCheck').addEventListener('change',(e)=>{
    if(e.target.checked) play(); else stop();
  });
  // keyboard
  window.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowRight') { next(); stop(); }
    if(e.key==='ArrowLeft') { prev(); stop(); }
    if(e.key===' ') { e.preventDefault(); playing?stop():play(); }
  });

  renderThumbs();
  show(0);
}

document.addEventListener('DOMContentLoaded', init);
