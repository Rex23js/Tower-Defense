// js/ui.js
import { GameAPI as _gameAPI } from "./engine.js"; // para tipagem; será undefined até engine inicializar
import { GAME_CONFIG } from "./game-config.js";

let gameAPI = null;
let waveManager = null;

// Categorias das torres geradas dinamicamente a partir do GAME_CONFIG.towerTypes
// Agrupamento mais compacto: reduz o número de abas combinando categorias semelhantes
const TOWER_CATEGORIES = (() => {
  const types =
    GAME_CONFIG && GAME_CONFIG.towerTypes ? GAME_CONFIG.towerTypes : {};
  const iconMap = {
    basic: "🏰",
    offense: "⚔️",
    support: "🛡️",
    antiair: "🛩️",
    magic: "🔮",
    special: "✨",
    other: "🔧",
  };

  const categories = {};

  const normalizeCategory = (raw) => {
    if (!raw) return "basic";
    const s = String(raw).toLowerCase();

    // Antiaéreo fica isolado
    if (s.match(/air|antiair|aa/)) return "antiair";

    // Suporte e debuffs / slow / heal / detector => suporte
    if (s.match(/support|utility|buff|heal|detector|shield|slow|debuff/))
      return "support";

    // Magic / elemental ficam juntos
    if (s.match(/magic|elemental|fire|ice|lightning|poison/)) return "magic";

    // Offense: dano, piercing, laser, projectile, splash, advanced, elite => agrupados
    if (
      s.match(
        /pierce|piercing|projectile|bullet|laser|splash|aoe|damage|dps|advanced|elite|high|tier/
      )
    )
      return "offense";

    // Special / unique / boss => especial
    if (s.match(/special|unique|boss/)) return "special";

    // Basic / starter / default
    if (s.match(/basic|starter|default/)) return "basic";

    return s || "other";
  };

  Object.entries(types).forEach(([key, cfg]) => {
    // Priorizar propriedade explícita de categoria, depois type, depois tags
    const rawCategory =
      cfg.category ||
      cfg.type ||
      (Array.isArray(cfg.tags) && cfg.tags[0]) ||
      null;
    const cat = normalizeCategory(rawCategory);

    if (!categories[cat]) {
      categories[cat] = {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: iconMap[cat] || iconMap.other,
        towers: [],
      };
    }

    categories[cat].towers.push(key);
  });

  // Ordem preferida mais compacta
  const preferredOrder = [
    "basic",
    "offense",
    "support",
    "antiair",
    "magic",
    "special",
  ];

  const ordered = {};
  preferredOrder.forEach((id) => {
    if (categories[id]) ordered[id] = categories[id];
  });
  // adicionar quaisquer categorias restantes
  Object.keys(categories).forEach((id) => {
    if (!ordered[id]) ordered[id] = categories[id];
  });

  return ordered;
})();

export function bindUI() {
  function renderShop() {
    const shop = document.querySelector(".shop");
    if (!shop) return;

    shop.innerHTML = `
      <style>
      /* Fazer as abas quebrarem em linhas e formar duas "colunas" por linha */
      .shop .shop-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .shop .shop-tabs .tab-button {
        /* duas colunas por linha: cada botão ocupa ~50% menos o gap */
        flex: 0 0 calc(50% - 8px);
        box-sizing: border-box;
        padding: 8px 10px;
        text-align: left;
        border: none;
        background: #f3f4f6;
        border-radius: 6px;
        cursor: pointer;
      }
      .shop .shop-tabs .tab-button.active {
        background: #111827;
        color: #fff;
      }
      /* Em telas pequenas, empilhar em uma coluna */
      @media (max-width: 480px) {
        .shop .shop-tabs .tab-button {
        flex: 0 0 100%;
        }
      }
      </style>

      <div class="shop-header">
      <h3>Loja de Torres</h3>
      <div class="shop-tabs">
        ${Object.entries(TOWER_CATEGORIES)
          .map(
            ([categoryId, category]) =>
              `<button class="tab-button" data-category="${categoryId}">
          ${category.icon} ${category.name}
        </button>`
          )
          .join("")}
      </div>
      </div>
      <div class="tab-content">
      ${Object.entries(TOWER_CATEGORIES)
        .map(
          ([categoryId, category]) =>
            `<div class="tab-pane" data-category="${categoryId}">
        <div class="shop-items">
          ${category.towers
            .map((towerType) => {
              const config = GAME_CONFIG.towerTypes[towerType];
              if (!config) return "";
              return `
                  <div class="shop-item" data-tower="${towerType}" tabindex="0" role="button">
                    <div class="thumb" style="background-color: ${config.color}"></div>
                    <div class="meta">
                      <strong>${config.name}</strong>
                      <div class="description">${config.description}</div>
                      <div class="price">💰 ${config.cost}</div>
                    </div>
                  </div>
                `;
            })
            .join("")}
            </div>
          </div>`
        )
        .join("")}
      </div>
    `;

    setupShopTabs();
    setupShopItems();
  }

  function setupShopTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");

    // Ativar primeira aba por padrão
    if (tabButtons.length > 0 && tabPanes.length > 0) {
      tabButtons[0].classList.add("active");
      tabPanes[0].classList.add("active");
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.category;

        // Remover classe active de todas as abas
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabPanes.forEach((pane) => pane.classList.remove("active"));

        // Ativar aba selecionada
        button.classList.add("active");
        const targetPane = document.querySelector(
          `[data-category="${category}"].tab-pane`
        );
        if (targetPane) {
          targetPane.classList.add("active");
        }
      });

      // Suporte para navegação por teclado
      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  function setupShopItems() {
    const shopItems = document.querySelectorAll(".shop-item");

    shopItems.forEach((item) => {
      const towerType = item.dataset.tower;

      item.addEventListener("click", () => select(towerType, item));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(towerType, item);
        }
      });
    });
  }

  function select(type, el) {
    // toggle selection
    const prev = document.querySelector(".shop-item.selected");
    if (prev) prev.classList.remove("selected");

    if (gameAPI) {
      gameAPI.selectTowerType(type);
      el.classList.add("selected");
    } else {
      console.warn("GameAPI ainda não inicializada");
    }
  }

  // Setup event listeners para controles do jogo
  function setupGameControls() {
    // Pause / Resume button
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        if (!gameAPI) return;
        gameAPI.togglePause();
        pauseBtn.textContent =
          pauseBtn.textContent === "Pausa" ? "Retomar" : "Pausa";
      });
    }

    // Start wave button
    const startWaveBtn = document.getElementById("btn-start-wave");
    if (startWaveBtn) {
      startWaveBtn.addEventListener("click", () => {
        if (!gameAPI) return;
        gameAPI.startNextWave();
      });
    }

    // Auto wave toggle button
    const autoWaveBtn = document.getElementById("btn-auto-wave");
    if (autoWaveBtn) {
      autoWaveBtn.addEventListener("click", () => {
        if (!gameAPI || !gameAPI.toggleAutoWaves) return;
        gameAPI.toggleAutoWaves();
      });
    }
  }

  // Setup event listeners para eventos do WaveManager
  function setupWaveManagerEvents() {
    if (!waveManager) return;

    // Wave started
    waveManager.addEventListener("wave:started", (event) => {
      const { waveNumber, totalWaves, totalEnemies, isBossWave } = event.detail;
      updateWaveDisplay(waveNumber, totalWaves);

      if (isBossWave) {
        showBossWaveNotification();
      }

      console.info(
        `Wave ${waveNumber}/${totalWaves} iniciada - ${totalEnemies} inimigos`
      );
    });

    // Wave completed
    waveManager.addEventListener("wave:completed", (event) => {
      const { waveNumber, goldReward, isBossWave } = event.detail;

      if (isBossWave) {
        console.info("Boss derrotado!");
      }

      showWaveCompletedMessage(waveNumber, goldReward);
    });

    // Enemy count updated
    waveManager.addEventListener("enemy:count:updated", (event) => {
      const { remaining, total, spawned } = event.detail;
      updateEnemyCount(remaining);
    });

    // Auto waves changed
    waveManager.addEventListener("auto_waves:changed", (event) => {
      const { enabled } = event.detail;
      updateAutoWaveButton(enabled);
    });

    // Game victory
    waveManager.addEventListener("game:victory", (event) => {
      const { finalScore, totalWaves, remainingLives, finalGold } =
        event.detail;
      showVictoryScreen(finalScore, totalWaves, remainingLives, finalGold);
    });

    // Game initialized
    waveManager.addEventListener("game:initialized", (event) => {
      const { totalWaves, currentWave } = event.detail;
      updateWaveDisplay(currentWave, totalWaves);
      updateEnemyCount(0);
    });
  }

  // Atualizar display da wave atual
  function updateWaveDisplay(currentWave, totalWaves) {
    const waveEl = document.getElementById("wave");
    if (waveEl) {
      waveEl.textContent = `Wave: ${currentWave}/${totalWaves}`;
    }
  }

  // Atualizar contador de inimigos
  function updateEnemyCount(remaining) {
    const enemyCountEl = document.getElementById("enemy-count");
    if (enemyCountEl) {
      enemyCountEl.textContent = `Inimigos: ${remaining}`;
    }
  }

  // Atualizar botão de auto waves
  function updateAutoWaveButton(enabled) {
    const autoWaveBtn = document.getElementById("btn-auto-wave");
    if (autoWaveBtn) {
      autoWaveBtn.textContent = `Waves Auto (${enabled ? "On" : "Off"})`;
      autoWaveBtn.classList.toggle("active", enabled);
    }
  }

  // Mostrar notificação de boss wave
  function showBossWaveNotification() {
    flashMessage("⚔️ BOSS WAVE! Prepare-se!", 3000, "boss-wave");
  }

  // Mostrar mensagem de wave completada
  function showWaveCompletedMessage(waveNumber, goldReward) {
    flashMessage(`Wave ${waveNumber} completada! +${goldReward} ouro`, 2000);
  }

  // Mostrar tela de vitória
  function showVictoryScreen(
    finalScore,
    totalWaves,
    remainingLives,
    finalGold
  ) {
    // Navegar para a tela de vitória
    setTimeout(() => {
      // Atualizar os dados da tela de vitória
      updateVictoryScreenData(
        finalScore,
        totalWaves,
        remainingLives,
        finalGold
      );
      // Navegar para a tela
      window.location.hash = "#/victory";
    }, 1000);
  }

  // Atualizar dados da tela de vitória
  function updateVictoryScreenData(
    finalScore,
    totalWaves,
    remainingLives,
    finalGold
  ) {
    // Esta função será chamada quando a tela de vitória for renderizada
    window.victoryData = {
      finalScore,
      totalWaves,
      remainingLives,
      finalGold,
    };
  }

  // Função melhorada para mostrar mensagens temporárias
  function flashMessage(msg, ms = 1100, className = "") {
    let el = document.getElementById("engine-msg");
    if (!el) {
      el = document.createElement("div");
      el.id = "engine-msg";
      el.style.position = "fixed";
      el.style.right = "20px";
      el.style.top = "20px";
      el.style.padding = "12px 18px";
      el.style.background = "rgba(17,24,39,0.95)";
      el.style.color = "#fff";
      el.style.borderRadius = "8px";
      el.style.zIndex = "9999";
      el.style.fontSize = "14px";
      el.style.fontWeight = "600";
      el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      el.style.transition = "opacity 0.3s ease";
      document.body.appendChild(el);
    }

    // Aplicar classe específica se fornecida
    if (className) {
      el.className = className;
      if (className === "boss-wave") {
        el.style.background = "rgba(220,38,38,0.95)";
        el.style.fontSize = "16px";
      }
    }

    el.textContent = msg;
    el.style.opacity = "1";

    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = "0";
      // Remover classe após fade out
      setTimeout(() => {
        el.className = "";
        el.style.background = "rgba(17,24,39,0.95)";
        el.style.fontSize = "14px";
      }, 300);
    }, ms);
  }

  // Função para renderizar dados da tela de vitória
  function renderVictoryData() {
    if (!window.victoryData) return;

    const { finalScore, totalWaves, remainingLives, finalGold } =
      window.victoryData;

    const finalScoreEl = document.getElementById("final-score");
    const wavesCompletedEl = document.getElementById("waves-completed");
    const remainingLivesEl = document.getElementById("remaining-lives");
    const finalGoldEl = document.getElementById("final-gold");

    if (finalScoreEl) finalScoreEl.textContent = finalScore.toLocaleString();
    if (wavesCompletedEl) wavesCompletedEl.textContent = totalWaves;
    if (remainingLivesEl) remainingLivesEl.textContent = remainingLives;
    if (finalGoldEl) finalGoldEl.textContent = finalGold.toLocaleString();
  }

  // Função pública para receber GameAPI uma vez que o engine seja inicializado
  window.__attachGameAPI = (api) => {
    gameAPI = api;

    // Obter referência para o WaveManager através da GameAPI
    if (api && api.getWaveManager) {
      waveManager = api.getWaveManager();
      setupWaveManagerEvents();
    }
  };

  // Função pública para renderizar dados de vitória (chamada pelo main.js)
  window.__renderVictoryData = renderVictoryData;

  // Initial setup
  renderShop();
  setupGameControls();
}
