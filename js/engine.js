// js/engine.js
import { getWaves, safeGetWeather } from "./api.js";
import { WaveManager } from "./wave-manager.js";
import { Enemy, Tower } from "./entities.js";
import { GAME_CONFIG } from "./game-config.js";

export let GameAPI = null;
// tornar acessível ao processWeather
let weatherOverlay = null;

const DEFAULTS = {
  startGold: GAME_CONFIG.startGold,
  startLives: GAME_CONFIG.startLives,
};

const PATH_SAMPLE_PER_SEG = GAME_CONFIG.pathSamplePerSeg;
const PATH_RADIUS_BLOCK = GAME_CONFIG.pathRadiusBlock;

// Adicione estas melhorias ao seu engine.js

// ==========================================================
// SISTEMA DE PARTÍCULAS PARA CLIMA
// ==========================================================

class WeatherParticle {
  constructor(x, y, type, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.active = true;

    // Configurações baseadas no tipo
    switch (type) {
      case "rain":
        this.vx = -2 + Math.random() * 4;
        this.vy = 200 + Math.random() * 100;
        this.length = 8 + Math.random() * 12;
        this.opacity = 0.3 + Math.random() * 0.4;
        this.color = `rgba(173, 216, 230, ${this.opacity})`;
        break;

      case "fog":
        this.vx = 10 + Math.random() * 20;
        this.vy = -5 + Math.random() * 10;
        this.size = 40 + Math.random() * 60;
        this.opacity = 0.1 + Math.random() * 0.2;
        this.color = `rgba(200, 200, 200, ${this.opacity})`;
        this.life = 1.0;
        this.maxLife = 3 + Math.random() * 4;
        break;

      case "storm":
        this.vx = -10 + Math.random() * 20;
        this.vy = 250 + Math.random() * 150;
        this.length = 15 + Math.random() * 20;
        this.opacity = 0.4 + Math.random() * 0.3;
        this.color = `rgba(100, 149, 237, ${this.opacity})`;
        this.lightning = Math.random() < 0.001; // Chance muito baixa de ser um raio
        break;
    }
  }

  update(dt) {
    switch (this.type) {
      case "rain":
      case "storm":
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Reset quando sair da tela
        if (this.y > this.canvasHeight + 20) {
          this.y = -20;
          this.x = Math.random() * this.canvasWidth;
        }
        if (this.x < -20 || this.x > this.canvasWidth + 20) {
          this.x = Math.random() * this.canvasWidth;
        }
        break;

      case "fog":
        this.x += this.vx * dt;
        this.life += dt;

        // Fade in/out
        const fadeProgress = Math.min(this.life / this.maxLife, 1);
        if (fadeProgress > 0.7) {
          this.opacity *= 0.98; // Fade out
        }

        if (this.x > this.canvasWidth + this.size || this.opacity < 0.01) {
          this.x = -this.size;
          this.y = Math.random() * this.canvasHeight;
          this.life = 0;
          this.opacity = 0.1 + Math.random() * 0.2;
        }
        break;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    switch (this.type) {
      case "rain":
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx * 0.1, this.y - this.length);
        ctx.stroke();
        break;

      case "fog":
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, "rgba(200, 200, 200, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "storm":
        // Chuva mais intensa
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx * 0.1, this.y - this.length);
        ctx.stroke();

        // Ocasionalmente desenhar "raio" (linha brilhante)
        if (this.lightning) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.stroke();
          this.lightning = false; // Uma vez só
        }
        break;
    }

    ctx.restore();
  }
}

// ==========================================================
// OVERLAY DE CLIMA NO CANVAS
// ==========================================================

class WeatherOverlay {
  constructor(canvasWidth, canvasHeight) {
    this.particles = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.currentWeatherType = "clear";
    this.intensity = 0;
    this.targetIntensity = 0;
    this.transitionSpeed = 0.5;
  }

  setWeather(weatherType, intensity = 1.0) {
    this.currentWeatherType = weatherType;
    this.targetIntensity = intensity;
  }

  updateCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  update(dt) {
    // Transição suave da intensidade
    if (this.intensity < this.targetIntensity) {
      this.intensity = Math.min(
        this.targetIntensity,
        this.intensity + this.transitionSpeed * dt
      );
    } else if (this.intensity > this.targetIntensity) {
      this.intensity = Math.max(
        this.targetIntensity,
        this.intensity - this.transitionSpeed * dt
      );
    }

    // Gerenciar partículas baseado no clima atual
    this.manageParticles();

    // Atualizar partículas existentes
    for (const particle of this.particles) {
      particle.update(dt);
    }

    // Remover partículas inativas
    this.particles = this.particles.filter((p) => p.active);
  }

  manageParticles() {
    const desiredCount = this.getDesiredParticleCount();

    // Adicionar partículas se necessário
    while (this.particles.length < desiredCount) {
      this.addParticle();
    }

    // Remover partículas em excesso
    while (this.particles.length > desiredCount) {
      this.particles.pop();
    }
  }

  getDesiredParticleCount() {
    if (this.intensity <= 0.1) return 0;

    switch (this.currentWeatherType) {
      case "rain":
        return Math.floor(80 * this.intensity);
      case "fog":
        return Math.floor(15 * this.intensity);
      case "storm":
        return Math.floor(120 * this.intensity);
      default:
        return 0;
    }
  }

  addParticle() {
    let x, y;

    switch (this.currentWeatherType) {
      case "rain":
      case "storm":
        x = Math.random() * this.canvasWidth;
        y = -20 - Math.random() * 100;
        break;
      case "fog":
        x = -60 - Math.random() * 40;
        y = Math.random() * this.canvasHeight;
        break;
      default:
        return;
    }

    this.particles.push(
      new WeatherParticle(
        x,
        y,
        this.currentWeatherType,
        this.canvasWidth,
        this.canvasHeight
      )
    );
  }

  draw(ctx) {
    if (this.intensity <= 0.1) return;

    ctx.save();

    // Efeito de escurecimento para tempestades
    if (this.currentWeatherType === "storm" && this.intensity > 0.5) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * this.intensity})`;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Desenhar partículas
    for (const particle of this.particles) {
      particle.draw(ctx);
    }

    ctx.restore();
  }
}

// ==========================================================
// INDICADORES VISUAIS NAS TORRES
// ==========================================================

function drawWeatherEffectOnTower(ctx, tower, weatherEffect) {
  if (
    !weatherEffect ||
    !weatherEffect.modifiers ||
    weatherEffect.modifiers.length === 0
  ) {
    return;
  }

  // Verificar se a torre é afetada
  const isAffected = weatherEffect.modifiers.some(
    (mod) => mod.category && tower.category === mod.category
  );

  if (!isAffected) return;

  ctx.save();

  // Efeito visual baseado no tipo de clima
  const time = Date.now() / 1000;

  switch (weatherEffect.label) {
    case "Neblina":
      // Círculo pulsante cinza ao redor da torre
      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 2);
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.size + 8, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case "Chuva":
      // Pequenas gotas ao redor da torre
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#4A90E2";
      for (let i = 0; i < 6; i++) {
        const angle = (time + i) * 3;
        const radius = tower.size + 10;
        const x = tower.x + Math.cos(angle) * radius;
        const y = tower.y + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "Tempestade":
      // Efeito elétrico intermitente
      if (Math.sin(time * 8) > 0.7) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.size + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Raios pequenos
        for (let i = 0; i < 4; i++) {
          const angle = ((Math.PI * 2) / 4) * i;
          const startRadius = tower.size / 2 + 2;
          const endRadius = tower.size + 12;
          ctx.beginPath();
          ctx.moveTo(
            tower.x + Math.cos(angle) * startRadius,
            tower.y + Math.sin(angle) * startRadius
          );
          ctx.lineTo(
            tower.x + Math.cos(angle) * endRadius,
            tower.y + Math.sin(angle) * endRadius
          );
          ctx.stroke();
        }
      }
      break;
  }

  ctx.restore();
}

// ==========================================================
// MELHORIAS NO DEBUG PANEL
// ==========================================================

// Adicione esta função para mostrar informações detalhadas:
function updateDebugWeatherInfo(weatherEffect) {
  const debugPanel = document.getElementById("debug-panel");
  if (!debugPanel) return;

  // Adicionar informações de status
  let statusDiv = debugPanel.querySelector(".weather-status");
  if (!statusDiv) {
    statusDiv = document.createElement("div");
    statusDiv.className = "weather-status";
    statusDiv.style.cssText = `
      margin-top: 10px;
      padding: 8px;
      background: rgba(0,0,0,0.7);
      border-radius: 4px;
      font-size: 12px;
      color: #fff;
    `;
    debugPanel.appendChild(statusDiv);
  }

  const effectInfo = weatherEffect
    ? `
    <strong>Clima Ativo: ${weatherEffect.label} ${
        weatherEffect.icon
      }</strong><br>
    ${weatherEffect.modifiers
      .map((mod) => `Torre ${mod.category}: ${mod.property} x${mod.multiplier}`)
      .join("<br>")}
  `
    : "Nenhum efeito ativo";

  statusDiv.innerHTML = effectInfo;
}

// Chame esta função sempre que o clima mudar:
// updateDebugWeatherInfo(state.activeWeatherEffect);

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

  // NOVO: Atualizar overlay visual
  if (weatherOverlay) {
    let weatherType = "clear";
    let intensity = 0;

    switch (activeEffect.label) {
      case "Chuva":
        weatherType = "rain";
        intensity = 0.7;
        break;
      case "Neblina":
        weatherType = "fog";
        intensity = 0.8;
        break;
      case "Tempestade":
        weatherType = "storm";
        intensity = 1.0;
        break;
    }

    weatherOverlay.setWeather(weatherType, intensity);
  }

  // NOVO: Atualizar debug info
  updateDebugWeatherInfo(state.activeWeatherEffect);

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
  // Inicializar sistema de clima visual
  weatherOverlay = new WeatherOverlay(cssW, cssH);
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

  // Atualizar tamanho do overlay de clima
  if (weatherOverlay) {
    weatherOverlay.updateCanvasSize(state.cssW, state.cssH);
  }

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
    startNextWave: () => {
      if (waveManager && typeof waveManager.startNextWave === "function") {
        try {
          waveManager.startNextWave(state);
        } catch (err) {
          console.warn("waveManager.startNextWave falhou:", err);
        }
      } else {
        console.warn("waveManager.startNextWave não está disponível");
      }
    },
    togglePause: () => {
      state.running = !state.running;
      if (state.running) {
        if (waveManager && typeof waveManager.resumeGame === "function") {
          try {
            waveManager.resumeGame();
          } catch (err) {
            console.warn("waveManager.resumeGame falhou:", err);
          }
        } else {
          console.warn("waveManager.resumeGame não disponível");
        }
      } else {
        if (waveManager && typeof waveManager.pauseGame === "function") {
          try {
            waveManager.pauseGame();
          } catch (err) {
            console.warn("waveManager.pauseGame falhou:", err);
          }
        } else {
          console.warn("waveManager.pauseGame não disponível");
        }
      }
    },

    setAutoWaves: (enabled) => {
      if (waveManager && typeof waveManager.setAutoWaves === "function") {
        try {
          waveManager.setAutoWaves(enabled);
        } catch (err) {
          console.warn("waveManager.setAutoWaves falhou:", err);
        }
      } else {
        console.warn("waveManager.setAutoWaves não disponível");
      }
    },
    toggleAutoWaves: () => {
      if (waveManager && typeof waveManager.toggleAutoWaves === "function") {
        try {
          waveManager.toggleAutoWaves();
        } catch (err) {
          console.warn("waveManager.toggleAutoWaves falhou:", err);
        }
      } else {
        console.warn("waveManager.toggleAutoWaves não disponível");
      }
    },

    getWaveStatus: () => waveManager.getStatus(),
    getState: () => state,
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

    // Recalculo de layout quando necessário
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

        if (weatherOverlay) {
          weatherOverlay.updateCanvasSize(state.cssW, state.cssH);
        }
      }
      state.needsRecalc = false;
    }

    // Atualizar clima e aplicar efeitos (sem desenhar aqui)
    updateWeatherTimer(dt, state);
    applyWeatherEffects(state);

    // Atualizar overlay (apenas atualização de física/partículas, sem draw)
    if (weatherOverlay) {
      weatherOverlay.update(dt);
    }

    // Atualizar wave manager (defensivo)
    if (waveManager && typeof waveManager.update === "function") {
      try {
        waveManager.update(dt, state);
      } catch (err) {
        console.warn("waveManager.update falhou:", err);
      }
    }

    // Atualizar torres
    for (const t of state.towers) {
      try {
        t.update(dt, state);
      } catch (err) {
        console.warn("tower.update falhou:", err);
      }
    }

    // Atualizar inimigos e capturar retornos
    const reachedBaseEnemies = [];
    for (const e of state.enemies) {
      try {
        const result = e.update(dt);
        if (result === "reached_base") reachedBaseEnemies.push(e);
      } catch (err) {
        console.warn("enemy.update falhou:", err);
      }
    }

    // Atualizar projéteis e efeitos
    for (const p of state.projectiles) {
      try {
        if (p && typeof p.update === "function") p.update(dt, state.enemies);
      } catch (err) {
        console.warn("projectile.update falhou:", err);
      }
    }
    for (const ef of state.effects) {
      try {
        if (ef && typeof ef.update === "function") ef.update(dt);
      } catch (err) {
        console.warn("effect.update falhou:", err);
      }
    }

    // Processar inimigos mortos
    const killedEnemies = state.enemies.filter(
      (e) => e.dead && !e._processedDead
    );
    if (killedEnemies.length > 0) {
      for (const enemy of killedEnemies) {
        state.gold += enemy.goldValue || 0;
        if (waveManager && typeof waveManager.onEnemyDefeated === "function") {
          try {
            waveManager.onEnemyDefeated(enemy);
          } catch (err) {
            console.warn("waveManager.onEnemyDefeated falhou:", err);
          }
        }
        enemy._processedDead = true;
      }
    }

    // Processar inimigos que chegaram à base
    for (const enemy of reachedBaseEnemies) {
      state.lives -= 1;
      enemy.dead = true;
      if (waveManager && typeof waveManager.onEnemyDefeated === "function") {
        try {
          waveManager.onEnemyDefeated(enemy);
        } catch (err) {
          console.warn("waveManager.onEnemyDefeated falhou:", err);
        }
      }
    }

    // Filtrar listas
    state.enemies = state.enemies.filter((e) => !e.dead);
    state.projectiles = state.projectiles.filter(
      (p) => p && p.active !== false
    );
    state.effects = state.effects.filter((e) => e && e.active !== false);

    // Atualizar HUD com segurança
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
            finalScore:
              typeof waveManager?.calculateScore === "function"
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
    // Desenhar efeitos de clima nas torres
    for (const tower of state.towers) {
      drawWeatherEffectOnTower(ctx, tower, state.activeWeatherEffect);
    }

    renderTowerGhost(ctx);
    for (const e of state.enemies) e.draw(ctx);

    // Desenhar projéteis e efeitos se existirem
    for (const p of state.projectiles) {
      if (p && typeof p.draw === "function") p.draw(ctx);
    }
    for (const ef of state.effects) {
      if (ef && typeof ef.draw === "function") ef.draw(ctx);
    }

    // ADICIONE AQUI: Desenhar overlay de clima
    if (weatherOverlay) {
      weatherOverlay.draw(ctx);
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
