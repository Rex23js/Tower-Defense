// js/wave-manager.js
// Módulo responsável pelo controle e gerenciamento das waves

import { GAME_CONFIG } from "./game-config.js";

export class WaveManager {
  constructor() {
    this.waves = [];
    this.nextWaveIndex = 0;
    this.maxWaves = 0;
    this.autoWaves = false;
    this.autoTimer = 0;
    this.isWaveActive = false;
    this.spawnQueue = [];
  }

  /**
   * Inicializa o gerenciador com os dados das waves
   * @param {Array} wavesData - Array de waves carregado da API
   */
  initialize(wavesData) {
    this.waves = wavesData || [];
    this.maxWaves = this.waves.length;
    this.nextWaveIndex = 0;
    this.isWaveActive = false;
    this.spawnQueue = [];
  }

  /**
   * Inicia a próxima wave
   * @param {Object} gameState - Estado geral do jogo
   * @returns {boolean} - true se a wave foi iniciada, false caso contrário
   */
  startNextWave(gameState) {
    // Verifica se ainda há waves para iniciar
    if (this.nextWaveIndex >= this.maxWaves) {
      console.info("Todas as waves já foram iniciadas");
      return false;
    }

    // Verifica se há inimigos ainda no mapa
    if (gameState.enemies.length > 0) {
      console.warn("Não é possível iniciar nova wave com inimigos no mapa");
      return false;
    }

    const currentWave = this.waves[this.nextWaveIndex];
    if (!currentWave) {
      console.error("Wave não encontrada:", this.nextWaveIndex);
      return false;
    }

    console.info(`Iniciando wave ${this.nextWaveIndex + 1}/${this.maxWaves}`);

    this.isWaveActive = true;
    this.spawnQueue = this.createSpawnQueue(currentWave);
    this.nextWaveIndex++;

    return true;
  }

  /**
   * Cria a fila de spawn baseada na configuração da wave
   * @param {Object} waveData - Dados da wave atual
   * @returns {Array} - Fila de spawn com timing
   */
  createSpawnQueue(waveData) {
    const queue = [];
    let delay = 0;

    waveData.enemies.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        queue.push({
          type: group.type,
          spawnTime: delay,
        });
        delay += GAME_CONFIG.enemySpawnDelay;
      }
    });

    return queue;
  }

  /**
   * Atualiza o gerenciador de waves
   * @param {number} deltaTime - Tempo decorrido desde último update
   * @param {Object} gameState - Estado geral do jogo
   */
  update(deltaTime, gameState) {
    if (!gameState.running) return;

    // Processar fila de spawn
    this.processSpawnQueue(deltaTime, gameState);

    // Verificar se wave atual terminou
    if (
      this.isWaveActive &&
      this.spawnQueue.length === 0 &&
      gameState.enemies.length === 0
    ) {
      this.onWaveCompleted(gameState);
    }

    // Processar auto waves
    if (this.autoWaves && !this.isWaveActive) {
      this.updateAutoTimer(deltaTime, gameState);
    }
  }

  /**
   * Processa a fila de spawn de inimigos
   * @param {number} deltaTime - Tempo decorrido
   * @param {Object} gameState - Estado do jogo
   */
  processSpawnQueue(deltaTime, gameState) {
    if (this.spawnQueue.length === 0) return;

    // Reduzir tempo de spawn de todos os inimigos na fila
    this.spawnQueue.forEach((spawn) => {
      spawn.spawnTime -= deltaTime;
    });

    // Spawnar inimigos que chegaram na hora
    const toSpawn = this.spawnQueue.filter((spawn) => spawn.spawnTime <= 0);

    toSpawn.forEach((spawn) => {
      this.spawnEnemy(spawn.type, gameState);
    });

    // Remover inimigos spawnados da fila
    this.spawnQueue = this.spawnQueue.filter((spawn) => spawn.spawnTime > 0);
  }

  /**
   * Spawna um inimigo específico
   * @param {string} type - Tipo do inimigo
   * @param {Object} gameState - Estado do jogo
   */
  spawnEnemy(type, gameState) {
    // Posição inicial: fora do final do path
    const startDistance = gameState.pathObj.total + 24 + Math.random() * 40;

    // Importar dinamicamente a classe Enemy quando necessário
    import("./entities.js")
      .then(({ Enemy }) => {
        const enemy = new Enemy(type, startDistance, gameState.pathObj);
        gameState.enemies.push(enemy);
      })
      .catch(() => {
        // Fallback caso entities.js não esteja disponível
        console.warn(
          "Não foi possível importar Enemy, usando implementação local"
        );
        const enemy = this.createEnemyFallback(
          type,
          startDistance,
          gameState.pathObj
        );
        gameState.enemies.push(enemy);
      });
  }

  /**
   * Implementação fallback para criação de inimigos
   * @param {string} type - Tipo do inimigo
   * @param {number} startDistance - Distância inicial
   * @param {Object} pathObj - Objeto do caminho
   */
  createEnemyFallback(type, startDistance, pathObj) {
    const config = GAME_CONFIG.enemyTypes[type] || GAME_CONFIG.enemyTypes.basic;

    return {
      type: type,
      dist: startDistance,
      pathObj: pathObj,
      dead: false,
      size: config.size,
      speed: config.speed,
      hp: config.hp,
      maxHp: config.hp,
      color: config.color,
      goldValue: config.goldValue,
      x: 0,
      y: 0,

      update(dt) {
        // Mover em direção ao início do path
        this.dist -= this.speed * dt;
        if (this.dist <= 0) {
          this.dead = true;
          return "reached_base";
        }

        // Atualizar posição baseada na distância no path
        const p = this.samplePointAtDistance(this.pathObj, this.dist);
        this.x = p.x;
        this.y = p.y;
        return null;
      },

      samplePointAtDistance(pathObj, distance) {
        const { points, cumulative } = pathObj;
        if (!points || points.length === 0) return { x: 0, y: 0 };
        if (distance <= 0) return points[0];
        if (distance >= pathObj.total) return points[points.length - 1];

        // Busca binária para encontrar o segmento
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
      },

      draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
          this.x - this.size / 2,
          this.y - this.size / 2,
          this.size,
          this.size
        );

        // Barra de HP
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(
          this.x - this.size / 2,
          this.y - this.size / 2 - 6,
          this.size,
          4
        );
        ctx.fillStyle = "#10b981";
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const hpWidth = hpRatio * this.size;
        ctx.fillRect(
          this.x - this.size / 2,
          this.y - this.size / 2 - 6,
          hpWidth,
          4
        );
      },
    };
  }

  /**
   * Chamado quando uma wave é completada
   * @param {Object} gameState - Estado do jogo
   */
  onWaveCompleted(gameState) {
    this.isWaveActive = false;

    // Dar recompensa de ouro
    const completedWaveIndex = this.nextWaveIndex - 1;
    const completedWave = this.waves[completedWaveIndex];
    if (completedWave && completedWave.goldReward) {
      gameState.gold += completedWave.goldReward;
    }

    console.info(`Wave ${completedWaveIndex + 1} completada!`);

    // Verificar condição de vitória
    if (this.nextWaveIndex >= this.maxWaves) {
      this.onGameVictory(gameState);
    } else if (this.autoWaves) {
      // Iniciar timer para próxima wave automática
      this.autoTimer = GAME_CONFIG.autoWaveDelay;
    }
  }

  /**
   * Atualiza o timer das waves automáticas
   * @param {number} deltaTime - Tempo decorrido
   * @param {Object} gameState - Estado do jogo
   */
  updateAutoTimer(deltaTime, gameState) {
    if (this.autoTimer > 0) {
      this.autoTimer -= deltaTime;
      if (this.autoTimer <= 0) {
        this.startNextWave(gameState);
      }
    }
  }

  /**
   * Chamado quando o jogador vence o jogo
   * @param {Object} gameState - Estado do jogo
   */
  onGameVictory(gameState) {
    gameState.running = false;
    console.info("🎉 Vitória! Todas as waves foram derrotadas!");

    // Disparar evento personalizado para a UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("gameVictory", {
          detail: { finalScore: this.calculateScore(gameState) },
        })
      );
    }
  }

  /**
   * Calcula a pontuação final do jogador
   * @param {Object} gameState - Estado do jogo
   * @returns {number} - Pontuação final
   */
  calculateScore(gameState) {
    const baseScore = gameState.gold * 10;
    const livesBonus = gameState.lives * 50;
    const waveBonus = this.nextWaveIndex * 100;
    return baseScore + livesBonus + waveBonus;
  }

  /**
   * Ativa/desativa o modo de waves automáticas
   * @param {boolean} enabled - Se deve ativar ou desativar
   */
  setAutoWaves(enabled) {
    this.autoWaves = enabled;
    if (!enabled) {
      this.autoTimer = 0;
    }
    console.info(`Waves automáticas: ${enabled ? "ATIVADAS" : "DESATIVADAS"}`);
  }

  /**
   * Verifica se pode iniciar uma nova wave
   * @param {Object} gameState - Estado do jogo
   * @returns {boolean}
   */
  canStartWave(gameState) {
    return (
      !this.isWaveActive &&
      gameState.enemies.length === 0 &&
      this.nextWaveIndex < this.maxWaves
    );
  }

  /**
   * Retorna informações sobre o estado atual das waves
   * @returns {Object}
   */
  getStatus() {
    return {
      currentWave: this.nextWaveIndex,
      totalWaves: this.maxWaves,
      isWaveActive: this.isWaveActive,
      autoWaves: this.autoWaves,
      autoTimer: this.autoTimer,
      remainingEnemies: this.spawnQueue.length,
    };
  }
}
