// This script is adapted from the birthday script but stops the age counter at EOL
// Use the memorial images.json moved into /memorial/
const IMAGES_JSON = '/memorial/images.json';
let images = [];
let index = 0;
let playing = false;
let autoplayInterval = 5000;
let timer = null;
let chronological = true;

// Birthday date (start)
const BIRTHDAY_DATE = new Date('2001-12-08T00:00:00Z');
// EOL date: stop counting age at this date and start counting since this date
const EOL_DATE = new Date('2025-12-19T00:00:00Z');

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
  try{
    const r = await fetch('/memorial/images/');
    if(!r.ok) throw new Error('no list');
    const txt = await r.text();
    const hrefs = Array.from(txt.matchAll(/href="([^"<>]+)"/ig)).map(m=>m[1]);
    const imgs = hrefs.filter(h=>/\.(jpe?g|png|gif|webp|heic)$/i.test(h)).map(h=> (h.startsWith('http')||h.startsWith('/'))?h:('images/'+h));
    return imgs;
  }catch(e){return null}
}

function normalizeEntries(arr){
  return arr.map(p=>{
    if(p.startsWith('/memorial/')) return p;
    if(p.startsWith('http')) return p;
    if(p.startsWith('images/')) return '/memorial/'+p;
    if(p.startsWith('/')) return p;
    return '/memorial/images/'+p;
  });
}

function sortChronological(list){
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
  const thumbImgs = thumbsEl().querySelectorAll('img');
  thumbImgs.forEach((t,ti)=> t.classList.toggle('active', ti===index));
  const nextIndex = (index+1)%images.length; const pre = new Image(); pre.src = images[nextIndex];
}

function next(){ show(index+1); }
function prev(){ show(index-1); }

function play(){ if(playing) return; playing=true; document.getElementById('play').textContent='Pause'; timer = setInterval(()=> next(), autoplayInterval); }
function stop(){ if(!playing) return; playing=false; document.getElementById('play').textContent='Play'; clearInterval(timer); timer=null; }

function computeDifference(fromDate, toDate){
  // returns full years, months, days, hours, minutes between fromDate -> toDate
  let years = 0, months = 0, days = 0;
  let current = new Date(fromDate);
  const endpoint = new Date(toDate);

  while(new Date(current.getFullYear()+1, current.getMonth(), current.getDate()) <= endpoint){
    years++;
    current.setFullYear(current.getFullYear()+1);
  }
  while(new Date(current.getFullYear(), current.getMonth()+1, current.getDate()) <= endpoint){
    months++;
    current.setMonth(current.getMonth()+1);
  }
  while(new Date(current.getFullYear(), current.getMonth(), current.getDate()+1) <= endpoint){
    days++;
    current.setDate(current.getDate()+1);
  }
  const remaining = endpoint - current;
  const hours = Math.floor(remaining / (1000*60*60));
  const minutes = Math.floor((remaining % (1000*60*60)) / (1000*60));
  return {years, months, days, hours, minutes};
}

function updateUptime(){
  const now = new Date();
  if(now <= EOL_DATE){
    // Still before EOL: count age from birthday to now
    const diff = computeDifference(BIRTHDAY_DATE, now);
    document.getElementById('years').textContent = diff.years;
    document.getElementById('months').textContent = diff.months;
    document.getElementById('days').textContent = diff.days;
    document.getElementById('hours').textContent = diff.hours;
    document.getElementById('minutes').textContent = diff.minutes;
    // clear since-eol
    document.getElementById('eol-years').textContent = 0;
    document.getElementById('eol-months').textContent = 0;
    document.getElementById('eol-days').textContent = 0;
    document.getElementById('eol-hours').textContent = 0;
    document.getElementById('eol-minutes').textContent = 0;
  }else{
    // After EOL: freeze age at EOL and show time since EOL
    const ageAtEol = computeDifference(BIRTHDAY_DATE, EOL_DATE);
    document.getElementById('years').textContent = ageAtEol.years;
    document.getElementById('months').textContent = ageAtEol.months;
    document.getElementById('days').textContent = ageAtEol.days;
    document.getElementById('hours').textContent = ageAtEol.hours;
    document.getElementById('minutes').textContent = ageAtEol.minutes;

    const since = computeDifference(EOL_DATE, now);
    document.getElementById('eol-years').textContent = since.years;
    document.getElementById('eol-months').textContent = since.months;
    document.getElementById('eol-days').textContent = since.days;
    document.getElementById('eol-hours').textContent = since.hours;
    document.getElementById('eol-minutes').textContent = since.minutes;
  }
}

async function init(){
  let list = await fetchImagesJson();
  if(!list || !list.length) list = await tryDirectoryListing();
  if(!list || !list.length){
    document.getElementById('caption').textContent = 'No images found. Put files into /memorial/images/ and run generate_images_json.ps1 to create images.json for best results.';
    return;
  }
  list = normalizeEntries(list);
  const chronologicalList = sortChronological(list);
  images = chronologicalList.slice();
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
  window.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowRight') { next(); stop(); }
    if(e.key==='ArrowLeft') { prev(); stop(); }
    if(e.key===' ') { e.preventDefault(); playing?stop():play(); }
  });

  renderThumbs();
  show(0);
  updateUptime();
  setInterval(updateUptime, 1000);
}

document.addEventListener('DOMContentLoaded', init);

