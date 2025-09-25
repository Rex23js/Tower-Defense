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
  // cria array 'extended' com repetição das pontas para suavizar curva
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

// Função que calcula distância real aos segmentos do caminho
function distanceToPath(pt, pathPoints) {
  if (!pathPoints || pathPoints.length === 0) return Infinity;
  let minD = Infinity;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    // projetar pt sobre o segmento AB
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

// Gera waypoints estáveis e proporcionais (mantendo a pista em formato de labirinto)
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

// ==========================================================
// INÍCIO DO ENGINE
// ==========================================================

export async function initEngine(canvas) {
  if (!canvas) return;

  // Configuração inicial estável
  let canvasData = setupStableCanvas(canvas);
  if (!canvasData) return; // Falha na configuração inicial

  let { cssW, cssH, dpr, ctx } = canvasData;

  // Estado inicial fixo
  const initialWaypoints = generateStableWaypoints(cssW, cssH);

  const state = {
    // ADICIONAR estas duas linhas:
    currentWeather: null,
    activeWeatherEffect: null,
    weatherTimer: 0,
    enemies: [],
    towers: [],
    gold: DEFAULTS.startGold,
    lives: DEFAULTS.startLives,
    currentWave: 0,
    waves: [],
    running: true,
    selectedTowerType: null,
    mouse: { x: 0, y: 0, isValid: false },
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
      hp: GAME_CONFIG.base?.hp || 100,
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

    if (state.gold < config.cost) {
      flashMessage("Ouro insuficiente!");
      return;
    }

    // Usar distanceToPath para verificação precisa
    const dToPath = distanceToPath({ x: mx, y: my }, state.pathPoints);
    const isInvalidPath = dToPath < PATH_RADIUS_BLOCK;
    const isInvalidTower = isOverlappingAnotherTower(
      mx,
      my,
      config.size,
      state.towers
    );

    // Verificar colisão com base
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
  // API PÚBLICA
  // ==========================================================

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

      // Usar distanceToPath para verificação precisa
      const dToPath = distanceToPath({ x, y }, state.pathPoints);
      if (dToPath < PATH_RADIUS_BLOCK)
        return { ok: false, reason: "não pode construir no caminho" };

      // Verificar sobreposição com outras torres
      if (isOverlappingAnotherTower(x, y, towerConfig.size, state.towers)) {
        return { ok: false, reason: "muito próximo de outra torre" };
      }

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
    getState: () => ({ ...state }),
    getWaveManager: () => state.waveManager,
    placeTower: placeTower,
    sellTower: sellTower,
    getTowerAt: getTowerAt,
    upgradeTower: upgradeTower,
    toggleAutoWaves: () => state.waveManager.toggleAutoWaves(),
    startNextWave: () => state.waveManager.startNextWave(),

    /**
     * FORÇA A MUDANÇA DE CLIMA PARA TESTES (DEBUG)
     */
    forceWeather(code) {
      console.log(`[DEBUG] Forçando clima com código: ${code}`);
      const mockWeatherData = {
        weathercode: code,
        temperature: 20,
      };
      processWeather(mockWeatherData, state);
    },

    destroy() {
      state.running = false;
      // Adicione aqui qualquer outra limpeza necessária
    },
  };

  // ==========================================================
  // INICIALIZAÇÃO DAS WAVES
  // ==========================================================

  try {
    // Carregar waves e clima em paralelo
    const [wavesResp, weatherResp] = await Promise.allSettled([
      getWaves(),
      safeGetWeather(
        GAME_CONFIG.weather.latitude,
        GAME_CONFIG.weather.longitude
      ),
    ]);

    // Processar waves
    // Processar waves
    if (wavesResp.status === "fulfilled" && wavesResp.value.data) {
      waveManager.initialize(wavesResp.value.data); // <--- LINHA CORRETA
    } else {
      console.warn(
        "Falha ao carregar waves; usando configuração local",
        wavesResp.reason
      );
      waveManager.initialize(GAME_CONFIG.waveDefinitions);
    }

    // Processar clima
    if (weatherResp.status === "fulfilled") {
      processWeather(weatherResp.value.data, state);
      console.info(
        `Clima carregado: ${state.activeWeatherEffect?.label}`,
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

  waveManager.spawnEnemy = (type, gameState) => {
    const startDistance = gameState.pathObj.total + 24 + Math.random() * 60;
    const e = new Enemy(type, startDistance, gameState.pathObj);
    gameState.enemies.push(e);
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

    // Caminho principal
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

  function renderTowerGhost(ctx) {
    if (!state.selectedTowerType) return;

    const config = GAME_CONFIG.towerTypes[state.selectedTowerType];
    const mx = state.mouse.x;
    const my = state.mouse.y;

    // Validações
    const dToPath = distanceToPath({ x: mx, y: my }, state.pathPoints);
    const isInvalidPath = dToPath < PATH_RADIUS_BLOCK;
    const isInvalidTower = isOverlappingAnotherTower(
      mx,
      my,
      config.size,
      state.towers,
      { ignoreRecentMs: 200 } // mantém sua proteção contra a torre recém-criada
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

    // ===== Ajuste aqui para encolher o visual =====
    // Valores de exemplo: 0.25 deixa o corpo bem pequeno; 0.5 é médio; 1.0 = tamanho "real".
    const GHOST_RANGE_SCALE = GAME_CONFIG.visual?.ghostRangeScale ?? 0.6; // alcance visual
    const GHOST_BODY_SCALE = GAME_CONFIG.visual?.ghostBodyScale ?? 0.25; // corpo visual (muito menor)

    // config.range é raio -> lado do quadrado visual = 2 * raio
    const rangeSide = config.range * 1 * GHOST_RANGE_SCALE;
    const ghostSize = config.size * GHOST_BODY_SCALE; // config.size = diâmetro esperado
    const halfGhost = ghostSize / 2;

    // Desenha área de alcance (quadrado)
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = color;
    ctx.fillRect(mx - rangeSide / 2, my - rangeSide / 2, rangeSide, rangeSide);
    ctx.restore();

    // Desenha corpo da torre (quadrado pequeno)
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
  // UPDATE E RENDER
  // ==========================================================

  let last = performance.now();

  function update(dt) {
    if (!state.running) return;

    // 1. ATUALIZAÇÕES GERAIS E DE CLIMA
    // Aplica efeitos e verifica se é hora de buscar um novo clima
    updateWeatherTimer(dt, state);
    applyWeatherEffects(state);

    // 2. LÓGICA DE ATUALIZAÇÃO DAS ENTIDADES
    // Gerencia o spawn de novos inimigos
    state.waveManager.update(dt);

    // Atualiza a posição e o estado de cada torre
    state.towers.forEach((t) => t.update(dt, state.enemies));

    // Atualiza a posição e o estado de cada inimigo
    state.enemies.forEach((e) => e.update(dt));

    // Atualiza a posição e o estado de cada projétil
    state.projectiles.forEach((p) => p.update(dt, state.enemies));

    // Atualiza efeitos visuais (explosões, etc.)
    state.effects.forEach((e) => e.update(dt));

    // 3. PROCESSAMENTO DE RESULTADOS E LIMPEZA
    // Filtra os inimigos que foram mortos neste frame
    const killedEnemies = state.enemies.filter((e) => e.dead);
    if (killedEnemies.length > 0) {
      killedEnemies.forEach((enemy) => {
        state.gold += enemy.goldValue; // Dá o ouro ao jogador
        state.waveManager.onEnemyDefeated(enemy);
      });
    }

    // Remove inimigos mortos e efeitos inativos da lista principal
    state.enemies = state.enemies.filter((e) => !e.dead);
    state.effects = state.effects.filter((e) => e.active);

    // Verifica se inimigos chegaram à base
    state.enemies.forEach((en) => {
      if (en.hasReachedBase) {
        state.lives -= 1;
        en.dead = true; // Marca o inimigo para ser removido no próximo frame
        state.waveManager.onEnemyDefeated(en);
      }
    });

    // Remove novamente caso algum inimigo tenha chegado à base
    state.enemies = state.enemies.filter((e) => !e.dead);

    // 4. VERIFICAÇÃO DE FIM DE JOGO
    if (state.lives <= 0) {
      state.running = false;
      console.info("Game Over: Vidas zeradas.");
      // Dispara evento de game over para a UI
    }
  }

  function render(ctx) {
    // Limpar e renderizar usando dimensões estáveis
    ctx.clearRect(0, 0, state.cssW, state.cssH);
    ctx.fillStyle = GAME_CONFIG.visual?.backgroundColor || "#0b1320";
    ctx.fillRect(0, 0, state.cssW, state.cssH);

    drawGrid(ctx);
    renderDecorations(ctx);
    renderPath(ctx, state.pathPoints);
    renderBase(ctx, state.base);

    // Desenhar torres
    for (const t of state.towers) t.draw(ctx);

    // Desenhar fantasma da torre
    renderTowerGhost(ctx);

    // Desenhar inimigos
    for (const e of state.enemies) e.draw(ctx);

    // Overlay de pausa/game over
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

  /**
   * Processa a resposta da API de clima e define o efeito ativo no estado do jogo.
   */
  function processWeather(weatherData, state) {
    state.currentWeather = weatherData;
    const code = weatherData.weathercode || 0;
    const effects = GAME_CONFIG.weather.effects;

    // Encontra qual efeito corresponde ao código atual
    let activeEffect = effects.clear; // Padrão
    for (const key in effects) {
      if (effects[key].codes.includes(code)) {
        activeEffect = effects[key];
        break;
      }
    }
    state.activeWeatherEffect = activeEffect;

    // Atualiza a UI
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
      state.activeWeatherEffect.modifiers.length === 0
    ) {
      return;
    }

    const modifiers = state.activeWeatherEffect.modifiers;

    for (const tower of state.towers) {
      // Reseta para valores base
      tower.resetToBaseline();

      // Aplica modificadores que afetam esta torre
      for (const mod of modifiers) {
        if (mod.category && tower.category === mod.category) {
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
    if (state.weatherTimer >= GAME_CONFIG.weather.updateInterval) {
      state.weatherTimer = 0;
      // Buscar clima em background (sem bloquear o jogo)
      safeGetWeather(
        GAME_CONFIG.weather.latitude,
        GAME_CONFIG.weather.longitude
      )
        .then((response) => {
          processWeather(response.data, state);
          console.info("Clima atualizado:", state.activeWeatherEffect?.label);
        })
        .catch((err) => console.warn("Falha na atualização do clima:", err));
    }
  }
  // js/engine.js

  // js/engine.js

  function gameLoop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (state.needsRecalc) {
      recalcLayout();
      state.needsRecalc = false;
    }

    // Chama a função update principal que agora contém toda a lógica
    update(dt);

    draw();

    if (state.running) {
      requestAnimationFrame(gameLoop);
    }
  }

  // Iniciar o loop
  requestAnimationFrame(gameLoop);

  return GameAPI;
}
