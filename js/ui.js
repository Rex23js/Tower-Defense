// js/ui.js
import { GameAPI as _gameAPI } from "./engine.js"; // para tipagem; será undefined até engine inicializar
import { GAME_CONFIG } from "./game-config.js";

let gameAPI = null;
let waveManager = null;

export function bindUI() {
  function renderShop() {
    const shop = document.querySelector(".shop");
    if (!shop) return;
    shop.innerHTML = "<h3>Loja</h3>";
    const ul = document.createElement("div");
    ul.className = "shop-items";

    // Gerar itens dinamicamente baseados no game-config
    for (const [towerType, config] of Object.entries(GAME_CONFIG.towerTypes)) {
      const item = document.createElement("div");
      item.className = "shop-item";
      item.innerHTML = `
        <div class="thumb" style="background-color: ${config.color}"></div>
        <div class="meta">
          <div><strong>${config.name}</strong></div>
          <div>${config.description}</div>
          <div>Preço: ${config.cost}</div>
        </div>
      `;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.dataset.tower = towerType;
      item.addEventListener("click", () => select(towerType, item));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter") select(towerType, item);
      });
      ul.appendChild(item);
    }
    shop.appendChild(ul);
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
