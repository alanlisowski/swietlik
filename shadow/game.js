const lamp = document.getElementById('lamp');
const lightMask = document.getElementById('lightMask');
const spider1 = document.getElementById('spider1');
const spider2 = document.getElementById('spider2');
const treasureEl = document.getElementById('treasure');
const staminaFill = document.getElementById('staminaFill');
const statusBox = document.getElementById('status');
const statusTitle = document.getElementById('statusTitle');
const tentacleCanvas = document.getElementById('tentacles');
const tctx = tentacleCanvas.getContext('2d');

const settings = {
  baseLight: 240,
  sprintLight: 320,
  minLight: 170,
  energyDrain: 0.55,
  energyRegen: 0.35,
  loseDistance: 32,
  winDistance: 48
};

function randomPoint(margin = 100) {
  return {
    x: margin + Math.random() * (window.innerWidth - margin * 2),
    y: margin + Math.random() * (window.innerHeight - margin * 2)
  };
}

function initTentacleChains(spider, count = 10) {
  const chains = [];
  for (let i = 0; i < count; i++) {
    const segCount = 6 + Math.floor(Math.random() * 3);
    const lengths = Array.from({ length: segCount }, () => 26 + Math.random() * 28);
    const nodes = Array.from({ length: segCount + 1 }, () => ({ x: 0, y: 0 }));
    chains.push({
      lengths,
      nodes,
      widthBase: 7 + Math.random() * 4,
      target: { x: 0, y: 0 },
      cooldown: 0,
      pull: { x: 0, y: 0 }
    });
  }
  spider.tentacles = chains;
}

const spiders = [
  { el: spider1, x: 120, y: 120, vx: 0, vy: 0, dir: 0, speed: 170, type: 'reckless', state: 'patrol', target: randomPoint(), detect: 260 },
  { el: spider2, x: 480, y: 360, vx: 0, vy: 0, dir: 0, speed: 140, type: 'stalker', state: 'patrol', target: randomPoint(), detect: 240 }
];

initTentacleChains(spiders[0], 12);
initTentacleChains(spiders[1], 12);

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let energy = 1;
let isSprintHeld = false;
let isSprinting = false;
let gameOver = false;
let lastTime = null;
let treasure = { x: window.innerWidth * 0.7, y: window.innerHeight * 0.6 };

function clampCursorToViewport() {
  cursorX = Math.max(0, Math.min(window.innerWidth, cursorX));
  cursorY = Math.max(0, Math.min(window.innerHeight, cursorY));
  lamp.style.left = cursorX + 'px';
  lamp.style.top = cursorY + 'px';
}

function placeTreasure() {
  const margin = 80;
  treasure.x = margin + Math.random() * (window.innerWidth - margin * 2);
  treasure.y = margin + Math.random() * (window.innerHeight - margin * 2);
  treasureEl.style.left = treasure.x + 'px';
  treasureEl.style.top = treasure.y + 'px';
}

function updateLightMask(radiusOverride) {
  const radius = radiusOverride || settings.baseLight;
  lightMask.style.setProperty('--lx', `${cursorX}px`);
  lightMask.style.setProperty('--ly', `${cursorY}px`);
  lightMask.style.setProperty('--lr', `${radius}px`);
  const intensity = 0.8 + Math.min(0.6, energy * 0.6);
  lightMask.style.setProperty('--li', intensity.toFixed(2));
}

window.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  clampCursorToViewport();
});

window.addEventListener('mousedown', () => { isSprintHeld = true; });
window.addEventListener('mouseup', () => { isSprintHeld = false; });

window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') isSprintHeld = true;
  if (e.key.toLowerCase() === 'r') resetGame();
});
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') isSprintHeld = false; });

window.addEventListener('resize', () => {
  clampCursorToViewport();
  placeTreasure();
  updateLightMask();
  spiders.forEach(sp => sp.target = randomPoint());
  resizeTentacleCanvas();
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function retargetTentacle(chain, spider) {
  const biasX = spider.state === 'chase' ? (cursorX - spider.x) * 0.35 : 0;
  const biasY = spider.state === 'chase' ? (cursorY - spider.y) * 0.35 : 0;
  const range = spider.state === 'chase' ? 260 : 160;
  chain.target.x = biasX + (Math.random() * 2 - 1) * range;
  chain.target.y = biasY + (Math.random() * 2 - 1) * range;
  chain.cooldown = 0.35 + Math.random() * 0.9;
}

function updateTentacleChain(chain, spider, dt) {
  chain.cooldown -= dt;
  if (chain.cooldown <= 0) retargetTentacle(chain, spider);

  const tip = chain.nodes[chain.nodes.length - 1];
  const followRate = Math.min(1, 12 * dt);
  tip.x = lerp(tip.x, chain.target.x, followRate);
  tip.y = lerp(tip.y, chain.target.y, followRate);

  for (let i = chain.nodes.length - 2; i >= 0; i--) {
    const dx = chain.nodes[i].x - chain.nodes[i + 1].x;
    const dy = chain.nodes[i].y - chain.nodes[i + 1].y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const diff = (dist - chain.lengths[i]) / dist;
    chain.nodes[i].x -= dx * diff;
    chain.nodes[i].y -= dy * diff;
  }

  chain.nodes[0].x = 0;
  chain.nodes[0].y = 0;
  for (let i = 1; i < chain.nodes.length; i++) {
    const dx = chain.nodes[i].x - chain.nodes[i - 1].x;
    const dy = chain.nodes[i].y - chain.nodes[i - 1].y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const scale = chain.lengths[i - 1] / dist;
    chain.nodes[i].x = chain.nodes[i - 1].x + dx * scale;
    chain.nodes[i].y = chain.nodes[i - 1].y + dy * scale;
  }

  chain.pull = { x: tip.x * 0.2, y: tip.y * 0.2 };
}

function resolveSpiderCollisions() {
  const minDist = 60;
  for (let i = 0; i < spiders.length; i++) {
    for (let j = i + 1; j < spiders.length; j++) {
      const dx = spiders[j].x - spiders[i].x;
      const dy = spiders[j].y - spiders[i].y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < minDist) {
        const overlap = (minDist - dist) * 0.6;
        const nx = dx / dist;
        const ny = dy / dist;
        spiders[i].x -= nx * overlap;
        spiders[i].y -= ny * overlap;
        spiders[j].x += nx * overlap;
        spiders[j].y += ny * overlap;
        spiders[i].vx -= nx * 40; spiders[i].vy -= ny * 40;
        spiders[j].vx += nx * 40; spiders[j].vy += ny * 40;
      }
    }
  }
}

function drawTentacles() {
  tctx.clearRect(0, 0, tentacleCanvas.width, tentacleCanvas.height);
  tctx.lineCap = 'round';
  tctx.lineJoin = 'round';
  spiders.forEach(spider => {
    if (!spider.tentacles) return;
    spider.tentacles.forEach(chain => {
      for (let i = 0; i < chain.nodes.length - 1; i++) {
        const a = chain.nodes[i];
        const b = chain.nodes[i + 1];
        const ax = spider.x + a.x;
        const ay = spider.y + a.y;
        const bx = spider.x + b.x;
        const by = spider.y + b.y;
        const width = Math.max(1.5, chain.widthBase * (1 - i / chain.nodes.length));
        tctx.strokeStyle = `rgba(255,255,255,${spider.state === 'chase' ? 0.9 : 0.7})`;
        tctx.lineWidth = width;
        tctx.beginPath();
        tctx.moveTo(ax, ay);
        tctx.lineTo(bx, by);
        tctx.stroke();
      }
      const tip = chain.nodes[chain.nodes.length - 1];
      const tx = spider.x + tip.x;
      const ty = spider.y + tip.y;
      tctx.fillStyle = 'rgba(255,255,255,0.5)';
      tctx.beginPath();
      tctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
      tctx.fill();
    });
  });
}

function updateSpiders(dt) {
  const dtSafe = dt || 1 / 60;
  spiders.forEach((spider, index) => {
    const dx = cursorX - spider.x;
    const dy = cursorY - spider.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (distance < spider.detect) {
      spider.state = 'chase';
      spider.el.style.opacity = 0.22;
    } else if (spider.state === 'chase' && distance > spider.detect * 1.3) {
      spider.state = 'patrol';
      spider.target = randomPoint();
      spider.el.style.opacity = 0.1;
    }

    let targetX = spider.state === 'chase' ? cursorX : (spider.target?.x ?? spider.x);
    let targetY = spider.state === 'chase' ? cursorY : (spider.target?.y ?? spider.y);

    const distToTarget = Math.hypot(targetX - spider.x, targetY - spider.y);
    if (spider.state === 'patrol' && distToTarget < 40) {
      spider.target = randomPoint();
      targetX = spider.target.x;
      targetY = spider.target.y;
    }

    const tdx = targetX - spider.x;
    const tdy = targetY - spider.y;

    if (spider.type === 'reckless') {
      const wobbleX = Math.sin(performance.now() * 0.004 + index) * 26;
      const wobbleY = Math.cos(performance.now() * 0.003 + index) * 22;
      const chaos = Math.sin(performance.now() * 0.008 + index * 1.7) * 0.25;
      const aimDx = tdx + wobbleX + dx * 0.1;
      const aimDy = tdy + wobbleY + dy * 0.1;
      const aimDist = Math.hypot(aimDx, aimDy) || 1;
      const speed = spider.speed * (spider.state === 'chase' ? 1.4 : 0.6) * (isSprinting ? 1.05 : 1);
      const inertia = 0.17;
      spider.vx = lerp(spider.vx, (aimDx / aimDist) * speed, inertia);
      spider.vy = lerp(spider.vy, (aimDy / aimDist) * speed, inertia);
      spider.dir = Math.atan2(spider.vy, spider.vx) + chaos;
    } else {
      const predict = spider.state === 'chase' ? Math.min(0.55, distance / 650) : 0.25;
      const aimX = targetX + dx * predict;
      const aimY = targetY + dy * predict;
      const aimDx = aimX - spider.x;
      const aimDy = aimY - spider.y;
      const aimDist = Math.hypot(aimDx, aimDy) || 1;
      const farBoost = distance > 240 ? 1.2 : 1;
      const speed = spider.speed * (spider.state === 'chase' ? 1.25 : 0.65) * farBoost * (isSprinting ? 1.02 : 1);
      const smooth = Math.min(1, 7 * dtSafe);
      spider.vx = lerp(spider.vx, (aimDx / aimDist) * speed, smooth);
      spider.vy = lerp(spider.vy, (aimDy / aimDist) * speed, smooth);
      spider.dir = Math.atan2(spider.vy, spider.vx);
    }

    spider.x += spider.vx * dtSafe;
    spider.y += spider.vy * dtSafe;

    const scale = spider.state === 'chase' ? 1.05 : 1;
    spider.el.style.left = spider.x + 'px';
    spider.el.style.top = spider.y + 'px';
    spider.el.style.transform = `translate(-50%, -50%) rotate(${spider.dir * 180 / Math.PI + 90}deg) scale(${scale})`;

    let pullX = 0;
    let pullY = 0;
    spider.tentacles?.forEach(chain => {
      updateTentacleChain(chain, spider, dtSafe);
      pullX += chain.pull.x;
      pullY += chain.pull.y;
    });
    spider.vx += pullX * 0.08;
    spider.vy += pullY * 0.08;
  });

  resolveSpiderCollisions();
}

function updateLampAndLight(dt) {
  if (isSprintHeld && energy > 0.05) {
    energy = Math.max(0, energy - settings.energyDrain * dt);
    isSprinting = true;
  } else {
    energy = Math.min(1, energy + settings.energyRegen * dt);
    isSprinting = false;
  }

  const fatigueLoss = (1 - energy) * (settings.baseLight - settings.minLight);
  const targetRadius = (isSprinting ? settings.sprintLight : settings.baseLight) - fatigueLoss;
  updateLightMask(targetRadius);

  staminaFill.style.transform = `scaleX(${energy.toFixed(3)})`;
}

function checkWinLose() {
  const distToTreasure = Math.hypot(cursorX - treasure.x, cursorY - treasure.y);
  if (!gameOver && distToTreasure < settings.winDistance) {
    endGame('Znalazles skarb!');
  }

  spiders.forEach(spider => {
    const dist = Math.hypot(cursorX - spider.x, cursorY - spider.y);
    if (!gameOver && dist < settings.loseDistance) {
      endGame('Zlapany przez pajaki!');
    }
  });
}

function endGame(text) {
  gameOver = true;
  statusTitle.textContent = text;
  statusBox.classList.add('show');
}

function resetGame() {
  gameOver = false;
  energy = 1;
  isSprintHeld = false;
  isSprinting = false;
  statusBox.classList.remove('show');
  spiders[0].x = 120; spiders[0].y = 120; spiders[0].vx = spiders[0].vy = 0; spiders[0].dir = 0; spiders[0].state = 'patrol'; spiders[0].target = randomPoint(); spiders[0].el.style.opacity = 0.1;
  spiders[1].x = Math.max(200, window.innerWidth - 180);
  spiders[1].y = Math.max(200, window.innerHeight - 160);
  spiders[1].vx = spiders[1].vy = 0; spiders[1].dir = 0; spiders[1].state = 'patrol'; spiders[1].target = randomPoint(); spiders[1].el.style.opacity = 0.1;
  spiders.forEach(sp => {
    sp.tentacles?.forEach(chain => {
      chain.nodes.forEach(n => { n.x = 0; n.y = 0; });
      retargetTentacle(chain, sp);
    });
  });
  placeTreasure();
  clampCursorToViewport();
}

function resizeTentacleCanvas() {
  tentacleCanvas.width = window.innerWidth;
  tentacleCanvas.height = window.innerHeight;
}

function tick(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (!gameOver) {
    updateLampAndLight(dt);
    updateSpiders(dt);
    checkWinLose();
  }

  drawTentacles();
  requestAnimationFrame(tick);
}

placeTreasure();
clampCursorToViewport();
updateLightMask(settings.baseLight);
resizeTentacleCanvas();
requestAnimationFrame(tick);
