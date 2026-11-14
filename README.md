# RocketCraft

A 2.5D side-scrolling shooter with an original blocky, cube-built look. Gameplay happens on a flat plane (left, right, up, down), but everything is drawn as 3D cubes.

Built with plain HTML, CSS and JavaScript. Three.js is loaded from a CDN, and there are no build tools.

## How to run

1. Open the `rocketcraft` folder in VS Code.
2. Right-click `index.html` and choose **Open with Live Server**.
3. Play in the browser tab that opens.

## Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys or W A S D |
| Shoot | Space (hold for rapid fire) |
| Debug: next time of day | T (or add `?hour=20` to the address) |

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page. Loads Three.js and `main.js`. |
| `style.css` | Makes the game fill the window and styles the controls text. |
| `main.js` | All the game code (scene, ship, bullets, terrain, game loop). |
| `TODO.md` | The roadmap: what's done and what's next. |
| `CREDITS.md` | Credits and licenses for third-party assets. |
| `assets/textures/` | Licensed 16x16 block textures (CC-BY-SA-4.0). |
| `CLAUDE.md` | Project rules for Claude Code. |

## Current features

- Blocky player ship built from cubes
- Move with arrow keys or WASD
- Shoot with Space
- Two-layer scrolling blocky terrain (near ground and distant hills)

## Planned next

- Enemies
- Collisions and score
- Sounds and better art (later)

---

## Credits

Block textures in `assets/textures/` are from Pixel-Perfection by Hugh "XSSheep" Rutland, license CC-BY-SA-4.0. See [CREDITS.md](CREDITS.md).

## Changelog

Newest entries go at the top. Add a new dated entry every time the game changes.

### 2026-11-15 - Real block textures for the terrain
- Terrain now uses image textures from `assets/textures/` (grass top, grass side, dirt, stone), loaded with Three.js `TextureLoader` using relative paths.
- Nearest-neighbor filtering, no mipmaps, so pixels stay crisp.
- If an image fails to load, the block uses a plain color instead and the game keeps running.
- Faces have slightly different brightness: top brightest, bottom darkest.
- Added `CREDITS.md` for the texture pack.
- The ship, bullets, clouds, sun, moon and stars are unchanged.
- Gameplay is unchanged.

### 2026-11-15 - Time of day
- The sky now follows the player's local clock: morning, daylight, afternoon, sunset and night, with smooth blending between phases.
- Each phase changes the sky gradient, sun/moon light, soft light, fog color and cloud tint.
- The sun is a blocky cube that travels across the sky, and at night there is a blocky moon and simple blocky stars.
- Sunset has warm orange and pink colors and long shadows. Night is dark and blue but readable, and the engine glow and bullets are brighter.
- The sky keeps changing slowly during a long session.
- Debug: press T to jump to the next phase, or add `?hour=20` to the address to set the hour. The phase name shows in the bottom-right corner.
- Phase hours and colors are in `TIME_OF_DAY` at the top of `main.js`.
- Gameplay is unchanged.

### 2026-11-15 - Visual upgrade: pixel-voxel look
- Added pixel textures drawn by code (grass, dirt, stone, ship panels, clouds) with crisp nearest-neighbor filtering.
- Richer, more saturated colors.
- Added a sky gradient (deep blue to light blue) and a bright blocky sun.
- Added sun light with soft shadows plus a hemisphere light, so cube faces have different brightness.
- Added fog so the far hills fade into the sky, and slowly drifting blocky clouds.
- The ship is now built from small textured cubes, with a glowing, flickering engine.
- Bullets are bright yellow with a small glow.
- Terrain now uses instanced meshes for speed.
- Colors, shadow and fog settings are at the top of `main.js`.
- Gameplay is unchanged.

### 2026-11-15 - Step 1: the foundation
- Created `index.html`, `style.css` and `main.js`.
- Added the Three.js scene with a side-on camera tilted slightly for the 2.5D look.
- Added the blocky player ship.
- Added movement with arrow keys or WASD, kept inside the screen edges.
- Added shooting with Space, with a short delay between shots.
- Added scrolling blocky terrain in two layers (near ground and slower distant hills).
- Added this README with a changelog.
- No enemies yet.

<!--
Template for future entries (copy, paste at the top of the changelog, edit):

### YYYY-MM-DD - Short title
- What was added
- What was changed
- What was fixed
-->
