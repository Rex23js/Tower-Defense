// js/game-config.js
// Configurações centralizadas do jogo para facilitar balanceamento

export const GAME_CONFIG = {
  // Configurações iniciais do jogo
  startGold: 100,
  startLives: 20,

  // Configurações do path
  pathSamplePerSeg: 1, // densidade de amostragem da curva
  pathRadiusBlock: 30, // distância mínima ao path para construir torres

  // Configurações das waves
  autoWaveDelay: 1.5, // segundos de delay entre waves no modo automático
  enemySpawnDelay: 0.5, // intervalo entre spawn de inimigos da mesma wave
  totalWaves: 12, // número total de waves no jogo

  // Recompensas
  goldPerKill: 7,

  // Definições dos tipos de inimigos
  enemyTypes: {
    basic: {
      speed: 70, // px/s
      hp: 12,
      size: 18,
      color: "#ef4444",
      goldValue: 6,
    },
    fast: {
      speed: 140, // px/s
      hp: 6,
      size: 18,
      color: "#f59e0b",
      goldValue: 8,
    },
    tank: {
      speed: 40, // px/s
      hp: 30,
      size: 22,
      color: "#8b5cf6",
      goldValue: 15,
    },
    boss: {
      speed: 50, // px/s
      hp: 50,
      size: 28,
      color: "#dc2626",
      goldValue: 25,
    },
  },

  // Definições dos tipos de torres
  towerTypes: {
    basic: {
      cost: 40,
      range: 120,
      fireRate: 1, // tiros por segundo
      damage: 4,
      color: "#60a5fa",
      name: "Torre Básica",
      description: "Dano moderado. Alcance médio.",
    },
    sniper: {
      cost: 80,
      range: 260,
      fireRate: 0.5, // Corrigido: sniper deveria ter fireRate baixo
      damage: 12,
      color: "#f97316",
      name: "Sniper",
      description: "Dano alto. Longo alcance. Cadência baixa.",
    },
    rapid: {
      cost: 60,
      range: 100,
      fireRate: 2.5,
      damage: 2,
      color: "#10b981",
      name: "Torre Rápida",
      description: "Dano baixo. Cadência alta.",
    },
    laser: {
      cost: 120,
      range: 180,
      fireRate: 1.8,
      damage: 8,
      color: "#a855f7",
      name: "Torre Laser",
      description: "Tecnologia avançada. Dano perfurante.",
    },
  },

  // Configuração das waves - sistema finito com progressão
  waveDefinitions: [
    // Waves iniciais - tutorial básico
    {
      id: 1,
      enemies: [{ type: "basic", count: 5 }],
      goldReward: 40,
      isBossWave: false,
    },
    {
      id: 2,
      enemies: [{ type: "basic", count: 8 }],
      goldReward: 50,
      isBossWave: false,
    },
    {
      id: 3,
      enemies: [{ type: "fast", count: 6 }],
      goldReward: 60,
      isBossWave: false,
    },

    // Waves intermediárias - mistura de tipos
    {
      id: 4,
      enemies: [
        { type: "basic", count: 6 },
        { type: "fast", count: 3 },
      ],
      goldReward: 70,
      isBossWave: false,
    },
    {
      id: 5,
      enemies: [
        { type: "tank", count: 2 },
        { type: "basic", count: 4 },
      ],
      goldReward: 80,
      isBossWave: false,
    },
    {
      id: 6,
      enemies: [{ type: "fast", count: 10 }],
      goldReward: 90,
      isBossWave: false,
    },

    // Waves avançadas - maior dificuldade
    {
      id: 7,
      enemies: [
        { type: "tank", count: 3 },
        { type: "fast", count: 5 },
      ],
      goldReward: 100,
      isBossWave: false,
    },
    {
      id: 8,
      enemies: [
        { type: "basic", count: 12 },
        { type: "tank", count: 2 },
      ],
      goldReward: 110,
      isBossWave: false,
    },
    {
      id: 9,
      enemies: [
        { type: "fast", count: 8 },
        { type: "tank", count: 4 },
      ],
      goldReward: 120,
      isBossWave: false,
    },

    // Waves finais - preparação para o boss
    {
      id: 10,
      enemies: [
        { type: "tank", count: 6 },
        { type: "fast", count: 6 },
      ],
      goldReward: 140,
      isBossWave: false,
    },
    {
      id: 11,
      enemies: [
        { type: "basic", count: 15 },
        { type: "tank", count: 3 },
      ],
      goldReward: 160,
      isBossWave: false,
    },

    // Wave final - Boss battle
    {
      id: 12,
      enemies: [
        { type: "boss", count: 2 },
        { type: "tank", count: 2 },
      ],
      goldReward: 300,
      isBossWave: true,
    },
  ],

  visual: {
    backgroundColor: "#f8fafc", // tema claro
    pathColor: "#ffffff",
    pathBorderColor: "#e6e6e6",
    pathWidth: 48,
    pathBorderWidth: 3,
    pathRadiusBlock: 32,
    baseColor: "#111827",
    baseStripeColor: "#f3f4f6",
  },

  // Configurações da base
  base: {
    width: 100,
    height: 100,
    hp: 100,
  },
};
