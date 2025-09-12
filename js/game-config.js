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
      fireRate: 0.5,
      damage: 12,
      color: "#f97316",
      name: "Sniper",
      description: "Dano alto. Cadência baixa.",
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
  },

  visual: {
    backgroundColor: "#f8fafc", // <-- troque aqui (tema claro)
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
