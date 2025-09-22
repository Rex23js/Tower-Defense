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
    // === TORRES BÁSICAS ===
    basic: {
      cost: 40,
      range: 120,
      fireRate: 1,
      damage: 4,
      color: "#60a5fa",
      name: "Torre Básica",
      description: "Dano moderado. Alcance médio.",
      category: "basic",
    },

    sniper: {
      cost: 80,
      range: 260,
      fireRate: 0.5,
      damage: 12,
      color: "#f97316",
      name: "Sniper",
      description: "Dano alto. Longo alcance. Cadência baixa.",
      category: "basic",
    },

    rapid: {
      cost: 60,
      range: 100,
      fireRate: 2.5,
      damage: 2,
      color: "#10b981",
      name: "Torre Rápida",
      description: "Dano baixo. Cadência alta.",
      category: "basic",
    },

    // === TORRES ELEMENTAIS ===
    fire: {
      cost: 100,
      range: 140,
      fireRate: 1.2,
      damage: 6,
      color: "#ef4444",
      name: "Torre de Fogo",
      description: "Causa dano em área. Efetiva contra enxames.",
      category: "elemental",
      splashRadius: 40,
      splashDamage: 3,
    },

    ice: {
      cost: 90,
      range: 130,
      fireRate: 0.8,
      damage: 4,
      color: "#60a5fa",
      name: "Torre de Gelo",
      description: "Reduz velocidade dos inimigos atingidos.",
      category: "elemental",
      slowEffect: 0.6, // reduz velocidade para 60%
      slowDuration: 2.5, // segundos
    },

    lightning: {
      cost: 110,
      range: 150,
      fireRate: 1.5,
      damage: 7,
      color: "#fbbf24",
      name: "Torre de Raio",
      description: "Atinge múltiplos inimigos em cadeia.",
      category: "elemental",
      chainTargets: 3,
      chainDamageReduction: 0.7, // 30% menos dano a cada salto
    },

    // === TORRES ESPECIALIZADAS ===
    antiair: {
      cost: 85,
      range: 180,
      fireRate: 2.0,
      damage: 5,
      color: "#06b6d4",
      name: "Torre Antiaérea",
      description: "Especializada em inimigos voadores. Ignora terrestres.",
      category: "specialized",
      airOnly: true,
      bonusDamageFlying: 4, // +4 dano contra voadores
    },

    armor_pierce: {
      cost: 120,
      range: 160,
      fireRate: 0.7,
      damage: 8,
      color: "#8b5cf6",
      name: "Torre Perfurante",
      description: "Ignora completamente armadura inimiga.",
      category: "specialized",
      armorPiercing: true,
      bonusDamageArmored: 6,
    },

    detector: {
      cost: 75,
      range: 200,
      fireRate: 1.8,
      damage: 3,
      color: "#34d399",
      name: "Torre Detectora",
      description: "Revela inimigos stealth e os marca para outras torres.",
      category: "specialized",
      detectStealth: true,
      markingRadius: 250,
      markingDuration: 5,
    },

    // === TORRES TÁTICAS ===
    poison: {
      cost: 95,
      range: 120,
      fireRate: 1.0,
      damage: 2,
      color: "#4d7c0f",
      name: "Torre Venenosa",
      description: "Aplica veneno que causa dano contínuo.",
      category: "tactical",
      poisonDPS: 3,
      poisonDuration: 4,
    },

    slow: {
      cost: 70,
      range: 140,
      fireRate: 1.5,
      damage: 1,
      color: "#64748b",
      name: "Torre Ralentizadora",
      description: "Foco em controle. Reduz drasticamente velocidade.",
      category: "tactical",
      slowEffect: 0.3, // reduz para 30% da velocidade
      slowDuration: 3,
    },

    shield_breaker: {
      cost: 130,
      range: 150,
      fireRate: 0.6,
      damage: 10,
      color: "#0ea5e9",
      name: "Torre Quebra-Escudo",
      description: "Causa dano extra a escudos e regeneração.",
      category: "tactical",
      shieldDamageMultiplier: 2.5,
      stopRegen: true,
    },

    // === TORRES AVANÇADAS ===
    laser: {
      cost: 150,
      range: 180,
      fireRate: 1.8,
      damage: 8,
      color: "#a855f7",
      name: "Torre Laser",
      description: "Tecnologia avançada. Dano perfurante.",
      category: "advanced",
      armorPiercing: true,
    },

    missile: {
      cost: 200,
      range: 220,
      fireRate: 0.4,
      damage: 15,
      color: "#dc2626",
      name: "Torre de Mísseis",
      description: "Mísseis teleguiados com grande área de explosão.",
      category: "advanced",
      splashRadius: 60,
      splashDamage: 8,
      homing: true,
    },

    plasma: {
      cost: 180,
      range: 160,
      fireRate: 1.2,
      damage: 12,
      color: "#7c3aed",
      name: "Torre de Plasma",
      description: "Energia pura. Efetiva contra todos os tipos.",
      category: "advanced",
      energyDamage: true, // ignora resistências físicas
      splashRadius: 30,
    },

    // === TORRES UTILITÁRIAS ===
    support: {
      cost: 80,
      range: 180,
      fireRate: 0,
      damage: 0,
      color: "#16a34a",
      name: "Torre de Suporte",
      description: "Aumenta alcance e dano de torres próximas.",
      category: "utility",
      supportRadius: 120,
      damageBonus: 0.25, // +25% dano
      rangeBonus: 0.15, // +15% alcance
    },

    economic: {
      cost: 100,
      range: 0,
      fireRate: 0,
      damage: 0,
      color: "#f59e0b",
      name: "Torre Econômica",
      description: "Gera ouro passivamente ao longo do tempo.",
      category: "utility",
      goldPerSecond: 2,
      goldPerKill: 3, // ouro extra por inimigos mortos próximos
      economicRadius: 150,
    },

    repair: {
      cost: 90,
      range: 150,
      fireRate: 2,
      damage: 0,
      color: "#06b6d4",
      name: "Torre de Reparo",
      description: "Repara outras torres e remove debuffs.",
      category: "utility",
      repairAmount: 10,
      cleansesDebuffs: true,
    },

    // === TORRES FINAIS ===
    orbital: {
      cost: 300,
      range: 999, // alcance infinito
      fireRate: 0.2,
      damage: 25,
      color: "#1f2937",
      name: "Canhão Orbital",
      description: "Ataque devastador de longo alcance. Mira qualquer lugar.",
      category: "ultimate",
      splashRadius: 80,
      splashDamage: 15,
      globalRange: true,
    },

    tesla: {
      cost: 250,
      range: 120,
      fireRate: 3,
      damage: 4,
      color: "#3b82f6",
      name: "Bobina Tesla",
      description: "Raios saltam entre todos os inimigos próximos.",
      category: "ultimate",
      chainAll: true, // atinge todos no alcance
      maxChainTargets: 8,
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
      goldReward: 70,
      isBossWave: false,
    },

    // Waves iniciais -> intermediárias
    {
      id: 5,
      enemies: [
        { type: "tank", count: 2 },
        { type: "basic", count: 6 },
      ],
      goldReward: 85,
      isBossWave: false,
    },
    {
      id: 6,
      enemies: [{ type: "fast", count: 10 }],
      goldReward: 95,
      isBossWave: false,
    },
    {
      id: 7,
      enemies: [{ type: "swarm", count: 16 }],
      goldReward: 100,
      isBossWave: false,
    },
    {
      id: 8,
      enemies: [
        { type: "flying", count: 6 },
        { type: "basic", count: 6 },
      ],
      goldReward: 110,
      isBossWave: false,
    },
    {
      id: 9,
      enemies: [
        { type: "armored", count: 2 },
        { type: "fast", count: 8 },
      ],
      goldReward: 125,
      isBossWave: false,
    },
    {
      id: 10,
      enemies: [
        { type: "bomber", count: 6 },
        { type: "basic", count: 8 },
      ],
      goldReward: 140,
      isBossWave: false,
    },

    // Waves intermediárias -> avançadas
    {
      id: 11,
      enemies: [
        { type: "regen", count: 4 },
        { type: "fast", count: 8 },
      ],
      goldReward: 155,
      isBossWave: false,
    },
    {
      id: 12,
      enemies: [
        { type: "healer", count: 3 },
        { type: "basic", count: 10 },
      ],
      goldReward: 170,
      isBossWave: false,
    },
    {
      id: 13,
      enemies: [
        { type: "stealth", count: 6 },
        { type: "fast", count: 6 },
      ],
      goldReward: 185,
      isBossWave: false,
    },
    {
      id: 14,
      enemies: [
        { type: "poison", count: 4 },
        { type: "swarm", count: 12 },
      ],
      goldReward: 200,
      isBossWave: false,
    },
    {
      id: 15,
      enemies: [
        { type: "tank", count: 4 },
        { type: "armored", count: 2 },
      ],
      goldReward: 220,
      isBossWave: false,
    },

    // Waves avançadas - introduz spawner/spectral/sentinel
    {
      id: 16,
      enemies: [
        { type: "spawner", count: 2 },
        { type: "swarm", count: 8 },
      ],
      goldReward: 240,
      isBossWave: false,
    },
    {
      id: 17,
      enemies: [
        { type: "spectral", count: 6 },
        { type: "fast", count: 8 },
      ],
      goldReward: 260,
      isBossWave: false,
    },
    {
      id: 18,
      enemies: [
        { type: "sentinel", count: 2 },
        { type: "basic", count: 10 },
      ],
      goldReward: 280,
      isBossWave: false,
    },
    {
      id: 19,
      enemies: [
        { type: "fast", count: 12 },
        { type: "poison", count: 5 },
      ],
      goldReward: 300,
      isBossWave: false,
    },

    // Primeira dificuldade forte - mini boss surge
    {
      id: 20,
      enemies: [
        { type: "mini_boss", count: 1 },
        { type: "tank", count: 3 },
        { type: "fast", count: 6 },
      ],
      goldReward: 360,
      isBossWave: true,
    },

    // Pós-mini boss - mistura com support/regen/healer
    {
      id: 21,
      enemies: [
        { type: "regen", count: 6 },
        { type: "healer", count: 2 },
        { type: "swarm", count: 10 },
      ],
      goldReward: 380,
      isBossWave: false,
    },
    {
      id: 22,
      enemies: [
        { type: "armored", count: 4 },
        { type: "basic", count: 12 },
      ],
      goldReward: 400,
      isBossWave: false,
    },
    {
      id: 23,
      enemies: [
        { type: "spawner", count: 3 },
        { type: "spectral", count: 4 },
        { type: "fast", count: 8 },
      ],
      goldReward: 420,
      isBossWave: false,
    },

    // Segunda linha de mini-bosses e desafios pesados
    {
      id: 24,
      enemies: [
        { type: "mini_boss", count: 2 },
        { type: "bomber", count: 6 },
        { type: "poison", count: 6 },
      ],
      goldReward: 520,
      isBossWave: true,
    },
    {
      id: 25,
      enemies: [
        { type: "juggernaut", count: 1 },
        { type: "armored", count: 5 },
        { type: "fast", count: 8 },
      ],
      goldReward: 600,
      isBossWave: true,
    },

    // Preparação final - ondas com muitos inimigos variados
    {
      id: 26,
      enemies: [
        { type: "tank", count: 8 },
        { type: "fast", count: 12 },
        { type: "swarm", count: 20 },
      ],
      goldReward: 680,
      isBossWave: false,
    },
    {
      id: 27,
      enemies: [
        { type: "boss_fire", count: 1 },
        { type: "spawner", count: 2 },
        { type: "spectral", count: 6 },
      ],
      goldReward: 900,
      isBossWave: true,
    },

    // Wave final - Boss(es) principais
    {
      id: 28,
      enemies: [
        { type: "boss", count: 1 },
        { type: "boss_ice", count: 1 },
        { type: "tank", count: 6 },
        { type: "fast", count: 10 },
      ],
      goldReward: 1500,
      isBossWave: true,
    },

    // Nova wave 29 - desafio pesado pós-chefe
    {
      id: 29,
      enemies: [
        { type: "boss_fire", count: 1 },
        { type: "spawner", count: 2 },
        { type: "fast", count: 12 },
        { type: "spectral", count: 6 },
      ],
      goldReward: 1700,
      isBossWave: true,
    },

    // Nova wave 30 - Última onda: combinação extrema
    {
      id: 30,
      enemies: [
        { type: "boss", count: 1 },
        { type: "juggernaut", count: 1 },
        { type: "mini_boss", count: 1 },
        { type: "swarm", count: 30 },
      ],
      goldReward: 2500,
      isBossWave: true,
    },
  ],

  visual: {
    // fundo do jogo (CSS pixels)
    backgroundColor: "#0b1320", // fundo escuro
    // cores e larguras do caminho (use esses pra ver o contraste)
    pathColor: "#1a1a1a", // cor do corpo do caminho (escuro)
    pathBorderColor: "#ffffff", // borda externa clara
    pathWidth: 48,
    pathBorderWidth: 3,
    pathRadiusBlock: 32,
    // central dash
    pathCenterDash: [8, 8],
    pathCenterColor: "rgba(255,255,255,0.15)",
    // base
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
