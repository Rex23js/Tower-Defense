// js/ui.js
import { GameAPI as _gameAPI } from "./engine.js"; // para tipagem; será undefined até engine inicializar
import { GAME_CONFIG } from "./game-config.js";

let gameAPI = null;

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

  // Pause / Start wave buttons
  document.body.addEventListener("click", (e) => {
    const tgt = e.target;
    if (tgt && tgt.id === "btn-pause") {
      if (!gameAPI) return;
      gameAPI.togglePause();
      tgt.textContent = tgt.textContent === "Pausa" ? "Retomar" : "Pausa";
    }
    if (tgt && tgt.id === "btn-start-wave") {
      if (!gameAPI) return;
      gameAPI.startNextWave();
    }
  });

  // expose function to receive GameAPI once engine is booted
  window.__attachGameAPI = (api) => {
    gameAPI = api;
  };

  // initial render of shop (works when view mounted)
  renderShop();
}
