# Tower Defense Acadêmico 🎯

![Status do Projeto](https://img.shields.io/badge/status-v1.0--alpha-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

> Um projeto de demonstração acadêmica de um jogo Tower Defense construído com **Vanilla JS**, Canvas API e integração com APIs externas.

---

## Índice

1. [Visão Geral e Justificativa](#visão-geral-e-justificativa)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Arquitetura do Projeto](#arquitetura-do-projeto)
4. [Sistema de Clima Dinâmico](#sistema-de-clima-dinâmico)
5. [Tecnologias Utilizadas](#tecnologias-utilizadas)
6. [APIs e Integrações](#apis-e-integrações)
7. [Estrutura do Repositório](#estrutura-do-repositório)
8. [Como Executar o Projeto (Local)](#como-executar-o-projeto-local)
9. [Roadmap / Próximas Implementações](#roadmap--próximas-implementações)
10. [Como Contribuir](#como-contribuir)
11. [Autores](#autores)
12. [Licença](#licença)

---

## Visão Geral e Justificativa

**Visão Geral.** "Tower Defense Acadêmico" é uma Single Page Application (SPA) que simula um jogo de defesa por torres onde o jogador posiciona torres para deter ondas de inimigos. O foco deste repositório é demonstrar: arquitetura modular em JavaScript, uso da Canvas API para renderização 2D, integração com APIs externas e um sistema de eventos para desacoplar UI e lógica de jogo.

**Justificativa.** O projeto é ideal para estudos e avaliação técnica — aborda temas como design de motor de jogo, balanceamento via arquivo de configuração, testes locais com JSON Server e manejo de falhas ao consumir APIs externas.

---

## Funcionalidades Implementadas

* **Sistema de Ondas** com 12 ondas configuráveis via `db.json` (JSON Server).
* **6 tipos de torres** (Básica, Perfurante, Área, Lentidão, Antiaérea, Boss Killer) com atributos e custo balanceáveis em `game-config.js`.
* **5 tipos de inimigos**, incluindo um *boss* com atributos especiais.
* **Sistema de Clima Dinâmico** que consome Open-Meteo e aplica debuffs no jogo.
* **Efeitos visuais** (chuva, neblina, tempestade) renderizados com sistema de partículas no canvas.
* **UI desacoplada**: `ui.js` escuta eventos do `WaveManager` e atualiza HUD (vida, ouro, onda).
* **SPA** com roteamento por hash (`#home`, `#game`, `#victory`).
* **Modo desenvolvedor**: painel de debug para forçar clima, ondas ou atributos.
* **Design responsivo** adaptado para desktop e tablets (mobile com limitações devido ao canvas).

---

## Arquitetura do Projeto

Arquitetura modular em arquivos JS separados para manter separação de responsabilidades (SoC):

* `main.js` — controlador da aplicação e roteamento.
* `engine.js` — game loop, render e gestão de entidades.
* `wave-manager.js` — emissor de eventos que gerencia as ondas.
* `ui.js` — manipulação do DOM e reatividade da interface.
* `entities.js` — classes `Tower`, `Enemy`, `Projectile` e lógica de combate.
* `game-config.js` — arquivo de balanceamento (torres, inimigos, ondas).
* `api.js` — abstração das chamadas à API local (`JSON Server`) e Open-Meteo.

---

## Sistema de Clima Dinâmico

* **Fonte de dados:** Open-Meteo (código do clima / weathercode).
* **Fallback seguro:** `safeGetWeather()` — caso a requisição falhe, aplica clima padrão para evitar travamentos.
* **Impactos no gameplay:**

  * *Neblina*: reduz alcance das torres.
  * *Chuva / Tempestade*: reduz cadência de tiro (fire rate).
* **Visuals**: partículas e shaders simples desenhados no canvas para chuva e neblina.

---

## Tecnologias Utilizadas

* **HTML5**, **CSS3**, **JavaScript (ES6+)**
* **Canvas API** para renderização do jogo
* **JSON Server** para mock de API local (`db.json`)
* **Git / GitHub** para versionamento
* Ferramentas: VS Code, Live Server

---

## APIs e Integrações

* **JSON Server (Local)** — fornece as ondas e dados do jogo a partir de `db.json`.
* **Open-Meteo (Externa)** — fornece condições meteorológicas para modificar mecânicas.

> Nota: As chamadas externas são encapsuladas em `api.js` — trate chaves e limites com cuidado.

---

## Estrutura do Repositório

```
/tower-defense-game
├── css/
│   └── style.css
├── js/
│   ├── api.js
│   ├── engine.js
│   ├── entities.js
│   ├── game-config.js
│   ├── main.js
│   ├── ui.js
│   └── wave-manager.js
├── index.html
├── db.json
└── README.md
```

---

## Como Executar o Projeto (Local)

### Pré-requisitos

* Node.js (v14+ recomendado)
* npm (ou yarn)
* Live Server (opcional, extensão do VS Code)

### Passos

1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

2. Instale o JSON Server (se não quiser instalar globalmente use `npx`)

```bash
npm install -g json-server   # opcional
# ou
npx json-server --watch db.json
```

3. Inicie o servidor local (default `http://localhost:3000`)

```bash
npx json-server --watch db.json --port 3000
```

4. Abra `index.html` com Live Server ou abra diretamente no navegador (use Live Server para evitar problemas de CORS ao consumir APIs locais)

5. Jogar! Use o painel de desenvolvedor (tecla `D` por padrão) para forçar clima/ondas e testar balanceamento.

---

## Roadmap / Próximas Implementações

* [ ] Sistema de pontuação e ranking persistido na API local
* [ ] Efeitos sonoros para seleções, tiros e mortes
* [ ] Sistema de upgrades inline para torres
* [ ] Múltiplos mapas e caminhos alternativos
* [ ] Modo cooperativo local (2 jogadores)
* [ ] Exportar estatísticas para CSV / Google Sheets

---

## Como Contribuir

1. Fork este repositório
2. Crie uma branch: `git checkout -b feature/nome-da-feature`
3. Faça commits claros: `git commit -m "feat: descreva a mudança"`
4. Push para a branch: `git push origin feature/nome-da-feature`
5. Abra um Pull Request descrevendo as mudanças

Sugestões rápidas: mantenha o `game-config.js` como fonte de verdade para balanceamento e adicione testes manuais no modo desenvolvedor.

---

## Autores

<table align="center">
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/200134059?v=4" width="96" alt="Ismael" />
      <br/>
      <sub><b>Ismael Gomes (Rex)</b></sub>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/202681925?v=4" width="96" alt="Eduardo" />
      <br/>
      <sub><b>Eduardo Monteiro</b></sub>
    </td>
  </tr>

</table>
---

## Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo `LICENSE` para detalhes.

---

> Feito com muito café, debugging às 3 da manhã e uma pitada de sarcasmo.
