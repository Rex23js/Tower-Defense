// js/main.js
import { initEngine } from "./engine.js";
import { bindUI } from "./ui.js";
import { getScores } from "./api.js";

const app = document.getElementById("app");

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

async function renderRoute() {
  const hash = (location.hash || "#/").replace("#", "");

  if (hash === "/" || hash === "") {
    showTemplateId("view-home");
  } else if (hash === "/game") {
    showTemplateId("view-game");
    // montar UI e engine após template montada
    setTimeout(async () => {
      bindUI();
      const canvas = document.getElementById("game-canvas");
      const api = await initEngine(canvas);
      // link UI <-> engine
      if (window.__attachGameAPI) window.__attachGameAPI(api);
    }, 50);
  } else if (hash === "/scores") {
    showTemplateId("view-scores");
    const el = document.getElementById("scores-list");
    if (el) {
      try {
        const scores = await getScores();
        el.innerHTML =
          "<ol>" +
          scores.map((s) => `<li>${s.player} – ${s.score}</li>`).join("") +
          "</ol>";
      } catch {
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
      // Se for um link para /game, limpar dados de vitória anteriores
      if (link === "#/game" && window.victoryData) {
        window.victoryData = null;
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
});

// Escutar evento global de vitória para navegação automática
window.addEventListener("game:victory", (event) => {
  const { finalScore, totalWaves, remainingLives, finalGold } = event.detail;

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
