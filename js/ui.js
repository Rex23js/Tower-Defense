// js/ui.js
import { GameAPI as _gameAPI } from "./engine.js"; // para tipagem; será undefined até engine inicializar

let gameAPI = null;

export function bindUI() {
  // loja declarativa
  const shopTemplate = [
    {
      id: "basic",
      name: "Torre Básica",
      cost: 40,
      desc: "Dano moderado. Alcance médio.",
    },
    {
      id: "sniper",
      name: "Sniper",
      cost: 80,
      desc: "Dano alto. Cadência baixa.",
    },
  ];

  function renderShop() {
    const shop = document.querySelector(".shop");
    if (!shop) return;
    shop.innerHTML = "<h3>Loja</h3>";
    const ul = document.createElement("div");
    ul.className = "shop-items";
    for (const t of shopTemplate) {
      const item = document.createElement("div");
      item.className = "shop-item";
      item.innerHTML = `<strong>${t.name}</strong><div>${t.desc}</div><div>Preço: ${t.cost}</div>`;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.dataset.tower = t.id;
      item.addEventListener("click", () => select(t.id, item));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter") select(t.id, item);
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
