// js/engine.js
// Engine do jogo: path suave (Catmull-Rom), inimigos por distância, base à esquerda, torres simples.
// Mantive tudo em um arquivo para facilitar.

import { getWaves } from "./api.js";

export let GameAPI = null;

// ---- constantes e defaults ----
const DEFAULTS = {
  startGold: 100,
  startLives: 20,
};

const PATH_SAMPLE_PER_SEG = 18; // quanto maior = curva mais suave e amostragem mais densa
const PATH_RADIUS_BLOCK = 36; // distância mínima ao path para permitir construir

// ---- helpers: Catmull-Rom spline + amostragem/distâncias ----
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
  // replicate endpoints so spline touches them
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
  // binary search for segment index
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

// cheap distance-to-path: percorre amostras e pega menor — suficiente se amostragem for densa
function distanceToPath(point, pathPoints) {
  let best = Infinity;
  for (const q of pathPoints) {
    const d = Math.hypot(point.x - q.x, point.y - q.y);
    if (d < best) best = d;
  }
  return best;
}

// ---- entidades ----
class Enemy {
  constructor(type, startDistance, pathObj) {
    this.type = type;
    this.dist = startDistance; // distância ao longo do path (px)
    this.pathObj = pathObj;
    this.dead = false;
    this.size = 18;
    if (type === "fast") {
      this.speed = 140; // px/s
      this.hp = 6;
      this.color = "#f59e0b";
    } else {
      this.speed = 70;
      this.hp = 12;
      this.color = "#ef4444";
    }
    this.x = 0;
    this.y = 0;
    // init position
    const p = samplePointAtDistance(this.pathObj, this.dist);
    this.x = p.x;
    this.y = p.y;
  }

  update(dt) {
    // move toward path start by reducing dist
    this.dist -= this.speed * dt;
    if (this.dist <= 0) {
      this.dead = true;
      return "reached_base";
    }
    const p = samplePointAtDistance(this.pathObj, this.dist);
    this.x = p.x;
    this.y = p.y;
    return null;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    // hp bar
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2 - 6,
      this.size,
      4
    );
    ctx.fillStyle = "#10b981";
    const maxHp = this.type === "fast" ? 6 : 12;
    const hpW = Math.max(0, (this.hp / maxHp) * this.size);
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2 - 6, hpW, 4);
  }
}

class Tower {
  constructor(x, y, opts = {}) {
    this.x = x;
    this.y = y;
    this.range = opts.range || 120;
    this.fireRate = opts.fireRate || 1;
    this.damage = opts.damage || 4;
    this.cooldown = 0;
    this.color = opts.color || "#60a5fa";
    this.size = 20;
  }

  update(dt, state) {
    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const target = this.findTarget(state.enemies);
      if (target) {
        target.hp -= this.damage;
        this.cooldown = 1 / this.fireRate;
        if (target.hp <= 0) target.dead = true;
      }
    }
  }

  findTarget(enemies) {
    let best = null;
    let bestD = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= this.range && d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ---- engine (init) ----
export async function initEngine(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = 960;
  canvas.height = 640;

  // waypoints: você pode editar aqui para mudar o traçado
  const waypoints = [
    { x: 80, y: canvas.height / 2 }, // base (left)
    { x: 240, y: canvas.height / 2 - 90 }, // curva pra cima
    { x: 520, y: canvas.height / 2 + 40 }, // curva pra baixo
    { x: canvas.width - 48, y: canvas.height / 2 }, // spawn (right)
  ];

  // construir pathPoints e pathObj (distâncias)
  const pathPoints = buildSmoothPath(waypoints, PATH_SAMPLE_PER_SEG);
  const pathObj = buildPathDistances(pathPoints);

  // base desenhável / área
  const base = {
    centerX: waypoints[0].x,
    centerY: waypoints[0].y,
    width: 80,
    height: 160,
    hp: 100, // base HP (para mostrar barra se quiser)
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
  };

  // API pública para UI
  GameAPI = {
    placeTowerAt: (x, y, type) => {
      const templates = {
        basic: {
          cost: 40,
          range: 120,
          fireRate: 1,
          damage: 4,
          color: "#60a5fa",
        },
        sniper: {
          cost: 80,
          range: 260,
          fireRate: 0.5,
          damage: 12,
          color: "#f97316",
        },
      };
      const tpl = templates[type];
      if (!tpl) return { ok: false, reason: "tipo inválido" };
      if (state.gold < tpl.cost)
        return { ok: false, reason: "ouro insuficiente" };

      // bloqueios: não construir sobre base
      const baseLeft = state.base.centerX - state.base.width / 2;
      const baseRight = state.base.centerX + state.base.width / 2;
      const baseTop = state.base.centerY - state.base.height / 2;
      const baseBottom = state.base.centerY + state.base.height / 2;
      if (x >= baseLeft && x <= baseRight && y >= baseTop && y <= baseBottom) {
        return { ok: false, reason: "não pode construir sobre a base" };
      }

      // evitar construir muito perto do path (usa amostras)
      const dToPath = distanceToPath({ x, y }, state.pathPoints);
      if (dToPath < PATH_RADIUS_BLOCK)
        return { ok: false, reason: "não pode construir no caminho" };

      state.gold -= tpl.cost;
      state.towers.push(new Tower(x, y, tpl));
      return { ok: true };
    },

    selectTowerType: (type) => {
      state.selectedTowerType = type;
    },

    startNextWave: () => spawnWave(state.currentWave),
    togglePause: () => (state.running = !state.running),
    getState: () => state,
  };

  // carregar waves via API (db.json)
  try {
    state.waves = await getWaves();
  } catch (e) {
    console.warn("Falha ao carregar waves; usando fallback", e);
    state.waves = [
      {
        id: 1,
        enemies: [
          { type: "basic", count: 6 },
          { type: "fast", count: 3 },
        ],
        goldReward: 60,
      },
    ];
  }

  // spawnWave: usa pathObj.total como referência; spawn fora do final do path
  function spawnWave(idx) {
    const wave = state.waves[idx];
    if (!wave) return;
    let delay = 0;
    wave.enemies.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          // spawn com offset para não nascer todos no mesmo pixel
          const startDist = state.pathObj.total + 24 + Math.random() * 40;
          const e = new Enemy(group.type, startDist, state.pathObj);
          state.enemies.push(e);
        }, Math.round(delay * 1000));
        delay += 0.5;
      }
    });
    state.currentWave++;
  }

  // update / render loop
  let last = performance.now();

  function update(dt) {
    if (!state.running) return;

    // enemies
    for (const en of state.enemies) {
      const res = en.update(dt);
      if (res === "reached_base") {
        state.lives -= 1;
      }
    }

    // towers
    for (const t of state.towers) t.update(dt, state);

    // cleanup + reward
    const before = state.enemies.length;
    state.enemies = state.enemies.filter((e) => !e.dead);
    const killed = before - state.enemies.length;
    if (killed > 0) state.gold += killed * 6;

    // HUD updates (se existirem elements)
    const goldEl = document.getElementById("gold");
    const livesEl = document.getElementById("lives");
    const waveEl = document.getElementById("wave");
    if (goldEl) goldEl.textContent = `Ouro: ${state.gold}`;
    if (livesEl) livesEl.textContent = `Vidas: ${state.lives}`;
    if (waveEl) waveEl.textContent = `Wave: ${Math.max(1, state.currentWave)}`;

    // game over
    if (state.lives <= 0) {
      state.running = false;
      console.info("Game Over");
    }
  }

  function renderPath(ctx, pathPoints) {
    if (!pathPoints || pathPoints.length < 2) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // thick stroke for the path
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++)
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    ctx.lineWidth = 40;
    ctx.strokeStyle = "#1f2937";
    ctx.stroke();

    // darker border
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    // optionally draw centerline faint
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++)
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.stroke();

    ctx.restore();
  }

  function renderBase(ctx, base) {
    const left = base.centerX - base.width / 2;
    ctx.save();
    // base body
    ctx.fillStyle = "#111827";
    ctx.fillRect(left, base.centerY - base.height / 2, base.width, base.height);
    // base stripe
    ctx.fillStyle = "#fca5a5";
    ctx.fillRect(left + 8, base.centerY - 8, base.width - 16, 16);
    ctx.restore();
  }

  function render(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = "#0b1320";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // path (curvo)
    renderPath(ctx, state.pathPoints);

    // base
    renderBase(ctx, state.base);

    // towers then enemies (so shots appear under enemies if you add effects)
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

  // click handler: compute click coords, check build validity, delegate to GameAPI
  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    if (state.selectedTowerType) {
      const res = GameAPI.placeTowerAt(x, y, state.selectedTowerType);
      if (!res.ok) {
        // feedback mínimo: console + toast se quiser
        console.warn("não foi possível colocar torre:", res.reason);
        // pequena tela de aviso visual (temporária)
        flashMessage(res.reason);
      }
    }
  });

  // pequena utilidade para mostrar mensagens temporárias
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
      el.style.boxShadow = "0 6px 22px rgba(2,6,23,0.6)";
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

  GameAPI.selectTowerType = (type) => {
    state.selectedTowerType = type;
  };

  // main loop
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    render(ctx);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // return API para UI
  return GameAPI;
}
