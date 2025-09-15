// js/wave-manager.js
// Módulo responsável pelo controle e gerenciamento das waves com sistema de eventos

import { GAME_CONFIG } from "./game-config.js";
import { Enemy } from "./entities.js";

// Estados possíveis do jogo
export const GAME_STATES = {
  PLAYING: "playing",
  PAUSED: "paused",
  VICTORY: "victory",
  GAME_OVER: "game_over",
  WAITING_FOR_WAVE: "waiting_for_wave",
};

export class WaveManager {
  constructor() {
    // Estado das waves
    this.waves = [];
    this.currentWaveIndex = 0;
    this.maxWaves = GAME_CONFIG.totalWaves || 12;
    this.isWaveActive = false;
    this.spawnQueue = [];

    // Sistema de eventos customizados
    this.eventTarget = new EventTarget();

    // Controle de inimigos
    this.totalEnemiesInWave = 0;
    this.enemiesSpawned = 0;
    this.enemiesRemaining = 0;

    // Auto waves
    this.autoWaves = false;
    this.autoTimer = 0;

    // Estado do jogo
    this.gameState = GAME_STATES.WAITING_FOR_WAVE;
  }

  /**
   * Inicializa o gerenciador com os dados das waves
   * @param {Array} wavesData - Array de waves carregado da API ou fallback
   */
  initialize(wavesData) {
    // Usar waves da API se disponível, senão usar configuração local
    if (wavesData && wavesData.length > 0) {
      this.waves = wavesData;
      this.maxWaves = wavesData.length;
    } else {
      // Fallback para configuração local
      this.waves = GAME_CONFIG.waveDefinitions;
      this.maxWaves = GAME_CONFIG.totalWaves;
    }

    this.currentWaveIndex = 0;
    this.isWaveActive = false;
    this.spawnQueue = [];
    this.gameState = GAME_STATES.WAITING_FOR_WAVE;

    // Disparar evento de inicialização
    this.dispatchEvent("game:initialized", {
      totalWaves: this.maxWaves,
      currentWave: this.currentWaveIndex,
    });

    console.info(`WaveManager inicializado: ${this.maxWaves} waves total`);
  }

  /**
   * Inicia a próxima wave
   * @param {Object} gameState - Estado geral do jogo
   * @returns {boolean} - true se a wave foi iniciada, false caso contrário
   */
  startNextWave(gameState) {
    // Verificar se ainda há waves para iniciar
    if (this.currentWaveIndex >= this.maxWaves) {
      console.info("Todas as waves já foram iniciadas");
      return false;
    }

    // Verificar se há inimigos ainda no mapa
    if (gameState.enemies.length > 0) {
      console.warn("Não é possível iniciar nova wave com inimigos no mapa");
      return false;
    }

    const currentWave = this.waves[this.currentWaveIndex];
    if (!currentWave) {
      console.error("Wave não encontrada:", this.currentWaveIndex);
      return false;
    }

    console.info(
      `Iniciando wave ${this.currentWaveIndex + 1}/${this.maxWaves}`
    );

    // Calcular total de inimigos da wave
    this.totalEnemiesInWave = currentWave.enemies.reduce(
      (sum, group) => sum + group.count,
      0
    );
    this.enemiesSpawned = 0;
    this.enemiesRemaining = this.totalEnemiesInWave;

    this.isWaveActive = true;
    this.gameState = GAME_STATES.PLAYING;
    this.spawnQueue = this.createSpawnQueue(currentWave);

    // Disparar eventos
    this.dispatchEvent("wave:started", {
      waveNumber: this.currentWaveIndex + 1,
      totalWaves: this.maxWaves,
      totalEnemies: this.totalEnemiesInWave,
      isBossWave: currentWave.isBossWave || false,
    });

    this.dispatchEvent("enemy:count:updated", {
      remaining: this.enemiesRemaining,
      total: this.totalEnemiesInWave,
      spawned: this.enemiesSpawned,
    });

    this.currentWaveIndex++;
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
    if (!gameState.running || this.gameState === GAME_STATES.PAUSED) return;

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
    if (
      this.autoWaves &&
      !this.isWaveActive &&
      this.gameState === GAME_STATES.WAITING_FOR_WAVE
    ) {
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
      this.enemiesSpawned++;
    });

    // Remover inimigos spawnados da fila
    this.spawnQueue = this.spawnQueue.filter((spawn) => spawn.spawnTime > 0);

    // Atualizar contador se houve spawn
    if (toSpawn.length > 0) {
      this.dispatchEvent("enemy:count:updated", {
        remaining: this.enemiesRemaining,
        total: this.totalEnemiesInWave,
        spawned: this.enemiesSpawned,
      });
    }
  }

  /**
   * Spawna um inimigo específico
   * @param {string} type - Tipo do inimigo
   * @param {Object} gameState - Estado do jogo
   */
  spawnEnemy(type, gameState) {
    // Posição inicial: fora do final do path
    const startDistance = gameState.pathObj.total + 24 + Math.random() * 40;

    // Usar diretamente a classe Enemy importada
    const enemy = new Enemy(type, startDistance, gameState.pathObj);
    gameState.enemies.push(enemy);
  }

  /**
   * Chamado quando um inimigo é derrotado (deve ser chamado pelo engine)
   * @param {Enemy} enemy - Inimigo derrotado
   */
  onEnemyDefeated(enemy) {
    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);

    this.dispatchEvent("enemy:defeated", {
      enemyType: enemy.type,
      goldValue: enemy.goldValue,
    });

    this.dispatchEvent("enemy:count:updated", {
      remaining: this.enemiesRemaining,
      total: this.totalEnemiesInWave,
      spawned: this.enemiesSpawned,
    });
  }

  /**
   * Chamado quando uma wave é completada
   * @param {Object} gameState - Estado do jogo
   */
  onWaveCompleted(gameState) {
    this.isWaveActive = false;
    this.gameState = GAME_STATES.WAITING_FOR_WAVE;

    // Dar recompensa de ouro
    const completedWaveIndex = this.currentWaveIndex - 1;
    const completedWave = this.waves[completedWaveIndex];
    if (completedWave && completedWave.goldReward) {
      gameState.gold += completedWave.goldReward;
    }

    console.info(`Wave ${completedWaveIndex + 1} completada!`);

    // Disparar evento de wave completada
    this.dispatchEvent("wave:completed", {
      waveNumber: completedWaveIndex + 1,
      goldReward: completedWave?.goldReward || 0,
      isBossWave: completedWave?.isBossWave || false,
    });

    // Verificar condição de vitória
    if (this.currentWaveIndex >= this.maxWaves) {
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
    this.gameState = GAME_STATES.VICTORY;
    gameState.running = false;
    console.info("🎉 Vitória! Todas as waves foram derrotadas!");

    const finalScore = this.calculateScore(gameState);

    // Disparar evento de vitória
    this.dispatchEvent("game:victory", {
      finalScore,
      totalWaves: this.maxWaves,
      remainingLives: gameState.lives,
      finalGold: gameState.gold,
    });
  }

  /**
   * Calcula a pontuação final do jogador
   * @param {Object} gameState - Estado do jogo
   * @returns {number} - Pontuação final
   */
  calculateScore(gameState) {
    const baseScore = gameState.gold * 10;
    const livesBonus = gameState.lives * 50;
    const waveBonus = this.currentWaveIndex * 100;
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

    this.dispatchEvent("auto_waves:changed", {
      enabled: this.autoWaves,
    });
  }

  /**
   * Toggle do estado de auto waves
   */
  toggleAutoWaves() {
    this.setAutoWaves(!this.autoWaves);
  }

  /**
   * Pausa o jogo
   */
  pauseGame() {
    if (this.gameState === GAME_STATES.PLAYING) {
      this.gameState = GAME_STATES.PAUSED;
      this.dispatchEvent("game:paused", {});
    }
  }

  /**
   * Resume o jogo
   */
  resumeGame() {
    if (this.gameState === GAME_STATES.PAUSED) {
      this.gameState = GAME_STATES.PLAYING;
      this.dispatchEvent("game:resumed", {});
    }
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
      this.currentWaveIndex < this.maxWaves &&
      this.gameState !== GAME_STATES.VICTORY
    );
  }

  /**
   * Retorna informações sobre o estado atual das waves
   * @returns {Object}
   */
  getStatus() {
    return {
      currentWave: this.currentWaveIndex,
      totalWaves: this.maxWaves,
      isWaveActive: this.isWaveActive,
      autoWaves: this.autoWaves,
      autoTimer: this.autoTimer,
      remainingEnemies: this.spawnQueue.length,
      enemiesInCurrentWave: this.totalEnemiesInWave,
      enemiesRemaining: this.enemiesRemaining,
      gameState: this.gameState,
    };
  }

  /**
   * Adiciona listener para eventos customizados
   * @param {string} eventType - Tipo do evento
   * @param {Function} callback - Função callback
   */
  addEventListener(eventType, callback) {
    this.eventTarget.addEventListener(eventType, callback);
  }

  /**
   * Remove listener de eventos
   * @param {string} eventType - Tipo do evento
   * @param {Function} callback - Função callback
   */
  removeEventListener(eventType, callback) {
    this.eventTarget.removeEventListener(eventType, callback);
  }

  /**
   * Dispara um evento customizado
   * @param {string} eventType - Tipo do evento
   * @param {Object} detail - Dados do evento
   */
  dispatchEvent(eventType, detail) {
    const event = new CustomEvent(eventType, { detail });
    this.eventTarget.dispatchEvent(event);

    // Também disparar no window para compatibilidade
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(eventType, { detail }));
    }
  }
}
