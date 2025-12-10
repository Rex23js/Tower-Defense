# Doitly - Gerenciador de Hábitos Diários

<div align="center">
  <img src="C:\xampp\htdocs\ProjetoFullstack\public\assets\img\logo.png" alt="Doitly Logo" width="120"/>
  
  ### Transforme seus objetivos em hábitos consistentes
  
  [![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
  [![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.2-7952B3?style=flat&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Instalação e Execução](#-instalação-e-execução)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Design System](#-design-system)
- [Roadmap](#-roadmap)
- [Equipe](#-equipe)

---

## 🎯 Sobre o Projeto

**Doitly** é um gerenciador de hábitos diários moderno e minimalista, desenvolvido para ajudar pessoas a criar rotinas consistentes e acompanhar seu progresso ao longo do tempo. Com design inspirado na simplicidade da Apple e efeitos glassmorphism, o Doitly oferece uma experiência visual agradável e intuitiva.

### Problema que Resolve

Muitas pessoas têm dificuldade em manter hábitos consistentes devido à falta de acompanhamento visual e organização. O Doitly resolve isso fornecendo:

- ✅ Interface intuitiva para gerenciar hábitos diários
- 📊 Visualização de progresso e estatísticas
- 🎯 Sistema de marcação simples e rápido
- 📈 Acompanhamento de streaks (sequências)
- 🔔 Organização por categorias e horários

---

## 🛠 Tecnologias Utilizadas

### Frontend

- **HTML5** - Estrutura semântica moderna
- **CSS3** - Design System customizado com Glassmorphism
- **Bootstrap 5.3.2** - Grid responsivo e componentes base
- **JavaScript (Vanilla)** - Interatividade e consumo de APIs
- **Google Fonts** - Inter & Plus Jakarta Sans

### Backend

- **PHP 8.0+** - Linguagem server-side
- **MySQL 8.0+** - Banco de dados relacional
- **API REST** - Arquitetura de comunicação
- **Sessions PHP** - Gerenciamento de autenticação

### Bibliotecas Futuras

- **Chart.js** - Visualização de dados e gráficos de progresso
- **ApexCharts** _(alternativa)_ - Gráficos interativos avançados

### Design & UI/UX

- **Excalidraw** - Wireframes e protótipos
- **Design System Próprio** - Tokens CSS e componentes reutilizáveis
- **Glassmorphism UI** - Efeito de vidro com backdrop-filter

### Ferramentas

- **Git & GitHub** - Controle de versão
- **XAMPP/MAMP** - Ambiente de desenvolvimento local
- **VS Code** - Editor de código

---

## ⚡ Funcionalidades

### ✨ Funcionalidades Atuais

#### Homepage/Landing Page (index.php)

- Apresentação visual do produto
- Seção de serviços principais
- Demonstração de interface de criação de hábitos
- Preview de hábitos de exemplo
- Design responsivo completo
- Footer com links e redes sociais

#### Design System Completo

- Sistema de cores e tipografia consistente
- Componentes reutilizáveis (botões, cards, inputs)
- Efeitos glassmorphism personalizados
- Animações e transições suaves
- Totalmente responsivo (mobile-first)

### 🚧 Em Desenvolvimento

1. **Sistema de Autenticação**

   - Página de login (login.php) - _em construção_
   - Página de cadastro (register.php) - _em construção_
   - Validação de formulários
   - Sistema de sessões seguro

2. **Dashboard Interativo**

   - Página principal do usuário (dashboard.php) - _planejado_
   - Estatísticas em tempo real:
     - Total de hábitos ativos
     - Taxa de conclusão diária
     - Maior streak (sequência)
   - Cards de métricas visuais

3. **Gerenciamento de Hábitos**

   - Página de hábitos (habits.php) - _planejado_
   - CRUD completo (Create, Read, Update, Delete)
   - Marcação de hábitos concluídos
   - Organização por categorias
   - Filtros por horário (manhã, tarde, noite)

4. **Histórico de Progresso**
   - Página de histórico (history.php) - _planejado_
   - Visualização de progresso ao longo do tempo
   - Gráficos com Chart.js

### 📊 Funcionalidades Planejadas

- Gráficos interativos de progresso mensal/anual
- Sistema de notificações
- Exportação de dados (PDF/CSV)
- Gamificação (conquistas e badges)
- Compartilhamento de progresso
- Modo escuro
- Calendário de hábitos
- Metas semanais e mensais

---

## 🏗 Arquitetura

O projeto segue uma arquitetura **MVC simplificada** adaptada para PHP, com separação clara entre apresentação, lógica de negócio e dados.

### Estrutura Geral

```
┌─────────────────────────┐
│   Frontend (Cliente)    │
│   - HTML/CSS/JS         │
│   - Bootstrap           │
│   - Design System       │
└──────────┬──────────────┘
           │ HTTP Request
           ▼
┌─────────────────────────┐
│   Backend (Servidor)    │
│   - PHP 8.0+            │
│   - API REST            │
│   - Sessions            │
└──────────┬──────────────┘
           │ SQL Queries
           ▼
┌─────────────────────────┐
│   Banco de Dados        │
│   MySQL 8.0+            │
└─────────────────────────┘
```

### Fluxo de Navegação Planejado

```
Homepage (index.php)
    │
    ├─→ Login (login.php) ──────→ Dashboard (dashboard.php)
    │                                  │
    └─→ Register (register.php) ───────┤
                                       │
                                       ├─→ Habits (habits.php)
                                       │
                                       └─→ History (history.php)
```

---

## 🚀 Instalação e Execução

### Pré-requisitos

- PHP 8.0 ou superior
- MySQL 8.0 ou superior
- Apache (XAMPP, MAMP, WAMP, ou similar)
- Navegador web moderno

### Passo a Passo

1. **Clone o repositório**

```bash
git clone https://github.com/dedeusgui/ProjetoFullstack.git
cd ProjetoFullstack
```

2. **Configure o servidor local**

```bash
# Mova o projeto para a pasta do seu servidor local
# XAMPP: C:/xampp/htdocs/
# MAMP: /Applications/MAMP/htdocs/
```

3. **Configure o banco de dados** _(em breve)_

```bash
# As instruções serão adicionadas quando o schema estiver completo
```

4. **Acesse a aplicação**

```
http://localhost/ProjetoFullstack/public/
```

### Executando com servidor PHP embutido

```bash
cd public
php -S localhost:8000
```

Acesse: `http://localhost:8000`

---

## 📁 Estrutura do Projeto

```
ProjetoFullstack/
│
├── 📂 actions/                    # Ações do backend (em desenvolvimento)
│   ├── api_get_habits.php         # GET - Lista hábitos
│   ├── api_get_stats.php          # GET - Estatísticas
│   ├── habit_create_action.php    # POST - Criar hábito
│   ├── habit_update_action.php    # PUT - Atualizar hábito
│   ├── habit_delete_action.php    # DELETE - Deletar hábito
│   ├── habit_mark_action.php      # POST - Marcar conclusão
│   ├── login_action.php           # POST - Autenticação
│   ├── register_action.php        # POST - Cadastro
│   └── logout_action.php          # POST - Logout
│
├── 📂 config/                     # Configurações (em desenvolvimento)
│   ├── conexao.php                # Conexão com banco de dados
│   └── auth.php                   # Middleware de autenticação
│
├── 📂 public/                     # Arquivos públicos (frontend)
│   │
│   ├── 📂 assets/
│   │   ├── 📂 css/
│   │   │   ├── style.css          # ✅ Design System completo
│   │   │   └── example-bootstrap.html  # Showcase de componentes
│   │   │
│   │   ├── 📂 js/
│   │   │   └── .gitkeep
│   │   │
│   │   └── 📂 img/
│   │       └── logo.png
│   │
│   ├── 📂 includes/
│   │   ├── header.php             # ✅ Header global reutilizável
│   │   ├── footer.php             # ✅ Footer global reutilizável
│   │   └── navbar.php             # ✅ Navbar componente
│   │
│   ├── index.php                  # ✅ Homepage/Landing page
│   ├── login.php                  # 🚧 Página de login
│   ├── register.php               # 🚧 Página de cadastro
│   ├── dashboard.php              # 🚧 Dashboard principal
│   ├── habits.php                 # 🚧 Gerenciamento de hábitos
│   └── history.php                # 🚧 Histórico de progressos
│
├── 📂 sql/
│   └── schema.sql                 # 🚧 Script de criação do banco
│
├── 📄 wireframe.png               # ✅ Wireframe do projeto (Excalidraw)
├── .gitignore
├── README.md                      # ✅ Este arquivo
└── LICENSE

Legenda:
✅ Completo
🚧 Em desenvolvimento
📋 Planejado
```

---

## 🎨 Design System

O Doitly possui um Design System completo e moderno, inspirado no design da Apple com efeitos glassmorphism.

### Paleta de Cores

```css
/* Backgrounds */
--bg-light: #ffffff
--bg-body: #f5f7fa
--bg-darker: #e6e7e9

/* Textos */
--text-primary: #222222
--text-secondary: #6c757d
--text-tertiary: #a0a0a0

/* Accent Colors */
--accent-blue: #4a74ff      /* Primary */
--accent-green: #59d186     /* Success */
--accent-gold: #eed27a      /* Warning */
--accent-red: #ff5757       /* Danger */
```

### Tipografia

- **Headings:** Plus Jakarta Sans (Italic, Light/Normal)
- **Body:** Inter (Normal, 300)
- **Weights:** 200 (Light), 300 (Normal), 400 (Regular), 500 (Medium), 600 (Semibold)

### Componentes Prontos

✅ **Botões:** Primary, Secondary, Outline, Ghost, Success, Danger  
✅ **Inputs:** Text, Textarea, Select (com estilos customizados)  
✅ **Cards:** Glass cards com blur effect  
✅ **Badges:** Success, Warning, Danger, Info  
✅ **Navbar:** Fixed top com glassmorphism  
✅ **Footer:** Responsivo com links sociais  
✅ **Habit Items:** Lista interativa de hábitos  
✅ **Stats Cards:** Cards de estatísticas

### Glassmorphism Effects

```css
/* Light Glass */
background: rgba(255, 255, 255, 0.08)
backdrop-filter: blur(10px)

/* Medium Glass */
background: rgba(255, 255, 255, 0.12)
backdrop-filter: blur(14px)

/* Strong Glass */
background: rgba(255, 255, 255, 0.55)
backdrop-filter: blur(22px)
```

### Responsividade

- **Mobile First:** < 480px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

Todos os componentes são 100% responsivos e otimizados para todos os dispositivos.

---

## 🗺 Roadmap

### Fase 1: Foundation ✅ (Concluída)

- [x] Estrutura básica do projeto
- [x] Design System completo
- [x] Homepage/Landing page
- [x] Componentes reutilizáveis
- [x] Wireframes e protótipos

### Fase 2: Autenticação 🚧 (Em Andamento)

- [ ] Página de login funcional
- [ ] Página de registro funcional
- [ ] Sistema de validação de formulários
- [ ] Integração com banco de dados
- [ ] Sistema de sessões PHP
- [ ] Middleware de autenticação

### Fase 3: Core Features 📋 (Próxima)

- [ ] Dashboard com estatísticas
- [ ] CRUD de hábitos completo
- [ ] Sistema de marcação de conclusão
- [ ] Página de histórico
- [ ] Integração das APIs REST

### Fase 4: Data Visualization 📋

- [ ] Implementação Chart.js
- [ ] Gráficos de progresso
- [ ] Calendário de hábitos
- [ ] Exportação de dados

### Fase 5: Enhancement 📋

- [ ] Sistema de notificações
- [ ] Gamificação
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)

### Fase 6: Deploy 📋

- [ ] Configuração de produção
- [ ] Deploy do frontend
- [ ] Deploy do backend
- [ ] Documentação final
- [ ] Vídeo de apresentação

---

## 📸 Capturas de Tela

### Homepage - Acima da Dobra

> Design moderno com glassmorphism e apresentação clara do produto

### Seção de Serviços

> Cards apresentando as funcionalidades principais do Doitly

### Preview de Hábitos

> Interface de exemplo mostrando como será o gerenciamento de hábitos

### Componentes UI

> Showcase completo de todos os componentes do Design System

_Screenshots serão adicionadas em breve_

---

## 📚 Documentação Adicional

### Para Desenvolvedores

- **Style Guide:** Veja `public/assets/css/example-bootstrap.html` para exemplos de todos os componentes
- **Wireframes:** Consulte o arquivo `wireframe.png` para referência de layout
- **CSS Variables:** Todas as variáveis de design estão em `:root` no `style.css`

### Boas Práticas Implementadas

✅ Código semântico e acessível  
✅ Mobile-first approach  
✅ Performance otimizada (blur reduzido em mobile)  
✅ Suporte a prefers-reduced-motion  
✅ Suporte a high-contrast mode  
✅ Componentes reutilizáveis  
✅ Separação de responsabilidades

---

## 👥 Equipe

- **Guilherme Deus** - [@dedeusgui](https://github.com/dedeusgui) - Frontend & Design
- **Ismael Gomes** - [@rex23js](https://github.com/rex23js) - Backend & Database

---

## 🎓 Contexto Acadêmico

Este projeto está sendo desenvolvido como trabalho da disciplina de Desenvolvimento Fullstack, com o objetivo de demonstrar conhecimentos em:

✅ Desenvolvimento Frontend responsivo com HTML/CSS/JavaScript  
✅ Design System e UI/UX moderno  
🚧 Criação de API REST com PHP  
🚧 Modelagem de banco de dados relacional  
🚧 Autenticação e autorização  
✅ Boas práticas de código e organização  
✅ Versionamento com Git  
✅ Documentação técnica completa

### Requisitos do Projeto

**Atendidos:**

- ✅ Interface responsiva
- ✅ Componentes reutilizáveis
- ✅ Boa organização de código
- ✅ Versionamento Git

**Em Desenvolvimento:**

- 🚧 Navegação entre páginas
- 🚧 Consumo de APIs
- 🚧 Formulários validados
- 🚧 API REST com CRUD completo
- 🚧 Autenticação e autorização
- 🚧 Banco de dados modelado

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🔗 Links Úteis

- [Repositório no GitHub](https://github.com/dedeusgui/ProjetoFullstack)
- [Deploy (em breve)](#)

---

## 📞 Contato

Tem alguma dúvida ou sugestão? Entre em contato!

- **GitHub:** [@dedeusgui](https://github.com/dedeusgui)
- **GitHub:** [@rex23js](https://github.com/rex23js)

---

<div align="center">
  
  ### 🌟 Status do Projeto: Em Desenvolvimento Ativo
  
  Feito com 💙 por Guilherme Deus e equipe
  
  ⭐ Deixe uma estrela se este projeto te interessou!
  
</div>
