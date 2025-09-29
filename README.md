Tower Defense - Projeto Acadêmico 🕹️
Bem-vindo ao Tower Defense Acadêmico, um jogo construído com tecnologias web puras que demonstra uma arquitetura de software robusta, integração com APIs externas para funcionalidades dinâmicas e uma interface reativa. Esta versão evoluiu de um conceito simples para um jogo completo e polido.

📖 Índice
Visão Geral e Justificativa

Funcionalidades Implementadas

Arquitetura do Jogo

Sistema de Clima Dinâmico

Tecnologias Utilizadas

APIs e Integrações

Estrutura do Projeto

Como Executar o Projeto

Roadmap de Futuras Implementações

Como Contribuir

Autores

Licença

1. Visão Geral e Justificativa
Visão Geral: O "Tower Defense Acadêmico" é um jogo de estratégia em que o jogador deve posicionar torres para impedir que ondas de inimigos cheguem ao final de um caminho. O projeto foi desenvolvido como uma Single Page Application (SPA), integrando dados de uma API local para o gameplay e uma API externa para simular condições climáticas que afetam a partida em tempo real.

Justificativa: Este projeto foi escolhido pela oportunidade de enfrentar desafios técnicos abrangentes, como a criação de um motor de jogo do zero usando a Canvas API, o desenvolvimento de uma arquitetura modular e desacoplada em JavaScript puro, a integração de múltiplas APIs e a implementação de um sistema de eventos para gerenciar o estado do jogo de forma eficiente.

2. Funcionalidades Implementadas
A versão atual do projeto é rica em funcionalidades que criam uma experiência de jogo completa e dinâmica:

Sistema de Ondas Avançado: 12 ondas de inimigos com dificuldade progressiva, carregadas dinamicamente via API local, com recompensas em ouro por onda concluída.

Arsenal de Torres Estratégicas: 6 tipos de torres com custos, habilidades e propósitos únicos (Básica, Perfurante, Dano em Área, Lentidão, Antiaérea e "Boss Killer"), permitindo diversas estratégias.

Inimigos Variados: 5 tipos de inimigos, incluindo um "Boss" desafiador, cada um com diferentes atributos de vida, velocidade e recompensas.

Sistema de Clima Dinâmico em Tempo Real:

Consome a API Open-Meteo para buscar as condições climáticas atuais.

Renderiza efeitos visuais de chuva, neblina e tempestade com um sistema de partículas no canvas.

O clima impacta a jogabilidade, aplicando debuffs (redução de alcance e cadência de tiro) nas torres.

Interface de Usuário (UI) Reativa:

A UI é desacoplada da lógica do jogo e reage a eventos emitidos pelo WaveManager.

A seleção de torres é gerada dinamicamente a partir do arquivo game-config.js, tornando o jogo facilmente extensível.

Single Page Application (SPA): Navegação fluida entre as telas de "Home", "Jogo" e "Vitória" sem a necessidade de recarregar a página, utilizando um sistema de roteamento baseado em hash.

Modo Desenvolvedor: Um painel de depuração oculto pode ser ativado para permitir que o desenvolvedor teste manualmente os diferentes efeitos climáticos e seu impacto no jogo.

Design Responsivo: A interface se ajusta para garantir a jogabilidade em diferentes tamanhos de tela.

3. Arquitetura do Jogo
O projeto foi estruturado de forma modular para garantir a separação de responsabilidades (SoC), facilitando a manutenção e a escalabilidade.

main.js: Ponto de Entrada (Controller): Gerencia o roteamento da SPA, o ciclo de vida da instância do jogo (criação e destruição) e a lógica do modal de configurações.

engine.js: Motor do Jogo (Core): Contém o game loop, a lógica de renderização no canvas, o gerenciamento de entidades (torres, inimigos, projéteis), a detecção de colisão e o processamento do sistema de clima.

wave-manager.js: Gerenciador de Estado: Controla o fluxo das ondas, o estado do jogo (jogando, pausado, vitória) e emite eventos para a UI, garantindo baixo acoplamento.

ui.js: Camada de Visualização (View): Manipula todos os elementos do DOM, escuta os eventos do WaveManager para atualizar informações (vidas, ouro, onda atual) e lida com a interação do usuário.

entities.js: Modelos de Dados: Define as classes Tower e Enemy com toda a sua lógica de comportamento, como atacar, mover e receber dano.

game-config.js: Arquivo de Configuração: Centraliza todas as variáveis de balanceamento, permitindo ajustes fáceis sem alterar a lógica do código.

api.js: Camada de Serviço: Abstrai a comunicação com as APIs, tratando das requisições e normalizando as respostas.

4. Sistema de Clima Dinâmico
Esta é uma das funcionalidades mais inovadoras do projeto. A integração com a API Open-Meteo adiciona uma camada imprevisível e estratégica ao jogo.

Coleta de Dados: Ao iniciar uma partida, o engine.js faz uma chamada à API para obter as condições climáticas em tempo real. Um wrapper safeGetWeather garante que o jogo não quebre se a API falhar, usando um clima padrão como fallback.

Efeitos Visuais: Um sistema de partículas renderiza efeitos de chuva ou neblina diretamente no canvas, criando uma imersão visual.

Impacto na Jogabilidade: O clima aplica debuffs que alteram a eficácia das torres:

Neblina: Reduz o alcance de todas as torres.

Chuva/Tempestade: Reduz a cadência de tiro (velocidade de ataque).

5. Tecnologias Utilizadas
Frontend: HTML5, CSS3, JavaScript (ES6+)

Bibliotecas: Nenhuma! O projeto foi construído em "Vanilla JS" para focar nos fundamentos.

API Gráfica: Canvas API para toda a renderização do jogo.

Backend (Mock): JSON Server para simular uma API REST local.

Ferramentas: Git, GitHub, VS Code, Live Server.

6. APIs e Integrações
The Tower Defense API (Local):

Fonte: json-server servindo o arquivo db.json.

Uso: Fornece os dados de configuração das 12 ondas de inimigos.

Open-Meteo API (Externa):

Fonte: https://api.open-meteo.com/

Uso: Obtém o código do clima (weathercode) para aplicar efeitos visuais e de jogabilidade.

7. Estrutura do Projeto
/tower-defense-game
|-- css/
|   |-- style.css
|-- js/
|   |-- api.js
|   |-- engine.js
|   |-- entities.js
|   |-- game-config.js
|   |-- main.js
|   |-- ui.js
|   |-- wave-manager.js
|-- index.html
|-- db.json
|-- README.md
8. Como Executar o Projeto
Pré-requisitos:

Node.js e npm.

Live Server (extensão para VS Code) ou similar.

Passos:

Clone o repositório:

Bash

git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
Inicie a API local:
Em um terminal, execute o json-server para servir os dados das ondas.

Bash

npx json-server --watch db.json
O servidor estará rodando em http://localhost:3000.

Abra o jogo no navegador:
Com o json-server rodando, clique com o botão direito no arquivo index.html e selecione "Open with Live Server".

9. Roadmap de Futuras Implementações
[ ] Sistema de pontuação e ranking (salvando na API local).

[ ] Efeitos sonoros para torres, inimigos e interface.

[ ] Sistema de upgrade para as torres durante o jogo.

[ ] Múltiplos mapas com diferentes caminhos.

[ ] Mais tipos de torres e inimigos para aumentar a complexidade estratégica.

10. Como Contribuir
Para aprimorar o projeto, siga os passos:

Faça um Fork deste repositório.

Crie uma nova branch (git checkout -b feature/sua-feature).

Faça commit das suas alterações (git commit -m 'Adicionando nova feature').

Faça push para a branch (git push origin feature/sua-feature).

Abra um Pull Request.

11. Autores
<div align="center">
Este projeto foi desenvolvido com dedicação por:

<img src="https://avatars.githubusercontent.com/u/200134059?v=4" width=115> <sub>Ismael Gomes (Rex)</sub>	<img src="https://avatars.githubusercontent.com/u/202681925?v=4" width=115> <sub>Eduardo Monteiro</sub>
GitHub	GitHub

EXPORTAR PARA AS PLANILHAS
</div>

12. Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

<div align="center">
<p>Feito com ❤️ e muito café ☕!</p>
</div>
