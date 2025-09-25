import { initEngine } from "./engine.js";
import { bindUI } from "./ui.js";
import { getScores } from "./api.js";

const app = document.getElementById("app");

// Instância atual do jogo
let currentGameAPI = null;

// Utility: tentativa segura de destruir a engine
function safeDestroy(api) {
  if (!api) return;
  try {
    if (typeof api.destroy === "function") {
      api.destroy();
    } else if (typeof api.stop === "function") {
      // fallback se a engine usar outro nome
      api.stop();
    }
  } catch (err) {
    console.warn("safeDestroy: falha ao destruir engine:", err);
  }
}

// --- LÓGICA DO MODAL DE CONFIGURAÇÕES ---
// js/main.js

// --- LÓGICA DO MODAL DE CONFIGURAÇÕES ---
function setupSettingsModal() {
  const openBtn = document.getElementById("btn-open-menu");
  const closeBtn = document.getElementById("btn-close-menu");
  const overlay = document.getElementById("settings-overlay");
  const devModeToggle = document.getElementById("dev-mode-toggle"); // Novo elemento

  if (!openBtn || !closeBtn || !overlay || !devModeToggle) return;

  const toggleModal = (visible) => {
    overlay.classList.toggle("is-visible", visible);
    overlay.style.display = visible ? "flex" : "none";
    overlay.setAttribute("aria-hidden", String(!visible));
    openBtn.setAttribute("aria-expanded", String(visible));

    const gameActions = document.getElementById("game-actions");
    const isGameView = location.hash === "#/game";
    if (gameActions) {
      gameActions.classList.toggle("hidden", !isGameView);
    }

    const pauseBtn = document.getElementById("btn-toggle-pause");
    if (pauseBtn && currentGameAPI) {
      const state = currentGameAPI.getState && currentGameAPI.getState();
      const isRunning = state && state.running;
      pauseBtn.textContent = isRunning ? "⏸️ Pausar" : "▶️ Continuar";
    }

    if (visible) {
      closeBtn.focus();
      document.addEventListener("keydown", handleKeydown);
    } else {
      document.removeEventListener("keydown", handleKeydown);
      openBtn.focus();
    }
  };

  function handleKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      toggleModal(false);
    }
  }

  openBtn.addEventListener("click", () => toggleModal(true));
  closeBtn.addEventListener("click", () => toggleModal(false));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      toggleModal(false);
    }
  });

  const pauseBtn = document.getElementById("btn-toggle-pause");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (currentGameAPI && typeof currentGameAPI.togglePause === "function") {
        currentGameAPI.togglePause();
        const state = currentGameAPI.getState && currentGameAPI.getState();
        const isRunning = state && state.running;
        pauseBtn.textContent = isRunning ? "⏸️ Pausar" : "▶️ Continuar";
      }
    });
  }

  const restartBtn = document.getElementById("btn-restart-game");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      toggleModal(false);
      window.restartGame();
    });
  }

  overlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => toggleModal(false));
  });

  document.addEventListener("keydown", (e) => {
    if (
      (e.key === "m" || e.key === "M") &&
      !overlay.classList.contains("is-visible")
    ) {
      e.preventDefault();
      toggleModal(true);
    }
  });

  // ==========================================================
  // NOVA LÓGICA DO MODO DESENVOLVEDOR
  // ==========================================================
  const isDevMode = localStorage.getItem("developerMode") === "true";
  devModeToggle.checked = isDevMode;

  devModeToggle.addEventListener("change", () => {
    localStorage.setItem("developerMode", devModeToggle.checked);
    // Recarrega a página se estiver no jogo para aplicar a mudança
    if (location.hash === "#/game") {
      window.location.reload();
    }
  });
}
// --- FIM DA LÓGICA DO MODAL ---
// --- FIM DA LÓGICA DO MODAL ---

function showTemplateId(templateId) {
  let template = document.getElementById(templateId);
  if (!template) {
    const alt = templateId
      .replace(/-template$/, "")
      .replace(/^(.*)$/, "view-$1");
    template = document.getElementById(alt);
  }
  if (!template) {
    app.innerHTML = `<p>Template ${templateId} não encontrado.</p>`;
    return;
  }
  app.innerHTML = "";
  app.appendChild(template.content.cloneNode(true));
}

/**
 * Configura o painel de depuração se o "Modo Desenvolvedor" estiver ativo.
 * @param {object} api - A GameAPI retornada pelo initEngine.
 */
function setupDebugPanel(api) {
  const isDevMode = localStorage.getItem("developerMode") === "true";
  const debugPanel = document.getElementById("debug-panel");

  if (isDevMode && debugPanel) {
    debugPanel.classList.add("is-visible");

    debugPanel.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
        const code = event.target.dataset.weathercode;
        if (code && api && typeof api.forceWeather === "function") {
          api.forceWeather(parseInt(code, 10));
        }
      }
    });
  }
}

async function renderRoute() {
  const hash = (location.hash || "#/").replace("#", "");

  // Sempre que mudamos de rota, garantimos destruir a engine anterior
  // se estamos saindo da view do jogo
  if (currentGameAPI && hash !== "/game") {
    safeDestroy(currentGameAPI);
    currentGameAPI = null;
  }

  if (hash === "/" || hash === "") {
    showTemplateId("view-home");
  } else if (hash === "/game") {
    // Se houver uma engine rodando, destrua antes de iniciar novo jogo
    if (currentGameAPI) {
      safeDestroy(currentGameAPI);
      currentGameAPI = null;
    }

    showTemplateId("view-game");

    // montar UI e engine após template montada
    setTimeout(async () => {
      bindUI();
      const canvas = document.getElementById("game-canvas");

      try {
        const api = await initEngine(canvas);
        currentGameAPI = api;

        // link UI <-> engine
        if (window.__attachGameAPI) window.__attachGameAPI(api);

        // Ativa o painel de debug após o jogo iniciar
        setupDebugPanel(currentGameAPI);
      } catch (err) {
        console.error("Falha ao iniciar engine:", err);
      }
    }, 50);
  } else if (hash === "/scores") {
    showTemplateId("view-scores");
    const el = document.getElementById("scores-list");
    if (el) {
      try {
        const scores = await getScores();
        el.innerHTML =
          "<ol>" +
          scores.data.map((s) => `<li>${s.player} — ${s.score}</li>`).join("") +
          "</ol>";
      } catch (err) {
        console.warn("Erro ao carregar scores:", err);
        el.textContent = "Não foi possível carregar pontuações.";
      }
    }
  } else if (hash === "/victory") {
    showTemplateId("view-victory");
    // Renderizar dados da vitória se disponíveis
    setTimeout(() => {
      if (window.__renderVictoryData) {
        window.__renderVictoryData();
      }
    }, 50);
  } else if (hash === "/docs") {
    showTemplateId("view-docs");
  } else {
    showTemplateId("view-home");
  }
}

// Event delegation para links de navegação
document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-link]");
  if (btn) {
    e.preventDefault();
    const link = btn.getAttribute("data-link");
    if (link) {
      // Limpar dados de vitória ao navegar
      if (window.victoryData) {
        window.victoryData = null;
      }

      // Se for link para /game e já estivermos nela, chamamos renderRoute para forçar reinício
      if (link === "#/game" && location.hash === "#/game") {
        // força reinício do jogo
        window.restartGame();
        return;
      }

      location.hash = link;
    }
  }
});

// Escutar mudanças de hash
window.addEventListener("hashchange", renderRoute);

// Inicializar aplicação
window.addEventListener("load", () => {
  renderRoute();
  setupSettingsModal(); // Configurar modal de opções
});

// Escutar evento global de vitória para navegação automática
window.addEventListener("game:victory", (event) => {
  const { finalScore, totalWaves, remainingLives, finalGold } =
    event.detail || {};

  // Armazenar dados da vitória
  window.victoryData = {
    finalScore,
    totalWaves,
    remainingLives,
    finalGold,
  };

  // Navegar para tela de vitória após um pequeno delay
  setTimeout(() => {
    location.hash = "#/victory";
  }, 2000);
});

// Função global para reiniciar jogo (robusta)
window.restartGame = () => {
  try {
    // destruir engine atual se existir
    if (currentGameAPI) {
      safeDestroy(currentGameAPI);
    }
    currentGameAPI = null;
    window.victoryData = null;

    // Se já estivermos em /game, forçar re-render
    if (location.hash !== "#/game") {
      location.hash = "#/game";
      // renderRoute será chamado pelo listener 'hashchange'
    } else {
      // força re-render mesmo sem mudança de hash
      renderRoute();
    }
  } catch (err) {
    console.error("restartGame: erro ao reiniciar:", err);
    // fallback simples
    location.hash = "#/game";
    renderRoute();
  }
};
