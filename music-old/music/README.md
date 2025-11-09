# Music Data JSON Guide

This README explains how to edit the `music-data.json` file to add, remove, or modify albums and songs.

## File Structure Overview

The `music-data.json` file contains all your music library data in a structured format. Here's what each part does:

```
music-data.json
└── albums (array)
    ├── Album 1
    │   ├── title
    │   ├── artist
    │   ├── ageRating
    │   ├── description
    │   ├── cover
    │   └── songs (array)
    │       ├── Song 1
    │       ├── Song 2
    │       └── ...
    └── Album 2
        └── ...
```

## Album Properties

Each album **must** have these 6 properties:

| Property | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| `title` | String | Yes | Album name | `"Cycle of Design"` |
| `artist` | String | Yes | Artist name | `"Akbar Q"` |
| `ageRating` | String | Yes | Content rating | `"All Ages"` |
| `description` | String | Yes | Album description | `"An electronic journey..."` |
| `cover` | String | Yes | Path to cover image | `"music/Cycle of Design/01.png"` |
| `songs` | Array | Yes | List of songs | `[{...}, {...}]` |

## Song Properties

Each song **must** have these 5 properties:

| Property | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| `title` | String | Yes | Song title | `"Power On"` |
| `artist` | String | Yes | Artist name | `"Akbar Q"` |
| `description` | String | Yes | Song description | `"The beginning of every..."` |
| `file` | String | Yes | Path to audio file | `"music/Cycle of Design/1. Power On.mp3"` |
| `duration` | Number/null | Optional | Length in seconds | `180` or `null` |

## How to Add a New Album

1. Open `music-data.json` in a text editor
2. Find the `"albums"` array
3. Add a comma `,` after the last album's closing brace `}`
4. Copy and paste this template:

```json
{
  "title": "Your Album Title Here",
  "artist": "Artist Name",
  "ageRating": "All Ages",
  "description": "Your album description here",
  "cover": "path/to/your/cover/image.png",
  "songs": []
}
```

5. Replace the placeholder text with your actual data
6. Save the file

## How to Add a New Song to an Album

1. Find the album you want to add a song to
2. Locate the `"songs"` array within that album
3. If there are existing songs, add a comma `,` after the last song's closing brace `}`
4. Copy and paste this template:

```json
{
  "title": "Your Song Title",
  "artist": "Artist Name",
  "description": "Your song description",
  "file": "path/to/your/audio/file.mp3",
  "duration": null
}
```

5. Replace the placeholder text with your actual data
6. Save the file

## How to Remove an Album

1. Find the album you want to remove
2. Delete the entire album object (from opening `{` to closing `}`)
3. Remove any extra commas that might be left behind
4. Save the file

## How to Remove a Song

1. Find the song you want to remove within an album's `songs` array
2. Delete the entire song object (from opening `{` to closing `}`)
3. Remove any extra commas that might be left behind
4. Save the file

## JSON Formatting Rules

**IMPORTANT:** JSON is very strict about formatting. Follow these rules:

### DO:
- Put all text in double quotes `"like this"`
- Use commas `,` between objects (except the last one)
- Use forward slashes `/` in file paths
- Use `null` (no quotes) for empty duration values
- Use numbers without quotes for duration in seconds

### DON'T:
- Use single quotes `'like this'`
- Add commas after the last item in an array or object
- Use backslashes `\` in file paths
- Put quotes around `null` or numbers

## File Path Examples

When adding cover images or audio files, use paths relative to your project root:

```
CORRECT:
"cover": "music/Cycle of Design/01.png"
"file": "music/Cycle of Design/1. Power On.mp3"

INCORRECT:
"cover": "music\\Cycle of Design\\01.png"
"file": "C:\\Users\\...\\1. Power On.mp3"
```

## Common Mistakes to Avoid

1. **Missing Commas:** Every object/item needs a comma after it, except the last one
2. **Extra Commas:** Don't put commas after the last item in arrays or objects
3. **Wrong Quotes:** Always use double quotes `"`, never single quotes `'`
4. **File Paths:** Use forward slashes `/`, not backslashes `\`
5. **Missing Properties:** Every album and song must have all required properties

## Testing Your Changes

After making changes:

1. Save the file
2. Check that your website/app still loads properly
3. Verify that new albums/songs appear correctly
4. Test that audio files and images load properly

## Complete Album Template

Here's a complete template for adding a new album with songs:

```json
{
  "title": "New Album Name",
  "artist": "Artist Name",
  "ageRating": "All Ages",
  "description": "Description of your new album",
  "cover": "path/to/album/cover.png",
  "songs": [
    {
      "title": "First Song",
      "artist": "Artist Name",
      "description": "Description of first song",
      "file": "path/to/first-song.mp3",
      "duration": null
    },
    {
      "title": "Second Song",
      "artist": "Artist Name", 
      "description": "Description of second song",
      "file": "path/to/second-song.mp3",
      "duration": 240
    }
  ]
}
```

## Need Help?

If you're having trouble:
1. Check that all brackets `{}` and `[]` are properly matched
2. Verify all commas are in the right places
3. Make sure all quotes are double quotes `"`
4. Use a JSON validator online to check your syntax
5. Compare your changes with the existing working examples

Remember: When in doubt, copy the structure of existing albums and songs!
