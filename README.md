# Tower Defense Acadêmico 🎯

![Status do Projeto](https://img.shields.io/badge/status-v1.0--alpha-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

> Jogo Tower Defense criado com HTML, CSS e JavaScript puro. Projeto focado em mecânicas clássicas, acessibilidade e experiência de usuário.

---

## Link do Projeto (deploy)
> https://thetowerdefense.netlify.app/


---

## Índice

1. [Visão Geral e Justificativa](#visão-geral-e-justificativa)  
2. [Conceito e Temática](#conceito-e-temática)  
3. [Funcionalidades Implementadas & Planejadas](#funcionalidades-implementadas--planejadas)  
4. [Wireframes](#wireframes)  
5. [Arquitetura e Estrutura do Projeto](#arquitetura-e-estrutura-do-projeto)  
6. [Tecnologias Utilizadas](#tecnologias-utilizadas)  
7. [APIs e Integrações](#apis-e-integrações)  
8. [Como Executar o Projeto (Local)](#como-executar-o-projeto-local)  
9. [Roadmap / Próximas Implementações](#roadmap--próximas-implementações)  
10. [Como Contribuir](#como-contribuir)  
11. [Autores](#autores)  
12. [Licença](#licença)

---

## Visão Geral e Justificativa

**Visão Geral.** Projeto acadêmico que implementa um jogo Tower Defense como uma Single Page Application (SPA). O objetivo técnico é demonstrar arquitetura modular em JavaScript, uso da Canvas API, integração com APIs externas e boas práticas de separação de responsabilidades.

**Justificativa.** Ferramenta de aprendizado e portfólio — combina lógica de jogo, balanceamento via configuração (`game-config.js`), e manejo de falhas ao consumir APIs externas (ex.: Open-Meteo).

---

## Conceito e Temática

Mistura de fantasia medieval com elementos pós-apocalípticos. O jogador posiciona torres em pontos estratégicos do mapa para impedir ondas de inimigos. A estética busca ser clara e funcional, com forte atenção à legibilidade e acessibilidade.

---

## Funcionalidades Implementadas & Planejadas

### Implementadas (v1.0)
- Sistema de ondas (12 ondas configuráveis via `db.json`).
- 6 tipos de torres (Básica, Perfurante, Área, Lentidão, Antiaérea, Boss Killer).
- 5 tipos de inimigos, incluindo boss.
- Sistema de clima dinâmico (integração com Open-Meteo) com efeitos visuais e debuffs.
- UI desacoplada (event-driven): HUD, seleção de torre e painel de desenvolvedor.
- SPA com roteamento por hash (`#home`, `#game`, `#victory`).

### Planejadas
- Sistema de poderes: Veneno (Poison), Gelo (Ice), Fogo (Fire).
- Sistema de upgrades para torres.
- Efeitos sonoros e música de fundo.
- Sistema de pontuação e ranking persistido.
- Múltiplos mapas e possibilidade de multiplayer local.

---

## Wireframes

> Coloque imagens exportadas do Excalidraw ou screenshots aqui. Você pode usar imagens locais (no repositório, pasta `wireframes/`) ou URLs públicas.

### Como adicionar imagens ao repositório
1. Exporte do Excalidraw como PNG/SVG.  
2. Crie a pasta `wireframes/` na raiz e mova as imagens:
```bash
mkdir -p wireframes
mv ~/Downloads/Wireframe_home.png wireframes/wireframe-home.png
mv ~/Downloads/Wireframe_game.png wireframes/wireframe-game.png
git add wireframes/
git commit -m "docs: add wireframe images"
git push origin <sua-branch>
Exibição (substitua os placeholders)
<p align="center"> <a href="WIRE_FRAME_HOME_FULL_URL_OR_PATH" target="_blank"> <img src="WIRE_FRAME_HOME_THUMB_URL_OR_PATH" alt="Wireframe - Home" width="520" style="margin-right:18px;" /> </a> <a href="WIRE_FRAME_GAME_FULL_URL_OR_PATH" target="_blank"> <img src="WIRE_FRAME_GAME_THUMB_URL_OR_PATH" alt="Wireframe - Jogo" width="520" /> </a> </p> <details> <summary><strong>Como usar URLs públicas</strong></summary>
Para imagens hospedadas no GitHub (raw):
https://raw.githubusercontent.com/SEU-USER/REPO/main/wireframes/wireframe-home.png

Para thumbnails, use uma versão menor como wireframes/wireframe-home-thumb.png no src e a full-size no href.

</details>
Arquitetura e Estrutura do Projeto
Arquitetura modular com separação clara de responsabilidades:

main.js — roteamento e ciclo de vida da aplicação.

engine.js — game loop, render e gestão de entidades.

wave-manager.js — controle de ondas e emissão de eventos.

ui.js — DOM, HUD e interação do jogador.

entities.js — classes Tower, Enemy, Projectile, etc.

game-config.js — balanceamento (torres, inimigos, ondas).

api.js — abstração para JSON Server e Open-Meteo.

Estrutura sugerida
arduino
Copiar código
/projeto-tower-defense
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
├── wireframes/
│   ├── wireframe-home.png
│   └── wireframe-game.png
├── assets/
│   └── images/
├── index.html
├── db.json
└── README.md
Tecnologias Utilizadas
HTML5 (semântico)

CSS3 (responsividade e animações leves)

JavaScript (ES6+, Canvas API)

JSON Server (mock local)

Git / GitHub (versionamento)

Ferramentas: VS Code, Live Server

APIs e Integrações
Open-Meteo — clima para efeitos dinâmicos (weathercode).

JSON Server — mock local para ondas e dados (db.json).

Em produção estática, recomendamos servir db.json como arquivo estático ou via serverless function (Netlify/Vercel) para evitar dependência de um processo json-server contínuo.

Como Executar o Projeto (Local)
Pré-requisitos
Node.js (v14+ recomendado)

npm (ou yarn)

Live Server (recomendado)

Passos
bash
Copiar código
git clone https://github.com/SEU-USER/REPO.git
cd REPO
# se usar JSON Server
npx json-server --watch db.json --port 3000
# abra index.html no navegador (ou use Live Server)
Em modo desenvolvimento, use a tecla de debug (ex.: D) para forçar clima/ondas.

Roadmap / Próximas Implementações
 Sistema de pontuação e ranking persistido.

 Efeitos sonoros e trilha.

 Sistema de upgrades e balanceamento refinado.

 Mais mapas e modos de jogo.

 Endpoint REST via serverless (Netlify/Vercel) para dados em produção.

Como Contribuir
Fork o repositório.

Crie uma branch: git checkout -b feature/nome-da-feature.

Commit: git commit -m "feat: descrição da feature".

Push: git push origin feature/nome-da-feature.

Abra um Pull Request com descrição das mudanças e testes realizados.

Autores
<table align="center"> <tr> <td align="center"> <a href="https://github.com/SEU-USER-ISMAEL"> <img src="https://avatars.githubusercontent.com/u/200134059?v=4" width="96" alt="Ismael" /> <br/> <sub><b>Ismael Gomes (Rex)</b></sub> </a> </td> <td align="center"> <a href="https://github.com/SEU-USER-EDUARDO"> <img src="https://avatars.githubusercontent.com/u/202681925?v=4" width="96" alt="Eduardo" /> <br/> <sub><b>Eduardo Monteiro</b></sub> </a> </td> </tr> </table>
Licença
Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para detalhes.

Feito com dedicação, café e debugging às horas impróprias.
