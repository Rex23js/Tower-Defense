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
   *
   * Removidos/alterados efeitos que aplicavam debuff diretamente às torres.
   * Em vez disso, alguns inimigos agora aplicam efeitos a inimigos ao morrer
   * (clouds/auras) ou possuem atributos internos, sem impactar torres.
   * ============================================================================
   */
  enemyTypes: {
    // Inimigo padrão
    basic: {
      speed: 70, // px/s
      hp: 14,
      size: 18,
      color: "#ef4444",
      goldValue: 6,
      description: "Inimigo padrão, equilíbrio entre velocidade e vida.",
    },

    // Inimigos rápidos - baixo HP, alta velocidade
    fast: {
      speed: 150,
      hp: 7,
      size: 16,
      color: "#f59e0b",
      goldValue: 7,
      description: "Rápido e frágil. Bom para testar cadência das torres.",
    },

    // Tanque - lento, muito HP
    tank: {
      speed: 40,
      hp: 40,
      size: 24,
      color: "#8b5cf6",
      goldValue: 18,
      armor: 2, // reduz dano recebido por hit (pode ser usado pela lógica de combate)
      description: "Lento e resistente. Reduz dano por ataque.",
    },

    // Armored - parecido com tank, mais focado em armadura
    armored: {
      speed: 45,
      hp: 28,
      size: 22,
      color: "#334155",
      goldValue: 14,
      armor: 4,
      description: "Tem alta armadura; ideal para torres que ignoram armadura.",
    },

    // Enxame - várias unidades pequenas (representada por unidade única aqui;
    // spawn logic pode criar muitas cópias)
    swarm: {
      speed: 120,
      hp: 5,
      size: 12,
      color: "#f97316",
      goldValue: 3,
      onDeathSplit: 0, // se >0, poderia gerar N unidades menores ao morrer
      description: "Pequeno e em número. Perigoso em massa.",
    },

    // Voador - pode ignorar obstáculos no mapa; towers sem alcance aéreo não o atingem
    // (unificado com variantes aéreas para evitar duplicatas)
    flying: {
      speed: 140,
      hp: 9,
      size: 14,
      color: "#06b6d4",
      goldValue: 10,
      flying: true,
      evasion: 0.1, // chance de evitar um hit (herdado da variante 'air')
      description:
        "Voa sobre o caminho; requer torres com dano aéreo. Rápido e evasivo.",
    },

    // Elemental - Fogo: não aplica burn às torres; deixa nuvem de fogo ao morrer
    fire: {
      speed: 85,
      hp: 18,
      size: 20,
      color: "#ef4444",
      goldValue: 12,
      burnOnDeath: 2, // dano ao longo do tempo em inimigos próximos ao morrer
      description:
        "Ao morrer deixa uma nuvem de fogo que danifica inimigos próximos.",
    },

    // Elemental - Gelo: efeito agora afeta inimigos (ao morrer) em vez de torres
    ice: {
      speed: 75,
      hp: 20,
      size: 20,
      color: "#60a5fa",
      goldValue: 12,
      slowOnDeath: 0.25, // reduz velocidade de inimigos próximos quando morre
      description:
        "Ao morrer reduz a velocidade de inimigos próximos (efeito para controle de multidão).",
    },

    // Inimigo que regenera vida ao longo do tempo
    regen: {
      speed: 60,
      hp: 30,
      size: 22,
      color: "#16a34a",
      goldValue: 15,
      regenPerSec: 1.2, // HP recuperado por segundo
      description: "Regenera vida lentamente durante o avanço.",
    },

    // Inimigo que cura aliados próximos periodicamente
    healer: {
      speed: 55,
      hp: 16,
      size: 20,
      color: "#a3e635",
      goldValue: 14,
      healAoE: 6, // cura por evento em área próxima (lógica aplica)
      healInterval: 3, // segundos entre curas
      description: "Suporta aliados curando-os durante a wave.",
    },

    // Kamikaze / Bombeiro - explode ao morrer causando dano em área
    bomber: {
      speed: 95,
      hp: 12,
      size: 18,
      color: "#f97316",
      goldValue: 11,
      explodeOnDeath: {
        damage: 18,
        radius: 36,
      },
      description: "Ao morrer causa explosão que fere inimigos próximos.",
    },

    // Stealth - fica invisível até ser atacado ou detectado
    stealth: {
      speed: 100,
      hp: 14,
      size: 16,
      color: "#374151",
      goldValue: 13,
      stealth: true, // requer mecânica de detecção para ser alvo
      revealOnHit: true,
      description: "Fica invisível a menos que seja detectado ou atingido.",
    },

    // Ácido/Envenenador - agora libera nuvem venenosa ao morrer (não debuffa torres)
    poison: {
      speed: 80,
      hp: 22,
      size: 20,
      color: "#4d7c0f",
      goldValue: 13,
      poisonOnDeath: 3, // DPS aplicado a inimigos na área ao morrer
      description:
        "Ao morrer libera uma nuvem venenosa que danifica inimigos próximos.",
    },

    // Blindado pesado - muita armadura, reduz dano físico fortemente
    juggernaut: {
      speed: 35,
      hp: 120,
      size: 34,
      color: "#1f2937",
      goldValue: 60,
      armor: 12,
      description:
        "Extremamente resistente; ideal para superar defesas com DPS alto.",
    },

    // Unidade que gera múltiplos inimigos menores ao morrer (enxameador)
    spawner: {
      speed: 50,
      hp: 26,
      size: 24,
      color: "#f59e0b",
      goldValue: 20,
      onDeathSplit: 4, // gera 4 unidades menores (por exemplo, do tipo 'swarm')
      description:
        "Ao morrer produz vários inimigos menores; atenção ao crowd control.",
    },

    // Fantasma/Spectral - toma menos dano físico e é imune a efeitos de ralentização
    spectral: {
      speed: 130,
      hp: 18,
      size: 16,
      color: "#6ee7b7",
      goldValue: 17,
      spectral: true, // indicador para lógica: reduz dano físico/ignora slows
      physicalResist: 0.5, // reduz 50% dano físico (exemplo)
      description: "Parcialmente intangível; resistente a slows e dano físico.",
    },

    // Sentinela/Shield - possui um escudo que regenera; o escudo absorve dano primeiro
    sentinel: {
      speed: 45,
      hp: 60,
      size: 26,
      color: "#0ea5e9",
      goldValue: 25,
      shield: {
        max: 30,
        regenPerSec: 2,
      },
      description: "Possui escudo regenerável que absorve dano antes da vida.",
    },

    // Mini-boss rápido: alto HP e velocidade moderada
    mini_boss: {
      speed: 68,
      hp: 140,
      size: 36,
      color: "#ef4444",
      goldValue: 90,
      armor: 3,
      isMiniBoss: true,
      description: "Mini-chefe com boa resistência e presença marcante.",
    },

    // Boss genérico
    boss: {
      speed: 50,
      hp: 220,
      size: 38,
      color: "#dc2626",
      goldValue: 200,
      armor: 6,
      isBoss: true,
      description: "Chefe principal. Alta vida e armadura.",
    },

    // Variante de boss - fogo
    boss_fire: {
      speed: 48,
      hp: 260,
      size: 42,
      color: "#ff4d4d",
      goldValue: 300,
      armor: 4,
      isBoss: true,
      burnAura: 4, // dano por segundo em áreas próximas (afeta inimigos, não torres)
      description: "Chefe de fogo com aura que danifica inimigos próximos.",
    },

    // Variante de boss - gelo (efeito agora mira inimigos, não torres)
    boss_ice: {
      speed: 44,
      hp: 280,
      size: 44,
      color: "#93c5fd",
      goldValue: 320,
      armor: 5,
      isBoss: true,
      slowEnemiesAura: 0.35, // reduz velocidade dos inimigos próximos
      description:
        "Chefe de gelo que atrasa inimigos próximos, favorecendo controle de multidão.",
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

  /**
   * ============================================================================
   * Waves - Definições de inimigos por onda
   *
   * Organize e ajuste as waves abaixo. Cada entrada deve conter:
   *  - id: número da wave
   *  - enemies: [{ type, count }, ...]
   *  - goldReward: recompensa por completar a wave
   *  - isBossWave: indica se é uma wave de chefe
   * ============================================================================
   */
  waveDefinitions: [
    // Waves iniciais - tutorial básico
    {
      id: 1,
      enemies: [{ type: "basic", count: 5 }],
      goldReward: 40,
      isBossWave: false,
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
