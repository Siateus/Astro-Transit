# Astro Transit

Protótipo em `Phaser 3 + TypeScript + React` focado em logística interestelar, despacho de contratos e navegação estratégica por mapa galáctico.

## Scripts

- `npm run dev`: sobe o ambiente de desenvolvimento com Vite
- `npm run build`: gera a build de produção

## Estrutura

- `src/game/scenes`: cenas Phaser
- `src/game/simulation`: regras de negócio e resolução do loop de jogo
- `src/game/session`: orquestração de estado de jogo e fachada da simulação
- `src/game/renderers`: renderização do mapa e HUD
- `src/game/controllers`: câmera, foco e input de navegação
- `src/game/world`: montagem do mundo a partir do mapa

## Direção da arquitetura

O projeto está sendo simplificado para manter:

- `Scene` como camada fina de integração com Phaser
- simulação desacoplada da renderização
- HUD orientado por view model
- bootstrap e configuração sem resíduos de template

## Roadmap

O histórico da refatoração implementada e os próximos passos planejados estão em [docs/refactoring-roadmap.md](/home/sia/Projetos/Astro-Transit/docs/refactoring-roadmap.md:1).
