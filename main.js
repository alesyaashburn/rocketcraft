// RocketCraft - pixel-voxel look + time of day (follows the player's clock).
// Everything is built from cubes and textures drawn by the code itself.
// No image files, no sounds, all original.

// ===============================================================
// 1. SETTINGS (change these to tweak the game and the look)
// ===============================================================

// --- Gameplay (unchanged) ---
const SHIP_SPEED = 10;          // how fast the ship moves
const BULLET_SPEED = 28;        // how fast bullets fly right
const SHOOT_COOLDOWN = 0.15;    // seconds between shots
const TERRAIN_SPEED = 5;        // how fast the ground scrolls left
const FAR_TERRAIN_SPEED = 2;    // distant hills scroll slower (feels deeper)
const PLAY_FLOOR = -6;          // top of the near ground. The ship stays above this.

// --- Time of day ---
// The game reads your computer's clock and picks a phase of the day.
// Each phase starts at "start" (hours, 24h clock) and lasts until the next
// phase starts. The last phase (night) runs until the first one starts again.
// Between two phases the look blends smoothly over "blendHours".
//
// Look settings for each phase:
//   skyTop / skyMid / skyHorizon : the three colors of the sky gradient
//   fog                          : far hills fade into this color
//   sunColor, sunIntensity       : the sunlight (also makes the shadows)
//   moonColor, moonIntensity     : the moonlight
//   hemiSky, hemiGround, hemiIntensity : soft light so shadows are never black
//   cloudTint, cloudEmissive     : cloud color (emissive = glow in the shade)
//   sunTint, sunGlow             : color of the sun cube and its glow
//   starOpacity                  : 0 = no stars, 1 = full stars
//   glowBoost                    : makes the engine glow and bullets brighter
const TIME_OF_DAY = {
  blendHours: 1.0,            // how long the smooth change between phases takes
  sweepHoursPerSecond: 4,     // how fast the sky "fast-forwards" when you press T
  phases: [
    {
      name: "Morning", start: 6,
      look: {
        skyTop: "#3b64c8", skyMid: "#9aa6e0", skyHorizon: "#ffc48f",
        fog: "#f7c9a0",
        sunColor: "#ffd2a0", sunIntensity: 0.85,
        moonColor: "#9db8ff", moonIntensity: 0,
        hemiSky: "#d8e4ff", hemiGround: "#8a6040", hemiIntensity: 0.75,
        cloudTint: "#ffe0cc", cloudEmissive: "#5a4a58",
        sunTint: "#ffd070", sunGlow: "#ffa040",
        starOpacity: 0, glowBoost: 1.1,
      },
    },
    {
      name: "Daylight", start: 9,
      look: {
        skyTop: "#1747c8", skyMid: "#4f8fe6", skyHorizon: "#a8e0ff",
        fog: "#a8e0ff",
        sunColor: "#fff2d6", sunIntensity: 1.0,
        moonColor: "#9db8ff", moonIntensity: 0,
        hemiSky: "#bfe6ff", hemiGround: "#7a5a3c", hemiIntensity: 0.8,
        cloudTint: "#ffffff", cloudEmissive: "#4d5870",
        sunTint: "#ffffff", sunGlow: "#ffd34a",
        starOpacity: 0, glowBoost: 1.0,
      },
    },
    {
      name: "Afternoon", start: 16,
      look: {
        skyTop: "#2955c8", skyMid: "#74a8e8", skyHorizon: "#ffe0a8",
        fog: "#f5dcb0",
        sunColor: "#ffdca0", sunIntensity: 0.95,
        moonColor: "#9db8ff", moonIntensity: 0,
        hemiSky: "#ffe8cc", hemiGround: "#7a5a3c", hemiIntensity: 0.75,
        cloudTint: "#fff0d8", cloudEmissive: "#5a5050",
        sunTint: "#ffe070", sunGlow: "#ffc040",
        starOpacity: 0, glowBoost: 1.1,
      },
    },
    {
      name: "Sunset", start: 18,
      look: {
        skyTop: "#40307f", skyMid: "#d0508c", skyHorizon: "#ff8a3c",
        fog: "#ff9a5c",
        sunColor: "#ff9a4a", sunIntensity: 0.8,
        moonColor: "#9db8ff", moonIntensity: 0,
        hemiSky: "#e8a0c0", hemiGround: "#5a3a40", hemiIntensity: 0.65,
        cloudTint: "#ff9ec0", cloudEmissive: "#6a2a4a",
        sunTint: "#ff7a30", sunGlow: "#ff5a2a",
        starOpacity: 0.1, glowBoost: 1.5,
      },
    },
    {
      name: "Night", start: 19.5,
      look: {
        skyTop: "#040a22", skyMid: "#0a1840", skyHorizon: "#1b3070",
        fog: "#14275c",
        sunColor: "#5060a0", sunIntensity: 0,
        moonColor: "#b4ccff", moonIntensity: 0.6,
        hemiSky: "#4666b8", hemiGround: "#222c58", hemiIntensity: 1.1,
        cloudTint: "#7a8cc0", cloudEmissive: "#101a3c",
        sunTint: "#ffe27a", sunGlow: "#ffc040",
        starOpacity: 1, glowBoost: 2.3,
      },
    },
  ],
};

// --- Colors of textures and objects (not time-dependent) ---
// Each texture has a "base" color and some speckle colors that are
// sprinkled over it to give every block a handmade pixel look.
const COLORS = {
  engine:    { base: "#ffa51a", dark: "#ff7a10", light: "#ffd83a", hot: "#ffe45c" },

  cloud: { base: "#ffffff", shade: "#dde8f6", shade2: "#c8d8ee" },

  sun:  { base: "#fff0a0", light: "#fffbd0", orange: "#ffd45a", hot: "#ffffff" },
  moon: { base: "#d8dfef", light: "#f2f5ff", dark: "#a9b4cc", crater: "#7e8aa6" },
  moonGlow: "#8fb0ff",

  bulletCore: "#ffee22",
  bulletHot: "#fffbd0",
  bulletGlow: "#ffc820",
  engineFlame: "#ffb020",
  engineGlow: "#ff8a1a",
};

// --- Terrain textures (image files, see CREDITS.md) ---
// Each entry: which image to load, and a plain fallback color that is used
// if the image can't be loaded (the game keeps working either way).
// Other images in assets/textures are free to use for later features.
const TEXTURE_FOLDER = "assets/textures/";   // relative path, works on GitHub Pages
const TERRAIN_TEXTURES = {
  grassTop:  { file: "default_grass.png",      fallback: "#3fc43a" },
  // The grass side image is only the green fringe (the rest is see-through),
  // so it is painted on top of the dirt image ("under").
  grassSide: { file: "default_grass_side.png", under: "default_dirt.png", fallback: "#6f8a34" },
  dirt:      { file: "default_dirt.png",       fallback: "#8b5a2b" },
  stone:     { file: "default_stone.png",      fallback: "#7d8696" },
};

// How bright each cube face is (1 = full). Top is brightest, bottom darkest.
// The sun light adds even more difference on top of this.
const FACE_BRIGHTNESS = {
  top: 1.0,
  side: 0.9,
  bottom: 0.7,
};

// ===============================================================
// SHIP DESIGN (edit this to change the shape of your ship!)
// ===============================================================
// The ship is a blocky platypus-themed aircraft made of cubes.
// We describe it with small text pictures.
//
// HOW TO READ IT
//  * Each "slice" is a SIDE VIEW of the ship, drawn as rows of letters.
//    Top row = top of the ship. Left = the back (tail). Right = the front (bill).
//  * Every letter is one cube. The letter tells which texture it uses
//    (see "legend" below). A "." means "no cube here".
//  * "depth" says how far toward/away from you this slice is placed:
//      0  = the middle of the ship
//      1  = one cube toward you,   -1 = one cube away from you
//    A slice with depth [-1, 1] is drawn twice (a left and a right copy),
//    so the ship is the same on both sides.
//  * All slices must have the same number of rows, and all rows the same
//    number of letters (14 columns, 5 rows here = 14 long, 5 tall).
//
// TIPS
//  * Change a letter to change a cube's texture. Change a letter to "." to remove it.
//  * Add a new slice to make the ship wider.
//  * Keep every row the same length, or the ship will look crooked.
//  * The hitbox is measured from these cubes automatically.
const SHIP_DESIGN = {
  cubeSize: 0.36,  // size of one cube in game units (bigger = bigger ship)

  // Which texture each letter means (names are from SHIP_TEXTURES below)
  legend: {
    D: "dirt",       // brown body
    R: "gravel",     // grey-brown belly and the wing webbing
    T: "bark",       // dark brown tail paddle and the wing "toes"
    L: "bill",       // light bill (the duck-bill nose)
    K: "eye",        // the two cube eyes
    G: "glass",      // cockpit bubble
    E: "engine",     // the small glowing orange engine cube
  },

  // Which row the engine and the gun are on (row 0 = top row)
  engineRow: 2,
  muzzleRow: 3,      // bullets come out of the tip of the bill

  slices: [
    // Middle of the ship (depth 0)
    {
      depth: [0],
      rows: [
        ".......GGG....",   // cockpit bubble on top
        "....DDDDDD....",   // top of the rounded body
        "..EDDDDDDDDD..",   // E = engine cube, then the body and forehead
        "TTTDDDDDDDDLLL",   // T = tail paddle (back), L = the flat bill (front)
        "....RRRRRR....",   // grey belly
      ],
    },
    // Body sides (one cube out, both sides): body, cockpit width, EYES (K)
    {
      depth: [-1, 1],
      rows: [
        ".......GGG....",
        "....DDDDDD....",
        "...DDDDDDDKD..",   // K = eye, near the front of the head
        "TTTDDDDDDDDLLL",
        "....RRRRRR....",
      ],
    },
    // Two cubes out: the webbed wings (R = web), the bill gets narrower, tail paddle
    {
      depth: [-2, 2],
      rows: [
        "..............",
        "..............",
        ".....DDDD.....",
        "TTT.RRRRRR.LL.",   // web in the middle, bill corners at the front
        "..............",
      ],
    },
    // Three cubes out: the wing "toes" (T) and the rounded edges of the tail paddle
    {
      depth: [-3, 3],
      rows: [
        "..............",
        "..............",
        "..............",
        ".TT.T.T.T.....",
        "..............",
      ],
    },
  ],

  // The flickering exhaust: 3 small cubes behind the engine.
  // Each one is [column, row, depth]. (The engine cube is at column 2, row 2.)
  exhaust: [
    [1, 2, 0],
    [0, 2, 0],
    [-1, 2, 0],
  ],
};

// Images used for the ship (from assets/textures, see CREDITS.md).
//   fallback  = plain color used if the image can't load
//   grey      = turn the picture grey (used for the glass frame)
//   backColor = paint the see-through image over this color first
const SHIP_TEXTURES = {
  dirt:     { file: "default_dirt.png",      fallback: "#6e5b4b" },
  gravel:   { file: "default_gravel.png",    fallback: "#8a8078" },
  bark:     { file: "default_tree.png",      fallback: "#4e3b2a" },
  bill:     { file: "default_sandstone.png", fallback: "#d8c08e" },
  eye:      { file: "default_coal_block.png", fallback: "#2a2a2a" },
  // The glass image is mostly see-through, so it is painted over light blue
  glass:    { file: "default_glass.png",     fallback: "#8fd8ff", grey: true, backColor: "#8fd8ff" },
};

// ===============================================================
// GAME RULES AND ENEMY SETTINGS (step 2: tweak the difficulty here)
// ===============================================================
const GAME_RULES = {
  startLives: 3,
  invulnerableSeconds: 2.0,    // how long your ship flickers (can't be hit) after a hit
  hitFlashSeconds: 0.12,       // how long a saucer flashes white when you shoot it
  hitPushback: 5,              // how hard a saucer is pushed back when shot (bigger = farther)
  hpBarSeconds: 2.0,           // the hit-point bar hides again after this long without a hit

  maxEnemiesOnScreen: 8,       // never more saucers than this at once
  startSpawnInterval: 2.0,     // seconds between new saucers at the start
  minSpawnInterval: 0.7,       // ...and the fastest it ever gets
  speedUpPer1000: 0.35,        // the gap gets this many seconds shorter per 1000 points
  maxDebris: 200,              // most little broken cubes alive at once
};

// The three kinds of saucer.
//   hp           = hits needed to destroy it
//   speed        = how fast it flies left (units per second)
//   waveAmplitude/waveSpeed = how far and how fast it moves up and down (0 = straight)
//   score        = points for destroying it
//   spawnWeight  = how often it is picked (bigger = more often)
//   fromScore    = it only starts appearing after you have this many points
//   debris       = how many little cubes it breaks into
const ENEMY_TYPES = {
  scout:    { hp: 1, speed: 7.5, waveAmplitude: 0,   waveSpeed: 0,   score: 100, spawnWeight: 5, fromScore: 0,   debris: 10 },
  standard: { hp: 3, speed: 3.5, waveAmplitude: 1.8, waveSpeed: 2.2, score: 250, spawnWeight: 3, fromScore: 200, debris: 16 },
  heavy:    { hp: 6, speed: 1.8, waveAmplitude: 0,   waveSpeed: 0,   score: 600, spawnWeight: 1, fromScore: 800, debris: 26 },
};

// Colors of the hit-point bar and the broken-cube debris
const ENEMY_COLORS = {
  barGreen: "#3be05a",
  barYellow: "#ffd83a",
  barRed: "#ff3b3b",
  barEmpty: "#2b2b33",
  window: { base: "#2dff6a", dark: "#12c24a", light: "#b8ffd0" },   // glowing windows
  debris: ["#6fe08a", "#d8c08e", "#3a3a40", "#aeb4b8", "#5dff8a"],
};

// Windows glow brightness: dim by day, bright at night (uses the time of day)
const ENEMY_WINDOW_GLOW = { day: 0.6, perBoost: 0.5 };

// ===============================================================
// ENEMY DESIGNS (edit these to change the saucers!)
// ===============================================================
// Same idea as the ship: each "slice" is a SIDE VIEW drawn with letters,
// top row = top of the saucer, and "depth" says how far toward/away from
// the camera that slice sits (0 = middle, [-1, 1] = one copy on each side).
// "." means no cube. All rows in a saucer must be the same length.
//
//   G = green glass dome          U = upper rim (lighter, top layer)
//   V = lower rim (lighter)       H = dark hull ring
//   W = glowing green window      L = landing leg
const ENEMY_LEGEND = {
  G: "dome", U: "rimUpper", V: "rimLower", H: "hull", W: "window", L: "leg",
};

// Images used for the saucers (see CREDITS.md). Fallback = color if the image can't load.
const ENEMY_TEXTURES = {
  // Glass painted over a see-through green, tinted green, slightly transparent
  dome:     { file: "default_glass.png",          fallback: "#4fd870", grey: true,
              backColor: "rgba(160, 255, 180, 0.55)", tint: "#7dff9a", opacity: 0.8 },
  rimUpper: { file: "default_sandstone_brick.png", fallback: "#d8c08e" },
  rimLower: { file: "default_sandstone.png",       fallback: "#e6d3a3" },
  hull:     { file: "default_coal_block.png",      fallback: "#3a3a40" },
  leg:      { file: "default_tin_block.png",       fallback: "#aeb4b8" },
};

const ENEMY_DESIGNS = {
  // SCOUT: small, 5 cubes wide
  scout: {
    cubeSize: 0.36,
    slices: [
      { depth: [0], rows: [
        ".GGG.",
        "UUUUU",
        "HHHHH",
        ".HHH.",
        ".....",
      ] },
      { depth: [-1, 1], rows: [
        "..G..",
        ".UUU.",
        "HWHWH",
        ".HHH.",
        ".L.L.",
      ] },
    ],
  },

  // STANDARD: medium, 7 cubes wide
  standard: {
    cubeSize: 0.4,
    slices: [
      { depth: [0], rows: [
        "..GGG..",
        ".GGGGG.",
        ".VVVVV.",
        "UUUUUUU",
        "HWHWHWH",
        ".HHHHH.",
        ".......",
      ] },
      { depth: [-1, 1], rows: [
        "..GGG..",
        ".GGGGG.",
        ".VVVVV.",
        "UUUUUUU",
        "HWHWHWH",
        ".HHHHH.",
        ".L...L.",
      ] },
      { depth: [-2, 2], rows: [
        ".......",
        "..GGG..",
        "..VVV..",
        ".UUUUU.",
        ".HWHWH.",
        "..HHH..",
        ".......",
      ] },
      { depth: [-3, 3], rows: [
        ".......",
        ".......",
        ".......",
        "..UUU..",
        "..HWH..",
        ".......",
        ".......",
      ] },
    ],
  },

  // HEAVY: large, 9 cubes wide
  heavy: {
    cubeSize: 0.44,
    slices: [
      { depth: [0], rows: [
        "...GGG...",
        "..GGGGG..",
        ".GGGGGGG.",
        ".VVVVVVV.",
        "UUUUUUUUU",
        "HWHWHWHWH",
        ".HHHHHHH.",
        ".........",
      ] },
      { depth: [-1, 1], rows: [
        "...GGG...",
        "..GGGGG..",
        ".GGGGGGG.",
        ".VVVVVVV.",
        "UUUUUUUUU",
        "HWHWHWHWH",
        ".HHHHHHH.",
        ".L.....L.",
      ] },
      { depth: [-2, 2], rows: [
        ".........",
        "...GGG...",
        "..GGGGG..",
        "..VVVVV..",
        ".UUUUUUU.",
        ".HWHWHWH.",
        "..HHHHH..",
        ".........",
      ] },
      { depth: [-3, 3], rows: [
        ".........",
        ".........",
        "...GGG...",
        "...VVV...",
        "..UUUUU..",
        "..HWHWH..",
        "...HHH...",
        ".........",
      ] },
      { depth: [-4, 4], rows: [
        ".........",
        ".........",
        ".........",
        ".........",
        "...UUU...",
        "...HWH...",
        ".........",
        ".........",
      ] },
    ],
  },
};

// --- Shadows ---
const SHADOW = {
  enabled: true,
  mapSize: 2048,        // shadow sharpness. Use 1024 if the game feels slow.
  bias: -0.0005,        // tiny nudge that stops stripy shadow artifacts
  normalBias: 0.03,
  halfWidth: 30,        // how much of the world is covered by shadows (left/right)
  halfHeight: 22,       // (up/down)
};

// --- Fog (far hills fade into the sky; the fog COLOR comes from the time of day) ---
const FOG = {
  enabled: true,
  near: 27,             // fog starts this far from the camera
  far: 48,              // everything is fully fogged at this distance
};

// --- Clouds ---
const CLOUDS = {
  count: 9,
  minSpeed: 0.4,
  maxSpeed: 1.0,
};

// --- Sun, moon and stars ---
const SKY_OBJECTS = {
  starCount: 80,
  lightDistance: 22,    // how far away the sun/moon light sits from the middle of the world
};

// ===============================================================
// 2. SCENE, CAMERA, RENDERER
// ===============================================================
const scene = new THREE.Scene();

// Camera looks at the game plane from the side, tilted a tiny bit
// so we can see the top and sides of the cubes (the "2.5D" look).
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 3, 22);
camera.lookAt(0, 0, 0);
scene.add(camera); // the camera must be in the scene so the sun, moon and stars can be attached to it

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = SHADOW.enabled;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft shadow edges
document.getElementById("game").appendChild(renderer.domElement);

// Fog: far things blend into the horizon color (color is set by the time of day)
if (FOG.enabled) {
  scene.fog = new THREE.Fog(new THREE.Color("#ffffff"), FOG.near, FOG.far);
}

// The edges of the screen (in game units). Updated when the window resizes.
const screen = { halfWidth: 18, halfHeight: 10 };

// ===============================================================
// 3. LIGHTS (colors and strengths are set every frame by the time of day)
// ===============================================================

// Soft light so the dark sides of cubes are never pure black
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.8);
scene.add(hemiLight);

// The sun / moon light: strong light from one direction. It makes the shadows,
// and it lights the top, front and side faces of each cube differently.
// By day it sits where the sun is; at night it sits where the moon is.
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(-8, 14, 10);
sunLight.castShadow = SHADOW.enabled;
sunLight.shadow.mapSize.set(SHADOW.mapSize, SHADOW.mapSize);
sunLight.shadow.bias = SHADOW.bias;
sunLight.shadow.normalBias = SHADOW.normalBias;
sunLight.shadow.camera.left = -SHADOW.halfWidth;
sunLight.shadow.camera.right = SHADOW.halfWidth;
sunLight.shadow.camera.top = SHADOW.halfHeight;
sunLight.shadow.camera.bottom = -SHADOW.halfHeight;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 80;
sunLight.shadow.camera.updateProjectionMatrix();
scene.add(sunLight);

// ===============================================================
// 4. PIXEL TEXTURES (drawn by code on a tiny canvas)
// ===============================================================

// A simple random number maker that gives the SAME numbers every time
// for the same seed. That way the textures look the same on every reload.
function makeRandom(seed) {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Make a small pixel texture.
//   size      = pixels across (16 means 16 x 16 pixels)
//   base      = main color
//   speckles  = list of { color, chance } sprinkled over the base
//   extra     = optional function to draw extra details on top
function makePixelTexture(options) {
  const size = options.size || 16;
  const random = makeRandom(options.seed);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Paint every pixel one by one
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = options.base;
      const roll = random();
      let total = 0;
      for (const speckle of options.speckles) {
        total += speckle.chance;
        if (roll < total) {
          color = speckle.color;
          break;
        }
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  if (options.extra) options.extra(ctx, random, size);

  const texture = new THREE.CanvasTexture(canvas);
  // Nearest = no blurring, so every pixel stays a crisp square
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

// ---------------------------------------------------------------
// Image textures from assets/textures (licensed, see CREDITS.md)
// ---------------------------------------------------------------
// Each block material starts as a plain fallback color. When its image
// finishes loading, the picture is put on it. If loading fails, the color
// stays and the game keeps working.
const textureLoader = new THREE.TextureLoader();
const textureCache = {}; // so each image file is only loaded once

function loadPixelTexture(file, onReady) {
  let entry = textureCache[file];
  if (!entry) {
    entry = { texture: null, failed: false, waiting: [] };
    textureCache[file] = entry;
    textureLoader.load(
      TEXTURE_FOLDER + file,
      function (texture) {
        // Nearest = no smoothing, no mipmaps, so pixels stay crisp squares
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        entry.texture = texture;
        for (const callback of entry.waiting) callback(texture);
        entry.waiting = [];
      },
      undefined,
      function () {
        entry.failed = true;
        entry.waiting = [];
        console.warn("RocketCraft: could not load " + TEXTURE_FOLDER + file + " - using a plain color instead.");
      }
    );
  }
  if (entry.texture) onReady(entry.texture);
  else if (!entry.failed) entry.waiting.push(onReady);
}

// Make a material for one kind of block face.
//   info   = an entry like the ones in TERRAIN_TEXTURES or SHIP_TEXTURES:
//            file, fallback color, and optionally:
//              under     = another image to paint first (for see-through images)
//              backColor = a color to paint first (for see-through images like glass)
//              boost     = brightness multiplier (for very dark images)
//              tint      = a color that is multiplied with the image (for example green glass)
//              opacity   = make the material see-through (0 to 1)
//   bright = brightness of this face (1 = full, lower = darker)
function makeBlockMaterial(info, bright) {
  const level = bright * (info.boost || 1);
  const tint = new THREE.Color(info.tint || "#ffffff");
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color(info.fallback).multiplyScalar(level),
  });
  if (info.opacity !== undefined) {
    material.transparent = true;
    material.opacity = info.opacity;
    material.depthWrite = false; // see-through cubes should not hide what is behind them
  }

  function showTexture(texture) {
    material.map = texture;
    material.color.copy(tint).multiplyScalar(level); // the picture's own colors (times the tint)
    material.needsUpdate = true;
  }

  if (info.under) {
    // See-through image (like the grass fringe): paint it on top of another image
    loadPixelTexture(info.under, function (underTexture) {
      loadPixelTexture(info.file, function (overlayTexture) {
        showTexture(stackTextures(underTexture, overlayTexture, null, info.grey));
      });
    });
  } else if (info.backColor || info.grey) {
    // Image that needs a plain color behind it (glass) and/or turning grey
    loadPixelTexture(info.file, function (overlayTexture) {
      showTexture(stackTextures(null, overlayTexture, info.backColor || null, info.grey));
    });
  } else {
    loadPixelTexture(info.file, showTexture);
  }
  return material;
}

// Paint a loaded texture on top of another texture (or a plain color)
// and return the combined texture. If "grey" is true, the top image is
// turned grey first (the see-through parts stay see-through).
function stackTextures(bottomTexture, topTexture, backColor, grey) {
  const size = topTexture.image.width;

  // Draw the top image on its own small canvas
  const layer = document.createElement("canvas");
  layer.width = size;
  layer.height = size;
  const layerContext = layer.getContext("2d");
  layerContext.imageSmoothingEnabled = false;
  layerContext.drawImage(topTexture.image, 0, 0, size, size);
  if (grey) {
    try {
      const picture = layerContext.getImageData(0, 0, size, size);
      const data = picture.data;
      for (let i = 0; i < data.length; i += 4) {
        const level = Math.round(data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
        data[i] = level;
        data[i + 1] = level;
        data[i + 2] = level;
      }
      layerContext.putImageData(picture, 0, 0);
    } catch (error) {
      console.warn("RocketCraft: could not turn a texture grey, using its normal colors.");
    }
  }

  // Put it on top of the back color / back texture
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  if (backColor) {
    ctx.fillStyle = backColor;
    ctx.fillRect(0, 0, size, size);
  } else if (bottomTexture) {
    ctx.drawImage(bottomTexture.image, 0, 0, size, size);
  }
  ctx.drawImage(layer, 0, 0);

  const combined = new THREE.CanvasTexture(canvas);
  combined.magFilter = THREE.NearestFilter;
  combined.minFilter = THREE.NearestFilter;
  combined.generateMipmaps = false;
  return combined;
}


const engineTexture = makePixelTexture({
  size: 8, seed: 88, base: COLORS.engine.base,
  speckles: [
    { color: COLORS.engine.dark, chance: 0.2 },
    { color: COLORS.engine.light, chance: 0.3 },
    { color: COLORS.engine.hot, chance: 0.1 },
  ],
});

const cloudTexture = makePixelTexture({
  size: 8, seed: 99, base: COLORS.cloud.base,
  speckles: [
    { color: COLORS.cloud.shade, chance: 0.25 },
    { color: COLORS.cloud.shade2, chance: 0.1 },
  ],
});

const sunTexture = makePixelTexture({
  size: 8, seed: 111, base: COLORS.sun.base,
  speckles: [
    { color: COLORS.sun.light, chance: 0.2 },
    { color: COLORS.sun.orange, chance: 0.2 },
    { color: COLORS.sun.hot, chance: 0.06 },
  ],
});

const moonTexture = makePixelTexture({
  size: 8, seed: 122, base: COLORS.moon.base,
  speckles: [
    { color: COLORS.moon.light, chance: 0.2 },
    { color: COLORS.moon.dark, chance: 0.15 },
    { color: COLORS.moon.crater, chance: 0.08 },
  ],
});

// ===============================================================
// 5. SKY, SUN, MOON AND STARS
// ===============================================================

// The sky is a tall thin canvas, repainted every frame with the current
// three colors (top, middle, horizon). Three.js stretches it over the screen.
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 2;
skyCanvas.height = 256;
const skyContext = skyCanvas.getContext("2d");
const skyTexture = new THREE.CanvasTexture(skyCanvas);
scene.background = skyTexture;

function paintSky(topColor, midColor, horizonColor) {
  const gradient = skyContext.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#" + topColor.getHexString());
  gradient.addColorStop(0.55, "#" + midColor.getHexString());
  gradient.addColorStop(1, "#" + horizonColor.getHexString());
  skyContext.fillStyle = gradient;
  skyContext.fillRect(0, 0, 2, 256);
  skyTexture.needsUpdate = true;
}

// A cube whose 6 faces have different brightness (top brightest), so the sun
// and moon read as 3D cubes. Face order: right, left, top, bottom, front, back.
const FACE_SHADES = [0.85, 0.85, 1.0, 0.7, 0.95, 0.7];

function makeCelestialCube(size, texture) {
  const materials = FACE_SHADES.map(function () {
    return new THREE.MeshBasicMaterial({ map: texture, fog: false });
  });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), materials);
  cube.rotation.set(0.5, 0.6, 0); // turned a bit so we can see the top and a side
  return { cube: cube, materials: materials };
}

// A flat see-through square placed behind the cube to make a soft blocky glow
function makeGlowSquare(size, opacity) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    fog: false,
  });
  const square = new THREE.Mesh(new THREE.BoxGeometry(size, size, 1), material);
  square.position.z = -6;
  return square;
}

// --- Sun ---
const sunGroup = new THREE.Group();
const sunParts = makeCelestialCube(6.5, sunTexture);
const sunGlowOuter = makeGlowSquare(15, 0.12);
const sunGlowInner = makeGlowSquare(11, 0.22);
sunGroup.add(sunGlowOuter, sunGlowInner, sunParts.cube);
camera.add(sunGroup); // attached to the camera, so it moves in screen space

// --- Moon (same idea, pale and bluish) ---
const moonGroup = new THREE.Group();
const moonParts = makeCelestialCube(5.5, moonTexture);
const moonGlowOuter = makeGlowSquare(13, 0.1);
const moonGlowInner = makeGlowSquare(9.5, 0.18);
moonGlowOuter.material.color.set(COLORS.moonGlow);
moonGlowInner.material.color.set(COLORS.moonGlow);
moonGroup.add(moonGlowOuter, moonGlowInner, moonParts.cube);
camera.add(moonGroup);
for (let i = 0; i < FACE_SHADES.length; i++) {
  moonParts.materials[i].color.setRGB(FACE_SHADES[i], FACE_SHADES[i], FACE_SHADES[i]);
}

// --- Stars: tiny cubes spread over the sky (only visible at night) ---
const starData = [];
for (let i = 0; i < SKY_OBJECTS.starCount; i++) {
  starData.push({
    x: Math.random() * 2 - 1,            // -1 (left edge) to +1 (right edge)
    y: -0.3 + Math.random() * 1.3,       // from just above the hills to the top
    size: 0.3 + Math.random() * 0.35,
  });
}
const starMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false,
});
const stars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), starMaterial, starData.length);
stars.frustumCulled = false;
camera.add(stars);

// How big the visible sky is, measured at the sun's distance. Set in placeSkyObjects().
const SUN_DISTANCE = 60;
const STAR_DISTANCE = 70;
const skySize = { halfWidth: 30, halfHeight: 28 };

// Called on every window resize: keeps stars spread over the whole screen
function placeSkyObjects() {
  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
  skySize.halfHeight = tanHalfFov * SUN_DISTANCE;
  skySize.halfWidth = skySize.halfHeight * camera.aspect;

  const starHalfHeight = tanHalfFov * STAR_DISTANCE;
  const starHalfWidth = starHalfHeight * camera.aspect;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < starData.length; i++) {
    dummy.position.set(starData[i].x * starHalfWidth, starData[i].y * starHalfHeight, -STAR_DISTANCE);
    dummy.scale.setScalar(starData[i].size);
    dummy.updateMatrix();
    stars.setMatrixAt(i, dummy.matrix);
  }
  stars.instanceMatrix.needsUpdate = true;
}

// ===============================================================
// 6. WINDOW RESIZE
// ===============================================================
function resizeGame() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Work out how much of the game plane (z = 0) the camera can see
  const distance = camera.position.z;
  const fovInRadians = (camera.fov * Math.PI) / 180;
  screen.halfHeight = Math.tan(fovInRadians / 2) * distance;
  screen.halfWidth = screen.halfHeight * camera.aspect;

  placeSkyObjects();
}
window.addEventListener("resize", resizeGame);
resizeGame();

// ===============================================================
// 7. THE PLAYER SHIP (built from the voxel design in SHIP_DESIGN)
// ===============================================================
// Glow strength from the time of day (1 = normal, bigger at night)
let glowBoost = 1;

// The ship's hitbox, measured from the voxel design in SHIP_DESIGN.
// It is the smallest box that fits all the cubes (side view), relative to the
// ship's center. buildShip() fills it in.
const shipHitbox = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

// Where bullets come out, relative to the ship's center (from muzzleRow in SHIP_DESIGN)
const shipMuzzle = { x: 0, y: 0 };

// Make the materials for one kind of ship cube (all 6 faces).
// Face order: right, left, top, bottom, front, back.
function makeShipMaterials(name) {
  if (name === "engine") {
    return new THREE.MeshBasicMaterial({ map: engineTexture }); // basic = always bright
  }
  const info = SHIP_TEXTURES[name] || { file: "default_stone.png", fallback: "#8c8c8c" };
  const side = makeBlockMaterial(info, FACE_BRIGHTNESS.side);
  return [
    side,                                          // right
    side,                                          // left
    makeBlockMaterial(info, FACE_BRIGHTNESS.top),  // top
    makeBlockMaterial(info, FACE_BRIGHTNESS.bottom), // bottom
    side,                                          // front
    side,                                          // back
  ];
}

function buildShip() {
  const ship = new THREE.Group();
  const cube = SHIP_DESIGN.cubeSize;
  const rowCount = SHIP_DESIGN.slices[0].rows.length;
  const columnCount = SHIP_DESIGN.slices[0].rows[0].length;

  // Turn a grid column / row into a position. The middle of the grid is (0, 0).
  function gridX(column) { return (column - (columnCount - 1) / 2) * cube; }
  function gridY(row) { return ((rowCount - 1) / 2 - row) * cube; }

  // Read the design: collect cube positions for each kind of cube
  const parts = {};
  let engineColumn = 0; // the column of the engine cube
  let minColumn = Infinity, maxColumn = -Infinity, minRow = Infinity, maxRow = -Infinity;
  for (const slice of SHIP_DESIGN.slices) {
    slice.rows.forEach(function (rowText, row) {
      for (let column = 0; column < rowText.length; column++) {
        const name = SHIP_DESIGN.legend[rowText[column]];
        if (!name) continue; // "." (or any letter not in the legend) = empty
        if (!parts[name]) parts[name] = [];
        if (name === "engine") engineColumn = column;
        for (const depth of slice.depth) {
          parts[name].push([gridX(column), gridY(row), depth * cube]);
        }
        minColumn = Math.min(minColumn, column);
        maxColumn = Math.max(maxColumn, column);
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    });
  }

  // Hitbox = the outer edges of the cubes we found
  shipHitbox.minX = gridX(minColumn) - cube / 2;
  shipHitbox.maxX = gridX(maxColumn) + cube / 2;
  shipHitbox.minY = gridY(maxRow) - cube / 2;
  shipHitbox.maxY = gridY(minRow) + cube / 2;
  shipMuzzle.x = shipHitbox.maxX + 0.35;
  shipMuzzle.y = gridY(SHIP_DESIGN.muzzleRow);

  // One InstancedMesh per kind of cube draws all of its cubes in a single go (fast)
  const geometry = new THREE.BoxGeometry(cube, cube, cube);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  for (const name in parts) {
    const list = parts[name];
    const mesh = new THREE.InstancedMesh(geometry, makeShipMaterials(name), list.length);
    for (let i = 0; i < list.length; i++) {
      dummy.position.set(list[i][0], list[i][1], list[i][2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Tiny brightness difference per cube, so no two look exactly alike
      const shade = 0.9 + Math.random() * 0.1;
      tint.setRGB(shade, shade, shade);
      mesh.setColorAt(i, tint);
    }
    mesh.castShadow = name !== "engine";
    mesh.frustumCulled = false;
    ship.add(mesh);
  }

  // --- Exhaust: a few glowing cubes behind the engine that flicker ---
  const backX = gridX(engineColumn) - cube / 2; // x of the back of the engine cube
  const engineY = gridY(SHIP_DESIGN.engineRow); // height of the engines
  // Normal (not additive) materials, so the glow can never wash out to white
  const exhaustMaterial = new THREE.MeshBasicMaterial({ map: engineTexture, fog: false });
  const exhaust = SHIP_DESIGN.exhaust.map(function (cell) {
    const piece = new THREE.Mesh(geometry, exhaustMaterial);
    piece.position.set(gridX(cell[0]), gridY(cell[1]), cell[2] * cube);
    piece.userData.distance = Math.max(1, engineColumn - cell[0]); // how far behind the engine
    ship.add(piece);
    return piece;
  });

  // --- Soft orange glow around the exhaust, and a little orange light ---
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(COLORS.engineGlow),
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    fog: false,
  });
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.8), glowMaterial);
  glow.position.set(backX - 0.6, engineY, 0);
  ship.add(glow);

  const engineLight = new THREE.PointLight(new THREE.Color(COLORS.engineGlow), 1.2, 9);
  engineLight.position.set(backX - 0.9, engineY, 0);
  ship.add(engineLight);

  // Keep handles so we can make the engine flicker every frame
  ship.userData.exhaust = exhaust;
  ship.userData.glowMaterial = glowMaterial;
  ship.userData.engineLight = engineLight;
  return ship;
}

const ship = buildShip();
ship.position.set(-screen.halfWidth * 0.6, 0, 0);
scene.add(ship);

// ===============================================================
// 8. KEYBOARD INPUT
// ===============================================================
// "keys" remembers which keys are being held down right now.
const keys = {};

window.addEventListener("keydown", function (event) {
  keys[event.code] = true;
  // Stop the page from scrolling when pressing arrows or space
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  // Debug: T jumps to the next time-of-day phase
  if (event.code === "KeyT" && !event.repeat) {
    jumpToNextPhase();
  }
  // Enter restarts after Game Over
  if (event.code === "Enter" && game.state === "gameover") {
    restartGame();
  }
});

window.addEventListener("keyup", function (event) {
  keys[event.code] = false;
});

function isLeft()  { return keys["ArrowLeft"]  || keys["KeyA"]; }
function isRight() { return keys["ArrowRight"] || keys["KeyD"]; }
function isUp()    { return keys["ArrowUp"]    || keys["KeyW"]; }
function isDown()  { return keys["ArrowDown"]  || keys["KeyS"]; }
function isShooting() { return keys["Space"]; }

// ===============================================================
// 9. MOVING THE SHIP
// ===============================================================
let shipTilt = 0; // current nose tilt (radians), eases toward the target

function updateShip(dt) {
  // Work out direction: -1, 0 or 1 on each axis
  let moveX = 0;
  let moveY = 0;
  if (isLeft())  moveX -= 1;
  if (isRight()) moveX += 1;
  if (isDown())  moveY -= 1;
  if (isUp())    moveY += 1;

  // Moving diagonally shouldn't be faster than moving straight
  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  ship.position.x += moveX * SHIP_SPEED * dt;
  ship.position.y += moveY * SHIP_SPEED * dt;

  // Keep the whole ship (its hitbox) inside the screen and above the ground
  const minX = -screen.halfWidth - shipHitbox.minX;
  const maxX = screen.halfWidth - shipHitbox.maxX;
  const minY = PLAY_FLOOR + 0.4 - shipHitbox.minY;
  const maxY = screen.halfHeight - 1 - shipHitbox.maxY;
  ship.position.x = Math.min(maxX, Math.max(minX, ship.position.x));
  ship.position.y = Math.min(maxY, Math.max(minY, ship.position.y));

  // Tilt the nose a little when going up or down (eases in and out)
  const targetTilt = moveY * 0.2;
  shipTilt += (targetTilt - shipTilt) * Math.min(1, dt * 10);
  ship.rotation.z = shipTilt;

  // Flicker the exhaust cubes, glow and light (stronger at night via glowBoost)
  const grow = 1 + 0.25 * (glowBoost - 1);
  for (const piece of ship.userData.exhaust) {
    const distance = piece.userData.distance;
    // Cubes farther behind the engine show up less often and are smaller
    if (Math.random() < 1 - 0.15 * distance) {
      piece.visible = true;
      piece.scale.setScalar((0.8 - 0.14 * distance + Math.random() * 0.3) * grow);
    } else {
      piece.visible = false;
    }
  }
  ship.userData.glowMaterial.opacity = Math.min(0.55, (0.13 + Math.random() * 0.1) * glowBoost);
  ship.userData.engineLight.intensity = (1.0 + Math.random() * 0.5) * glowBoost;
}

// ===============================================================
// 10. BULLETS (bright yellow with a small glow)
// ===============================================================
const bullets = [];          // all bullets currently flying
let shootTimer = 0;          // counts down until we can shoot again

// Shared shapes and materials for every bullet (saves memory)
const bulletCoreGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.2);
const bulletHotGeometry = new THREE.BoxGeometry(0.5, 0.09, 0.09);
const bulletGlowGeometry = new THREE.BoxGeometry(1.2, 0.55, 0.55);
const bulletCoreMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.bulletCore), fog: false });
const bulletHotMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.bulletHot), fog: false });
const bulletGlowMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(COLORS.bulletGlow),
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  fog: false,
});

function shootBullet() {
  // A bullet is a small group: yellow core + white-hot middle + soft glow
  const bullet = new THREE.Group();
  bullet.add(new THREE.Mesh(bulletCoreGeometry, bulletCoreMaterial));
  bullet.add(new THREE.Mesh(bulletHotGeometry, bulletHotMaterial));
  const glow = new THREE.Mesh(bulletGlowGeometry, bulletGlowMaterial);
  glow.scale.setScalar(1 + 0.35 * (glowBoost - 1)); // bigger glow at night
  bullet.add(glow);
  bullet.position.set(ship.position.x + shipMuzzle.x, ship.position.y + shipMuzzle.y, 0); // just in front of the nose
  scene.add(bullet);
  bullets.push(bullet);
}

function updateBullets(dt) {
  // Count down the cooldown, and shoot if Space is held
  shootTimer -= dt;
  if (isShooting() && shootTimer <= 0 && game.state === "playing") {
    shootBullet();
    shootTimer = SHOOT_COOLDOWN;
  }

  // Move bullets right; remove the ones that left the screen.
  // We loop backwards so removing an item doesn't skip the next one.
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.x += BULLET_SPEED * dt;
    if (bullet.position.x > screen.halfWidth + 2) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
}

// ===============================================================
// 11. SCROLLING TERRAIN (instanced, textured)
// ===============================================================
// The ground is a row of "columns". Each column is a stack of cubes:
// stone at the bottom, dirt in the middle, grass on top.
// Columns slide left. When one leaves the screen, it jumps to the right
// end with a new height, so the ground never runs out.
//
// To keep things fast, all cubes of one kind (grass, dirt or stone) are
// drawn together as ONE "InstancedMesh" instead of hundreds of meshes.

const MAX_LAYERS = 5; // tallest a column can be (in cubes)

// Materials shared by all terrain. A cube has 6 faces, in this order:
// right, left, top, bottom, front, back.

// A grass block has 3 different looks: grass top, grass side, and dirt underneath
const grassSideMaterial = makeBlockMaterial(TERRAIN_TEXTURES.grassSide, FACE_BRIGHTNESS.side);
const grassBlockMaterials = [
  grassSideMaterial,                                                                  // right
  grassSideMaterial,                                                                  // left
  makeBlockMaterial(TERRAIN_TEXTURES.grassTop, FACE_BRIGHTNESS.top),                // top
  makeBlockMaterial(TERRAIN_TEXTURES.dirt, FACE_BRIGHTNESS.bottom),                 // bottom
  grassSideMaterial,                                                                  // front
  grassSideMaterial,                                                                  // back
];
// Dirt and stone cubes use the same picture on every face
const dirtBlockMaterial = makeBlockMaterial(TERRAIN_TEXTURES.dirt, FACE_BRIGHTNESS.side);
const stoneBlockMaterial = makeBlockMaterial(TERRAIN_TEXTURES.stone, FACE_BRIGHTNESS.side);

function createTerrain(settings) {
  const count = settings.columnCount;
  const size = settings.blockSize;
  const totalWidth = count * size;
  const capacity = count * MAX_LAYERS;

  // Information for each column
  const columnX = [];        // x position
  const columnHeight = [];   // how many cubes tall
  const columnShade = [];    // small brightness difference per cube

  const tint = new THREE.Color(settings.tint);
  const colorHelper = new THREE.Color();
  const dummy = new THREE.Object3D();

  // The three instanced meshes
  const geometry = new THREE.BoxGeometry(size, size, settings.depth);
  const meshes = {
    grass: new THREE.InstancedMesh(geometry, grassBlockMaterials, capacity),
    dirt: new THREE.InstancedMesh(geometry, dirtBlockMaterial, capacity),
    stone: new THREE.InstancedMesh(geometry, stoneBlockMaterial, capacity),
  };
  for (const name in meshes) {
    const mesh = meshes[name];
    mesh.castShadow = settings.castShadow;
    mesh.receiveShadow = settings.receiveShadow;
    mesh.frustumCulled = false;
    mesh.setColorAt(0, colorHelper.setRGB(1, 1, 1)); // makes sure colors are switched on
    scene.add(mesh);
  }

  // Pick a new height close to the previous one so the ground looks smooth
  let lastHeight = Math.ceil(settings.maxHeight / 2);
  function nextHeight() {
    const change = Math.floor(Math.random() * 3) - 1; // -1, 0 or +1
    lastHeight = Math.min(settings.maxHeight, Math.max(1, lastHeight + change));
    return lastHeight;
  }

  function newShades(columnIndex) {
    for (let layer = 0; layer < MAX_LAYERS; layer++) {
      columnShade[columnIndex * MAX_LAYERS + layer] = 0.85 + Math.random() * 0.2;
    }
  }

  for (let i = 0; i < count; i++) {
    columnX.push(-totalWidth / 2 + i * size);
    columnHeight.push(nextHeight());
    newShades(i);
  }

  // Place every cube of every column into the instanced meshes
  function rebuild() {
    const used = { grass: 0, dirt: 0, stone: 0 };

    for (let c = 0; c < count; c++) {
      const height = columnHeight[c];
      for (let layer = 0; layer < height; layer++) {
        // What kind of cube is this?
        let kind = "dirt";
        if (layer === height - 1) kind = "grass";
        else if (layer < 2) kind = "stone";

        const mesh = meshes[kind];
        const index = used[kind]++;

        dummy.position.set(columnX[c], settings.baseY + size / 2 + layer * size, settings.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);

        const shade = columnShade[c * MAX_LAYERS + layer];
        colorHelper.setRGB(shade * tint.r, shade * tint.g, shade * tint.b);
        mesh.setColorAt(index, colorHelper);
      }
    }

    for (const name in meshes) {
      const mesh = meshes[name];
      mesh.count = used[name];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    }
  }
  rebuild();

  // Called every frame
  function update(dt) {
    for (let c = 0; c < count; c++) {
      columnX[c] -= settings.speed * dt;
      // Off the left side? Jump to the right end with a new height.
      if (columnX[c] < -totalWidth / 2) {
        columnX[c] += totalWidth;
        columnHeight[c] = nextHeight();
        newShades(c);
      }
    }
    rebuild();
  }

  return { update: update };
}

// Distant hills: slower, bluish tint, no shadows, and the fog fades them into the sky
const farTerrain = createTerrain({
  columnCount: 90,
  blockSize: 1.2,
  depth: 6,
  z: -12,
  baseY: -12,
  maxHeight: 5,
  speed: FAR_TERRAIN_SPEED,
  tint: "#b4d0ee",
  castShadow: false,
  receiveShadow: false,
});

// Near ground: this is the one that catches the ship's shadow
const nearTerrain = createTerrain({
  columnCount: 60,
  blockSize: 1,
  depth: 6,
  z: -1,
  baseY: -10,
  maxHeight: 4,
  speed: TERRAIN_SPEED,
  tint: "#ffffff",
  castShadow: true,
  receiveShadow: true,
});

// ===============================================================
// 12. BLOCKY CLOUDS (drift slowly to the left)
// ===============================================================
const cloudMaterial = new THREE.MeshLambertMaterial({
  map: cloudTexture,
  emissive: new THREE.Color("#4d5870"), // keeps the shaded sides from going too dark (set by time of day)
  fog: false,                           // clouds are not fogged
});
const cloudGeometry = new THREE.BoxGeometry(1, 1, 1);
const cloudWrapDistance = 60; // clouds loop around when they pass this far left
const clouds = [];

function buildCloud() {
  const cloud = new THREE.Group();
  const blockSize = 1.5 + Math.random() * 1.5;
  const length = 3 + Math.floor(Math.random() * 4);

  for (let i = 0; i < length; i++) {
    // Bottom row
    const bottom = new THREE.Mesh(cloudGeometry, cloudMaterial);
    bottom.scale.set(blockSize, blockSize, blockSize * 1.6);
    bottom.position.set(i * blockSize, 0, 0);
    cloud.add(bottom);

    // A few bumps on top (not on the very ends)
    if (i > 0 && i < length - 1 && Math.random() < 0.65) {
      const top = new THREE.Mesh(cloudGeometry, cloudMaterial);
      top.scale.set(blockSize, blockSize, blockSize * 1.2);
      top.position.set(i * blockSize, blockSize, 0);
      cloud.add(top);
    }
  }

  cloud.position.set(
    -cloudWrapDistance + Math.random() * cloudWrapDistance * 2,
    3 + Math.random() * 10,
    -10 - Math.random() * 14
  );
  cloud.userData.speed = CLOUDS.minSpeed + Math.random() * (CLOUDS.maxSpeed - CLOUDS.minSpeed);
  scene.add(cloud);
  clouds.push(cloud);
}

for (let i = 0; i < CLOUDS.count; i++) buildCloud();

function updateClouds(dt) {
  for (const cloud of clouds) {
    cloud.position.x -= cloud.userData.speed * dt;
    if (cloud.position.x < -cloudWrapDistance) {
      cloud.position.x += cloudWrapDistance * 2;
    }
  }
}

// ===============================================================
// 12b. ENEMIES, COLLISIONS, SCORE, LIVES (step 2)
// ===============================================================
// How it works:
//  * Saucers are built from the voxel designs in ENEMY_DESIGNS.
//  * To keep things fast, saucers are REUSED ("pooling"): when one dies or
//    leaves the screen it goes back to a pool, and is reused for the next spawn.
//  * Hits are checked with simple boxes (side view): bullet vs saucer,
//    and saucer vs your ship (using shipHitbox).

const game = {
  state: "playing",                    // "playing" or "gameover"
  score: 0,
  lives: GAME_RULES.startLives,
  invulnerable: 0,                     // seconds left of flickering after a hit
  spawnTimer: 1.5,                     // seconds until the next saucer
};

// --- On-screen text (score, lives, game over message) ---
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const gameOverElement = document.getElementById("gameover");
const finalScoreElement = document.getElementById("finalScore");
let lastScoreText = "";
let lastLivesText = "";

function updateHud() {
  const scoreText = "Score " + String(game.score).padStart(6, "0");
  if (scoreElement && scoreText !== lastScoreText) {
    scoreElement.textContent = scoreText;
    lastScoreText = scoreText;
  }
  const livesText = "Lives " + "♥ ".repeat(Math.max(0, game.lives)).trim();
  if (livesElement && livesText !== lastLivesText) {
    livesElement.textContent = livesText;
    lastLivesText = livesText;
  }
}

// --- Shared things (made once, used by every saucer) ---
const enemyWindowMaterial = new THREE.MeshBasicMaterial({
  map: makePixelTexture({
    size: 8, seed: 133, base: ENEMY_COLORS.window.base,
    speckles: [
      { color: ENEMY_COLORS.window.dark, chance: 0.2 },
      { color: ENEMY_COLORS.window.light, chance: 0.15 },
    ],
  }),
  fog: false,
});

const barSegmentGeometry = new THREE.BoxGeometry(0.22, 0.14, 0.05);
const barMaterials = {
  green: new THREE.MeshBasicMaterial({ color: ENEMY_COLORS.barGreen, fog: false }),
  yellow: new THREE.MeshBasicMaterial({ color: ENEMY_COLORS.barYellow, fog: false }),
  red: new THREE.MeshBasicMaterial({ color: ENEMY_COLORS.barRed, fog: false }),
  empty: new THREE.MeshBasicMaterial({ color: ENEMY_COLORS.barEmpty, fog: false }),
};

const enemyCubeGeometries = {}; // one cube shape per cube size

const enemyPools = { scout: [], standard: [], heavy: [] }; // saucers waiting to be reused
const activeEnemies = [];                                   // saucers flying right now

// --- Build one saucer from its voxel design ---
function buildEnemy(typeName) {
  const type = ENEMY_TYPES[typeName];
  const design = ENEMY_DESIGNS[typeName];
  const cube = design.cubeSize;
  const rowCount = design.slices[0].rows.length;
  const columnCount = design.slices[0].rows[0].length;

  function gridX(column) { return (column - (columnCount - 1) / 2) * cube; }
  function gridY(row) { return ((rowCount - 1) / 2 - row) * cube; }

  // Read the design: collect cube positions for each kind of cube
  const parts = {};
  let minColumn = Infinity, maxColumn = -Infinity, minRow = Infinity, maxRow = -Infinity;
  for (const slice of design.slices) {
    slice.rows.forEach(function (rowText, row) {
      for (let column = 0; column < rowText.length; column++) {
        const kind = ENEMY_LEGEND[rowText[column]];
        if (!kind) continue; // "." = empty
        if (!parts[kind]) parts[kind] = [];
        for (const depth of slice.depth) {
          parts[kind].push([gridX(column), gridY(row), depth * cube]);
        }
        minColumn = Math.min(minColumn, column);
        maxColumn = Math.max(maxColumn, column);
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    });
  }

  // Each saucer gets its OWN materials (so one saucer can flash without the others).
  // The windows share one material, so they all glow the same.
  const materials = {
    dome: makeBlockMaterial(ENEMY_TEXTURES.dome, 1),
    rimUpper: makeBlockMaterial(ENEMY_TEXTURES.rimUpper, 1),
    rimLower: makeBlockMaterial(ENEMY_TEXTURES.rimLower, 1),
    hull: makeBlockMaterial(ENEMY_TEXTURES.hull, 1),
    leg: makeBlockMaterial(ENEMY_TEXTURES.leg, 1),
    window: enemyWindowMaterial,
  };

  if (!enemyCubeGeometries[cube]) enemyCubeGeometries[cube] = new THREE.BoxGeometry(cube, cube, cube);
  const geometry = enemyCubeGeometries[cube];
  const group = new THREE.Group();
  const dummy = new THREE.Object3D();
  for (const kind in parts) {
    const list = parts[kind];
    const mesh = new THREE.InstancedMesh(geometry, materials[kind], list.length);
    for (let i = 0; i < list.length; i++) {
      dummy.position.set(list[i][0], list[i][1], list[i][2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  // The hitbox: the smallest box around the cubes (side view)
  const box = {
    minX: gridX(minColumn) - cube / 2,
    maxX: gridX(maxColumn) + cube / 2,
    minY: gridY(maxRow) - cube / 2,
    maxY: gridY(minRow) + cube / 2,
  };

  // The hit-point bar: one small segment per hit point, floating above the saucer
  const barGroup = new THREE.Group();
  const segments = [];
  const spacing = 0.27;
  for (let i = 0; i < type.hp; i++) {
    const segment = new THREE.Mesh(barSegmentGeometry, barMaterials.empty);
    segment.position.x = (i - (type.hp - 1) / 2) * spacing;
    barGroup.add(segment);
    segments.push(segment);
  }
  barGroup.position.set(0, box.maxY + 0.5, 0);
  barGroup.visible = false;
  group.add(barGroup);

  return {
    typeName: typeName,
    type: type,
    group: group,
    flashMaterials: [materials.dome, materials.rimUpper, materials.rimLower, materials.hull, materials.leg],
    box: box,
    bar: { group: barGroup, segments: segments, timer: 0 },
    hp: type.hp,
    x: 0, y: 0, baseY: 0, phase: 0, age: 0, push: 0, flash: 0,
  };
}

// --- The hit-point bar: green, then yellow, then red as it gets low ---
function updateHpBar(enemy) {
  let color = barMaterials.green;
  if (enemy.hp <= 1) color = barMaterials.red;
  else if (enemy.hp / enemy.type.hp <= 0.5) color = barMaterials.yellow;

  enemy.bar.segments.forEach(function (segment, i) {
    segment.material = i < enemy.hp ? color : barMaterials.empty;
  });
}

function setFlash(enemy, amount) {
  for (const material of enemy.flashMaterials) {
    material.emissive.setRGB(amount, amount, amount);
  }
}

// --- Spawning and removing saucers ---
function pickEnemyType() {
  const options = [];
  let total = 0;
  for (const name in ENEMY_TYPES) {
    if (game.score >= ENEMY_TYPES[name].fromScore) {
      options.push(name);
      total += ENEMY_TYPES[name].spawnWeight;
    }
  }
  let roll = Math.random() * total;
  for (const name of options) {
    roll -= ENEMY_TYPES[name].spawnWeight;
    if (roll <= 0) return name;
  }
  return options[0];
}

function spawnEnemy(typeName) {
  const type = ENEMY_TYPES[typeName];
  const enemy = enemyPools[typeName].pop() || buildEnemy(typeName);

  enemy.hp = type.hp;
  enemy.age = 0;
  enemy.push = 0;
  enemy.flash = 0;
  enemy.phase = Math.random() * Math.PI * 2;
  enemy.bar.timer = 0;
  enemy.bar.group.visible = false;
  setFlash(enemy, 0);

  // Random height (room left for the up-and-down wave)
  const minY = PLAY_FLOOR + 0.6 - enemy.box.minY + type.waveAmplitude;
  const maxY = screen.halfHeight - 1.5 - enemy.box.maxY - type.waveAmplitude;
  enemy.baseY = minY + Math.random() * Math.max(0.1, maxY - minY);
  enemy.y = enemy.baseY;
  enemy.x = screen.halfWidth + 1 - enemy.box.minX; // just outside the right edge

  enemy.group.position.set(enemy.x, enemy.y, 0);
  scene.add(enemy.group);
  activeEnemies.push(enemy);
}

// Put a saucer back in its pool (it stops existing in the world)
function releaseEnemy(enemy) {
  scene.remove(enemy.group);
  const index = activeEnemies.indexOf(enemy);
  if (index !== -1) activeEnemies.splice(index, 1);
  enemyPools[enemy.typeName].push(enemy);
}

// --- Debris: little cubes that fly apart when something breaks ---
const debrisList = [];
const debrisMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0xffffff }),
  GAME_RULES.maxDebris
);
debrisMesh.frustumCulled = false;
debrisMesh.setColorAt(0, new THREE.Color(1, 1, 1)); // makes sure colors are switched on (must come BEFORE count = 0)
debrisMesh.count = 0;                               // nothing to draw yet
scene.add(debrisMesh);
const debrisDummy = new THREE.Object3D();
const debrisColor = new THREE.Color();

function spawnDebris(x, y, count, colors, sizeScale) {
  for (let i = 0; i < count; i++) {
    if (debrisList.length >= GAME_RULES.maxDebris) return;
    debrisList.push({
      x: x + (Math.random() - 0.5) * 1.2 * sizeScale,
      y: y + (Math.random() - 0.5) * 0.8 * sizeScale,
      z: (Math.random() - 0.5) * 1.2,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * 6 + 1,
      vz: (Math.random() - 0.5) * 5,
      spinX: Math.random() * 6,
      spinY: Math.random() * 6,
      size: (0.12 + Math.random() * 0.16) * sizeScale,
      life: 0.7 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function updateDebris(dt) {
  for (let i = debrisList.length - 1; i >= 0; i--) {
    const piece = debrisList[i];
    piece.life -= dt;
    if (piece.life <= 0) {
      debrisList[i] = debrisList[debrisList.length - 1];
      debrisList.pop();
      continue;
    }
    piece.vy -= 14 * dt; // gravity
    piece.x += piece.vx * dt;
    piece.y += piece.vy * dt;
    piece.z += piece.vz * dt;
  }

  // Write the positions into the instanced mesh
  for (let i = 0; i < debrisList.length; i++) {
    const piece = debrisList[i];
    debrisDummy.position.set(piece.x, piece.y, piece.z);
    debrisDummy.rotation.set(piece.life * piece.spinX, piece.life * piece.spinY, 0);
    debrisDummy.scale.setScalar(piece.size * Math.min(1, piece.life / 0.3)); // shrink at the end
    debrisDummy.updateMatrix();
    debrisMesh.setMatrixAt(i, debrisDummy.matrix);
    debrisMesh.setColorAt(i, debrisColor.set(piece.color));
  }
  debrisMesh.count = debrisList.length;
  debrisMesh.instanceMatrix.needsUpdate = true;
  debrisMesh.instanceColor.needsUpdate = true;
}

// --- Hitting and breaking saucers ---
function breakEnemy(enemy, awardScore) {
  spawnDebris(enemy.x, enemy.y, enemy.type.debris, ENEMY_COLORS.debris, 1);
  if (awardScore) {
    game.score += enemy.type.score;
    updateHud();
  }
  releaseEnemy(enemy);
}

function damageEnemy(enemy) {
  enemy.hp -= 1;
  if (enemy.hp <= 0) {
    breakEnemy(enemy, true);
    return;
  }
  enemy.flash = GAME_RULES.hitFlashSeconds;   // flash white
  enemy.push = GAME_RULES.hitPushback;        // pushed back a little
  enemy.bar.timer = GAME_RULES.hpBarSeconds;  // show the bar
  updateHpBar(enemy);
}

// --- Your ship: losing lives, game over, restart ---
const shipDebrisColors = ["#6e5b4b", "#8a8078", "#4e3b2a", "#d8c08e"];

function hurtShip(enemy) {
  game.lives -= 1;
  game.invulnerable = GAME_RULES.invulnerableSeconds;
  spawnDebris(ship.position.x, ship.position.y, 8, shipDebrisColors, 0.8);
  breakEnemy(enemy, false); // the saucer that hit you breaks (no points)
  updateHud();
  if (game.lives <= 0) gameOver();
}

function gameOver() {
  game.state = "gameover";
  ship.visible = false;
  spawnDebris(ship.position.x, ship.position.y, 30, shipDebrisColors, 1);
  for (const bullet of bullets) scene.remove(bullet);
  bullets.length = 0;
  if (finalScoreElement) finalScoreElement.textContent = "Score " + String(game.score).padStart(6, "0");
  if (gameOverElement) gameOverElement.style.display = "block";
}

function restartGame() {
  while (activeEnemies.length > 0) releaseEnemy(activeEnemies[0]);
  for (const bullet of bullets) scene.remove(bullet);
  bullets.length = 0;
  debrisList.length = 0;

  game.state = "playing";
  game.score = 0;
  game.lives = GAME_RULES.startLives;
  game.invulnerable = 0;
  game.spawnTimer = 1.5;

  ship.visible = true;
  ship.position.set(-screen.halfWidth * 0.6, 0, 0);
  shipTilt = 0;
  if (gameOverElement) gameOverElement.style.display = "none";
  updateHud();
}

// --- Called every frame ---
function boxesOverlap(minA, maxA, minB, maxB) {
  return minA < maxB && maxA > minB;
}

function updateGame(dt) {
  const playing = game.state === "playing";

  // 1. Spawn new saucers (the gap gets shorter as the score goes up)
  if (playing) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      if (activeEnemies.length < GAME_RULES.maxEnemiesOnScreen) {
        spawnEnemy(pickEnemyType());
      }
      const interval = Math.max(
        GAME_RULES.minSpawnInterval,
        GAME_RULES.startSpawnInterval - (game.score / 1000) * GAME_RULES.speedUpPer1000
      );
      game.spawnTimer = interval * (0.8 + Math.random() * 0.4);
    }
  }

  // 2. Move saucers, flash, hit-point bars, windows
  const windowLevel = ENEMY_WINDOW_GLOW.day + ENEMY_WINDOW_GLOW.perBoost * (glowBoost - 1);
  enemyWindowMaterial.color.setRGB(windowLevel, windowLevel, windowLevel);

  for (let i = activeEnemies.length - 1; i >= 0; i--) {
    const enemy = activeEnemies[i];
    const type = enemy.type;

    enemy.age += dt;
    enemy.x -= type.speed * dt;
    enemy.x += enemy.push * dt;
    enemy.push *= Math.exp(-8 * dt); // the push fades out quickly
    enemy.y = enemy.baseY + Math.sin(enemy.age * type.waveSpeed + enemy.phase) * type.waveAmplitude;
    enemy.group.position.set(enemy.x, enemy.y, 0);

    if (enemy.flash > 0) {
      enemy.flash -= dt;
      setFlash(enemy, Math.max(0, enemy.flash) / GAME_RULES.hitFlashSeconds * 0.8);
    }

    if (enemy.bar.timer > 0) {
      enemy.bar.timer -= dt;
      enemy.bar.group.visible = enemy.bar.timer > 0;
      enemy.bar.group.quaternion.copy(camera.quaternion); // always faces the camera
    }

    // Left the screen: back to the pool
    if (enemy.x + enemy.box.maxX < -screen.halfWidth - 2) {
      releaseEnemy(enemy);
    }
  }

  // 3. Collisions
  if (playing) {
    // Bullets hit saucers
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
      const enemy = activeEnemies[i];
      const left = enemy.x + enemy.box.minX;
      const right = enemy.x + enemy.box.maxX;
      const bottom = enemy.y + enemy.box.minY;
      const top = enemy.y + enemy.box.maxY;
      for (let b = bullets.length - 1; b >= 0; b--) {
        const bullet = bullets[b];
        const bx = bullet.position.x;
        const by = bullet.position.y;
        if (boxesOverlap(bx - 0.4, bx + 0.4, left, right) &&
            boxesOverlap(by - 0.12, by + 0.12, bottom, top)) {
          scene.remove(bullet);
          bullets.splice(b, 1);
          damageEnemy(enemy);
          break; // this saucer may be gone now, go to the next one
        }
      }
    }

    // Saucers hit your ship (not while flickering)
    if (game.invulnerable > 0) {
      game.invulnerable -= dt;
      ship.visible = Math.floor(game.invulnerable * 12) % 2 === 0; // flicker
      if (game.invulnerable <= 0) ship.visible = true;
    } else {
      const shipLeft = ship.position.x + shipHitbox.minX;
      const shipRight = ship.position.x + shipHitbox.maxX;
      const shipBottom = ship.position.y + shipHitbox.minY;
      const shipTop = ship.position.y + shipHitbox.maxY;
      for (let i = activeEnemies.length - 1; i >= 0; i--) {
        const enemy = activeEnemies[i];
        if (boxesOverlap(shipLeft, shipRight, enemy.x + enemy.box.minX, enemy.x + enemy.box.maxX) &&
            boxesOverlap(shipBottom, shipTop, enemy.y + enemy.box.minY, enemy.y + enemy.box.maxY)) {
          hurtShip(enemy);
          break; // one hit at a time
        }
      }
    }
  }

  // 4. Broken cubes
  updateDebris(dt);
}

updateHud();

// ===============================================================
// 13. TIME OF DAY
// ===============================================================
// How it works, step by step:
//   1. We read the real clock (hour + minutes) -> "target hour".
//   2. "shownHour" follows the target hour. Normally they are the same.
//      After pressing T, shownHour fast-forwards so the sky sweeps smoothly.
//   3. From shownHour we pick the phase and blend with the next/previous phase.
//   4. We apply the blended look to the sky, lights, fog, clouds, sun/moon, glow.

const phases = TIME_OF_DAY.phases;
const phaseCount = phases.length;

// --- Turn the look settings (text colors) into real Three.js colors, once ---
function parseLook(source) {
  const look = {};
  for (const key in source) {
    look[key] = typeof source[key] === "string" ? new THREE.Color(source[key]) : source[key];
  }
  return look;
}
const parsedLooks = phases.map(function (phase) { return parseLook(phase.look); });
const currentLook = parseLook(phases[0].look); // the blended result, reused every frame

// Mix look a and look b. amount 0 = all a, 1 = all b. Result goes into "out".
function mixLooks(a, b, amount, out) {
  for (const key in out) {
    if (out[key].isColor) {
      out[key].copy(a[key]).lerp(b[key], amount);
    } else {
      out[key] = a[key] + (b[key] - a[key]) * amount;
    }
  }
}

function smoothStep(x) {
  return x * x * (3 - 2 * x);
}

// Hours helpers. The day starts at the first phase (morning), so hours before
// that (for example 3:00) are treated as "27:00" to keep night in one piece.
function unwrapHour(hour) {
  return hour < phases[0].start ? hour + 24 : hour;
}
function phaseStart(i) { return phases[i].start; }
function phaseEnd(i) { return i < phaseCount - 1 ? phases[i + 1].start : phases[0].start + 24; }
function phaseLength(i) { return phaseEnd(i) - phaseStart(i); }

function getPhaseIndex(hour) {
  const h = unwrapHour(hour);
  for (let i = 0; i < phaseCount; i++) {
    if (h >= phaseStart(i) && h < phaseEnd(i)) return i;
  }
  return phaseCount - 1;
}

// Work out the blended look for an hour and store it in currentLook
function computeLook(hour) {
  const h = unwrapHour(hour);
  const i = getPhaseIndex(hour);
  const next = (i + 1) % phaseCount;
  const previous = (i + phaseCount - 1) % phaseCount;
  const start = phaseStart(i);
  const end = phaseEnd(i);
  const halfBlend = TIME_OF_DAY.blendHours / 2;

  // The blend zone is centered on the phase boundary (half before, half after)
  const halfAtEnd = Math.min(halfBlend, phaseLength(i) / 2, phaseLength(next) / 2);
  const halfAtStart = Math.min(halfBlend, phaseLength(i) / 2, phaseLength(previous) / 2);

  if (h > end - halfAtEnd) {
    const t = (h - (end - halfAtEnd)) / (2 * halfAtEnd);      // 0 .. 0.5
    mixLooks(parsedLooks[i], parsedLooks[next], smoothStep(t), currentLook);
  } else if (h < start + halfAtStart) {
    const t = 0.5 + (h - start) / (2 * halfAtStart);          // 0.5 .. 1
    mixLooks(parsedLooks[previous], parsedLooks[i], smoothStep(t), currentLook);
  } else {
    mixLooks(parsedLooks[i], parsedLooks[i], 0, currentLook);
  }
}

// --- The clock ---
function realHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}
function wrapHour(hour) {
  return ((hour % 24) + 24) % 24;
}

// Debug: ?hour=20 in the address sets the hour (the clock keeps running from there)
let hourOffset = 0;                       // added to the real clock
const hourFromUrl = parseFloat(new URLSearchParams(window.location.search).get("hour"));
if (isFinite(hourFromUrl)) {
  hourOffset = hourFromUrl - realHour();
}
let shownHour = wrapHour(realHour() + hourOffset);

// Debug: T key. Jump to the middle of the next phase.
function jumpToNextPhase() {
  const current = getPhaseIndex(wrapHour(realHour() + hourOffset));
  const next = (current + 1) % phaseCount;
  const middle = (phaseStart(next) + phaseEnd(next)) / 2;
  hourOffset = middle - realHour();
}

// --- Sun and moon position: they travel in an arc across the sky ---
// progress 0 = left horizon, 0.5 = top of the sky, 1 = right horizon
const sunriseHour = phases[0].start;
const sunsetHour = phases[phaseCount - 1].start; // night begins when the sun sets

function arcPosition(group, progress) {
  const clamped = Math.min(1, Math.max(0, progress));
  const angle = Math.PI * clamped;
  group.position.set(
    -Math.cos(angle) * skySize.halfWidth * 0.75,
    skySize.halfHeight * (-0.6 + 1.4 * Math.sin(angle)), // starts hidden behind the hills
    -SUN_DISTANCE
  );
  return angle;
}

// Where the light comes from for a given arc angle (low angle = long shadows)
function lightPositionFor(angle, target) {
  target.set(-Math.cos(angle) * 16, 1.5 + Math.sin(angle) * 14, 9);
  return target;
}

// Reusable objects (so we don't create new ones every frame)
const sunLightPosition = new THREE.Vector3();
const moonLightPosition = new THREE.Vector3();
const lightColorHelper = new THREE.Color();
const tintHelper = new THREE.Color();

let lastLabel = "";
const phaseLabel = document.getElementById("phase");

function updateTimeOfDay(dt, instant) {
  // 1. Follow the real clock. shownHour chases the target (only moves forward).
  const targetHour = wrapHour(realHour() + hourOffset);
  let difference = wrapHour(targetHour - shownHour);
  if (instant || difference > 23.9) {
    shownHour = targetHour;
  } else if (difference > 0.0005) {
    shownHour = wrapHour(shownHour + Math.min(difference, TIME_OF_DAY.sweepHoursPerSecond * dt));
  }

  // 2. Blend the phases
  computeLook(shownHour);
  const look = currentLook;
  const h = unwrapHour(shownHour);

  // 3. Sky and fog
  paintSky(look.skyTop, look.skyMid, look.skyHorizon);
  if (scene.fog) scene.fog.color.copy(look.fog);

  // 4. Sun and moon (blocky cubes in the sky)
  const sunProgress = (h - sunriseHour) / (sunsetHour - sunriseHour);
  const moonProgress = (h - sunsetHour) / (sunriseHour + 24 - sunsetHour);
  const sunIsUp = h >= sunriseHour && h < sunsetHour;
  const moonIsUp = h >= sunsetHour; // unwrapHour keeps early-morning hours above this
  sunGroup.visible = sunIsUp;
  moonGroup.visible = moonIsUp;
  const sunAngle = arcPosition(sunGroup, sunProgress);
  const moonAngle = arcPosition(moonGroup, moonProgress);
  sunParts.cube.rotation.y += dt * 0.25; // slow spin so the cube faces catch the light
  moonParts.cube.rotation.y += dt * 0.15;

  // Sun colors (the cube faces keep different brightness, tinted by the time of day)
  for (let i = 0; i < FACE_SHADES.length; i++) {
    sunParts.materials[i].color.setRGB(
      FACE_SHADES[i] * look.sunTint.r, FACE_SHADES[i] * look.sunTint.g, FACE_SHADES[i] * look.sunTint.b
    );
  }
  sunGlowOuter.material.color.copy(look.sunGlow);
  sunGlowInner.material.color.copy(look.sunGlow);

  // 5. Stars (fade in at night, with a tiny twinkle)
  starMaterial.opacity = look.starOpacity * (0.85 + 0.15 * Math.sin(performance.now() / 700));
  stars.visible = look.starOpacity > 0.01;

  // 6. Lights. One directional light does both sun and moon:
  //    it sits where the stronger one is, and mixes their colors.
  lightPositionFor(sunAngle, sunLightPosition);
  lightPositionFor(moonAngle, moonLightPosition);
  const sunStrength = look.sunIntensity;
  const moonStrength = look.moonIntensity;
  const totalStrength = sunStrength + moonStrength;
  if (totalStrength > 0.001) {
    sunLight.position.copy(sunLightPosition).multiplyScalar(sunStrength)
      .addScaledVector(moonLightPosition, moonStrength)
      .normalize().multiplyScalar(SKY_OBJECTS.lightDistance);
    lightColorHelper.copy(look.sunColor).lerp(look.moonColor, moonStrength / totalStrength);
    sunLight.color.copy(lightColorHelper);
  }
  sunLight.intensity = totalStrength;

  hemiLight.color.copy(look.hemiSky);
  hemiLight.groundColor.copy(look.hemiGround);
  hemiLight.intensity = look.hemiIntensity;

  // 7. Clouds
  cloudMaterial.color.copy(look.cloudTint);
  cloudMaterial.emissive.copy(look.cloudEmissive);

  // 8. Glow of the engine and bullets (stronger at night)
  glowBoost = look.glowBoost;
  bulletGlowMaterial.opacity = Math.min(0.9, 0.35 * glowBoost);

  // 9. Little text in the corner (only touched when it changes)
  const hours = Math.floor(shownHour);
  const minutes = Math.floor((shownHour - hours) * 60);
  const label = phases[getPhaseIndex(shownHour)].name + "  " +
    String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") +
    "  (T = next phase)";
  if (label !== lastLabel && phaseLabel) {
    phaseLabel.textContent = label;
    lastLabel = label;
  }
}

updateTimeOfDay(0, true); // set the right look before the first frame

// ===============================================================
// 14. THE GAME LOOP
// ===============================================================
// This function runs about 60 times per second.
const clock = new THREE.Clock();

function gameLoop() {
  requestAnimationFrame(gameLoop);

  // dt = seconds since the last frame (capped so lag spikes don't cause jumps)
  const dt = Math.min(clock.getDelta(), 0.05);

  updateTimeOfDay(dt, false);
  if (game.state === "playing") updateShip(dt);
  updateBullets(dt);
  updateGame(dt);
  updateClouds(dt);
  farTerrain.update(dt);
  nearTerrain.update(dt);

  renderer.render(scene, camera);
}

gameLoop();
