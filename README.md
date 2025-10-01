# Tower Defense Acadêmico 🎯

![Status do Projeto](https://img.shields.io/badge/status-v1.0--alpha-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

> Jogo Tower Defense criado com HTML, CSS e JavaScript puro. Projeto focado em mecânicas clássicas, arquitetura modular, acessibilidade e experiência do jogador.

---

## Demo (deploy)
> Insira aqui a URL do deploy quando disponível.  
**Exemplo:** `https://thetowerdefense.netlify.app`

---

## Índice

1. [Visão Geral e Justificativa](#visão-geral-e-justificativa)  
2. [Conceito e Temática](#conceito-e-temática)  
3. [Funcionalidades Implementadas (v1.0)](#funcionalidades-implementadas-v10)  
4. [Funcionalidades Planejadas](#funcionalidades-planejadas)  
5. [Wireframe](#wireframe)  
6. [Arquitetura e Estrutura do Projeto](#arquitetura-e-estrutura-do-projeto)  
7. [Tecnologias Utilizadas](#tecnologias-utilizadas)  
8. [APIs e Integrações](#apis-e-integrações)  
9. [Como Executar o Projeto (Local)](#como-executar-o-projeto-local)  
10. [Testes & Debugging](#testes--debugging)  
11. [Contribuição](#contribuição)  
12. [Autores](#autores)  
13. [Licença](#licença)

---

## Visão Geral e Justificativa

**Visão Geral.**  
"Tower Defense Acadêmico" é uma Single Page Application (SPA) que simula um jogo de defesa por torres. O jogador posiciona torres para deter ondas de inimigos enquanto gerencia recursos e upgrades. O objetivo técnico é demonstrar arquitetura modular em JavaScript, uso da Canvas API para render 2D, integração com APIs externas e boas práticas de engenharia front-end.

**Justificativa.**  
Projeto ideal para portfólio e estudos: combina lógica de jogo, balanceamento via arquivo de configuração, tratamento de falhas em integrações externas e foco em acessibilidade.

---

## Conceito e Temática

Mistura de fantasia medieval com elementos pós-apocalípticos. Estética limpa e funcional, priorizando legibilidade e controles acessíveis. Jogabilidade baseada em ondas configuráveis, torres com roles distintas e sistema de clima que altera mecânicas.

---

## Funcionalidades Implementadas (v1.0)

- Sistema de ondas configurável (via `db.json` / JSON Server).  
- Seis tipos de torres (Básica, Perfurante, Área, Lentidão, Antiaérea, Boss Killer).  
- Diversos inimigos, incluindo boss com atributos especiais.  
- Sistema de clima dinâmico (consumo de Open-Meteo + fallback seguro).  
- Efeitos visuais para chuva e neblina desenhados no canvas.  
- UI desacoplada (event-driven): HUD, seleção de torre, painel de desenvolvedor.  
- SPA com roteamento por hash (`#/`, `#/game`, `#/victory`, `#/scores`).  
- Modo desenvolvedor / painel de debug para forçar clima e ondas.  
- Design responsivo (desktop e tablet; mobile com limitações do canvas).

---

## Funcionalidades Planejadas

- Sistema de poderes (veneno, gelo, fogo).  
- Upgrades de torre e árvore de evolução.  
- Efeitos sonoros e trilha sonora dinâmica.  
- Sistema de pontuação e ranking persistido.  
- Múltiplos mapas / caminhos.  
- Endpoint REST em serverless (Netlify/Vercel) para dados em produção.  
- Export de estatísticas (CSV/Google Sheets).

---

## Wireframe

Wireframe principal disponível no repositório como `Frame.png`. Use para referenciação do layout e distribuição de elementos da interface.

---

## Arquitetura e Estrutura do Projeto

Arquitetura modular com separação clara de responsabilidades:

- `index.html` — entrada HTML principal. :contentReference[oaicite:3]{index=3}  
- `js/main.js` — roteamento e ciclo de vida da aplicação.  
- `js/engine.js` — game loop, render e gestão de entidades.  
- `js/wave-manager.js` — controle de ondas e emissão de eventos.  
- `js/ui.js` — DOM, HUD e interações do jogador.  
- `js/entities.js` — classes `Tower`, `Enemy`, `Projectile`, etc.  
- `js/game-config.js` — balanceamento (torres, inimigos, ondas).  
- `js/api.js` — abstração para JSON Server e Open-Meteo.  
- `css/style.css` — estilos e temas.

### Estrutura (exemplo)
/tower-defense
├── api/ # (opcional) arquivos para json-server
├── css/
│ └── style.css
├── js/
│ ├── api.js
│ ├── engine.js
│ ├── entities.js
│ ├── game-config.js
│ ├── main.js
│ ├── ui.js
│ └── wave-manager.js
├── index.html
├── db.json # (opcional) dados de ondas/mock
├── package.json # script "api" disponível. 
packge


└── README.md

yaml
Copiar código

> Observação: `db.json` é recomendado para desenvolvimento com `json-server`. Em deploy estático, use serverless endpoints ou substitua por arquivos estáticos.

---

## Tecnologias Utilizadas

- HTML5 semântico  
- CSS3 (responsividade + animações leves)  
- JavaScript (ES6+, Canvas API)  
- JSON Server (mock local)  
- Ferramentas: Git, VS Code, Live Server

---

## APIs e Integrações

- **Open-Meteo** — condições meteorológicas que alteram mecânicas (weathercode).  
- **JSON Server** — mock local para ondas e dados (`db.json`).  
- **Observação de robustez:** todas as chamadas externas são encapsuladas em `api.js` com fallback seguro para evitar crashes.

---

## Como Executar o Projeto (Local)

### Pré-requisitos

- Node.js (v14+ recomendado)  
- npm (ou yarn)  
- Live Server (opcional) — facilita abrir `index.html` com CORS apropriado

### Passos rápidos

1. Clone o repositório
```bash
git clone https://github.com/SEU-USER/SEU-REPO.git
cd SEU-REPO
Instale dependências (se necessário)

bash
Copiar código
npm install
Inicie o mock API (se usar db.json)

bash
Copiar código
# usa o script definido no package.json (json-server)
npm run api
# ou, sem instalar: npx json-server --watch api/db.json --port 3000
Abra index.html no navegador

Recomendado: usar Live Server da extensão do VS Code para evitar problemas de CORS.

Alternativa: servir via http-server ou outra solução simples.

Script útil
npm run api — inicia json-server (se api/db.json estiver presente). 
packge


Testes & Debugging
Use o painel de debug (tecla D ou interface) para forçar clima, ondas e testar balanceamento.

Testes manuais recomendados: fluxo de jogo completo, inicio/pausa/restart, comportamento de torres sob diferentes climas.

Automação (futuro): integrar testes end-to-end (Selenium / Playwright).

Como Contribuir
Fork o repositório.

Crie uma branch: git checkout -b feature/nome-da-feature.

Faça commits claros: git commit -m "feat: descrição".

Faça push: git push origin feature/nome-da-feature.

Abra um Pull Request com descrição e evidências de teste.

Sugestões: mantenha game-config.js atualizado como fonte de verdade para balanceamento.

Autores
<table align="center"> <tr> <td align="center"> <img src="https://avatars.githubusercontent.com/u/200134059?v=4" width="96" alt="Ismael" /> <br/> <sub><b>Ismael Gomes (Rex)</b></sub> </td> <td align="center"> <img src="https://avatars.githubusercontent.com/u/202681925?v=4" width="96" alt="Eduardo" /> <br/> <sub><b>Eduardo Monteiro</b></sub> </td> </tr> </table>
Licença
Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para detalhes.

Feito com dedicação, café e debugging às horas impróprias.
