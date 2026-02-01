(() => {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const tmpl = document.getElementById('cardTmpl');

  const toTitle = (fileBase) => {
    const cleaned = fileBase
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || fileBase;
  };

  const extractYear = (text) => {
    const match = text.match(/\b(19\d{2}|20\d{2})\b/);
    return match ? match[1] : null;
  };

  const extOf = (filename) => {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
  };

  const baseOf = (filename) => {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(0, i) : filename;
  };

  const safeSrc = (filename) => `images/${encodeURI(filename)}`;

  const renderCard = (filename) => {
    const node = tmpl.content.firstElementChild.cloneNode(true);
    const img = node.querySelector('.card__img');
    const name = node.querySelector('.card__name');
    const meta = node.querySelector('.card__meta');

    const base = baseOf(filename);
    const year = extractYear(base);
    const ext = extOf(filename);

    name.textContent = filename;
    meta.textContent = `${toTitle(base)}${year ? ` • ${year}` : ''} • ${ext.toUpperCase()} • loading…`;

    img.src = safeSrc(filename);
    img.alt = base;

    img.addEventListener('load', () => {
      meta.textContent = `${toTitle(base)}${year ? ` • ${year}` : ''} • ${ext.toUpperCase()} • ${img.naturalWidth}×${img.naturalHeight}`;
    });

    img.addEventListener('error', () => {
      meta.textContent = `${toTitle(base)}${year ? ` • ${year}` : ''} • ${ext.toUpperCase()} • failed to load`;
      node.style.opacity = '0.7';
    });

    return node;
  };

  const load = async () => {
    try {
      const res = await fetch('images/manifest.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
      const files = await res.json();

      if (!Array.isArray(files)) throw new Error('manifest is not an array');

      const onlyImages = files
        .filter((f) => typeof f === 'string')
        .filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));

      count.textContent = `${onlyImages.length} files`;

      const frag = document.createDocumentFragment();
      for (const file of onlyImages) frag.appendChild(renderCard(file));
      grid.replaceChildren(frag);
    } catch (err) {
      count.textContent = 'Could not load gallery';
      grid.textContent = 'Ensure images/manifest.json exists and is valid JSON.';
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  load();
})();
