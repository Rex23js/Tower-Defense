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

// Sistema de canvas estável - sem loops de redimensionamento
function setupStableCanvas(canvas) {
  const container = canvas.parentElement;
  let lastWidth = 0;
  let lastHeight = 0;

  function updateCanvasSize() {
    const containerRect = container.getBoundingClientRect();
    const newWidth = Math.max(300, Math.floor(containerRect.width));
    const newHeight = Math.max(200, Math.floor(containerRect.height));

    // Só atualizar se realmente mudou significativamente
    if (
      Math.abs(newWidth - lastWidth) < 2 &&
      Math.abs(newHeight - lastHeight) < 2
    ) {
      return null; // Sem mudança significativa
    }

    lastWidth = newWidth;
    lastHeight = newHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Aplicar tamanhos sem trigger de novos eventos
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";
    canvas.width = Math.floor(newWidth * dpr);
    canvas.height = Math.floor(newHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    return { cssW: newWidth, cssH: newHeight, dpr, ctx };
  }

  return updateCanvasSize();
}

// Gera waypoints estáveis e proporcionais
function generateStableWaypoints(cssW, cssH) {
  const margin = Math.min(cssW, cssH) * 0.08;
  const segmentW = (cssW - margin * 2) / 6;
  const segmentH = (cssH - margin * 2) / 4;

  return [
    { x: margin, y: cssH - margin },
    { x: margin + segmentW * 1.2, y: cssH - margin },
    { x: margin + segmentW * 1.2, y: cssH - margin - segmentH * 1.5 },
    { x: margin + segmentW * 2.8, y: cssH - margin - segmentH * 1.5 },
    { x: margin + segmentW * 2.8, y: margin + segmentH * 0.5 },
    { x: margin + segmentW * 1.5, y: margin + segmentH * 0.5 },
    { x: margin + segmentW * 1.5, y: cssH - margin - segmentH * 2.8 },
    { x: margin + segmentW * 4, y: cssH - margin - segmentH * 2.8 },
    { x: margin + segmentW * 4, y: cssH - margin - segmentH * 1.8 },
    { x: margin + segmentW * 5.2, y: cssH - margin - segmentH * 1.8 },
    { x: margin + segmentW * 5.2, y: margin + segmentH * 1.2 },
    { x: cssW - margin, y: margin + segmentH * 1.2 },
  ];
}

// ---- engine (init) ----
export async function initEngine(canvas) {
  if (!canvas) return;

  // Configuração inicial estável
  let canvasData = setupStableCanvas(canvas);
  if (!canvasData) return; // Falha na configuração inicial

  let { cssW, cssH, dpr, ctx } = canvasData;

  // Estado inicial fixo
  const initialWaypoints = generateStableWaypoints(cssW, cssH);

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
    // Elementos estáticos que não mudam durante o jogo
    waypoints: initialWaypoints,
    pathPoints: buildSmoothPath(initialWaypoints, PATH_SAMPLE_PER_SEG),
    pathObj: null, // será calculado após pathPoints
    base: {
      centerX: initialWaypoints[0].x,
      centerY: initialWaypoints[0].y,
      width: Math.min(cssW, cssH) * 0.12,
      height: Math.min(cssW, cssH) * 0.12,
      hp: GAME_CONFIG.base.hp,
    },
    decorations: [],
    // Dimensões atuais
    cssW,
    cssH,
    dpr,
    // Flag para controlar recalculamentos
    needsRecalc: false,
  };

  // Calcular pathObj após pathPoints estar definido
  state.pathObj = buildPathDistances(state.pathPoints);

  // Gerar decorações uma vez
  function generateDecorations() {
    const decs = [];
    const density = Math.floor((cssW * cssH) / 12000);
    const tries = Math.max(30, Math.min(150, density));

    for (let i = 0; i < tries; i++) {
      const margin = Math.min(cssW, cssH) * 0.05;
      const px = margin + Math.random() * (cssW - margin * 2);
      const py = margin + Math.random() * (cssH - margin * 2);
      const d = distanceToPath({ x: px, y: py }, state.pathPoints);

      if (d > PATH_RADIUS_BLOCK + 25) {
        const r = 4 + Math.random() * Math.min(cssW, cssH) * 0.025;
        decs.push({
          x: px,
          y: py,
          r,
          type: Math.random() > 0.85 ? "cactus" : "rock",
        });
      }
    }
    return decs;
  }

  state.decorations = generateDecorations();

  const waveManager = new WaveManager();

  // Public API
  GameAPI = {
    placeTowerAt: (x, y, type) => {
      const towerConfig = GAME_CONFIG.towerTypes[type];
      if (!towerConfig) return { ok: false, reason: "tipo inválido" };
      if (state.gold < towerConfig.cost)
        return { ok: false, reason: "ouro insuficiente" };

      // Verificar colisão com base
      const baseLeft = state.base.centerX - state.base.width / 2;
      const baseRight = state.base.centerX + state.base.width / 2;
      const baseTop = state.base.centerY - state.base.height / 2;
      const baseBottom = state.base.centerY + state.base.height / 2;

      if (x >= baseLeft && x <= baseRight && y >= baseTop && y <= baseBottom) {
        return { ok: false, reason: "não pode construir sobre a base" };
      }

      // Verificar distância do caminho
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

    togglePause: () => {
      state.running = !state.running;
      if (state.running) waveManager.resumeGame();
      else waveManager.pauseGame();
    },

    setAutoWaves: (enabled) => waveManager.setAutoWaves(enabled),
    toggleAutoWaves: () => waveManager.toggleAutoWaves(),
    getWaveStatus: () => waveManager.getStatus(),
    getState: () => state,
    getWaveManager: () => waveManager,
  };

  // Carregar waves
  try {
    state.waves = await getWaves();
    waveManager.initialize(state.waves);
  } catch (e) {
    console.warn("Falha ao carregar waves; usando configuração local", e);
    waveManager.initialize(GAME_CONFIG.waveDefinitions);
  }

  waveManager.spawnEnemy = (type, gameState) => {
    const startDistance = gameState.pathObj.total + 24 + Math.random() * 60;
    const e = new Enemy(type, startDistance, gameState.pathObj);
    gameState.enemies.push(e);
  };

  // Funções de renderização (sem mudanças nas dimensões)
  function drawGrid(ctx) {
    const step = Math.max(
      16,
      Math.min(40, Math.min(state.cssW, state.cssH) / 25)
    );
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= state.cssW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, state.cssH);
      ctx.stroke();
    }
    for (let y = 0; y <= state.cssH; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(state.cssW, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderDecorations(ctx) {
    for (const d of state.decorations) {
      ctx.save();
      ctx.globalAlpha = 0.12;

      if (d.type === "rock") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r, d.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#ffffff";
        const w = d.r * 0.4;
        const h = d.r * 1.2;
        ctx.fillRect(d.x - w / 2, d.y - h / 2, w, h);
        ctx.fillRect(d.x - d.r * 0.8, d.y - w / 2, w * 0.7, w);
        ctx.fillRect(d.x + d.r * 0.1, d.y - w / 2, w * 0.7, w);
      }
      ctx.restore();
    }
  }

  function renderPath(ctx, pathPoints) {
    if (!pathPoints || pathPoints.length < 2) return;

    const pathWidth = Math.max(
      30,
      Math.min(60, Math.min(state.cssW, state.cssH) / 15)
    );
    const borderWidth = Math.max(2, pathWidth * 0.08);

    ctx.save();

    // Caminho principal
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

    ctx.lineWidth = pathWidth;
    ctx.strokeStyle = GAME_CONFIG.visual.pathColor || "#1a1a1a";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Borda do caminho
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

    ctx.lineWidth = pathWidth + borderWidth * 2;
    ctx.strokeStyle = "#ffffff";
    ctx.globalCompositeOperation = "destination-over";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    // Linha central
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

    const dashSize = Math.max(4, pathWidth / 8);
    ctx.setLineDash([dashSize, dashSize]);
    ctx.lineWidth = Math.max(1, pathWidth / 20);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function renderBase(ctx, base) {
    const left = base.centerX - base.width / 2;
    const top = base.centerY - base.height / 2;
    const crossSize = base.width * 0.3;

    ctx.save();

    // Base principal
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(left, top, base.width, base.height);

    // Borda
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, base.width / 30);
    ctx.strokeRect(left, top, base.width, base.height);

    // Cruz médica
    ctx.fillStyle = "#ffffff";
    // Horizontal
    ctx.fillRect(
      base.centerX - crossSize / 2,
      base.centerY - crossSize / 6,
      crossSize,
      crossSize / 3
    );
    // Vertical
    ctx.fillRect(
      base.centerX - crossSize / 6,
      base.centerY - crossSize / 2,
      crossSize / 3,
      crossSize
    );

    ctx.restore();
  }

  // Update loop (sem alterações de layout)
  let last = performance.now();

  function update(dt) {
    if (!state.running) return;

    // Verificar se precisa recalcular layout (apenas uma vez por mudança)
    if (state.needsRecalc) {
      const newData = setupStableCanvas(canvas);
      if (newData) {
        // Atualizar dimensões
        state.cssW = newData.cssW;
        state.cssH = newData.cssH;
        state.dpr = newData.dpr;
        ctx = newData.ctx;

        // Recalcular elementos do jogo apenas uma vez
        state.waypoints = generateStableWaypoints(state.cssW, state.cssH);
        state.pathPoints = buildSmoothPath(
          state.waypoints,
          PATH_SAMPLE_PER_SEG
        );
        state.pathObj = buildPathDistances(state.pathPoints);

        const baseSize = Math.min(state.cssW, state.cssH) * 0.12;
        state.base.centerX = state.waypoints[0].x;
        state.base.centerY = state.waypoints[0].y;
        state.base.width = baseSize;
        state.base.height = baseSize;

        state.decorations = generateDecorations();
        state.needsRecalc = false; // Marcar como concluído
      }
    }

    waveManager.update(dt, state);

    for (const en of state.enemies) {
      const res = en.update(dt);
      if (res === "reached_base") {
        state.lives -= 1;
        waveManager.onEnemyDefeated(en);
      }
    }

    for (const t of state.towers) t.update(dt, state);

    const killedEnemies = state.enemies.filter((e) => e.dead);
    state.enemies = state.enemies.filter((e) => !e.dead);

    if (killedEnemies.length > 0) {
      killedEnemies.forEach((enemy) => {
        waveManager.onEnemyDefeated(enemy);
      });
    }

    // Atualizar HUD
    const goldEl = document.getElementById("gold");
    const livesEl = document.getElementById("lives");
    if (goldEl) goldEl.textContent = `Ouro: ${state.gold}`;
    if (livesEl) livesEl.textContent = `Vidas: ${state.lives}`;

    // Game Over
    if (state.lives <= 0) {
      state.running = false;
      console.info("Game Over");
      waveManager.dispatchEvent("game:over", {
        reason: "no_lives",
        finalScore: waveManager.calculateScore(state),
      });
    }
  }

  function render(ctx) {
    // Limpar e renderizar usando dimensões estáveis
    ctx.clearRect(0, 0, state.cssW, state.cssH);
    ctx.fillStyle = GAME_CONFIG.visual.backgroundColor || "#0b1320";
    ctx.fillRect(0, 0, state.cssW, state.cssH);

    drawGrid(ctx);
    renderDecorations(ctx);
    renderPath(ctx, state.pathPoints);
    renderBase(ctx, state.base);

    for (const t of state.towers) t.draw(ctx);
    for (const e of state.enemies) e.draw(ctx);

    if (!state.running) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, state.cssW, state.cssH);

      ctx.fillStyle = "#fff";
      ctx.font = `${
        Math.min(state.cssW, state.cssH) / 25
      }px Inter, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("PAUSADO / GAME OVER", state.cssW / 2, state.cssH / 2);
      ctx.restore();
    }
  }

  // Cliques estáveis
  canvas.addEventListener("click", (ev) => {
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;

    if (
      state.selectedTowerType &&
      xCss >= 0 &&
      yCss >= 0 &&
      xCss <= state.cssW &&
      yCss <= state.cssH
    ) {
      const res = GameAPI.placeTowerAt(xCss, yCss, state.selectedTowerType);
      if (!res.ok) {
        console.warn("Não foi possível colocar torre:", res.reason);
        flashMessage(res.reason);
      }
    }
  });

  function flashMessage(msg, ms = 1500) {
    let el = document.getElementById("engine-msg");
    if (!el) {
      el = document.createElement("div");
      el.id = "engine-msg";
      Object.assign(el.style, {
        position: "fixed",
        right: "20px",
        top: "100px",
        padding: "12px 16px",
        background: "rgba(17,24,39,0.95)",
        color: "#fff",
        borderRadius: "8px",
        zIndex: "9999",
        fontSize: "14px",
        fontFamily: "Inter, Arial, sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "opacity 0.3s ease",
      });
      document.body.appendChild(el);
    }

    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => {
      el.style.opacity = "0";
    }, ms);
  }

  // Sistema de redimensionamento controlado - sem loops
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Apenas marcar para recalculação no próximo frame
      state.needsRecalc = true;
    }, 150); // Delay maior para estabilizar
  }

  // Listener de resize mais seguro
  window.addEventListener("resize", handleResize);

  // Cleanup
  window.addEventListener("beforeunload", () => {
    window.removeEventListener("resize", handleResize);
  });

  // Game loop principal
  function gameLoop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    update(dt);
    render(ctx);

    requestAnimationFrame(gameLoop);
  }

  // Iniciar o loop
  requestAnimationFrame(gameLoop);

  return GameAPI;
}
