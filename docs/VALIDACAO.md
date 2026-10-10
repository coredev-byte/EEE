# Validação da entrega

- Instalação repetida com `npm ci --no-audit --no-fund --cache /workspace/.npm`: concluída com lockfile preservado.
- `npm run build`: TypeScript e bundle de produção aprovados.
- `npm test`: 17 testes de lógica executados e aprovados.
- `npm run test:e2e`: 7 testes de Chromium executados e aprovados. A revisão do inventário verificou seleção, filtros, comparação, equipar/remover, atalhos E/C/R, descarte confirmado com persistência, uso de poções, abas e layout móvel.
- A missão inicial foi concluída por entrada real de teclado e mouse: combate, XP, desbloqueio, baú, equipamento, percurso até o portal, interação e recompensa. O reload confirmou persistência.
- Foram verificados quatro sentidos de movimento, animação durante o movimento, dano e morte, retorno à vila, recargas, poções, pausa, troca de classe, equipamento/remover, restauração do salvamento e redimensionamento.
- A primeira inicialização monitorada não apresentou exceções JavaScript. Vite respondeu HTTP 200 na porta 5173.
- Auditoria dos PNGs exportados: cada imagem contém no máximo 63 cores opacas, além da transparência. Fontes e assets são locais.
- Capturas em `artifacts/`: menu, gameplay, orientações, inventário, missão concluída, pausa, morte, tablet e mobile.

A comparação visual foi feita com as referências anexadas: composição do HUD, proporções adultas, lenço, cabelo, materiais, cenário isométrico e atlas. Isso não equivale a aprovação de reprodução exata. As diferenças e os refinamentos restantes estão em `ART.md`.

As instruções completas de instalação e início foram salvas nos campos `install_script` e `start_skill` do rascunho do ambiente. Esse salvamento não publica o ambiente. A publicação e a restauração em uma tarefa nova não foram executadas nem verificadas.
