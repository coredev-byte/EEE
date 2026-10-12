# Distrito Zero — O Eco de Kharn

RPG de ação isométrico em pixel art. Explore Vila Pedralta, restaure as memórias da Margem, investigue O Selo Partido e enfrente Kharn nas Ruínas Esquecidas. A campanha segue para o Bairro da Ferrugem, com missões industriais e opcionais.

## Executar

Requer Node.js 22.12+ (validado com 24.19) e npm.

```sh
npm ci
npm run dev
```

O jogo e a capa ocupam toda a janela, sem cabeçalho, rodapé ou instruções de movimento na tela. As teclas aparecem somente nas habilidades e utilitários. O retrato mostra o busto da classe atual e os três ícones ao lado das barras foram removidos. Teclado, mouse e os botões continuam funcionando; os controles podem ser consultados nas configurações.

O Vite escuta na porta 5173. O jogo funciona inteiramente no navegador; não precisa de banco, conta, API ou credenciais. Fontes e sprites são locais. `npm run build` produz `dist/`; `npm run preview` serve esse resultado.

## Controles

| Ação                                         | Tecla                                |
| -------------------------------------------- | ------------------------------------ |
| Mover / correr                               | WASD / Shift + WASD                  |
| Ataque básico                                | Clique esquerdo; mouse aponta o alvo |
| Habilidades                                  | 1, 2, 3, 4                           |
| Vida / mana / elixir                         | Z, X, V                              |
| Conversar, abrir baú e interagir com o selo  | F                                    |
| Inventário / classes / habilidades / missões | I / C / K / J                        |
| Configurações / pausa                        | M / Esc                              |

WASD controla o movimento; as teclas 1–4 ativam habilidades, e Z/X/V usam poções. As duas primeiras habilidades começam desbloqueadas. Subir de nível concede pontos para a árvore: três especializações por classe, ativas, passivas, melhorias e conexões híbridas. Abra K, selecione um nó, aprenda e equipe em 1–4. Os menus pausam o mundo. Clicar em um item o equipa; o × remove o equipamento daquele espaço.

O diamante dourado no minimapa marca o objetivo atual. Encontre a entrada, derrote três ameaças e interaja com o selo usando F. Baús podem ser abertos uma vez e concedem moedas, uma poção e equipamentos. As quatro classes podem ser trocadas no painel C, preservando progressão e equipamento. Morrer oferece um retorno à vila, com custo de 25 moedas.

Depois de romper o selo, use F novamente para viajar à **Margem de Kharn**. Converse com Iria, derrote os vigias e afine os três marcos com F. Volte pelo selo ao sul e entregue as memórias à Guardiã de Pedralta. Depois da entrega, converse com Lenir em Pedralta: investigue o registro chamuscado, confronte Bizel e siga até a entrada isolada (25,6) na Margem. Nas **Ruínas Esquecidas**, resolva os prismas, prepare-se na fonte e enfrente Kharn em três fases. O desfecho de **O Selo Partido** libera a Estrada das Caldeiras (24,18) até Ferrugem. Saves anteriores que já avançaram conservam o acesso antigo e podem aceitar o capítulo com Lenir. Converse com Elcio, recupere componentes, restaure a bomba, leia o manifesto e enfrente o Mestre da Fornalha. Resgatar Nara e restaurar a passarela são missões opcionais. O diário (J) reúne as missões, estados, recompensas, registros e rastreamento; o minimapa revela áreas e indica passagens e objetivos. Região, encontros, baús e campanha são persistidos em save v4, com migração de v1/v2/v3 e cópia local dos saves antigos antes da primeira gravação. Veja [a expansão industrial](docs/EXPANSAO_IMPLEMENTACAO.md). Veja [a implementação das regiões](docs/REGIOES_IMPLEMENTACAO.md).

A HUD usa os moldes enviados em `HUD.JPG`, `MAPAA.PNG` e `MISSOES.PNG`: quadros dourados para itens e habilidades, retrato em losango, vida vermelha, mana azul, XP em faixa fina ciano, objetivos em lista e minimapa isométrico retangular. Os valores e marcadores acompanham o jogo real; a legenda abre no botão **?**. Veja [a implementação dos moldes](docs/HUD_REFERENCIA.md).

## Sistemas implementados

- Quatro regiões de 28 × 28 conectadas por passagens: Vila Pedralta, Margem de Kharn, Ruínas Esquecidas e Bairro da Ferrugem. Terrenos, pontos de interesse, encontros e descoberta próprios; câmera e colisões compartilhadas, canal com passagens e ordenação por posição dos pés.
- Sprites direcionais e frames próprios de idle, caminhada, preparação, ataque, recuperação, dano, magia e morte. Corrida acelera o ciclo de movimentação; interação usa os frames de gestos existentes.
- Bandidos e lobos com patrulha, linha de visão, perseguição por A*, ataque, recuperação, dano, morte e retorno à origem. Seis encontros únicos em Kharn e cinco autômatos em Ferrugem, incluindo o Mestre da Fornalha e o Sucateiro Voraz opcional. O Mestre entra em sobrecarga e sinaliza descargas de calor antes de atingir a área próxima.
- Capítulo I completo: investigação com Lenir, miniboss Bizel, masmorra com mecanismos, baús e atalho, apresentação de Kharn, três fases com ataques anunciados, desfecho e recompensa única. Checkpoint de arena, recuperação após morte, cenas puláveis, música por fase e compatibilidade com saves antigos. Veja [a implementação do capítulo](docs/KHARN_BOSS_IMPLEMENTACAO.md).
- Combate com alcance, cone, preparação, recuperação, proteção contra dano duplicado, invulnerabilidade temporária, projéteis e recargas.
- Guerreiro, Arcanista, Assassino e Atirador, com atributos e habilidades distintos: cortes, projéteis, investidas, explosões, defesa e cura.
- Objetivos com alvos reais, símbolos por ação, nome próximo e seta de direção que evita os painéis da HUD. Minimapa com orientação do jogador, objetivo ativo e legenda; o objetivo continua para O Selo Partido e Ferrugem após as memórias e encerra ao concluir a campanha industrial; secundárias podem ser rastreadas pelo diário. Máscaras locais de oclusão preservam personagem, ameaças e interativos sem alterar a ordem de profundidade. Casas das três regiões têm bases físicas retangulares, separadas dos sprites. Veja [visibilidade e objetivos](docs/VISIBILIDADE_IMPLEMENTACAO.md).
- HUD ligada ao estado real, minimapa dinâmico, poções e seis painéis. Inventário em três colunas seguindo a referência: personagem e equipamentos, mochila com filtros e detalhes do item. Selecione um item e use E para equipar/usar, C para comparar ou R para descartar com confirmação. Os equipamentos modificam atributos e os efeitos elementais; a arma é desenhada nos próprios frames de animação.
- Árvore com 180 nós principais, 36 melhorias, 12 conexões híbridas e 12 escolhas de Maestria. Nível máximo 60, 59 pontos por perfil de classe, quatro habilidades equipáveis e uma suprema. Builds, redistribuição por moeda e migração de saves antigos. Veja [as regras da árvore](docs/ARVORE_IMPLEMENTACAO.md).
- XP, níveis, pontos de habilidade, moedas, baús e missão com recompensa única. Reaparecimento distante dos inimigos permite continuar a progressão.
- Persistência v4 em localStorage: personagem, inventário, equipamentos, campanha, região atual, descoberta, posição/HP dos encontros e baús por região. Migração dos saves v1/v2/v3, com backup do formato anterior. Missões, passagens, chefes e mudanças no mundo também são persistidos. Salvamento a cada oito segundos e nas transações importantes; dados inválidos são recusados.
- Efeitos com 48 frames de sprites: corte, projétil, explosão, impacto, cura e dissipação de morte.

## Arquitetura

| Arquivo                                | Responsabilidade                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/main.ts`                          | Inicialização e inspeção de estado somente leitura para testes                       |
| `src/data.ts`                          | Classes, habilidades, itens e tempos de animação                                     |
| `src/world.ts`                         | Composição das regiões, projeção, terreno e colisões                                 |
| `src/regions.ts`, `src/navigation.ts`  | Campanha, conexões, progresso regional e rotas A*                                    |
| `src/missions.ts`, `src/mission-ui.ts` | Definições e eventos das missões, adaptação do legado, diário e diálogos industriais |
| `src/state.ts`                         | Entidades, atributos, equipamento e progressão                                       |
| `src/animation.ts`                     | Frames, direção e orientação                                                         |
| `src/combat.ts`                        | Preparação, acertos, recursos, projéteis e recompensas                               |
| `src/enemies.ts`                       | Máquina de estados, percepção, perseguição e retorno                                 |
| `src/game.ts`                          | Loop, coordenação, interação e missão                                                |
| `src/renderer.ts`, `src/occlusion.ts`  | Mundo, profundidade, sprites, iluminação, VFX e máscaras locais                      |
| `src/objectives.ts`, `src/minimap.ts`  | Símbolos, direção, posição real dos objetivos e minimapa                             |
| `src/ui.ts`                            | HUD e painéis conectados ao estado                                                   |
| `src/save.ts`                          | Serialização e validação de salvamentos                                              |
| `src/input.ts`, `src/audio.ts`         | Entrada e mixer central de áudio                                                     |

## Validar

```sh
npm test
npm run build
npm run test:e2e
```

Os testes de navegador usam Chromium instalado em `/usr/bin/chromium` neste ambiente. Em outra máquina, ajuste `launchOptions.executablePath` em `playwright.config.ts` para seu Chromium instalado. Os testes iniciam o Vite quando necessário. Não é preciso baixar outro navegador neste ambiente.

A suíte de lógica cobre projeção, colisões, animação, dano, alcance, recompensa única, mana, recarga, projéteis, defesa, IA, equipamento, XP, salvamentos inválidos, explosões, investida e cura. A suíte de navegador percorre o jogo com teclado e mouse, incluindo conclusão real da missão, recarga do salvamento, morte e retorno à vila. Capturas ficam em `artifacts/`.

## Direção visual e limites desta entrega

Leia [a documentação de arte](docs/ART.md) para atlas, pivôs e processamento. Os sprites foram produzidos com a ferramenta de imagens a partir das referências do usuário; não são os arquivos originais dessas referências, e não constituem uma reprodução exata pixel a pixel. A revisão humana de fidelidade visual ainda é necessária, sobretudo em silhuetas, materiais, detalhe do ambiente e continuidade de alguns frames gerados.

A campanha jogável mantém as missões de Pedralta/Margem, acrescenta O Selo Partido com Bizel e Kharn, e continua com Máquinas Mortas no capítulo II. São quatro regiões finitas conectadas, sem streaming. Jardim do Véu, Cidade Afogada, Cinzas e Distrito Zero são metadados futuros, sem mapas ou capítulos jogáveis nesta entrega. Bizel e Kharn têm encontros próprios. As ruínas usam plataformas com colisão plana; suas escadarias não acrescentam física em altura. Kharn e os objetos da masmorra usam atlas novos refinados com imagegen a partir de modelos em código, normalizados por pivôs nos pés. Ferrugem reutiliza os atlas de construções, com piso em tons de ferrugem e autômatos desenhados em pixel art por código. Elcio e Nara usam o sprite de NPC existente. A navegação usa A* com obstáculos estáticos; não inclui planejamento cooperativo entre criaturas. Casas e ruínas grandes usam bases retangulares; objetos menores conservam raios físicos. Os efeitos de iluminação são polígonos discretos e não uma simulação de sombras dinâmicas.

O áudio usa **55 arquivos locais sintetizados**, incluindo a ambiência mecânica de Ferrugem, mixer por categorias, manutenção/cancelamento por dono, coleta agrupada e música em três camadas. Em M, ajuste os volumes e mute, salvos neste navegador. As gravações e a trilha definitivas continuam pendentes; [a documentação de áudio](docs/AUDIO_IMPLEMENTACAO.md) descreve o que funciona, o inventário e a produção necessária. A interface se adapta a telas menores, mas a jogabilidade desta entrega usa teclado e mouse, sem controles de toque. Não há sincronização de progresso entre dispositivos.

A evolução estrutural está registrada em [docs/AUDITORIA_RPG.md](docs/AUDITORIA_RPG.md), com causas verificadas, sistemas preservados e critérios das próximas etapas. A primeira entrega estabelece coordenadas e pivôs compartilhados, ordem de profundidade incluindo efeitos, clique correto em tela cheia, minimapa separado e movimento com colisão em subpassos. Regiões conectadas, continuidade do capítulo II, árvore ramificada e mixer de áudio foram entregues em etapas posteriores. Variantes visuais ampliadas de equipamento, drops no chão e produção sonora final permanecem no roteiro.

A capa ocupa toda a janela e tem vento nos cabelos e tecidos, brilho oscilante da lua e combates decorativos nas pontes. A música temática original de 48 segundos começa após interação (botão ♫ na capa), respeita os volumes e mute do jogo e faz transição ao iniciar a jornada. A animação pausa em abas ocultas e respeita a preferência do sistema por movimento reduzido.

## Prólogo cinematográfico e tutorial narrativo

Uma nova jornada começa com **O Chamado**, em cenas dirigidas no mapa real de
Pedralta: silêncio, sinal do selo e despertar do personagem escolhido. Clique
em **Pular cena** ou pressione Enter para concluir a cena e devolver os controles.
Escape pausa inclusive a introdução. A preferência do sistema por movimento
reduzido desativa pans e zooms dirigidos; o som respeita o mixer e mute existentes.

O tutorial acompanha movimento, corrida, conversa com a Guardiã, exploração,
combate, habilidades 1/2, poções, baú, mochila, diário, classe e árvore. As dicas
são temporárias, reconhecem ações antecipadas e ficam registradas no diário J.
Não é preciso gastar consumíveis com os recursos completos, equipar algo pior
ou gastar pontos para conhecer a árvore. As três ameaças, o selo e a Memória de
Kharn usam a missão e as recompensas existentes. A campanha segue até a Margem,
a Guardiã e Ferrugem. O progresso narrativo é salvo no contrato v4; jornadas
antigas continuam normalmente e cenas interrompidas retomam de um ponto seguro.

O roteiro, os módulos, as condições de avanço, a compatibilidade e os resultados
de testes estão em [docs/PROLOGO_IMPLEMENTACAO.md](docs/PROLOGO_IMPLEMENTACAO.md).
O ritmo de 12–18 minutos é uma meta que ainda requer validação com jogadores.
