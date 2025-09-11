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
          scores.map((s) => `<li>${s.player} — ${s.score}</li>`).join("") +
          "</ol>";
      } catch {
        el.textContent = "Não foi possível carregar pontuações.";
      }
    }
  } else if (hash === "/docs") {
    showTemplateId("view-docs");
  } else {
    showTemplateId("view-home");
  }
}

document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-link]");
  if (btn) {
    e.preventDefault();
    const link = btn.getAttribute("data-link");
    if (link) location.hash = link;
  }
});

window.addEventListener("hashchange", renderRoute);
window.addEventListener("load", () => {
  renderRoute();
});
