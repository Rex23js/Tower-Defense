# Tower Defense Acadêmico 🎯

![Status do Projeto](https://img.shields.io/badge/status-v1.0--alpha-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

> Jogo Tower Defense criado com HTML, CSS e JavaScript puro. Projeto focado em mecânicas clássicas, acessibilidade e experiência de usuário.

---

## Link do Projeto (deploy)
> Coloque aqui a URL do deploy quando estiver disponível.  
**Ex:** `https://thetowerdefense.netlify.app`

---

## Índice

1. [Visão Geral e Justificativa](#visão-geral-e-justificativa)  
2. [Conceito e Temática](#conceito-e-temática)  
3. [Funcionalidades Implementadas & Planejadas](#funcionalidades-implementadas--planejadas)  
4. [Wireframe](#wireframe)  
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

**Justificativa.** Ferramenta de aprendizado e portfólio — combina lógica de jogo, balanceamento via configuração (`game-config.js`) e manejo de falhas ao consumir APIs externas.

---

## Conceito e Temática

Mistura de fantasia medieval com elementos pós-apocalípticos. O jogador posiciona torres em pontos estratégicos do mapa para impedir ondas de inimigos. A estética busca ser clara e funcional, com atenção à legibilidade e acessibilidade.

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
- Múltiplos mapas e modos alternativos.

---

## Wireframe

> Wireframe principal (export do seu editor) — arquivo presente no repositório: `Frame.png`

<p align="center">
  <a href="Frame.png" target="_blank">
    <img src="Frame.png" alt="Wireframe - Tela inicial e layout do jogo" width="900" />
  </a>
</p>

---

## Arquitetura e Estrutura do Projeto

Arquitetura modular com separação clara de responsabilidades:

- `main.js` — roteamento e ciclo de vida da aplicação.  
- `engine.js` — game loop, render e gestão de entidades.  
- `wave-manager.js` — controle de ondas e emissão de eventos.  
- `ui.js` — DOM, HUD e interação do jogador.  
- `entities.js` — classes `Tower`, `Enemy`, `Projectile`, etc.  
- `game-config.js` — balanceamento (torres, inimigos, ondas).  
- `api.js` — abstração para JSON Server e Open-Meteo.

### Estrutura (conforme pasta do seu print)
/Tower-Defense
├── api/
├── css/
├── data/
├── js/
├── Frame.png
├── index.html
├── package.json
└── README.md

yaml
Copiar código

> Observação: `data/` pode conter `db.json` para uso local com `json-server`.

---

## Tecnologias Utilizadas

- HTML5 (semântico)  
- CSS3 (responsividade e animações leves)  
- JavaScript (ES6+, Canvas API)  
- JSON Server (mock local)  
- Git / GitHub (versionamento)  
- Ferramentas: VS Code, Live Server

---

## APIs e Integrações

- **Open-Meteo** — clima para efeitos dinâmicos (weathercode).  
- **JSON Server** — mock local para ondas e dados (`db.json`).  

> Em deploy estático, recomenda-se servir `db.json` como arquivo estático ou usar uma serverless function (Netlify/Vercel) para expor endpoints sem depender de um processo `json-server` rodando constantemente.

---

## Como Executar o Projeto (Local)

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Edge)  
- Node.js (recomendado para `json-server`)  
- Live Server (opcional, para facilitar desenvolvimento)

### Passos
```bash
git clone https://github.com/SEU-USER/SEU-REPO.git
cd SEU-REPO

# se usar JSON Server (opcional)
npx json-server --watch data/db.json --port 3000

# abrir index.html no navegador (ou com Live Server)
Roadmap / Próximas Implementações
 Sistema de pontuação e ranking persistido.

 Efeitos sonoros e trilha.

 Sistema de upgrades e balanceamento refinado.

 Mais mapas e modos de jogo.

 Endpoint REST via serverless (Netlify/Vercel) para dados em produção.

Como Contribuir
Fork este repositório.

Crie uma branch: git checkout -b feature/nome-da-feature.

Faça commits claros: git commit -m "feat: descrição da feature".

Push: git push origin feature/nome-da-feature.

Abra um Pull Request com descrição e evidências de teste.

Autores
<table align="center"> <tr> <td align="center"> <img src="https://avatars.githubusercontent.com/u/200134059?v=4" width="96" alt="Ismael" /> <br/> <sub><b>Ismael Gomes (Rex)</b></sub> </td> <td align="center"> <img src="https://avatars.githubusercontent.com/u/202681925?v=4" width="96" alt="Eduardo" /> <br/> <sub><b>Eduardo Monteiro</b></sub> </td> </tr> </table>
Licença
Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para detalhes.

Feito com dedicação, café e debugging às horas impróprias.
