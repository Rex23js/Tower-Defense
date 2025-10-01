# Tower Defense Acadêmico 🎯

![Status do Projeto](https://img.shields.io/badge/versão-v1.0--alpha-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

Bem-vindo ao "Tower Defense Acadêmico", um jogo de defesa por torres desenvolvido com JavaScript puro, Canvas API e integração com APIs externas. Este projeto demonstra arquitetura modular, mecânicas de jogo balanceadas e um sistema de clima dinâmico que afeta o gameplay.

O foco é apresentar boas práticas de engenharia de software front-end, incluindo separação de responsabilidades, tratamento de erros, e uma experiência de usuário fluida e acessível.

# Link do Projeto Em Deploy

https://thetowerdefense.netlify.app/

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Funcionalidades da Versão Atual (v1.0-alpha)](#2-funcionalidades-da-versão-atual-v10-alpha)
3. [Wireframe e Conceito Visual](#3-wireframe-e-conceito-visual)
4. [Tecnologias Utilizadas](#4-tecnologias-utilizadas)
5. [APIs Integradas](#5-apis-integradas)
6. [Estrutura do Projeto](#6-estrutura-do-projeto)
7. [Versionamento com Git](#7-versionamento-com-git)
8. [Acessibilidade e Responsividade](#8-acessibilidade-e-responsividade)
9. [Sistema de Clima Dinâmico](#9-sistema-de-clima-dinâmico)
10. [Como Executar o Projeto](#10-como-executar-o-projeto)

---

### 1. Visão Geral e Justificativa

**Visão Geral:** O "Tower Defense Acadêmico" é uma Single Page Application (SPA) que simula um jogo de defesa por torres onde o jogador posiciona torres estrategicamente para deter ondas de inimigos. O projeto integra dados de APIs externas, apresenta mecânicas de jogo balanceadas e oferece uma experiência visual rica através da Canvas API.

**Justificativa:** Este projeto foi escolhido pela oportunidade de trabalhar com desafios técnicos completos, incluindo:
- Implementação de um game loop otimizado
- Arquitetura modular e desacoplada (event-driven)
- Integração com APIs externas (Open-Meteo para clima)
- Sistema de balanceamento configurável
- Renderização 2D com Canvas API
- Gestão de estado complexo
- Prática de fluxo Git Flow profissional

### 2. Funcionalidades da Versão Atual (v1.0-alpha)

#### **Mecânicas de Jogo**
- **Sistema de Ondas:** 12 ondas progressivas com dificuldade crescente, configuráveis via `db.json` ou fallback local
- **Sistema de Torres:**
  - 4 tipos de torres com características únicas (Básica, Rápida, Sniper, Mágica)
  - Sistema de cooldown e targeting inteligente
  - Limites configuráveis por tipo de torre
  - Visualização de alcance e status
- **Sistema de Inimigos:**
  - 6 tipos diferentes: Básico, Rápido, Tanque, Enxame, Voador e Boss
  - Atributos balanceados (velocidade, HP, recompensa em ouro)
  - Sistema de pathing suave usando Catmull-Rom splines
- **Economia de Jogo:**
  - Sistema de ouro para compra de torres
  - Recompensas por onda completada
  - Recompensas por inimigos derrotados

#### **Sistema de Clima Dinâmico**
- **Integração com Open-Meteo API:** Clima real que afeta as mecânicas do jogo
- **Efeitos Visuais:**
  - Sistema de partículas para chuva, neblina e tempestade
  - Overlay visual dinâmico no canvas
  - Transições suaves entre estados climáticos
- **Impacto no Gameplay:**
  - **Neblina:** Reduz alcance das torres avançadas em 25%
  - **Chuva:** Reduz cadência de tiro das torres básicas em 10%
  - **Tempestade:** Reduz cadência de todas as torres
- **Indicadores Visuais:**
  - Ícones de debuff nas torres afetadas
  - Anéis comparativos (alcance base vs atual)
  - Barras de duração para efeitos temporários
  - Status do clima na HUD

#### **Interface e Experiência**
- **Loja de Torres:** Sistema de abas categorizadas com informações detalhadas
- **HUD Dinâmica:** 
  - Contador de ouro, vidas e wave atual
  - Contador de inimigos restantes
  - Status do clima em tempo real
- **Controles de Jogo:**
  - Pausar/Retomar partida
  - Ajuste de velocidade (1x, 2x, 3x)
  - Sistema de ondas automáticas
  - Modo desenvolvedor com painel de debug
- **Feedback Visual:**
  - Ghost da torre durante posicionamento
  - Validação visual de posicionamento (verde/vermelho)
  - Linhas de targeting para torres
  - Barras de HP dos inimigos
  - Cooldown visual nas torres

#### **Navegação e Rotas**
- **Home (`#/`):** Tela inicial com apresentação do jogo
- **Jogo (`#/game`):** Interface principal de gameplay
- **Vitória (`#/victory`):** Tela de vitória com estatísticas finais
- **Ranking (`#/scores`):** Sistema de pontuação (preparado para persistência)

#### **Recursos Técnicos**
- **Arquitetura Modular:** Separação clara entre engine, UI, entidades e configuração
- **Sistema de Eventos:** Comunicação desacoplada entre componentes
- **Tratamento de Erros:** Fallbacks seguros para APIs externas
- **Otimização de Performance:**
  - Canvas responsivo com ajuste de DPI
  - Sistema de redimensionamento estável
  - Recalculação inteligente de paths

#### **Modo Desenvolvedor**
- **Painel de Debug:** Controle manual do clima para testes
- **Informações Detalhadas:** Estado do jogo e torres em tempo real
- **Ativação Persistente:** Configuração salva em localStorage

#### **Design e Estética**
- **Tema Medieval/Fantasia:**
  - Castelo defendível com torres laterais
  - Caminho de terra estilizado com marcações
  - Decorações ambientais (árvores)
  - Grid sutil de fundo
- **Paleta de Cores Consistente:** Design system definido em CSS variables
- **Animações Suaves:** Transições e efeitos visuais polidos

### 3. Wireframe e Conceito Visual:

![Wireframe principal (Frame)](wireframes/Frame.png)


**Mapa Mental do Projeto:**
```
ideias do site
├── tower defense
│   ├── mecânicas básicas do gênero
│   │   ├── poderes (gelo, fogo, veneno)
│   │   └── funções específicas etc
│   └── temática medieval simplificada
├── justificativa
│   └── criação de jogo multiplataforma acessível
├── wireframe
│   ├── menu inicial
│   │   └── botão de início
│   └── partes do menu
└── ferramentas de programação
    ├── CSS
    └── JavaScript
```

### 4. Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Canvas API:** Renderização 2D do jogo
- **Arquitetura:** SPA com roteamento por hash
- **Armazenamento:** localStorage para preferências do usuário
- **Versionamento:** Git / GitHub
- **Ferramentas de Desenvolvimento:** 
  - VS Code
  - Live Server
  - JSON Server (para desenvolvimento)

### 5. APIs Integradas

#### **1. Open-Meteo API (Clima)**
- **Propósito:** Fornecer dados meteorológicos reais que afetam o gameplay
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Dados Utilizados:** `weathercode` (código do clima atual)
- **Fallback:** Sistema seguro que usa clima padrão em caso de falha
- **Atualização:** A cada 5 minutos durante o jogo

#### **2. JSON Server (Desenvolvimento Local)**
- **Propósito:** Mock API para dados de ondas e ranking
- **Porta Padrão:** `http://localhost:3000`
- **Endpoints:**
  - `/waves` - Configuração das ondas
  - `/scores` - Sistema de ranking
- **Nota:** Em produção, substituir por endpoint serverless ou arquivo estático

### 6. Estrutura do Projeto

```
/tower-defense-game
├── css/
│   └── style.css              # Estilos globais e sistema de design
├── js/
│   ├── api.js                 # Abstração de chamadas a APIs
│   ├── engine.js              # Game loop, render e gestão de entidades
│   ├── entities.js            # Classes Tower e Enemy
│   ├── game-config.js         # Configuração e balanceamento
│   ├── main.js                # Roteamento e controle da aplicação
│   ├── ui.js                  # Manipulação do DOM e eventos
│   └── wave-manager.js        # Controle de ondas e eventos
├── api/                       # (Opcional) Dados para JSON Server
│   └── db.json               # Mock de dados de ondas e scores
├── wireframes/               # (Opcional) Wireframes do projeto
├── index.html                # Entrada da aplicação
├── package.json              # Dependências e scripts
└── README.md                 # Este arquivo
```

### 7. Versionamento com Git

O projeto utiliza um fluxo de trabalho baseado no **Git Flow**, com as seguintes branches:

- **master (ou main):** Contém o código de produção, estável e pronto para deploy. Cada versão final será marcada com uma `tag` (ex: `v1.0-alpha`).
- **develop:** Branch principal de desenvolvimento. Novas funcionalidades são integradas aqui antes de irem para a `master`.
- **feature/\*:** Branches temporárias para desenvolvimento de novas funcionalidades.
  - Exemplo: `feature/sistema-upgrades`, `feature/efeitos-sonoros`

**Convenção de Commits:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração de código
- `docs:` Atualização de documentação
- `style:` Mudanças de formatação
- `test:` Adição ou correção de testes

### 8. Acessibilidade e Responsividade

#### **Responsividade**
- **Desktop (> 1200px):** Layout lado a lado (loja + jogo)
- **Tablet (900px - 1200px):** Layout adaptado com loja reduzida
- **Mobile (< 900px):** Layout vertical com loja colapsável
- **Canvas Responsivo:** Ajuste automático ao container com DPI otimizado

#### **Acessibilidade**
- **Navegação por Teclado:** 
  - Tecla `M` para abrir menu
  - `ESC` para fechar modais
  - `Enter` e `Space` para ativar botões
- **ARIA Labels:** Atributos semânticos para leitores de tela
- **Contraste:** Paleta de cores com contraste adequado
- **Focus Indicators:** Indicadores visuais claros para navegação por teclado
- **Modo Desenvolvedor:** Acessível via toggle nas configurações

### 9. Sistema de Clima Dinâmico

O sistema de clima é um dos diferenciais técnicos do projeto:

#### **Implementação**
```javascript
// Códigos de clima do Open-Meteo
weather: {
  effects: {
    clear: { codes: [0,1,2,3], modifiers: [] },
    fog: { codes: [45,48], modifiers: [
      { category: "advanced", property: "range", multiplier: 0.75 }
    ]},
    rain: { codes: [51,53,55,61,63,65], modifiers: [
      { category: "basic", property: "fireRate", multiplier: 0.9 }
    ]},
    storm: { codes: [95,96,99], modifiers: [
      { category: "basic", property: "fireRate", multiplier: 0.8 },
      { category: "advanced", property: "fireRate", multiplier: 0.85 }
    ]}
  }
}
```

#### **Efeitos Visuais**
- **Sistema de Partículas:** Até 120 partículas simultâneas para tempestades
- **Tipos de Partículas:**
  - Chuva: Gotas animadas com velocidade e ângulo
  - Neblina: Nuvens com gradiente e fade in/out
  - Tempestade: Chuva intensa com raios ocasionais
- **Performance:** Otimizado com pooling e culling de partículas

#### **Integração com Gameplay**
- **Debuffs Dinâmicos:** Aplicados/removidos automaticamente nas torres
- **Indicadores Visuais:** Ícones e anéis mostram torres afetadas
- **Fallback Seguro:** Nunca quebra o jogo mesmo se a API falhar

### 10. Como Executar o Projeto

#### **Pré-requisitos**
- **Node.js** (v14+ recomendado)
- **npm** ou **yarn**
- **Live Server** (opcional, mas recomendado)

#### **Instalação**

1. **Clone o repositório:**
```bash
git clone https://github.com/Rex23js/Tower-Defense.git
cd tower-defense-game
```

2. **Instale as dependências (opcional, apenas para JSON Server):**
```bash
npm install
```

3. **Inicie o JSON Server (desenvolvimento local):**
```bash
npm run api
# ou
npx json-server --watch api/db.json --port 3000
```

4. **Abra o projeto:**
   - **Opção 1 (Recomendada):** Use a extensão Live Server do VS Code
     - Clique com botão direito em `index.html`
     - Selecione "Open with Live Server"
   
   - **Opção 2:** Abra `index.html` diretamente no navegador
     - **Nota:** Pode haver problemas com CORS ao acessar APIs locais

#### **Scripts Disponíveis**
```json
{
  "scripts": {
    "api": "json-server --watch api/db.json --port 3000"
  }
}
```

#### **Modo Desenvolvedor**
1. Entre no jogo (`#/game`)
2. Abra o menu de configurações (⚙️)
3. Ative o toggle "Modo Desenvolvedor"
4. Use o painel de debug para forçar condições climáticas

---

## Roadmap / Próximas Implementações

- [ ] Sistema de upgrades inline para torres
- [ ] Poderes especiais (veneno, gelo, fogo)
- [ ] Efeitos sonoros e música de fundo
- [ ] Sistema de ranking persistido (com API em produção)
- [ ] Múltiplos mapas e caminhos
- [ ] Modo cooperativo local
- [ ] Exportação de estatísticas para CSV
- [ ] Testes automatizados end-to-end
- [ ] Modo história com narrativa

---

## Como Contribuir

1. **Fork** este repositório
2. Crie uma branch: `git checkout -b feature/nome-da-feature`
3. Faça commits claros: `git commit -m "feat: descrição da mudança"`
4. Push para a branch: `git push origin feature/nome-da-feature`
5. Abra um **Pull Request** descrevendo as mudanças

**Dicas para Contribuir:**
- Mantenha o `game-config.js` como fonte de verdade para balanceamento
- Teste no modo desenvolvedor antes de enviar PR
- Siga as convenções de código existentes
- Adicione comentários em lógicas complexas

---

## Autores

<table align="center">
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/200134059?v=4" width="96" alt="Ismael" />
      <br/>
      <sub><b>Ismael Gomes (Rex)</b></sub>
      <br/>
      <a href="https://github.com/Rex23js">GitHub</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/202681925?v=4" width="96" alt="Eduardo" />
      <br/>
      <sub><b>Eduardo Monteiro</b></sub>
      <br/>
      <a href="https://github.com/USUARIO-EDUARDO">GitHub</a>
    </td>
  </tr>
</table>

---

## Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo `LICENSE` para detalhes.

---

<div align="center">

**🎯 Feito com dedicação, café e debugging às 3 da manhã 🎯**

</div>
