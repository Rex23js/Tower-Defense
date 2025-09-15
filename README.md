<div align="center">

  <img src="[URL_DA_IMAGEM_DE_CABEÇALHO_AQUI]" alt="Banner do Projeto Tower Defense" width="800"/>

# Tower Defense - Projeto Acadêmico 🚀

  <p>
    <strong>Um jogo de Tower Defense construído com HTML, CSS e JavaScript puro, focado em boas práticas de desenvolvimento, testes e integração com API.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-concluído-green" alt="Status do Projeto">
    <img src="https://img.shields.io/github/languages/top/seu-usuario/seu-repositorio?color=blue" alt="Linguagem Principal">
    <img src="https://img.shields.io/github/last-commit/seu-usuario/seu-repositorio" alt="Último Commit">
    <img src="https://img.shields.io/badge/licen%C3%A7a-MIT-informational" alt="Licença MIT">
  </p>
</div>

<div align="center">

  <img src="[URL_DO_GIF_DO_GAMEPLAY_AQUI]" alt="Gameplay do Tower Defense" width="700">
</div>

---

## 📖 Sumário

- [🎯 Sobre o Projeto](#-sobre-o-projeto)
- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🚀 Como Executar o Projeto](#-como-executar-o-projeto)
- [🔌 API - Estrutura e Integração](#-api---estrutura-e-integração)
- [✅ Testes e Qualidade](#-testes-e-qualidade)
- [🔮 Roadmap de Futuras Implementações](#-roadmap-de-futuras-implementações)
- [🤝 Como Contribuir](#-como-contribuir)
- [👨‍💻 Autores](#-autores)
- [📄 Licença](#-licença)

---

## 🎯 Sobre o Projeto

Este projeto é a materialização de um desafio acadêmico: criar um jogo de **Tower Defense** funcional e bem estruturado, utilizando apenas tecnologias web fundamentais. O objetivo principal foi aplicar e demonstrar um fluxo de trabalho de desenvolvimento completo, abrangendo desde a concepção e documentação inicial até os testes, tratamento de exceções e o deploy final de uma aplicação interativa.

---

## ✨ Funcionalidades

- ✅ **Sistema de Ondas (Waves):** Ondas de inimigos com dificuldade progressiva, carregadas dinamicamente via API.
- ✅ **Torres Estratégicas:** 3 tipos de torres com características únicas (dano, alcance, cadência de tiro).
- ✅ **Inimigos Variados:** 4 tipos de inimigos com diferentes atributos (velocidade, vida, etc.).
- ✅ **Economia e Vidas:** Sistema de ouro para construção e vidas que determinam a derrota.
- ✅ **Interface Intuitiva:** HUD clara para exibir recursos, onda atual e outras informações vitais.
- ✅ **Ranking de Pontuação:** As pontuações são salvas e exibidas através de uma API REST.
- ✅ **Responsividade:** Interface adaptável para uma boa experiência em diferentes resoluções de tela.
- ✅ **Acessibilidade:** Navegação via teclado (`Tab` e `Enter`) para interações na UI.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com as seguintes ferramentas:

| Ferramenta            | Descrição                                              |
| --------------------- | ------------------------------------------------------ |
| **HTML5**             | Estrutura semântica e elemento `<canvas>` para o jogo. |
| **CSS3**              | Estilização e responsividade da interface.             |
| **JavaScript (ES6+)** | Lógica do jogo, manipulação do DOM e requisições.      |
| **JSON Server**       | Simulação de uma API RESTful para waves e scores.      |
| **Git & GitHub**      | Versionamento de código e gerenciamento do projeto.    |
| **Postman**           | Documentação e teste dos endpoints da API.             |
| **Vercel/Netlify**    | Hospedagem e deploy contínuo.                          |

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para rodar o jogo em seu ambiente local:

```bash
# 1. Clone este repositório
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)

# 2. Navegue até o diretório do projeto
cd seu-repositorio

# 3. Instale as dependências (para o JSON Server)
npm install

# 4. Inicie a API fake em um terminal
# O servidor rodará em http://localhost:3000
npm run api

# 5. Abra o arquivo `index.html` no seu navegador
# Dica: use a extensão "Live Server" do VS Code para uma melhor experiência.
```

---

## 🔌 API - Estrutura e Integração

A aplicação utiliza uma API REST simulada com `JSON Server` para gerenciar dados dinâmicos.

| Verbo  | Endpoint  | Descrição                                              |
| :----- | :-------- | :----------------------------------------------------- |
| `GET`  | `/waves`  | Retorna a configuração completa das ondas de inimigos. |
| `GET`  | `/scores` | Retorna a lista de pontuações mais altas.              |
| `POST` | `/scores` | Adiciona uma nova pontuação ao banco de dados.         |

As requisições são tratadas de forma assíncrona com `async/await` e blocos `try...catch` para garantir que falhas de comunicação com o servidor não quebrem a aplicação, informando o usuário sobre o problema.

---

## ✅ Testes e Qualidade

Para assegurar a robustez do projeto, foram aplicadas as seguintes estratégias de teste:

- **Testes de API com Postman:** Uma collection completa foi criada para validar todos os endpoints, incluindo cenários de sucesso (`200 OK`, `201 Created`) e de erro (`404`, `500`). O arquivo `TowerDefense.postman_collection.json` está na branch `testes`.
- **Testes Manuais e Casos de Uso:** Foram documentados e executados casos de teste para validar a lógica do jogo, como o posicionamento de torres, o cálculo de dano e a lógica de vitória/derrota.
- **Tratamento de Casos Críticos:** O sistema foi projetado para lidar com falhas, como a indisponibilidade da API ou entradas inválidas do usuário, exibindo feedback claro sem interromper a experiência.

---

## 🔮 Roadmap de Futuras Implementações

Este projeto tem potencial para crescer. As próximas funcionalidades planejadas são:

- [ ] **Novas Torres e Inimigos:** Expandir a variedade estratégica do jogo.
- [ ] **Sistema de Upgrade:** Permitir que o jogador melhore as torres durante a partida.
- [ ] **Efeitos Sonoros e Música:** Adicionar uma camada de imersão auditiva.
- [ ] **Múltiplos Mapas:** Oferecer diferentes desafios e caminhos.
- [ ] **Animações e Efeitos Visuais:** Polir as animações de ataque, explosão e morte.
- [ ] **Salvar Progresso:** Implementar `localStorage` para salvar o jogo entre sessões.

---

## 🤝 Como Contribuir

Contribuições são sempre bem-vindas! Se você tem ideias para melhorar o projeto, siga os passos:

1.  **Faça um Fork** deste repositório.
2.  Crie uma nova branch (`git checkout -b feature/sua-feature`).
3.  Faça commit das suas alterações (`git commit -m 'Adicionando nova feature'`).
4.  Faça push para a branch (`git push origin feature/sua-feature`).
5.  Abra um **Pull Request**.

---

<div align="center">
## 👨‍💻 Autores

Este projeto foi desenvolvido com dedicação por:

| [<img src="https://avatars.githubusercontent.com/u/200134059?v=4" width=115><br><sub>Ismael Gomes (Rex)</sub>](https://github.com/Rex23jsl) | [<img src="https://avatars.githubusercontent.com/u/202681925?v=4" width=115><br><sub>Eduardo Monteiro</sub>](https://github.com/eduardominhom) |
| :-----------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                 [GitHub](https://github.com/Rex23js) <br/>                                                  |                                                   [GitHub](https://github.com/eduardominhom)                                                   |

---

</div>
## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Feito com ❤️ e muito café☕!</p>
</div>
