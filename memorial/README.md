Memorial page
=================

Usage
-----

1. Create a folder `memorial/images/` and put your images there (jpg, png, webp, gif).
2. From the `memorial` folder run the generator to create `images.json` (Windows PowerShell):

   .\generate_images_json.ps1

   This will write `memorial/images.json` containing an ordered array of image paths (sorted by file modification time).

3. Commit `memorial/images.json` and your `images/` folder to your site. The page `https://domain.com/memorial/` will load the images and provide slideshow controls.

Notes
-----
- If your hosting provides a directory listing, the page will attempt to parse it as a fallback.
- The slideshow defaults to chronological order (by file name/modified time). Use the Random button to shuffle.
- For very large galleries (200-300 images) consider enabling `loading=lazy` on thumbnails (already used) and keep image sizes reasonable.
