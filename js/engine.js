// js/engine.js
import { getWaves, safeGetWeather } from "./api.js";
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

// ==========================================================
// FUNÇÕES UTILITÁRIAS
// ==========================================================

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Catmull-Rom helpers
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

function distanceToPath(pt, pathPoints) {
  if (!pathPoints || pathPoints.length === 0) return Infinity;
  let minD = Infinity;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = pt.x - a.x;
    const wy = pt.y - a.y;
    const vLen2 = vx * vx + vy * vy;
    let t = vLen2 > 0 ? (vx * wx + vy * wy) / vLen2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + vx * t;
    const py = a.y + vy * t;
    const d = Math.hypot(pt.x - px, pt.y - py);
    if (d < minD) minD = d;
  }
  return minD;
}

function isOverlappingAnotherTower(x, y, newTowerSize, existingTowers) {
  for (const tower of existingTowers) {
    const requiredDist = (newTowerSize + tower.size) / 2;
    if (distance({ x, y }, { x: tower.x, y: tower.y }) < requiredDist) {
      return true;
    }
  }
  return false;
}

function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

function setupStableCanvas(canvas) {
  const container = canvas.parentElement;
  let lastWidth = 0;
  let lastHeight = 0;

  function updateCanvasSize() {
    const containerRect = container.getBoundingClientRect();
    const newWidth = Math.max(300, Math.floor(containerRect.width));
    const newHeight = Math.max(200, Math.floor(containerRect.height));

    if (
      Math.abs(newWidth - lastWidth) < 2 &&
      Math.abs(newHeight - lastHeight) < 2
    ) {
      return null;
    }

    lastWidth = newWidth;
    lastHeight = newHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

/**
 * Processa a resposta da API de clima e define o efeito ativo no estado do jogo.
 */
function processWeather(weatherData, state) {
  state.currentWeather = weatherData;
  const code = weatherData?.weathercode || 0;
  const effects = GAME_CONFIG.weather?.effects || {};

  let activeEffect = effects.clear || {
    label: "Tempo Bom",
    icon: "☀️",
    modifiers: [],
  };
  for (const key in effects) {
    const eff = effects[key];
    if (Array.isArray(eff?.codes) && eff.codes.includes(code)) {
      activeEffect = eff;
      break;
    }
  }
  state.activeWeatherEffect = activeEffect;

  window.dispatchEvent(
    new CustomEvent("weather:update", { detail: state.activeWeatherEffect })
  );
}

/**
 * Aplica os modificadores de clima às torres.
 */
function applyWeatherEffects(state) {
  if (
    !state.activeWeatherEffect ||
    !state.activeWeatherEffect.modifiers ||
    state.activeWeatherEffect.modifiers.length === 0
  ) {
    return;
  }

  const modifiers = state.activeWeatherEffect.modifiers;

  for (const tower of state.towers) {
    if (typeof tower.resetToBaseline === "function") {
      tower.resetToBaseline();
    }

    for (const mod of modifiers) {
      if (
        mod.category &&
        tower.category === mod.category &&
        tower[mod.property]
      ) {
        tower[mod.property] *= mod.multiplier;
      }
    }
  }
}

/**
 * Atualiza o timer do clima e busca novos dados quando necessário.
 */
function updateWeatherTimer(dt, state) {
  state.weatherTimer += dt;
  if (state.weatherTimer >= (GAME_CONFIG.weather?.updateInterval || 300)) {
    state.weatherTimer = 0;
    safeGetWeather(
      GAME_CONFIG.weather?.latitude || -30.0346,
      GAME_CONFIG.weather?.longitude || -51.2177
    )
      .then((response) => {
        processWeather(response.data, state);
        console.info("Clima atualizado:", state.activeWeatherEffect?.label);
      })
      .catch((err) => console.warn("Falha na atualização do clima:", err));
  }
}

// ==========================================================
// INÍCIO DO ENGINE
// ==========================================================

export async function initEngine(canvas) {
  if (!canvas) return null;

  // Configuração inicial estável
  const canvasData = setupStableCanvas(canvas);
  if (!canvasData) return null;

  let { cssW, cssH, dpr, ctx } = canvasData;

  // Estado inicial
  const initialWaypoints = generateStableWaypoints(cssW, cssH);
  const state = {
    currentWeather: null,
    activeWeatherEffect: null,
    weatherTimer: 0,
    enemies: [],
    towers: [],
    projectiles: [], // INICIALIZADO
    effects: [], // INICIALIZADO
    gold: DEFAULTS.startGold,
    lives: DEFAULTS.startLives,
    currentWave: 0,
    waves: [],
    running: true,
    selectedTowerType: null,
    mouse: { x: 0, y: 0, isValid: false },
    canvas,
    waypoints: initialWaypoints,
    pathPoints: buildSmoothPath(initialWaypoints, PATH_SAMPLE_PER_SEG),
    pathObj: null,
    base: {
      centerX: initialWaypoints[0].x,
      centerY: initialWaypoints[0].y,
      width: Math.min(cssW, cssH) * 0.12,
      height: Math.min(cssW, cssH) * 0.12,
      hp: GAME_CONFIG.base?.hp || 100,
    },
    decorations: [],
    cssW,
    cssH,
    dpr,
    needsRecalc: false,
  };

  state.pathObj = buildPathDistances(state.pathPoints);

  function generateDecorations() {
    const decs = [];
    const density = Math.floor((state.cssW * state.cssH) / 12000);
    const tries = Math.max(30, Math.min(150, density));

    for (let i = 0; i < tries; i++) {
      const margin = Math.min(state.cssW, state.cssH) * 0.05;
      const px = margin + Math.random() * (state.cssW - margin * 2);
      const py = margin + Math.random() * (state.cssH - margin * 2);
      const d = distanceToPath({ x: px, y: py }, state.pathPoints);

      if (d > PATH_RADIUS_BLOCK + 25) {
        const r = 4 + Math.random() * Math.min(state.cssW, state.cssH) * 0.025;
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
  // CORRIGIDO: expor a instância no state
  state.waveManager = waveManager;

  // ==========================================================
  // EVENT LISTENERS
  // ==========================================================

  function handleMouseMove(e) {
    const pos = getMousePos(canvas, e);
    state.mouse.x = pos.x;
    state.mouse.y = pos.y;
  }

  function handleMouseLeave() {
    state.selectedTowerType = null;
  }

  function handleClick(e) {
    if (!state.selectedTowerType) return;

    const { x: mx, y: my } = getMousePos(canvas, e);
    const config = GAME_CONFIG.towerTypes[state.selectedTowerType];
    if (!config) return;

    if (state.gold < config.cost) {
      flashMessage("Ouro insuficiente!");
      return;
    }

    const dToPath = distanceToPath({ x: mx, y: my }, state.pathPoints);
    const isInvalidPath = dToPath < PATH_RADIUS_BLOCK;
    const isInvalidTower = isOverlappingAnotherTower(
      mx,
      my,
      config.size,
      state.towers
    );

    const baseLeft = state.base.centerX - state.base.width / 2;
    const baseRight = state.base.centerX + state.base.width / 2;
    const baseTop = state.base.centerY - state.base.height / 2;
    const baseBottom = state.base.centerY + state.base.height / 2;
    const isInvalidBase =
      mx >= baseLeft && mx <= baseRight && my >= baseTop && my <= baseBottom;

    if (isInvalidPath || isInvalidTower || isInvalidBase) {
      if (isInvalidPath) flashMessage("Muito próximo do caminho!");
      else if (isInvalidTower) flashMessage("Muito próximo de outra torre!");
      else if (isInvalidBase) flashMessage("Não pode construir sobre a base!");
      return;
    }

    state.gold -= config.cost;
    const tower = new Tower(mx, my, state.selectedTowerType);
    state.towers.push(tower);
  }

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleMouseLeave);
  canvas.addEventListener("click", handleClick);

  // ==========================================================
  // FUNÇÕES AUXILIARES (CORRIGIDAS)
  // ==========================================================

  function getTowerAt(x, y) {
    return state.towers.find((t) => Math.hypot(t.x - x, t.y - y) <= t.size);
  }

  function placeTower(x, y, type) {
    const cfg = GAME_CONFIG.towerTypes[type];
    if (!cfg) return { ok: false, reason: "tipo inválido" };
    if (state.gold < cfg.cost)
      return { ok: false, reason: "ouro insuficiente" };

    const dToPath = distanceToPath({ x, y }, state.pathPoints);
    if (dToPath < PATH_RADIUS_BLOCK) return { ok: false, reason: "no_path" };
    if (isOverlappingAnotherTower(x, y, cfg.size, state.towers))
      return { ok: false, reason: "overlap" };

    state.gold -= cfg.cost;
    const tower = new Tower(x, y, type);
    state.towers.push(tower);
    return { ok: true, tower };
  }

  function sellTower(tower) {
    const idx = state.towers.indexOf(tower);
    if (idx === -1) return { ok: false };
    const refund = Math.floor(tower.cost * 0.5);
    state.gold += refund;
    state.towers.splice(idx, 1);
    return { ok: true, refund };
  }

  function upgradeTower(tower, upgradeType) {
    if (!tower) return { ok: false, reason: "no tower" };
    const res = tower.upgrade && tower.upgrade(upgradeType);
    return res || { ok: false, reason: "upgrade not available" };
  }

  // ==========================================================
  // API PÚBLICA (CORRIGIDA)
  // ==========================================================

  let rafId = null;

  GameAPI = {
    placeTowerAt: (x, y, type) => placeTower(x, y, type),
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
    getState: () => ({ ...state }),
    getWaveManager: () => waveManager, // CORRIGIDO: retorna a instância real
    placeTower: placeTower,
    sellTower: sellTower,
    getTowerAt: getTowerAt,
    upgradeTower: upgradeTower,

    forceWeather(code) {
      console.log(`[DEBUG] Forçando clima com código: ${code}`);
      const mockWeatherData = { weathercode: code, temperature: 20 };
      processWeather(mockWeatherData, state);
    },

    destroy() {
      state.running = false;
      if (rafId) cancelAnimationFrame(rafId);
      try {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("click", handleClick);
        window.removeEventListener("resize", handleResize);
      } catch (e) {
        // ignore
      }
    },
  };

  // ==========================================================
  // INICIALIZAÇÃO DAS WAVES E CLIMA
  // ==========================================================

  try {
    const [wavesResp, weatherResp] = await Promise.allSettled([
      getWaves(),
      safeGetWeather(
        GAME_CONFIG.weather?.latitude || -30.0346,
        GAME_CONFIG.weather?.longitude || -51.2177
      ),
    ]);

    if (wavesResp.status === "fulfilled" && wavesResp.value?.data) {
      waveManager.initialize(wavesResp.value.data);
    } else {
      console.warn(
        "Falha ao carregar waves; usando configuração local",
        wavesResp.reason
      );
      waveManager.initialize(GAME_CONFIG.waveDefinitions);
    }

    if (weatherResp.status === "fulfilled" && weatherResp.value?.data) {
      processWeather(weatherResp.value.data, state);
      console.info(
        "Clima carregado:",
        state.activeWeatherEffect?.label,
        weatherResp.value.meta
      );
    } else {
      console.warn(
        "Falha ao carregar clima; usando tempo limpo",
        weatherResp.reason
      );
      processWeather({ weathercode: 0, temperature: 20 }, state);
    }
  } catch (e) {
    console.warn("Falha geral na inicialização; usando fallbacks", e);
    waveManager.initialize(GAME_CONFIG.waveDefinitions);
    processWeather({ weathercode: 0, temperature: 20 }, state);
  }

  // CORRIGIDO: sobrescreve spawn para usar state corretamente
  waveManager.spawnEnemy = (type) => {
    const startDistance = state.pathObj.total + 24 + Math.random() * 60;
    const e = new Enemy(type, startDistance, state.pathObj);
    state.enemies.push(e);
  };

  // ==========================================================
  // FUNÇÕES DE RENDERIZAÇÃO
  // ==========================================================

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

    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

    ctx.lineWidth = pathWidth;
    ctx.strokeStyle = GAME_CONFIG.visual?.pathColor || "#1a1a1a";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

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

    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(left, top, base.width, base.height);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, base.width / 30);
    ctx.strokeRect(left, top, base.width, base.height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      base.centerX - crossSize / 2,
      base.centerY - crossSize / 6,
      crossSize,
      crossSize / 3
    );
    ctx.fillRect(
      base.centerX - crossSize / 6,
      base.centerY - crossSize / 2,
      crossSize / 3,
      crossSize
    );

    ctx.restore();
  }

  function renderTowerGhost(ctx) {
    if (!state.selectedTowerType) return;

    const config = GAME_CONFIG.towerTypes[state.selectedTowerType];
    if (!config) return;

    const mx = state.mouse.x;
    const my = state.mouse.y;

    const dToPath = distanceToPath({ x: mx, y: my }, state.pathPoints);
    const isInvalidPath = dToPath < PATH_RADIUS_BLOCK;
    const isInvalidTower = isOverlappingAnotherTower(
      mx,
      my,
      config.size,
      state.towers
    );

    const baseLeft = state.base.centerX - state.base.width / 2;
    const baseRight = state.base.centerX + state.base.width / 2;
    const baseTop = state.base.centerY - state.base.height / 2;
    const baseBottom = state.base.centerY + state.base.height / 2;
    const isInvalidBase =
      mx >= baseLeft && mx <= baseRight && my >= baseTop && my <= baseBottom;

    state.mouse.isValid = !isInvalidPath && !isInvalidTower && !isInvalidBase;

    const color = state.mouse.isValid
      ? "rgba(0, 255, 0, 0.3)"
      : "rgba(255, 0, 0, 0.3)";

    const GHOST_RANGE_SCALE = GAME_CONFIG.visual?.ghostRangeScale ?? 0.6;
    const GHOST_BODY_SCALE = GAME_CONFIG.visual?.ghostBodyScale ?? 0.25;

    const rangeSide = config.range * 1 * GHOST_RANGE_SCALE;
    const ghostSize = config.size * GHOST_BODY_SCALE;
    const halfGhost = ghostSize / 2;

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = color;
    ctx.fillRect(mx - rangeSide / 2, my - rangeSide / 2, rangeSide, rangeSide);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = config.color || "#999";
    ctx.fillRect(mx - halfGhost, my - halfGhost, ghostSize, ghostSize);
    ctx.lineWidth = Math.max(1, ghostSize * 0.06);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(mx - halfGhost, my - halfGhost, ghostSize, ghostSize);
    ctx.restore();
  }

  // ==========================================================
  // UPDATE E RENDER (CORRIGIDOS)
  // ==========================================================

  function update(dt) {
    if (!state.running) return;

    // Verificar se precisa recalcular layout
    if (state.needsRecalc) {
      const newData = setupStableCanvas(canvas);
      if (newData) {
        state.cssW = newData.cssW;
        state.cssH = newData.cssH;
        state.dpr = newData.dpr;
        ctx = newData.ctx;

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
      }
      state.needsRecalc = false;
    }

    // Atualizar clima e aplicar efeitos
    updateWeatherTimer(dt, state);
    applyWeatherEffects(state);

    // Atualizar wave manager
    waveManager.update(dt, state);

    // Atualizar torres
    for (const t of state.towers) {
      t.update(dt, state);
    }

    // Atualizar inimigos e capturar retornos
    const reachedBaseEnemies = [];
    for (const e of state.enemies) {
      const result = e.update(dt);
      if (result === "reached_base") {
        reachedBaseEnemies.push(e);
      }
    }

    // Atualizar projéteis e efeitos
    for (const p of state.projectiles) {
      if (p && typeof p.update === "function") {
        p.update(dt, state.enemies);
      }
    }
    for (const ef of state.effects) {
      if (ef && typeof ef.update === "function") {
        ef.update(dt);
      }
    }

    // Processar inimigos mortos (não processados ainda)
    const killedEnemies = state.enemies.filter(
      (e) => e.dead && !e._processedDead
    );
    if (killedEnemies.length > 0) {
      for (const enemy of killedEnemies) {
        state.gold += enemy.goldValue || 0;
        waveManager.onEnemyDefeated(enemy);
        enemy._processedDead = true;
      }
    }

    // Processar inimigos que chegaram à base
    for (const enemy of reachedBaseEnemies) {
      state.lives -= 1;
      enemy.dead = true;
      waveManager.onEnemyDefeated(enemy);
    }

    // Filtrar listas
    state.enemies = state.enemies.filter((e) => !e.dead);
    state.projectiles = state.projectiles.filter(
      (p) => p && p.active !== false
    );
    state.effects = state.effects.filter((e) => e && e.active !== false);

    // Atualizar HUD
    const goldEl = document.getElementById("gold");
    const livesEl = document.getElementById("lives");
    if (goldEl) goldEl.textContent = `Ouro: ${state.gold}`;
    if (livesEl) livesEl.textContent = `Vidas: ${state.lives}`;

    // Game Over
    if (state.lives <= 0) {
      state.running = false;
      console.info("Game Over");
      window.dispatchEvent(
        new CustomEvent("game:over", {
          detail: {
            reason: "no_lives",
            finalScore: waveManager.calculateScore
              ? waveManager.calculateScore(state)
              : 0,
          },
        })
      );
    }
  }

  function render(ctx) {
    ctx.clearRect(0, 0, state.cssW, state.cssH);
    ctx.fillStyle = GAME_CONFIG.visual?.backgroundColor || "#0b1320";
    ctx.fillRect(0, 0, state.cssW, state.cssH);

    drawGrid(ctx);
    renderDecorations(ctx);
    renderPath(ctx, state.pathPoints);
    renderBase(ctx, state.base);

    for (const t of state.towers) t.draw(ctx);
    renderTowerGhost(ctx);
    for (const e of state.enemies) e.draw(ctx);

    // Desenhar projéteis e efeitos se existirem
    for (const p of state.projectiles) {
      if (p && typeof p.draw === "function") p.draw(ctx);
    }
    for (const ef of state.effects) {
      if (ef && typeof ef.draw === "function") ef.draw(ctx);
    }

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

  function draw() {
    render(ctx);
  }

  // ==========================================================
  // UTILIDADES
  // ==========================================================

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

  // ==========================================================
  // SISTEMA DE REDIMENSIONAMENTO
  // ==========================================================

  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      state.needsRecalc = true;
    }, 150);
  }

  window.addEventListener("resize", handleResize);

  window.addEventListener("beforeunload", () => {
    window.removeEventListener("resize", handleResize);
  });

  // ==========================================================
  // GAME LOOP PRINCIPAL
  // ==========================================================

  let last = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    update(dt);
    draw();

    if (state.running) {
      rafId = requestAnimationFrame(gameLoop);
    }
  }

  // Iniciar o loop
  rafId = requestAnimationFrame(gameLoop);

  return GameAPI;
}
