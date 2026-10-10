# Objetivos, minimapa e física dos cenários

Pedido preservado em [VISIBILIDADE_SOLICITADA.md](VISIBILIDADE_SOLICITADA.md). Base anterior: `9d3cad5`. Antes das alterações foram revisados mundo, renderer, pivôs/projeção, ordenação, navegação, missões, regiões, minimapa, HUD, persistência e testes existentes. A implementação usa o jogo atual e os atlas existentes.

## Objetivos

`Game.activeObjective()` resolve uma única prioridade a partir da etapa atual. Na primeira missão, o objetivo muda de descoberta da entrada para uma ameaça viva durante o combate e depois para abrir o selo. A posição do inimigo acompanha seu movimento. A campanha de Kharn indica primeiro a passagem da região atual, depois Iria, o vigia de cada marco, a estátua quando o vigia morre, a passagem de retorno e a Guardiã na entrega. Após a recompensa final, retorna `null`: o selo deixa de receber destaque de missão, embora continue sendo uma passagem utilizável.

As posições vêm dos objetos e atores do mundo. Nomes, alturas de marcador e tipo da ação acompanham esses alvos. O HUD distingue derrotar o vigia de afinar o marco; o renderer mostra um símbolo acima do alvo e, quando esse ponto está visível e o jogador está a menos de cinco unidades, o nome curto. Há desenhos próprios para conversa, investigação, coleta, combate, interação e deslocamento. Coleta é suportada pelo renderer, mas não foi inventada uma nova missão de coleta.

Fora da área visível, o indicador aponta para o alvo. Se sua posição coincide com os painéis da HUD, é deslocado para uma área livre, mantendo a seta na direção correta. Os limites são medidos e convertidos para os mesmos pixels lógicos do Canvas; `ResizeObserver` atualiza o cache após mudanças de layout/tamanho, sem medir todos os painéis por quadro. Os marcadores são desenhados depois da vinheta para conservar contraste, sem mover os sprites para uma camada superior.

## Minimapa

O minimapa recebe o mesmo objetivo ativo. Seu marcador dourado e símbolo são projetados por `minimapPoint`, usando coordenadas reais e tamanho da região. O jogador aparece como uma seta orientada: direções da câmera isométrica são convertidas para os eixos do mapa. Conexões permanecem ciano, com nome da região de destino e estado do selo. A legenda distingue jogador, objetivo e passagem. Descoberta regional, baús, NPCs, marcos e inimigos próximos continuam presentes.

O mapa atual mostra a região completa; descoberta oculta terreno desconhecido, sem impedir a indicação da missão. A rotina também limita objetivos externos à borda com indicação de direção, caso a área representada venha a mudar. Não existem missões secundárias ativas nem dados de andares na campanha atual; não foram acrescentados marcadores ou setas verticais fictícios.

## Oclusão e profundidade

A fila `paintWorld` continua ordenando cenário, jogador, inimigos, projéteis e efeitos pela posição dos pés. Não se desenha o jogador por cima das construções. `Occlusion` verifica apenas props visíveis: primeiro profundidade e sobreposição espacial, depois amostras do alpha real do frame nas áreas do corpo. Margens transparentes do atlas não ativam o efeito.

Quando um prop à frente cobre o jogador, uma máscara elíptica local revela seu corpo. A mesma lógica protege inimigos vivos em combate/próximos, o alvo ativo e NPCs/baús próximos. O alpha da máscara converge gradualmente, restaurando a imagem quando a sobreposição termina. Somente a área da máscara perde opacidade; telhado, fachada e outros pixels exteriores permanecem normais. Árvores, muros, ruínas, rochas e objetos usam o mesmo mecanismo. Imagens e alpha por frame são armazenados em cache; uma superfície auxiliar de 128 × 160 é reutilizada para os props afetados. A troca de região limpa as máscaras temporárias.

## Física e interação

O sprite completo usa frame/pivô/escala existentes. A base física permanece em coordenadas de mundo, independente da imagem. Todas as casas e ruínas grandes das duas regiões usam footprint retangular com meias dimensões 1,2 × 1,2; o teste círculo contra retângulo incorpora o raio do ator. Assim, telhados e margens transparentes não viram paredes, enquanto a base permanece sólida. Troncos, rochas e objetos menores conservam seus raios físicos definidos por tipo; água e perímetros visíveis conservam suas regras.

Movimento, A*, projéteis e recuperação de posição de saves utilizam essas bases compartilhadas. O movimento em subpassos e deslizamento não foi substituído. Um teste antigo que esperava parada no limite do círculo foi atualizado para exigir parada antes da base retangular e posição final livre: a faixa recém-liberada é uma alteração física intencional.

A interação continua tolerando alcance de 1,5 unidade e usando F. `World.canInteract` verifica o segmento de aproximação contra bases sólidas e o canal, impedindo abrir um baú ou falar através de uma parede. O próprio alvo é excluído desse bloqueio para permitir interagir com a sua superfície. HUD e ação usam a mesma consulta de proximidade.

## Arquivos alterados

| Arquivo                                                       | Alteração                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/objectives.ts`                                           | Tipos, ícones por ação, borda e posicionamento fora da HUD          |
| `src/game.ts`                                                 | Alvo real por etapa, marcador no renderer/snapshot, texto e alcance |
| `src/minimap.ts`                                              | Objetivo opcional, símbolos e orientação do jogador                 |
| `src/renderer.ts`, `src/occlusion.ts`                         | Alvos de visibilidade, máscaras graduais locais e marcador do mundo |
| `src/world.ts`                                                | Bases de casas nas duas regiões e verificação de interações         |
| `src/ui.ts`, `src/style.css`                                  | Legenda e limites responsivos da HUD                                |
| `tests/visibility.test.ts`, `tests/e2e/visibility.spec.ts`    | Regressões de objetivos, bases, máscaras, direção e layouts         |
| `tests/systems.test.ts`                                       | Expectativa de parada compatível com a nova base física             |
| `README.md`, `docs/AUDITORIA_RPG.md`, este relatório e pedido | Estado atual e decisões                                             |

## Validação

Regressão final aprovada: `npm test` passou com **82 testes**, `npm run test:e2e` passou com **25 cenários Chromium** e `npm run build` concluiu sem erros. `git diff --check` não encontrou erros de whitespace. Os testes novos verificam alvos em movimento, etapas/conclusão, passagem regional, bloqueio de interação por paredes, contorno das casas e posição livre. Os cenários Chromium medem pixels de máscaras reais, preservação fora da área necessária, aumento gradual do efeito, restauração completa e profundidade diante/atrás de casas, ruínas e outros tipos de prop. Incluem inimigo em combate e NPC alvo, movimento por WASD, indicação externa, minimapa real e ausência de destaque ao finalizar a campanha. A seta é verificada fora dos painéis nas larguras 1440, 800 e 390 pixels.

Evidências: `artifacts/occlusion-local.png`, `artifacts/objective-direction.png` e `artifacts/objectives-hud.png`. O teste anterior de projéteis atrás/diante de cenário opaco continua exigindo a ordenação correta; a campanha inteira de Kharn e a missão original continuam sendo executadas com teclado/mouse e saves legítimos.

## Limites atuais

- Não há interiores navegáveis, portas de casas utilizáveis, outro andar ou masmorra independente na versão atual. O selo entre Pedralta e Kharn é a entrada/transição real preservada. A expansão para os distritos e chefes da Bíblia Oficial continua sendo uma etapa narrativa e jogável futura.
- As bases são aproximações configuradas no mundo; não são extraídas automaticamente dos pixels da arte. Árvores, rochas e pequenos objetos continuam usando círculos. Os telhados não fazem parte dessas bases.
- A detecção de oclusão usa amostragem do alpha nas áreas corporais, com máscaras elípticas; não é uma segmentação automática de cada membro. A transição gradual conserva a imagem externa à área afetada, sem remover a estrutura inteira.
- Há um objetivo principal por vez; baús opcionais são pontos de interesse, sem destaque de missão inventado. Não foi criada uma campanha secundária para preencher ícones.
- Save permanece v3 e local. Os campos de objetivos e máscaras são derivados/temporários; não mudam o formato nem apagam inventário, builds ou campanha. Posições antigas dentro de uma nova base sólida são recuperadas pela normalização existente.
- Não foi realizado benchmark de FPS em hardware externo; cache, descarte de props fora da tela e limites de alvo evitam criar uma máscara por estrutura a cada quadro.
