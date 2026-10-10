# Etapa 2 — regiões e continuidade

Pedido: [REGIOES_SOLICITADAS.md](REGIOES_SOLICITADAS.md). Base: `8db46db`. Foram lidos a auditoria estrutural, a revisão solicitada, README e os sistemas de mundo, renderização, missão, áudio, IA, HUD e save antes da implementação. O projeto foi ampliado, mantendo classes, árvore, equipamentos, combate, inventário, sprites e mixer.

## Percurso jogável

1. Em Vila Pedralta, encontre o selo e derrote três ameaças como antes. A primeira interação com **F** entrega a recompensa inicial, uma única vez.
2. O selo torna-se uma passagem. Use **F novamente** para entrar na **Margem de Kharn**. Saves antigos com a missão concluída já podem atravessar; a recompensa inicial não é entregue outra vez.
3. Converse com **Iria, cartógrafa da Margem**, junto ao aqueduto sul, e aceite **As Memórias da Margem**.
4. Siga as estradas até os marcos da Vigia, do Canal e da Memória. Derrote o vigia vinculado a cada marco e use **F** junto à estátua para afiná-lo. Repetir a interação não aumenta o contador.
5. Depois dos três marcos, retorne pelo selo ao sul. Em Pedralta, converse com a Guardiã e entregue as memórias: **300 XP, 180 moedas e Olho de Kharn**. O equipamento é adicionado se ainda não estiver no inventário; moedas e XP são concedidos apenas uma vez.
6. As duas regiões continuam acessíveis. Baús, marcos, descoberta e encontros permanecem registrados após a volta e após recarregar.

A campanha atual tem dois capítulos finitos. O objetivo final informa que as memórias foram reunidas e permite continuar explorando; não há terceiro capítulo ou mundo aberto contínuo anunciado.

## Regiões e coordenadas

São duas regiões de 28 × 28, com coordenadas locais explícitas e uma conexão interativa bidirecional. A transição preserva HP/MP, nível, XP, moedas, inventário, equipamento, builds e recargas; posiciona o personagem numa chegada válida e concede uma proteção breve. Limpa projéteis, efeitos, estados temporários e sons pertencentes à cena anterior, troca terreno/objetos/inimigos e ajusta a câmera imediatamente. Não recria a campanha.

Pedralta mantém sua composição inicial. Kharn reutiliza os atlas existentes em uma composição própria: aqueduto com aberturas, canal não caminhável, passagens secas, estradas de pedra, ruínas, árvores mortas, marcos, lanternas, dois baús e seis encontros com HP próprio. As bordas têm muralhas/rochas visíveis; os limites de segurança ainda existem, com função de perímetro da região.

A mesma `World` define terreno, limites e colisões para jogador, IA e projéteis. As ruínas grandes de Kharn usam footprints retangulares com teste de círculo contra retângulo; Pedralta preserva os volumes circulares anteriores. Água impede movimento, mas não interrompe projéteis aéreos. Os objetos, atores e efeitos seguem a fila de profundidade existente, com pés e câmera no contrato espacial compartilhado. O nome de Iria e dos marcos é desenhado nos pontos de interesse.

## IA

`navigation.ts` implementa A* numa grade de meia célula, com clearance por raio, cache de obstáculos por região/raio, rejeição de diagonais que cortam cantos e checagem de segmentos. A suavização mantém somente segmentos totalmente livres. O movimento real continua usando subpassos e colisões; o caminho não teletransporta o inimigo.

A IA percebe com linha de visão, conserva perseguição por até quatro segundos sem visão e abandona alvos distantes/fora do raio de retorno. Replaneja após deslocamento do alvo, intervalo ou bloqueio, e retorna à origem por caminho válido. Ataques não atravessam paredes. Os passos acompanham deslocamento real e a direção acompanha o trecho percorrido.

As criaturas de Kharn são encontros únicos e permanecem derrotadas; os inimigos de Pedralta conservam o reaparecimento distante existente para progressão. Matar em Kharn não altera o contador da primeira missão; os desafios da árvore continuam contando mortes globais.

## HUD, minimapa e áudio

A HUD mostra região, capítulo e objetivo atuais. O diário mantém a primeira missão concluída e acrescenta o capítulo II com entrada, conversa, três marcos e entrega. O minimapa utiliza o tamanho/coordenadas da região, revela células próximas, conserva descoberta separada por região, mostra conexão, personagens/baús e marcos; destaca o objetivo atual. Pode orientar o jogador a pontos de missão ainda não visitados.

Kharn usa o soundscape de ruínas do mixer existente, enquanto música e combate seguem seus estados reais. Descoberta, conversa, aceitação, marcos e conclusão acionam eventos já entregues no sistema de áudio; não foram inventados novos arquivos, vozes ou uma trilha final.

## Persistência e migração

A chave `distrito-zero:v1` é mantida para encontrar o save existente; o formato passa a **v3**. O estado inclui região atual, posição do personagem, campanha, baús/mortes/descoberta por região e HP/posição/estado de recompensa dos encontros. Campos antigos `opened`/`killed` continuam presentes, espelhando a região ativa.

Saves v1 e v2 são migrados para Pedralta, preservando missão inicial, recompensas, itens, equipamento, perfis de habilidade e progresso anterior. A migração de árvore v1 continua funcionando. Uma posição dentro de obstáculo é deslocada para o ponto livre mais próximo, sem apagar o personagem. Região desconhecida, acesso a Kharn antes do selo, marcos desconhecidos/repetidos, recompensa de campanha incompleta e encontros inválidos são recusados.

Salvar ocorre nas transições e ações de campanha, além do autosave existente. Durante uma troca, a região anterior é capturada antes de montar a próxima. Recarregar mantém encontros mortos e feridos, baús abertos e objetivos afinados; ataques/rotas temporários não são serializados.

## Arquivos

| Arquivos                                                               | Responsabilidade                                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/regions.ts`                                                       | Identidades, conexões, campanha, marcos, progresso regional e encontros de Kharn                        |
| `src/world.ts`                                                         | Composição das duas áreas, perímetros, footprints, água, descoberta, segmentos e recuperação de posição |
| `src/navigation.ts`, `src/enemies.ts`, `src/state.ts`                  | A*, rotas, percepção/perseguição/retorno e dados temporários de navegação                               |
| `src/game.ts`, `src/combat.ts`                                         | Transições, campanha, interações, recompensas e contador de mortes por missão                           |
| `src/save.ts`                                                          | Save v3, validação e migração de v1/v2                                                                  |
| `src/renderer.ts`                                                      | Reconstrução do piso, câmera e nomes regionais sem alterar os atlas                                     |
| `src/minimap.ts`, `src/ui.ts`, `src/style.css`                         | Descoberta, conexões, objetivos, diálogos e diário regional                                             |
| `tests/regions.test.ts`, `tests/e2e/regions.spec.ts`                   | Novos testes de regiões, navegação, campanha e persistência                                             |
| `tests/skills.test.ts`, `tests/e2e/game.spec.ts`                       | Migração para v3 e travessia após concluir a missão inicial                                             |
| `README.md`, `docs/AUDITORIA_RPG.md`, este relatório e pedido original | Estado real da entrega e limitações                                                                     |

## Validação

Regressão final aprovada: `npm test` passou com **74 testes**, `npm run test:e2e` passou com **20 cenários Chromium** e `npm run build` concluiu sem erros. Também passaram os **6 testes Python** de áudio e frames de sprite. `git diff --check` não encontrou erros de whitespace. As capturas da nova região e do diário estão em `artifacts/kharn-region.png` e `artifacts/kharn-campaign.png`.

Os testes de lógica incluem todas as passagens/POIs alcançáveis, footprints/água, caminhos bloqueados, contorno por IA real, abandono e retorno, migração v1/v2, encontros feridos, transações e recompensa única.

Os cenários Chromium incluem conclusão da missão inicial e ida/volta, além da campanha inteira iniciada de um save v2 legítimo: entrada, conversa, marcos após combates reais, baú, reload em Kharn, retorno, entrega e reload sem recompensa duplicada. Só são usados controles e leitura do snapshot; não há comandos de debug para concluir objetivos.

## Limitações restantes

- Duas regiões finitas ligadas por selo, sem streaming contínuo, interiores ou um terceiro capítulo.
- Atlas reutilizados para ruínas, inimigos e personagens; Iria usa o atlas de Arcanista, sem sprite exclusivo. Não foram acrescentadas classes de inimigos nem um chefe.
- Pedralta conserva colisões circulares aproximadas em construções; footprints foram aplicados às grandes ruínas novas.
- Navegação considera obstáculos estáticos. Não há reserva cooperativa de células nem colisão física entre criaturas.
- Campanha entregue com três objetivos de combate/interação, sem escolhas narrativas ramificadas ou dublagem.
- Descoberta é por proximidade, sem oclusão visual de fog por paredes. A água tem colisão e visual, sem simulação física.
- Salvamento continua local no navegador, sem sincronização entre dispositivos; controles continuam teclado e mouse.
- Personalização visual ampliada de equipamentos e áudio definitivo permanecem nas próximas etapas.
