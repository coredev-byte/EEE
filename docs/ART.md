# Arte, escala e animação

## Escala escolhida

Resolução lógica: **960 × 540**. Diamante do terreno: **80 × 40** pixels. Frames de personagem e inimigos: **96 × 112**, origem no centro dos pés em **(48, 108)**. O protagonista visível tem aproximadamente 70–85 pixels de altura, dependendo da pose, e proporção adulta. A anotação 16 × 32 das referências foi tratada como escala lógica, não como tamanho final do sprite: essa redução perderia cabelo, lenço, bolsas e materiais. A referência de 92 px orientou a escala do conjunto, sem definir universalmente todos os elementos.

O Canvas desativa `imageSmoothingEnabled` e arredonda coordenadas de renderização. A apresentação CSS usa `image-rendering: pixelated`. Sprites do protagonista são renderizados em escala lógica 1:1. O layout responsivo pode usar ampliação física fracionária nearest-neighbor quando a tela não comporta escala inteira. Objetos maiores e alguns efeitos também usam redimensionamento nearest-neighbor. Não se aplica interpolação bilinear.

Os atlases exportados compartilham **63 cores de materiais e transparência**. A paleta é extraída das ilustrações e aplicada sem dithering. Contornos e sombreamento vêm dos assets, não de retângulos desenhados no renderer.

## Atlas

| Caminho em `public/assets/`          | Organização                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `characters/hero.png`                | 12 colunas × 4 linhas; frente, direita, costas e esquerda                                                           |
| `characters/{classe}.png`            | 12 frames de perfil para cada outra classe                                                                          |
| `characters/{classe}-directions.png` | 12 frames; frente 0–3, costas 4–7, direita 8–11                                                                     |
| `characters/{classe}-combat.png`     | 6 colunas × 4 direções; preparação, ataque, recuperação, dano, conjuração, morte                                    |
| `enemies/enemies.png`                | 6 colunas × 2 linhas; bandido e lobo                                                                                |
| `scenery/props.png`                  | 12 objetos; casa, casa arruinada, portal, muro, árvore, árvore seca, pinheiro, rochas, lanterna, barris, caixa, baú |
| `scenery/tiles.png`                  | 12 tiles 80 × 40                                                                                                    |
| `objects/objects.png`                | Banco, cerca de madeira, fonte e estátua; células 128 × 160                                                         |
| `icons/icons.png`                    | 12 ícones 48 × 48                                                                                                   |
| `effects/effects.png`                | 8 frames × 6 efeitos; células 128 × 128                                                                             |
| `animations/manifest.json`           | Pivôs e índices básicos                                                                                             |
| `spritesheets/source-*.png`          | Folhas geradas originais para auditoria/reexportação                                                                |

O protagonista usa frames 0–1 para idle, 2–5 para caminhada, 6–8 para ataque, 9 para dano, 10 para conjuração e 11 para morte. Tempos estão em `src/data.ts`: idle 1,1s, caminhada 0,52s, ataque 0,48s, dano 0,24s, conjuração 0,55s e morte 0,7s. As classes têm folhas próprias de combate e locomação. Para a orientação esquerda, os perfis e frames específicos são usados; somente espelhamento de perfil é empregado quando necessário, sem inventar vistas laterais a partir de um sprite frontal.

A corrida reutiliza os frames de caminhada, com deslocamento e cadência acelerados. A interação reutiliza frames de gesto; uma sequência artística exclusiva de abrir baús ainda seria um refinamento. O corpo não é deformado nem movido verticalmente para fingir caminhada. O movimento vem de frames articulados. A colisão usa a posição dos pés e um raio de 0,22 unidades de mundo; obstáculos usam volumes próprios.

## Produção dos assets

A ferramenta de imagem gerou folhas seguindo as imagens anexadas, com fundo chromakey. `scripts/compile_assets.py` faz recorte, remoção do chromakey, ajuste nearest-neighbor, alinhamento dos pivôs e quantização. As coordenadas de recorte foram examinadas nos arquivos gerados; as folhas não seguem todas as dimensões pedidas perfeitamente, por isso os limites de linha são explícitos no script.

Os PNGs exportados estão versionáveis e são carregados diretamente; executar o compilador não é requisito para desenvolver ou publicar. Para reexportar, Python e Pillow são necessários. Os originais preservados em `public/assets/spritesheets` permitem reexportação em outra máquina.

## Revisão visual

Capturas do navegador em `artifacts/` permitem comparar menu, cena jogável, inventário, morte, telas menores e missão concluída. A composição mantém HUD superior esquerda, localização e objetivo abaixo, minimapa superior direita, QWER inferior esquerda e poções inferior direita.

As imagens de referência são a direção obrigatória, mas os PNGs gerados são uma aproximação: existe repetição de peças ambientais, diferença de texturas e iluminação e alguma variação de anatomia entre frames. A cena foi revisada para remover resíduos magenta, preservar direções reais e manter proporções legíveis. A aprovação de fidelidade exata não foi afirmada.
