Akbar Qamar Birthday Gallery
=============================

A photo gallery celebrating Akbar Qamar's birthday (December 8).

Usage
-----

1. Create a folder `birthday/images/` and put your photos there (jpg, png, webp, gif).
2. From the `birthday` folder run the generator to create `images.json` (Windows PowerShell):

   .\generate_images_json.ps1

   This will write `birthday/images.json` containing an ordered array of image paths (sorted by file modification time).

3. Commit `birthday/images.json` and your `images/` folder to your site. The page `https://domain.com/birthday/` will load the images and provide slideshow controls.

Features
--------
- Full slideshow with next/prev controls
- Chronological or random ordering with one-click toggle
- Autoplay with adjustable interval
- Age/time counter showing years, months, days since birth
- Keyboard navigation (arrow keys, spacebar)
- Responsive thumbnail gallery with lazy loading

Notes
-----
- If your hosting provides a directory listing, the page will attempt to parse it as a fallback.
- The slideshow defaults to chronological order (by file name/modified time). Use the Random button to shuffle.
- For large galleries (200+ images) keep image sizes reasonable and use `loading=lazy` for best performance.
