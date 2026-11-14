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

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page. Loads Three.js and `main.js`. |
| `style.css` | Makes the game fill the window and styles the controls text. |
| `main.js` | All the game code (scene, ship, bullets, terrain, game loop). |
| `TODO.md` | The roadmap: what's done and what's next. |
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

## Changelog

Newest entries go at the top. Add a new dated entry every time the game changes.

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
