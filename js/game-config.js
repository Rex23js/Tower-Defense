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

  /**
   * ============================================================================
   * Enemy Types - Definições dos tipos de inimigos
   * ============================================================================
   */
  enemyTypes: {
    basic: {
      speed: 70,
      hp: 14,
      size: 18,
      color: "#ef4444",
      goldValue: 6,
      description: "Inimigo padrão, equilíbrio entre velocidade e vida.",
    },
    fast: {
      speed: 140,
      hp: 6,
      size: 16,
      color: "#f59e0b",
      goldValue: 7,
      description: "Rápido e frágil. Pressiona as torres de cadência.",
    },
    tank: {
      speed: 40,
      hp: 40,
      size: 24,
      color: "#8b5cf6",
      goldValue: 18,
      armor: 2,
      description: "Lento e resistente; absorve dano.",
    },
    swarm: {
      speed: 120,
      hp: 5,
      size: 12,
      color: "#f97316",
      goldValue: 3,
      description: "Pequeno e em número — perigoso em massa.",
    },
    flying: {
      speed: 140,
      hp: 9,
      size: 14,
      color: "#06b6d4",
      goldValue: 10,
      flying: true,
      description: "Voador — requer torre antiaérea.",
    },
    boss: {
      speed: 45,
      hp: 180,
      size: 40,
      color: "#dc2626",
      goldValue: 220,
      armor: 5,
      isBoss: true,
      description: "Chefe final. Alta vida e armadura.",
    },
  },

  towerTypes: {
    basic: {
      cost: 40,
      range: 120,
      fireRate: 1,
      damage: 4,
      size: 20,
      color: "#60a5fa",
      name: "Torre Básica",
      description: "Dano consistente e confiável.",
      category: "basic",
    },

    rapid: {
      cost: 60,
      range: 100,
      fireRate: 2.5,
      damage: 2,
      size: 20,
      color: "#10b981",
      name: "Torre Rápida",
      description: "Alta cadência para lidar com enxames.",
      category: "basic",
    },

    sniper: {
      cost: 80,
      range: 260,
      fireRate: 0.5,
      damage: 12,
      size: 20,
      color: "#f97316",
      name: "Sniper",
      description: "Dano alto e longo alcance, ótimo contra tanques.",
      category: "basic",
    },
  },

  /**
   * ============================================================================
   * Configurações de Clima e Efeitos
   * ============================================================================
   */
  weather: {
    // Coordenadas para a API Open-Meteo
    latitude: -37.8136,
    longitude: 144.9631,
    // Intervalo para buscar clima novamente (em segundos)
    updateInterval: 300, // 5 minutos
    // Efeitos aplicados a torres com base no weathercode da API.
    effects: {
      // Códigos 0-3: Céu limpo, poucas nuvens (sem efeito)
      clear: {
        codes: [0, 1, 2, 3],
        label: "Tempo Bom",
        icon: "☀️",
        modifiers: [],
      },
      // Códigos 45, 48: Neblina
      fog: {
        codes: [45, 48],
        label: "Neblina",
        icon: "🌫️",
        modifiers: [
          // Reduz o alcance de torres de longo alcance
          { category: "sniper", property: "range", multiplier: 0.7 },
        ],
      },
      // Códigos 61-67: Chuva
      rain: {
        // Códigos 51-57 (Chuvisco), 61-67 (Chuva), 80-82 (Aguaceiros)
        codes: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
        label: "Chuva",
        icon: "🌧️",
        modifiers: [
          { category: "basic", property: "fireRate", multiplier: 0.9 },
        ],
      },
      // Tempestade
      storm: {
        codes: [95, 96, 99],
        label: "Tempestade",
        icon: "⛈️",
        modifiers: [
          // Efeito 1: Reduz alcance das torres básicas
          { category: "basic", property: "range", multiplier: 0.8 },
          // Efeito 2: Reduz a velocidade de tiro das snipers
          { category: "sniper", property: "fireRate", multiplier: 0.85 },
        ],
      },
    },
  },

  waveDefinitions: [
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
    {
      id: 4,
      enemies: [
        { type: "basic", count: 6 },
        { type: "fast", count: 4 },
      ],
      goldReward: 75,
      isBossWave: false,
    },
    {
      id: 5,
      enemies: [{ type: "swarm", count: 12 }],
      goldReward: 90,
      isBossWave: false,
    },
    {
      id: 6,
      enemies: [
        { type: "tank", count: 2 },
        { type: "basic", count: 6 },
      ],
      goldReward: 120,
      isBossWave: false,
    },
    {
      id: 7,
      enemies: [
        { type: "flying", count: 6 },
        { type: "fast", count: 6 },
      ],
      goldReward: 140,
      isBossWave: false,
    },
    {
      id: 8,
      enemies: [
        { type: "swarm", count: 18 },
        { type: "basic", count: 8 },
      ],
      goldReward: 160,
      isBossWave: false,
    },
    {
      id: 9,
      enemies: [
        { type: "tank", count: 3 },
        { type: "fast", count: 8 },
      ],
      goldReward: 200,
      isBossWave: false,
    },
    {
      id: 10,
      enemies: [{ type: "boss", count: 1 }],
      goldReward: 400,
      isBossWave: true,
    },
    {
      id: 11,
      enemies: [
        { type: "fast", count: 12 },
        { type: "swarm", count: 20 },
      ],
      goldReward: 480,
      isBossWave: false,
    },
    {
      id: 12,
      enemies: [
        { type: "boss", count: 1 },
        { type: "tank", count: 4 },
      ],
      goldReward: 1200,
      isBossWave: true,
    },
  ],

  visual: {
    // fundo do jogo (CSS pixels)
    backgroundColor: "#0b1320",
    // cores e larguras do caminho
    pathColor: "#1a1a1a",
    pathBorderColor: "#ffffff",
    pathWidth: 48,
    pathBorderWidth: 3,
    pathRadiusBlock: 32,
    // central dash
    pathCenterDash: [8, 8],
    pathCenterColor: "rgba(255,255,255,0.15)",
    // base
    baseColor: "#111827",
    baseStripeColor: "#f3f4f6",
    // ghost tower visualization
    ghostRangeScale: 0.6,
    ghostBodyScale: 0.25,
  },

  // Configurações da base
  base: {
    width: 100,
    height: 100,
    hp: 100,
  },
};
