// js/entities.js
// Classes das entidades do jogo: inimigos e torres

import { GAME_CONFIG } from "./game-config.js";

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
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.type = type;

    // Aplicar configurações do tipo
    const config = GAME_CONFIG.towerTypes[type] || GAME_CONFIG.towerTypes.basic;
    this.range = config.range;
    this.fireRate = config.fireRate;
    this.damage = config.damage;
    this.color = config.color;
    this.cost = config.cost;

    this.cooldown = 0;
    this.size = 20;
    this.target = null;
    this.totalDamageDealt = 0;
    this.enemiesKilled = 0;
  }

  /**
   * Atualiza o estado da torre
   * @param {number} dt - Delta time
   * @param {Object} gameState - Estado do jogo
   */
  update(dt, gameState) {
    this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const target = this.findTarget(gameState.enemies);
      if (target) {
        this.fire(target, gameState);
        this.cooldown = 1 / this.fireRate;
      }
    }
  }

  /**
   * Encontra o melhor alvo dentro do alcance
   * @param {Array} enemies - Array de inimigos
   * @returns {Enemy|null} - Inimigo alvo ou null
   */
  findTarget(enemies) {
    let bestTarget = null;
    let bestScore = -1;

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (distance > this.range) continue;

      // Estratégia de alvo: priorizar inimigos mais próximos da base
      const score = this.calculateTargetScore(enemy, distance);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }

    this.target = bestTarget;
    return bestTarget;
  }

  /**
   * Calcula a pontuação do alvo para priorização
   * @param {Enemy} enemy - Inimigo
   * @param {number} distance - Distância até o inimigo
   * @returns {number} - Pontuação do alvo
   */
  calculateTargetScore(enemy, distance) {
    // Priorizar inimigos mais próximos da base (menor dist)
    const proximityToBase = 1000 - enemy.dist;
    const proximityToTower = 200 - distance;

    return proximityToBase + proximityToTower;
  }

  /**
   * Dispara contra um alvo
   * @param {Enemy} target - Inimigo alvo
   * @param {Object} gameState - Estado do jogo
   */
  fire(target, gameState) {
    const killed = target.takeDamage(this.damage);
    this.totalDamageDealt += this.damage;

    if (killed) {
      this.enemiesKilled++;
      // Dar recompensa de ouro
      gameState.gold += target.goldValue;
    }

    // Criar efeito visual de tiro (opcional)
    this.createFireEffect(target);
  }

  /**
   * Cria efeito visual de disparo
   * @param {Enemy} target - Alvo do disparo
   */
  createFireEffect(target) {
    // Efeito simples - pode ser expandido no futuro
    if (typeof window !== "undefined" && window.createParticle) {
      window.createParticle({
        from: { x: this.x, y: this.y },
        to: { x: target.x, y: target.y },
        color: this.color,
        duration: 0.1,
      });
    }
  }

  /**
   * Verifica se um ponto está dentro do alcance
   * @param {number} x - Coordenada X
   * @param {number} y - Coordenada Y
   * @returns {boolean}
   */
  isInRange(x, y) {
    const distance = Math.hypot(x - this.x, y - this.y);
    return distance <= this.range;
  }

  /**
   * Renderiza a torre no canvas
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {boolean} showRange - Se deve mostrar o alcance
   */
  draw(ctx, showRange = false) {
    // Alcance (círculo pontilhado)
    if (showRange) {
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Corpo da torre
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );

    // Borda da torre
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );

    // Indicador de cooldown
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

    // Linha para o alvo atual
    if (this.target && !this.target.dead) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.strokeStyle = "rgba(255,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Retorna estatísticas da torre
   * @returns {Object}
   */
  getStats() {
    return {
      type: this.type,
      cost: this.cost,
      damage: this.damage,
      fireRate: this.fireRate,
      range: this.range,
      totalDamage: this.totalDamageDealt,
      kills: this.enemiesKilled,
      efficiency: this.totalDamageDealt / this.cost,
    };
  }

  /**
   * Melhora a torre (upgrade)
   * @param {string} upgradeType - Tipo de melhoria
   * @returns {Object} - Resultado da melhoria
   */
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

    // Aplicar upgrade
    this[upgrade.property] *= upgrade.multiplier;
    this.cost += upgrade.cost;

    return {
      success: true,
      cost: upgrade.cost,
      newValue: this[upgrade.property],
    };
  }
}
