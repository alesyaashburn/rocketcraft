// RocketCraft - step 1: scene, camera, player ship, shooting, scrolling terrain.
// Everything is built from simple colored cubes. No images or sounds.

// ---------------------------------------------------------------
// 1. SETTINGS (change these numbers to tweak the game)
// ---------------------------------------------------------------
const SHIP_SPEED = 10;          // how fast the ship moves
const BULLET_SPEED = 28;        // how fast bullets fly right
const SHOOT_COOLDOWN = 0.15;    // seconds between shots
const TERRAIN_SPEED = 5;        // how fast the ground scrolls left
const FAR_TERRAIN_SPEED = 2;    // distant hills scroll slower (feels deeper)

// ---------------------------------------------------------------
// 2. SCENE, CAMERA, RENDERER
// ---------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec8ff); // sky blue

// Camera looks at the game plane from the side, tilted a tiny bit
// so we can see the top and sides of the cubes (that's the "2.5D" look).
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 3, 22);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
document.getElementById("game").appendChild(renderer.domElement);

// Lights: soft light everywhere + a "sun" so cube sides have different shades
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(-5, 10, 8);
scene.add(sun);

// The edges of the screen (in game units). Updated when the window resizes.
const screen = { halfWidth: 18, halfHeight: 10 };

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
}
window.addEventListener("resize", resizeGame);
resizeGame();

// ---------------------------------------------------------------
// 3. HELPER: make a colored cube
// ---------------------------------------------------------------
function makeBlock(width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshLambertMaterial({ color: color });
  return new THREE.Mesh(geometry, material);
}

// ---------------------------------------------------------------
// 4. THE PLAYER SHIP (a group of cubes, nose pointing right)
// ---------------------------------------------------------------
function buildShip() {
  const ship = new THREE.Group();

  const body = makeBlock(2.2, 0.7, 0.9, 0xd9dde3); // main body (light gray)
  ship.add(body);

  const nose = makeBlock(0.7, 0.4, 0.5, 0xe84a4a); // red nose
  nose.position.set(1.45, 0, 0);
  ship.add(nose);

  const cockpit = makeBlock(0.8, 0.4, 0.5, 0x4ad8ff); // blue glass
  cockpit.position.set(0.2, 0.5, 0);
  ship.add(cockpit);

  const wings = makeBlock(1.0, 0.15, 2.4, 0xe84a4a); // wide red wings
  wings.position.set(-0.4, -0.1, 0);
  ship.add(wings);

  const tail = makeBlock(0.6, 0.6, 0.15, 0xe84a4a); // tail fin
  tail.position.set(-1.0, 0.5, 0);
  ship.add(tail);

  const engine = makeBlock(0.4, 0.4, 0.6, 0xffa11a); // orange engine glow
  engine.position.set(-1.3, 0, 0);
  engine.material = new THREE.MeshBasicMaterial({ color: 0xffa11a });
  ship.add(engine);

  // Keep a handle on the engine so we can make it flicker later
  ship.userData.engine = engine;
  return ship;
}

const ship = buildShip();
ship.position.set(-screen.halfWidth * 0.6, 0, 0);
scene.add(ship);

// ---------------------------------------------------------------
// 5. KEYBOARD INPUT
// ---------------------------------------------------------------
// "keys" remembers which keys are being held down right now.
const keys = {};

window.addEventListener("keydown", function (event) {
  keys[event.code] = true;
  // Stop the page from scrolling when pressing arrows or space
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
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

// ---------------------------------------------------------------
// 6. MOVING THE SHIP
// ---------------------------------------------------------------
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

  // Keep the ship inside the screen (and above the ground)
  const minX = -screen.halfWidth + 1.8;
  const maxX = screen.halfWidth - 1.8;
  const minY = -4;
  const maxY = screen.halfHeight - 2;
  ship.position.x = Math.min(maxX, Math.max(minX, ship.position.x));
  ship.position.y = Math.min(maxY, Math.max(minY, ship.position.y));

  // Tilt the nose a little when going up or down
  ship.rotation.z = moveY * 0.25;

  // Flicker the engine glow
  ship.userData.engine.scale.x = 0.8 + Math.random() * 0.6;
}

// ---------------------------------------------------------------
// 7. BULLETS
// ---------------------------------------------------------------
const bullets = [];          // all bullets currently flying
let shootTimer = 0;          // counts down until we can shoot again

// One shared shape and color for every bullet (saves memory)
const bulletGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.2);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xfff04a });

function shootBullet() {
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
  bullet.position.set(ship.position.x + 1.9, ship.position.y, 0);
  scene.add(bullet);
  bullets.push(bullet);
}

function updateBullets(dt) {
  // Count down the cooldown, and shoot if Space is held
  shootTimer -= dt;
  if (isShooting() && shootTimer <= 0) {
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

// ---------------------------------------------------------------
// 8. SCROLLING TERRAIN
// ---------------------------------------------------------------
// The ground is a row of "columns". Each column is a stack of cubes.
// Columns slide left. When one leaves the screen, it jumps to the right
// end with a new height, so the ground never runs out.

const MAX_LAYERS = 5; // tallest a column can be (in cubes)

function createTerrain(settings) {
  const columns = [];
  const totalWidth = settings.columnCount * settings.blockSize;
  let lastHeight = Math.ceil(settings.maxHeight / 2);

  // Pick a new height close to the previous one so the ground looks smooth
  function nextHeight() {
    const change = Math.floor(Math.random() * 3) - 1; // -1, 0 or +1
    lastHeight = Math.min(settings.maxHeight, Math.max(1, lastHeight + change));
    return lastHeight;
  }

  // Show/hide cubes in a column to match a height, and color them
  function setColumnHeight(column, height) {
    for (let layer = 0; layer < MAX_LAYERS; layer++) {
      const block = column.blocks[layer];
      block.visible = layer < height;
      const isTop = layer === height - 1;
      const color = isTop ? settings.topColor : (layer < 2 ? settings.deepColor : settings.sideColor);
      block.material.color.setHex(color);
    }
  }

  for (let i = 0; i < settings.columnCount; i++) {
    const column = new THREE.Group();
    column.blocks = [];
    for (let layer = 0; layer < MAX_LAYERS; layer++) {
      const size = settings.blockSize;
      const block = makeBlock(size, size, settings.depth, 0xffffff);
      block.position.y = settings.baseY + size / 2 + layer * size;
      column.add(block);
      column.blocks.push(block);
    }
    column.position.x = -totalWidth / 2 + i * settings.blockSize;
    column.position.z = settings.z;
    setColumnHeight(column, nextHeight());
    scene.add(column);
    columns.push(column);
  }

  // Called every frame
  function update(dt) {
    for (const column of columns) {
      column.position.x -= settings.speed * dt;
      // Off the left side? Jump to the right end with a new height.
      if (column.position.x < -totalWidth / 2) {
        column.position.x += totalWidth;
        setColumnHeight(column, nextHeight());
      }
    }
  }

  return { update: update };
}

// Distant hills (dark, slow, far behind the ship)
const farTerrain = createTerrain({
  columnCount: 90,
  blockSize: 1.2,
  depth: 3,
  z: -12,
  baseY: -12,
  maxHeight: 5,
  speed: FAR_TERRAIN_SPEED,
  topColor: 0x4f8a6a,
  sideColor: 0x4a7a8c,
  deepColor: 0x3f6a7a,
});

// Near ground (grass on top, dirt and stone below)
const nearTerrain = createTerrain({
  columnCount: 60,
  blockSize: 1,
  depth: 3,
  z: 0,
  baseY: -10,
  maxHeight: 4,
  speed: TERRAIN_SPEED,
  topColor: 0x5fbf4a,
  sideColor: 0x8b5a2b,
  deepColor: 0x7d7d85,
});

// ---------------------------------------------------------------
// 9. THE GAME LOOP
// ---------------------------------------------------------------
// This function runs about 60 times per second.
const clock = new THREE.Clock();

function gameLoop() {
  requestAnimationFrame(gameLoop);

  // dt = seconds since the last frame (capped so lag spikes don't cause jumps)
  const dt = Math.min(clock.getDelta(), 0.05);

  updateShip(dt);
  updateBullets(dt);
  farTerrain.update(dt);
  nearTerrain.update(dt);

  renderer.render(scene, camera);
}

gameLoop();
