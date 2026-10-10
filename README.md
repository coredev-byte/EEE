# Distrito Zero — O Eco de Kharn

RPG de ação isométrico em pixel art. O primeiro capítulo é jogável: explore Vila Pedralta, lute contra bandidos e lobos, encontre equipamentos e rompa o selo de Kharn.

## Executar

Requer Node.js 22.12+ (validado com 24.19) e npm.

```sh
npm ci
npm run dev
```

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

Depois de romper o selo, use F novamente para viajar à **Margem de Kharn**. Converse com Iria, derrote os vigias e afine os três marcos com F. Volte pelo selo ao sul e entregue as memórias à Guardiã de Pedralta. O diário (J) mostra ambos os capítulos; o minimapa revela áreas e indica passagens e objetivos. Região, encontros, baús e campanha são persistidos em save v3, com migração de v1/v2. Veja [a implementação das regiões](docs/REGIOES_IMPLEMENTACAO.md).

A HUD segue a referência metálica com detalhes em bronze: nível em losango, vida/coração vermelho, mana/gota azul, XP/estrela roxa, três atalhos e minimapa circular com legenda no botão **?**. Veja [o modelo aplicado e as capturas](docs/HUD_REFERENCIA.md).

## Sistemas implementados

- Duas regiões de 28 × 28 conectadas por selo interativo: Vila Pedralta e Margem de Kharn. Terrenos, pontos de interesse, encontros e descoberta próprios; câmera e colisões compartilhadas, canal com passagens e ordenação por posição dos pés.
- Sprites direcionais e frames próprios de idle, caminhada, preparação, ataque, recuperação, dano, magia e morte. Corrida acelera o ciclo de movimentação; interação usa os frames de gestos existentes.
- Bandidos e lobos com patrulha, linha de visão, perseguição por A*, ataque, recuperação, dano, morte e retorno à origem. Seis encontros únicos em Kharn, além dos inimigos da vila.
- Combate com alcance, cone, preparação, recuperação, proteção contra dano duplicado, invulnerabilidade temporária, projéteis e recargas.
- Guerreiro, Arcanista, Assassino e Atirador, com atributos e habilidades distintos: cortes, projéteis, investidas, explosões, defesa e cura.
- Objetivos com alvos reais, símbolos por ação, nome próximo e seta de direção que evita os painéis da HUD. Minimapa com orientação do jogador, objetivo ativo e legenda; destaques encerram ao concluir a campanha. Máscaras locais de oclusão preservam personagem, ameaças e interativos sem alterar a ordem de profundidade. Casas das duas regiões têm bases físicas retangulares, separadas dos sprites. Veja [visibilidade e objetivos](docs/VISIBILIDADE_IMPLEMENTACAO.md).
- HUD ligada ao estado real, minimapa dinâmico, poções e seis painéis. Inventário em três colunas seguindo a referência: personagem e equipamentos, mochila com filtros e detalhes do item. Selecione um item e use E para equipar/usar, C para comparar ou R para descartar com confirmação. Os equipamentos modificam atributos e os efeitos elementais; a arma é desenhada nos próprios frames de animação.
- Árvore com 180 nós principais, 36 melhorias, 12 conexões híbridas e 12 escolhas de Maestria. Nível máximo 60, 59 pontos por perfil de classe, quatro habilidades equipáveis e uma suprema. Builds, redistribuição por moeda e migração de saves antigos. Veja [as regras da árvore](docs/ARVORE_IMPLEMENTACAO.md).
- XP, níveis, pontos de habilidade, moedas, baús e missão com recompensa única. Reaparecimento distante dos inimigos permite continuar a progressão.
- Persistência v3 em localStorage: personagem, inventário, equipamentos, campanha, região atual, descoberta, posição/HP dos encontros e baús por região. Migração dos saves v1/v2. Salvamento a cada oito segundos e nas transações importantes; dados inválidos são recusados.
- Efeitos com 48 frames de sprites: corte, projétil, explosão, impacto, cura e dissipação de morte.

## Arquitetura

| Arquivo                               | Responsabilidade                                                |
| ------------------------------------- | --------------------------------------------------------------- |
| `src/main.ts`                         | Inicialização e inspeção de estado somente leitura para testes  |
| `src/data.ts`                         | Classes, habilidades, itens e tempos de animação                |
| `src/world.ts`                        | Composição das regiões, projeção, terreno e colisões            |
| `src/regions.ts`, `src/navigation.ts` | Campanha, conexões, progresso regional e rotas A*               |
| `src/state.ts`                        | Entidades, atributos, equipamento e progressão                  |
| `src/animation.ts`                    | Frames, direção e orientação                                    |
| `src/combat.ts`                       | Preparação, acertos, recursos, projéteis e recompensas          |
| `src/enemies.ts`                      | Máquina de estados, percepção, perseguição e retorno            |
| `src/game.ts`                         | Loop, coordenação, interação e missão                           |
| `src/renderer.ts`, `src/occlusion.ts` | Mundo, profundidade, sprites, iluminação, VFX e máscaras locais |
| `src/objectives.ts`, `src/minimap.ts` | Símbolos, direção, posição real dos objetivos e minimapa        |
| `src/ui.ts`                           | HUD e painéis conectados ao estado                              |
| `src/save.ts`                         | Serialização e validação de salvamentos                         |
| `src/input.ts`, `src/audio.ts`        | Entrada e mixer central de áudio                                |

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

A campanha tem dois capítulos e duas regiões finitas conectadas pelo selo. Não há mundo aberto contínuo, interiores ou terceiro capítulo. Kharn reutiliza os atlas existentes; Iria, bandidos e lobos não têm novos sprites exclusivos. A navegação usa A* com obstáculos estáticos; não inclui planejamento cooperativo entre criaturas. As construções antigas de Pedralta conservam colisões circulares, enquanto as grandes ruínas de Kharn usam footprints. Os efeitos de iluminação são polígonos discretos e não uma simulação de sombras dinâmicas.

O áudio usa **53 arquivos locais sintetizados**, mixer por categorias, manutenção/cancelamento por dono, coleta agrupada e música em três camadas. Em M, ajuste os volumes e mute, salvos neste navegador. As gravações e a trilha definitivas continuam pendentes; [a documentação de áudio](docs/AUDIO_IMPLEMENTACAO.md) descreve o que funciona, o inventário e a produção necessária. A interface se adapta a telas menores, mas a jogabilidade desta entrega usa teclado e mouse, sem controles de toque. Não há sincronização de progresso entre dispositivos.

A evolução estrutural está registrada em [docs/AUDITORIA_RPG.md](docs/AUDITORIA_RPG.md), com causas verificadas, sistemas preservados e critérios das próximas etapas. A primeira entrega estabelece coordenadas e pivôs compartilhados, ordem de profundidade incluindo efeitos, clique correto em tela cheia, minimapa separado e movimento com colisão em subpassos. Regiões conectadas, continuidade do capítulo II, árvore ramificada e mixer de áudio foram entregues em etapas posteriores. Variantes visuais ampliadas de equipamento, drops no chão e produção sonora final permanecem no roteiro.
