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

WASD controla o movimento; as teclas 1–4 ativam habilidades, e Z/X/V usam poções. As duas primeiras habilidades começam desbloqueadas. Subir de nível concede pontos para as demais. Os menus pausam o mundo. Clicar em um item o equipa; o × remove o equipamento daquele espaço.

O diamante dourado no minimapa é a entrada das ruínas. Encontre a entrada, derrote três ameaças e interaja com o selo usando F. Baús podem ser abertos uma vez e concedem moedas, uma poção e equipamentos. As quatro classes podem ser trocadas no painel C, preservando progressão e equipamento. Morrer oferece um retorno à vila, com custo de 25 moedas.

## Sistemas implementados

- Mundo 28 × 28, projeção isométrica, câmera acompanhando o jogador, colisões com obstáculos e ordenação por posição dos pés.
- Sprites direcionais e frames próprios de idle, caminhada, preparação, ataque, recuperação, dano, magia e morte. Corrida acelera o ciclo de movimentação; interação usa os frames de gestos existentes.
- Bandidos e lobos com patrulha, percepção, perseguição, ataque, recuperação, dano e morte.
- Combate com alcance, cone, preparação, recuperação, proteção contra dano duplicado, invulnerabilidade temporária, projéteis e recargas.
- Guerreiro, Arcanista, Assassino e Atirador, com atributos e habilidades distintos: cortes, projéteis, investidas, explosões, defesa e cura.
- HUD ligada ao estado real, minimapa dinâmico, poções e seis painéis. Inventário em três colunas seguindo a referência: personagem e equipamentos, mochila com filtros e detalhes do item. Selecione um item e use E para equipar/usar, C para comparar ou R para descartar com confirmação. Os equipamentos modificam atributos e os efeitos elementais; a arma é desenhada nos próprios frames de animação.
- XP, níveis, pontos de habilidade, moedas, baús e missão com recompensa única.
- Persistência versionada em localStorage: personagem, inventário, equipamentos, missão, inimigos derrotados e baús. Salvamento a cada oito segundos e nas transações importantes; dados inválidos são recusados.
- Efeitos com 48 frames de sprites: corte, projétil, explosão, impacto, cura e dissipação de morte.

## Arquitetura

| Arquivo                        | Responsabilidade                                               |
| ------------------------------ | -------------------------------------------------------------- |
| `src/main.ts`                  | Inicialização e inspeção de estado somente leitura para testes |
| `src/data.ts`                  | Classes, habilidades, itens e tempos de animação               |
| `src/world.ts`                 | Composição da vila, projeção, terreno e colisões               |
| `src/state.ts`                 | Entidades, atributos, equipamento e progressão                 |
| `src/animation.ts`             | Frames, direção e orientação                                   |
| `src/combat.ts`                | Preparação, acertos, recursos, projéteis e recompensas         |
| `src/enemies.ts`               | Máquina de estados e navegação local dos inimigos              |
| `src/game.ts`                  | Loop, coordenação, interação e missão                          |
| `src/renderer.ts`              | Mundo, profundidade, sprites, iluminação, VFX e minimapa       |
| `src/ui.ts`                    | HUD e painéis conectados ao estado                             |
| `src/save.ts`                  | Serialização e validação de salvamentos                        |
| `src/input.ts`, `src/audio.ts` | Entrada e áudio de desenvolvimento                             |

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

O primeiro capítulo e seus sistemas funcionam. A expansão para interiores das ruínas, novos capítulos e inimigos adicionais não está incluída. O selo conclui a missão inicial, sem carregar um segundo mapa. A navegação inimiga usa desvio local de obstáculos, não uma malha global de caminhos. Os efeitos de iluminação são polígonos discretos e não uma simulação de sombras dinâmicas.

O áudio é **temporário**, sintetizado, e está identificado no painel de configurações. A trilha e os efeitos definitivos não foram fornecidos; [o manifesto de áudio](public/assets/audio/manifest.json) documenta os pontos de substituição. A interface se adapta a telas menores, mas a jogabilidade desta entrega usa teclado e mouse, sem controles de toque. Não há sincronização de progresso entre dispositivos.

A evolução estrutural está registrada em [docs/AUDITORIA_RPG.md](docs/AUDITORIA_RPG.md), com causas verificadas, sistemas preservados e critérios das próximas etapas. A primeira entrega estabelece coordenadas e pivôs compartilhados, ordem de profundidade incluindo efeitos, clique correto em tela cheia, minimapa separado e movimento com colisão em subpassos. O mundo conectado, a árvore ramificada, variantes visuais de equipamento, drops e áudio final permanecem no roteiro.
