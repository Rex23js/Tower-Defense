// js/engine.js
import { getWaves } from "./api.js";
import { WaveManager } from "./wave-manager.js";
import { Enemy, Tower } from "./entities.js";
import { GAME_CONFIG } from "./game-config.js";

export let GameAPI = null;

const DEFAULTS = {
  startGold: GAME_CONFIG.startGold,
  startLives: GAME_CONFIG.startLives,
};

const PATH_SAMPLE_PER_SEG = GAME_CONFIG.pathSamplePerSeg;
const PATH_RADIUS_BLOCK = GAME_CONFIG.pathRadiusBlock;

// Catmull-Rom helpers (mantidos)
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
}

function buildSmoothPath(waypoints, segmentsPerCurve = PATH_SAMPLE_PER_SEG) {
  if (!waypoints || waypoints.length < 2) return [...(waypoints || [])];
  const pts = [];
  const extended = [
    waypoints[0],
    ...waypoints,
    waypoints[waypoints.length - 1],
  ];
  for (let i = 1; i < extended.length - 2; i++) {
    const p0 = extended[i - 1];
    const p1 = extended[i];
    const p2 = extended[i + 1];
    const p3 = extended[i + 2];
    for (let s = 0; s < segmentsPerCurve; s++) {
      const t = s / segmentsPerCurve;
      pts.push(catmullRom(p0, p1, p2, p3, t));
    }
  }
  pts.push(waypoints[waypoints.length - 1]);
  return pts;
}

function buildPathDistances(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return { points, cumulative: cum, total: cum[cum.length - 1] };
}

function samplePointAtDistance(pathObj, distance) {
  const { points, cumulative } = pathObj;
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (distance <= 0) return points[0];
  if (distance >= pathObj.total) return points[points.length - 1];
  let low = 0;
  let high = cumulative.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (cumulative[mid] <= distance && distance <= cumulative[mid + 1]) {
      const a = points[mid];
      const b = points[mid + 1];
      const segLen = cumulative[mid + 1] - cumulative[mid];
      const t = segLen === 0 ? 0 : (distance - cumulative[mid]) / segLen;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    if (cumulative[mid] < distance) low = mid + 1;
    else high = mid - 1;
  }
  return points[points.length - 1];
}

function distanceToPath(point, pathPoints) {
  let best = Infinity;
  for (const q of pathPoints) {
    const d = Math.hypot(point.x - q.x, point.y - q.y);
    if (d < best) best = d;
  }
  return best;
}

// ---- engine (init) ----
export async function initEngine(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = 960;
  canvas.height = 640;

  // Novo caminho inspirado na imagem: da direita para esquerda com curvas quadradas
  const waypoints = [
    // BASE (esquerda - final do caminho)
    { x: 60, y: canvas.height - 80 },

    // Primeira seção horizontal
    { x: 200, y: canvas.height - 80 },

    // Curva para cima
    { x: 200, y: canvas.height - 200 },

    // Seção horizontal para direita
    { x: 350, y: canvas.height - 200 },

    // Curva para cima
    { x: 350, y: canvas.height - 350 },

    // Seção para esquerda
    { x: 180, y: canvas.height - 350 },

    // Curva para cima
    { x: 180, y: 200 },

    // Seção longa para direita
    { x: 500, y: 200 },

    // Curva para baixo
    { x: 500, y: 350 },

    // Seção para direita
    { x: 700, y: 350 },

    // Curva final para cima em direção ao spawn
    { x: 700, y: 120 },

    // SPAWN POINT (direita - início do caminho)
    { x: canvas.width - 40, y: 120 },
  ];

  // Usar menos amostras para manter as curvas mais quadradas
  const pathPoints = waypoints; //buildSmoothPath(waypoints, 4);
  const pathObj = buildPathDistances(pathPoints);

  const base = {
    centerX: waypoints[0].x,
    centerY: waypoints[0].y,
    width: GAME_CONFIG.base.width,
    height: GAME_CONFIG.base.height,
    hp: GAME_CONFIG.base.hp,
  };

  const state = {
    enemies: [],
    towers: [],
    gold: DEFAULTS.startGold,
    lives: DEFAULTS.startLives,
    currentWave: 0,
    waves: [],
    running: true,
    selectedTowerType: null,
    canvas,
    pathPoints,
    pathObj,
    waypoints,
    base,
    decorations: [],
  };

  // gerar decorações (pedras/cactos) fora do caminho
  function seedDecorations() {
    const decs = [];
    const tries = 90;
    for (let i = 0; i < tries; i++) {
      const px = 40 + Math.random() * (canvas.width - 80);
      const py = 40 + Math.random() * (canvas.height - 80);
      const d = distanceToPath({ x: px, y: py }, state.pathPoints);
      // só coloca se estiver distante o suficiente do caminho e da base
      if (d > PATH_RADIUS_BLOCK + 30) {
        const r = 6 + Math.random() * 20;
        decs.push({
          x: px,
          y: py,
          r,
          type: Math.random() > 0.85 ? "cactus" : "rock",
        });
      }
    }
    state.decorations = decs;
  }
  seedDecorations();

  const waveManager = new WaveManager();

  // Public API para UI
  GameAPI = {
    placeTowerAt: (x, y, type) => {
      const towerConfig = GAME_CONFIG.towerTypes[type];
      if (!towerConfig) return { ok: false, reason: "tipo inválido" };
      if (state.gold < towerConfig.cost)
        return { ok: false, reason: "ouro insuficiente" };

      // impede construir sobre o base box
      const baseLeft = state.base.centerX - state.base.width / 2;
      const baseRight = state.base.centerX + state.base.width / 2;
      const baseTop = state.base.centerY - state.base.height / 2;
      const baseBottom = state.base.centerY + state.base.height / 2;
      if (x >= baseLeft && x <= baseRight && y >= baseTop && y <= baseBottom) {
        return { ok: false, reason: "não pode construir sobre a base" };
      }

      // impede construir sobre o caminho
      const dToPath = distanceToPath({ x, y }, state.pathPoints);
      if (dToPath < PATH_RADIUS_BLOCK)
        return { ok: false, reason: "não pode construir no caminho" };

      state.gold -= towerConfig.cost;
      state.towers.push(new Tower(x, y, type));
      return { ok: true };
    },

    selectTowerType: (type) => {
      state.selectedTowerType = type;
    },

    startNextWave: () => waveManager.startNextWave(state),

    togglePause: () => (state.running = !state.running),

    setAutoWaves: (enabled) => waveManager.setAutoWaves(enabled),

    getWaveStatus: () => waveManager.getStatus(),

    getState: () => state,
  };

  // carregar waves via API
  try {
    state.waves = await getWaves();
  } catch (e) {
    console.warn("Falha ao carregar waves; usando fallback", e);
    state.waves = [
      {
        id: 1,
        enemies: [
          { type: "basic", count: 6 },
          { type: "fast", count: 2 },
        ],
        goldReward: 30,
      },
      {
        id: 2,
        enemies: [
          { type: "basic", count: 8 },
          { type: "fast", count: 4 },
        ],
        goldReward: 45,
      },
      {
        id: 3,
        enemies: [
          { type: "basic", count: 10 },
          { type: "tank", count: 2 },
        ],
        goldReward: 60,
      },
      {
        id: 4,
        enemies: [
          { type: "fast", count: 12 },
          { type: "basic", count: 6 },
        ],
        goldReward: 80,
      },
      {
        id: 5,
        enemies: [
          { type: "tank", count: 4 },
          { type: "fast", count: 8 },
        ],
        goldReward: 120,
      },
    ];
  }

  waveManager.initialize(state.waves);

  // override spawnEnemy para usar Enemy importada
  waveManager.spawnEnemy = (type, gameState) => {
    const startDistance = gameState.pathObj.total + 24 + Math.random() * 60;
    const e = new Enemy(type, startDistance, gameState.pathObj);
    gameState.enemies.push(e);
  };

  // Desenhar grid de fundo
  function drawGrid(ctx) {
    const step = 32;
    ctx.save();
    // very subtle grid
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#ffffff";
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Desenhar decorações (pedras / cactos)
  function renderDecorations(ctx) {
    for (const d of state.decorations) {
      if (d.type === "rock") {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r, d.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // cactus (simple)
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(d.x - 4, d.y - 10, 8, 20);
        ctx.fillRect(d.x - 10, d.y - 6, 6, 4);
        ctx.fillRect(d.x + 4, d.y - 6, 6, 4);
        ctx.restore();
      }
    }
  }

  // render path com estilo mais quadrado e preto/branco
  function renderPath(ctx, pathPoints) {
    if (!pathPoints || pathPoints.length < 2) return;
    ctx.save();

    // Caminho principal mais largo e escuro
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++)
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);

    ctx.lineWidth = 50; // Caminho mais largo
    ctx.strokeStyle = "#1a1a1a"; // Cinza muito escuro
    ctx.lineCap = "square";
    ctx.lineJoin = "miter"; // Junções quadradas
    ctx.stroke();

    // Bordas brancas para contraste
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++)
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);

    ctx.lineWidth = 54; // Ligeiramente maior para criar borda
    ctx.strokeStyle = "#ffffff";
    ctx.globalCompositeOperation = "destination-over";
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";

    // Linha central pontilhada sutil
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++)
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function renderBase(ctx, base) {
    const left = base.centerX - base.width / 2;
    const top = base.centerY - base.height / 2;

    ctx.save();

    // Base principal
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(left, top, base.width, base.height);

    // Borda branca
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(left, top, base.width, base.height);

    // Detalhes internos
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(left + 20, top + 40, base.width - 40, 20);
    ctx.fillRect(left + 40, top + 20, 20, base.height - 40);

    ctx.restore();
  }

  // update & render
  let last = performance.now();

  function update(dt) {
    if (!state.running) return;

    waveManager.update(dt, state);

    for (const en of state.enemies) {
      const res = en.update(dt);
      if (res === "reached_base") state.lives -= 1;
    }

    for (const t of state.towers) t.update(dt, state);

    const before = state.enemies.length;
    state.enemies = state.enemies.filter((e) => !e.dead);
    const killed = before - state.enemies.length;
    if (killed > 0) {
      // reward already applied in tower.fire
    }

    // HUD updates
    const goldEl = document.getElementById("gold");
    const livesEl = document.getElementById("lives");
    const waveEl = document.getElementById("wave");
    if (goldEl) goldEl.textContent = `Ouro: ${state.gold}`;
    if (livesEl) livesEl.textContent = `Vidas: ${state.lives}`;
    if (waveEl) {
      const st = waveManager.getStatus();
      waveEl.textContent = `Wave: ${st.currentWave}/${st.totalWaves}`;
    }

    if (state.lives <= 0) {
      state.running = false;
      console.info("Game Over");
    }
  }

  function render(ctx) {
    // background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = GAME_CONFIG.visual.backgroundColor || "#0b1320";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx);
    renderDecorations(ctx);
    renderPath(ctx, state.pathPoints);
    renderBase(ctx, state.base);

    for (const t of state.towers) t.draw(ctx);
    for (const e of state.enemies) e.draw(ctx);

    if (!state.running) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "24px Inter, Arial";
      ctx.fillText("Pausado / Game Over", 20, 40);
    }
  }

  // canvas click to place tower (UI forwards selection to engine)
  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    if (state.selectedTowerType) {
      const res = GameAPI.placeTowerAt(x, y, state.selectedTowerType);
      if (!res.ok) {
        console.warn("não foi possível colocar torre:", res.reason);
        flashMessage(res.reason);
      }
    }
  });

  function flashMessage(msg, ms = 1100) {
    let el = document.getElementById("engine-msg");
    if (!el) {
      el = document.createElement("div");
      el.id = "engine-msg";
      el.style.position = "fixed";
      el.style.right = "20px";
      el.style.top = "20px";
      el.style.padding = "10px 14px";
      el.style.background = "rgba(17,24,39,0.9)";
      el.style.color = "#fff";
      el.style.borderRadius = "8px";
      el.style.zIndex = 9999;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = "0";
    }, ms);
  }

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    render(ctx);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  return GameAPI;
}
