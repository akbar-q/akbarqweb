// This script is adapted from the birthday script but stops the age counter at EOL
// Use the memorial images.json moved into /memorial/
const IMAGES_JSON = '/memorial/images.json';
let images = []; // array of objects: {full, thumb}
let index = 0;
let playing = false;
let autoplayInterval = 5000;
let timer = null;
// default to random/shuffled playing
let chronological = false;

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
  // normalize to array of objects: {full, thumb}
  return arr.map(item=>{
    if(typeof item === 'string'){
      let p = item;
      if(!p.startsWith('http') && !p.startsWith('/')){
        if(p.startsWith('images/')) p = '/memorial/'+p; else p = '/memorial/images/'+p;
      }
      // derive thumbnail path (thumbnails/ same base name) but keep absolute if provided
      const filename = p.split('/').pop();
      const thumb = p.replace('/images/','/thumbnails/');
      return { full: p, thumb };
    } else if(item && typeof item === 'object'){
      // already {full, thumb}
      const full = item.full && !item.full.startsWith('http') && !item.full.startsWith('/') ? ('/memorial/'+item.full) : item.full;
      const thumb = item.thumb && !item.thumb.startsWith('http') && !item.thumb.startsWith('/') ? ('/memorial/'+item.thumb) : item.thumb || full;
      return { full, thumb };
    }
    return null;
  }).filter(Boolean);
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
  images.forEach((item,i)=>{
    const img = document.createElement('img');
    img.dataset.src = item.thumb || item.full; // lazy load when visible
    img.loading='lazy'; img.alt = item.full.split('/').pop();
    img.dataset.index = i;
    img.addEventListener('click',()=>{ show(i); stop(); });
    // if thumbnail fails, fall back to full image immediately
    img.addEventListener('error', ()=>{
      if(item.full && img.src !== item.full){ img.src = item.full; img.classList.add('broken'); }
    });
    if(i===index) img.classList.add('active');
    thumbs.appendChild(img);
  });
  // lazy-load thumbnails using IntersectionObserver
  const io = new IntersectionObserver((entries, obs) =>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el = e.target; const src = el.dataset.src;
        if(src){ el.src = src; el.removeAttribute('data-src'); }
        obs.unobserve(el);
      }
    });
  }, {root: null, rootMargin: '200px', threshold: 0.1});
  thumbs.querySelectorAll('img[data-src]').forEach(i=> io.observe(i));
}

function loadFullForIndex(i){
  const item = images[i];
  if(!item) return Promise.resolve();
  return new Promise((resolve)=>{
    const img = new Image();
    img.src = item.full;
    img.onload = ()=> resolve(img.src);
    img.onerror = ()=> resolve(item.full);
  });
}

function show(i){
  if(!images.length) return;
  index = ((i%images.length)+images.length)%images.length;
  const item = images[index];
  // show low-res thumb immediately and apply blur while full loads
  const main = currentEl();
  main.classList.add('blurred','loading');
  main.src = item.thumb || item.full;
  captionEl().textContent = (item.full||item.thumb).split('/').pop();
  const thumbImgs = thumbsEl().querySelectorAll('img');
  thumbImgs.forEach((t,ti)=> t.classList.toggle('active', ti===index));
  // load full image in background and swap when ready
  loadFullForIndex(index).then((fullSrc)=>{
    // smooth transition from blurred thumb to full image
    // set full src then remove blur once painted
    const prevSrc = main.src;
    main.src = fullSrc;
    // ensure image paints, then remove blur class
    requestAnimationFrame(()=>{
      main.classList.remove('blurred');
      // slight delay to make sure transition visible
      setTimeout(()=> main.classList.remove('loading'), 350);
    });
  });
  // preload next full image
  const nextIndex = (index+1)%images.length;
  loadFullForIndex(nextIndex);
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
  const chronologicalList = sortChronological(list.map(i=> (i.full||i)));
  // chronologicalList is array of full paths -- convert back to objects preserving thumb
  const mapByFull = new Map(list.map(i=>[i.full,i]));
  images = chronologicalList.map(p=> mapByFull.get(p) || { full:p, thumb:p.replace('/images/','/thumbnails/') });
  // default to shuffled order if chronological is false
  if(!chronological){ images = shuffleArray(images); }
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
  // show a random starting image (already shuffled if random mode)
  const startIndex = Math.floor(Math.random()*images.length);
  show(startIndex);
  setupDownload();
  // start autoplay by default (play mode)
  document.getElementById('autoplayCheck').checked = true;
  play();
  updateUptime();
  setInterval(updateUptime, 1000);
}

document.addEventListener('DOMContentLoaded', init);

// Download modal and ZIP creation
function setupDownload(){
  const modal = document.getElementById('downloadModal');
  const btn = document.getElementById('downloadAll');
  const close = document.getElementById('closeModal');
  const openGithub = document.getElementById('openGithub');
  const createZip = document.getElementById('createZip');
  const zipStatus = document.getElementById('zipStatus');
  const githubLink = document.getElementById('githubLink');
  if(!btn || !modal) return;
  btn.addEventListener('click', ()=> { modal.setAttribute('aria-hidden','false'); });
  close.addEventListener('click', ()=> { modal.setAttribute('aria-hidden','true'); zipStatus.textContent = ''; });
  openGithub.addEventListener('click', ()=>{ window.open(githubLink.href,'_blank'); });

  createZip.addEventListener('click', async ()=>{
    if(typeof JSZip === 'undefined'){ zipStatus.textContent = 'ZIP library not loaded.'; return; }
    zipStatus.textContent = 'Preparing ZIP (this may take a while)...';
    const zip = new JSZip();
    // fetch each full image sequentially with limited concurrency
    const concurrency = 4;
    let i = 0;
    async function worker(){
      while(i < images.length){
        const idx = i++; const item = images[idx];
        try{
          zipStatus.textContent = `Fetching ${idx+1} of ${images.length}: ${item.full.split('/').pop()}`;
          const r = await fetch(item.full);
          if(!r.ok) { zipStatus.textContent = `Failed to fetch ${item.full}`; continue; }
          const b = await r.blob();
          zip.file(item.full.split('/').pop(), b);
        }catch(e){ console.error('fetch error',e); }
      }
    }
    const workers = Array.from({length:concurrency}).map(()=>worker());
    await Promise.all(workers);
    zipStatus.textContent = 'Compressing...';
    const blob = await zip.generateAsync({type:'blob'}, (meta)=>{ zipStatus.textContent = `Compressing ${Math.round(meta.percent)}%`; });
    zipStatus.textContent = 'Preparing download...';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'memorial-images.zip';
    document.body.appendChild(a); a.click(); a.remove();
    zipStatus.textContent = 'Download started.';
  });
}

