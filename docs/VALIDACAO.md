# Validação da entrega

- Instalação repetida com `npm ci --no-audit --no-fund --cache /workspace/.npm`: concluída com lockfile preservado.
- `npm run build`: TypeScript e bundle de produção aprovados.
- `npm test`: 18 testes de lógica e renderização executados e aprovados.
- `npm run test:e2e`: 7 testes de Chromium executados e aprovados. A revisão do inventário verificou seleção, filtros, comparação, equipar/remover, atalhos E/C/R, descarte confirmado com persistência, uso de poções, abas e layout móvel.
- A missão inicial foi concluída por entrada real de teclado e mouse: combate, XP, desbloqueio, baú, equipamento, percurso até o portal, interação e recompensa. O reload confirmou persistência.
- Foram verificados quatro sentidos de movimento, animação durante o movimento, dano e morte, retorno à vila, recargas, poções, pausa, troca de classe, equipamento/remover, restauração do salvamento e redimensionamento.
- A primeira inicialização monitorada não apresentou exceções JavaScript. Vite respondeu HTTP 200 na porta 5173.
- Auditoria dos PNGs exportados: cada imagem contém no máximo 63 cores opacas, além da transparência. Fontes e assets são locais.
- Capturas em `artifacts/`: menu, gameplay, orientações, inventário, missão concluída, pausa, morte, tablet e mobile.

A comparação visual foi feita com as referências anexadas: composição do HUD, proporções adultas, lenço, cabelo, materiais, cenário isométrico e atlas. Isso não equivale a aprovação de reprodução exata. As diferenças e os refinamentos restantes estão em `ART.md`.

As instruções completas de instalação e início foram salvas nos campos `install_script` e `start_skill` do rascunho do ambiente. Esse salvamento não publica o ambiente. A publicação e a restauração em uma tarefa nova não foram executadas nem verificadas.

A remoção da arma sobreposta foi verificada nas quatro classes, quatro direções e ações de repouso, caminhada, ataque, conjuração, dano e morte. A captura `artifacts/player-without-overlay.png` mostra a renderização sem o cilindro; partículas elementais e o indicador de proteção continuam funcionando.
