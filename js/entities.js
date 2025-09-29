// js/entities.js
// Classes das entidades do jogo: inimigos e torres

import { GAME_CONFIG } from "./game-config.js";

/** Desenha um raio zig-zag */
function drawLightningIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.18);
  ctx.beginPath();
  const s = size;
  ctx.moveTo(cx - s * 0.5, cy + s * 0.4);
  ctx.lineTo(cx - s * 0.15, cy - s * 0.15);
  ctx.lineTo(cx + s * 0.05, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.4);
  ctx.stroke();

  // brilho sutil
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,255,230,0.25)";
  ctx.lineWidth = Math.max(0.6, size * 0.07);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.4);
  ctx.lineTo(cx - s * 0.15, cy - s * 0.15);
  ctx.lineTo(cx + s * 0.05, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.4);
  ctx.stroke();
  ctx.restore();
}

/** Desenha um escudo rachado (para redução de dano) */
function drawCrackedShield(ctx, cx, cy, size, color) {
  ctx.save();
  const r = size * 0.45;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.lineTo(cx + r * 0.8, cy + r * 0.9);
  ctx.lineTo(cx - r * 0.8, cy + r * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // rachadura
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.2;
  ctx.moveTo(cx - r * 0.15, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.02, cy + r * 0.15);
  ctx.lineTo(cx - r * 0.02, cy + r * 0.05);
  ctx.stroke();
  ctx.restore();
}

/** Desenha uma gota (para chuva) */
function drawDropIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  const s = size * 0.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.6);
  ctx.bezierCurveTo(
    cx + s * 0.35,
    cy - s * 0.15,
    cx + s * 0.12,
    cy + s * 0.6,
    cx,
    cy + s * 0.6
  );
  ctx.bezierCurveTo(
    cx - s * 0.12,
    cy + s * 0.6,
    cx - s * 0.35,
    cy - s * 0.15,
    cx,
    cy - s * 0.6
  );
  ctx.fill();
  ctx.restore();
}

/** Desenha anéis comparativos (baseline tracejado + atual sólido) */
function drawRangeRings(ctx, tower) {
  const baseR = (tower.baseline && tower.baseline.range) || tower.range;
  const curR = tower.range || baseR;
  ctx.save();

  // base (tracejada, fraca)
  ctx.beginPath();
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.arc(tower.x, tower.y, baseR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // atual (visível)
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(249,115,22,0.95)"; // laranja
  ctx.arc(tower.x, tower.y, curR, 0, Math.PI * 2);
  ctx.stroke();

  // indicador de perda percentual (se reduziu)
  if (baseR > curR) {
    const pct = Math.round(((baseR - curR) / baseR) * 100);
    ctx.font = "11px Inter, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.fillText(`-${pct}%`, tower.x, tower.y - curR - 10);
  }

  ctx.restore();
}

/** Desenha todos os debuffs da torre (ícones + barras de duração) */
function drawDebuffsForTower(ctx, tower) {
  if (!Array.isArray(tower.debuffs) || tower.debuffs.length === 0) return;

  const iconsize = Math.max(8, Math.min(14, tower.size * 0.35));
  const baseY = tower.y - tower.size / 2 - 14;
  const spacing = iconsize + 6;
  const count = tower.debuffs.length;

  for (let i = 0; i < count; i++) {
    const d = tower.debuffs[i];
    const cx = tower.x - ((count - 1) * spacing) / 2 + i * spacing;
    const cy = baseY;

    // escolha de cor por propriedade
    const colorMap = {
      range: "#60a5fa",
      fireRate: "#facc15",
      damage: "#ef4444",
    };
    const col = colorMap[d.property] || "#999";

    ctx.save();
    // se for debuff de range, mostra anéis ao redor da torre
    if (d.property === "range") {
      drawRangeRings(ctx, tower);
      // e desenha um pequeno ícone de indicação
      ctx.beginPath();
      ctx.fillStyle = col;
      ctx.arc(cx, cy, iconsize * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.property === "fireRate") {
      drawLightningIcon(ctx, cx, cy, iconsize * 2.0, col);
    } else if (d.property === "damage") {
      drawCrackedShield(ctx, cx, cy, iconsize * 2.0, col);
    } else if (d.property === "accuracy" || d.property === "slow") {
      drawDropIcon(ctx, cx, cy, iconsize * 1.6, col);
    } else {
      // fallback: pequeno círculo
      ctx.beginPath();
      ctx.fillStyle = col;
      ctx.arc(cx, cy, iconsize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // barra de duração (se aplicável)
    if (typeof d.remaining === "number") {
      // inicial: guarde d._initial quando criado (recomendado)
      const initial = typeof d._initial === "number" ? d._initial : d.remaining;
      const pct =
        initial > 0 ? Math.max(0, Math.min(1, d.remaining / initial)) : 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(cx - iconsize, cy + 8, iconsize * 2 * pct, 2);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 0.6;
      ctx.strokeRect(cx - iconsize, cy + 8, iconsize * 2, 2);
    }

    ctx.restore();
  }
}

/**
 * Classe base para inimigos
 */
export class Enemy {
  constructor(type, startDistance, pathObj) {
    this.type = type;
    this.dist = startDistance; // distância ao longo do path (px)
    this.pathObj = pathObj;
    this.dead = false;

    // Aplicar configurações do tipo
    const config = GAME_CONFIG.enemyTypes[type] || GAME_CONFIG.enemyTypes.basic;
    this.speed = config.speed; // px/s
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.size = config.size;
    this.color = config.color;
    this.goldValue = config.goldValue;

    this.x = 0;
    this.y = 0;

    // Inicializar posição
    const p = this.samplePointAtDistance(this.pathObj, this.dist);
    this.x = p.x;
    this.y = p.y;
  }

  /**
   * Atualiza o estado do inimigo
   * @param {number} dt - Delta time em segundos
   * @returns {string|null} - Evento especial ou null
   */
  update(dt) {
    // Mover em direção ao início do path (base)
    this.dist -= this.speed * dt;

    if (this.dist <= 0) {
      this.dead = true;
      return "reached_base";
    }

    // Atualizar posição baseada na nova distância
    const p = this.samplePointAtDistance(this.pathObj, this.dist);
    this.x = p.x;
    this.y = p.y;

    return null;
  }

  /**
   * Amostra um ponto no path baseado na distância
   * @param {Object} pathObj - Objeto do path com pontos e distâncias
   * @param {number} distance - Distância ao longo do path
   * @returns {Object} - Ponto {x, y}
   */
  samplePointAtDistance(pathObj, distance) {
    const { points, cumulative } = pathObj;
    if (!points || points.length === 0) return { x: 0, y: 0 };
    if (distance <= 0) return points[0];
    if (distance >= pathObj.total) return points[points.length - 1];

    // Busca binária para encontrar o segmento correto
    let low = 0;
    let high = cumulative.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (cumulative[mid] <= distance && distance <= cumulative[mid + 1]) {
        const a = points[mid];
        const b = points[mid + 1];
        const segLen = cumulative[mid + 1] - cumulative[mid];
        const t = segLen === 0 ? 0 : (distance - cumulative[mid]) / segLen;
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        };
      }
      if (cumulative[mid] < distance) low = mid + 1;
      else high = mid - 1;
    }

    return points[points.length - 1];
  }

  /**
   * Aplica dano ao inimigo
   * @param {number} damage - Quantidade de dano
   * @returns {boolean} - true se o inimigo morreu
   */
  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  /**
   * Renderiza o inimigo no canvas
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   */
  draw(ctx) {
    // Corpo do inimigo
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );

    // Barra de HP
    const barHeight = 4;
    const barY = this.y - this.size / 2 - 6;

    // Background da barra
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(this.x - this.size / 2, barY, this.size, barHeight);

    // HP atual
    ctx.fillStyle = this.hp > this.maxHp * 0.3 ? "#10b981" : "#ef4444";
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const hpWidth = hpRatio * this.size;
    ctx.fillRect(this.x - this.size / 2, barY, hpWidth, barHeight);
  }

  /**
   * Retorna informações de depuração do inimigo
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      type: this.type,
      hp: this.hp,
      maxHp: this.maxHp,
      speed: this.speed,
      distance: this.dist.toFixed(1),
      position: { x: this.x.toFixed(1), y: this.y.toFixed(1) },
    };
  }
}

/**
 * Classe para torres
 */
export class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;

    const cfg = GAME_CONFIG.towerTypes[type] || {};
    this.cfg = cfg;

    // Normalizar valores vindos de config (usar defaults)
    this.size = typeof cfg.size === "number" ? cfg.size : 20;
    this.range = typeof cfg.range === "number" ? cfg.range : 80;
    this.damage = typeof cfg.damage === "number" ? cfg.damage : cfg.damage ?? 4;
    this.fireRate =
      typeof cfg.fireRate === "number" ? cfg.fireRate : cfg.fireRate ?? 1;
    this.color = cfg.color || "#33c";
    this.cost = cfg.cost || 0;

    // Estado dinâmico
    this.cooldown = 0;
    this.target = null;
    this.totalDamageDealt = 0;
    this.enemiesKilled = 0;

    // Retarget
    this.retargetTimer = 0;
    this.retargetInterval =
      typeof cfg.retargetInterval === "number" ? cfg.retargetInterval : 0.25;
    this.category = cfg.category || "basic";

    // Baseline (valores puros para reset)
    this.baseline = {
      damage: this.damage,
      range: this.range,
      fireRate: this.fireRate,
    };

    // Sistema de debuffs
    // debuffs: array de { id, property, multiplier, remaining|null, _initial|null, source, label }
    this.debuffs = [];
    this._effectCache = null;
  }

  // reseta para baseline (antes de reaplicar debuffs)
  resetToBaseline() {
    this.damage = this.baseline.damage;
    this.range = this.baseline.range;
    this.fireRate = this.baseline.fireRate;
  }

  // recalcula stats baseando-se nos debuffs atuais
  computeEffectiveStats() {
    this.resetToBaseline();

    if (Array.isArray(this.debuffs) && this.debuffs.length) {
      for (const d of this.debuffs) {
        if (!d || !d.property || typeof d.multiplier !== "number") continue;
        if (d.property in this) {
          this[d.property] = this[d.property] * d.multiplier;
        }
      }
    }

    // evite fireRate zero/negativo
    if (!this.fireRate || this.fireRate <= 0) this.fireRate = 0.001;
  }

  addDebuff(deb) {
    if (!deb || !deb.id) return;
    this.debuffs = this.debuffs || [];
    const exists = this.debuffs.find((d) => d.id === deb.id);
    if (exists) {
      // renovar duração se aplicável
      if (typeof deb.remaining === "number") exists.remaining = deb.remaining;
      return;
    }
    const copy = Object.assign({}, deb);
    if (typeof copy.remaining === "number") copy._initial = copy.remaining;
    else copy._initial = null;
    this.debuffs.push(copy);
    this.computeEffectiveStats();
  }

  removeDebuff(id) {
    this.debuffs = (this.debuffs || []).filter((d) => d.id !== id);
    this.computeEffectiveStats();
  }

  update(dt, gameState) {
    if (dt <= 0) return;

    // atualizar timers de debuffs
    if (Array.isArray(this.debuffs) && this.debuffs.length) {
      let changed = false;
      for (const d of this.debuffs) {
        if (typeof d.remaining === "number") {
          d.remaining -= dt;
          if (d.remaining <= 0) {
            d._expired = true;
            changed = true;
          }
        }
      }
      if (changed) {
        this.debuffs = this.debuffs.filter((d) => !d._expired);
        this.computeEffectiveStats();
      }
    }

    // timers normais
    this.cooldown = (this.cooldown || 0) - dt;
    this.retargetTimer = (this.retargetTimer || 0) - dt;

    // retarget
    if (!this.target || this.retargetTimer <= 0) {
      this.retargetTimer = this.retargetInterval;
      this.target = this.findTarget(gameState.enemies || []);
    }

    // atirar se possível
    if (this.cooldown <= 0 && this.target) {
      this.fire(this.target, gameState);
      const fr = this.fireRate && this.fireRate > 0 ? this.fireRate : 1;
      this.cooldown = 1 / fr;
    }
  }

  findTarget(enemies) {
    let bestTarget = null;
    let bestScore = -Infinity;

    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist > this.range) continue;
      const pathTotal = (enemy.pathObj && enemy.pathObj.total) || 1000;
      const score = this.calculateTargetScore(enemy, dist, pathTotal);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  calculateTargetScore(enemy, distance, pathTotal = 1000) {
    const progressTowardsBase = Math.max(
      0,
      (pathTotal || 1000) - (enemy.dist || 0)
    );
    const closenessToTower = Math.max(0, (this.range || 0) - distance);
    const wBase = 0.7;
    const wTower = 0.3;
    return wBase * progressTowardsBase + wTower * closenessToTower;
  }

  fire(target, gameState) {
    if (!target || target.dead) return;

    const dmg = typeof this.damage === "number" ? this.damage : 1;
    const killed = target.takeDamage(dmg);

    this.totalDamageDealt += dmg;
    if (killed) this.enemiesKilled++;

    // efeito visual (pode acionar partículas se houver)
    this.createFireEffect(target);
  }

  createFireEffect(target) {
    if (typeof window !== "undefined" && window.createParticle) {
      window.createParticle({
        from: { x: this.x, y: this.y },
        to: { x: target.x, y: target.y },
        color: this.color,
        duration: 0.1,
      });
    }
  }

  isInRange(x, y) {
    const d = Math.hypot(x - this.x, y - this.y);
    return d <= this.range;
  }

  draw(ctx, showRange = false) {
    // alcance (círculo pontilhado)
    if (showRange) {
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // corpo
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );

    // borda
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );

    // indicador de cooldown
    if (this.cooldown > 0) {
      const cooldownRatio = this.cooldown / (1 / this.fireRate);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(
        this.x - this.size / 2,
        this.y + this.size / 2 + 2,
        this.size * (1 - cooldownRatio),
        3
      );
    }

    // linha para alvo
    if (this.target && !this.target.dead) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.strokeStyle = "rgba(255,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Desenha indicadores visuais de debuffs (renderiza anéis/ícones/barra)
    drawDebuffsForTower(ctx, this);
  }

  getStats() {
    return {
      type: this.type,
      cost: this.cost,
      damage: this.damage,
      fireRate: this.fireRate,
      range: this.range,
      totalDamage: this.totalDamageDealt,
      kills: this.enemiesKilled,
      efficiency: this.cost
        ? this.totalDamageDealt / this.cost
        : this.totalDamageDealt,
    };
  }

  upgrade(upgradeType) {
    const upgrades = {
      damage: { cost: 30, multiplier: 1.5, property: "damage" },
      range: { cost: 25, multiplier: 1.3, property: "range" },
      speed: { cost: 35, multiplier: 1.4, property: "fireRate" },
    };

    const upgrade = upgrades[upgradeType];
    if (!upgrade) {
      return { success: false, reason: "Tipo de upgrade inválido" };
    }

    this[upgrade.property] *= upgrade.multiplier;
    this.cost += upgrade.cost;

    // atualizar baseline também (opcional — decide se upgrades são permanentes)
    this.baseline[upgrade.property] = this[upgrade.property];

    return {
      success: true,
      cost: upgrade.cost,
      newValue: this[upgrade.property],
    };
  }
}
