# Referências novas — diálogos, Kharn e Ruínas Esquecidas

## Fontes e aplicação

As três imagens adicionadas em `8900743` foram preservadas no repositório:

- `Diálogo nas Ruínas de Pedralta.png`: moldura inferior azul-escura/dourada,
  retrato à esquerda, plaqueta do nome e opções com destaque dourado.
- `NaasJ-a7KnN4sZ_rLvycgiEVGDGl5N1ikVuT5Jv2oy_eOmoEeMKuUfn3Z_XgNpTPvwFj_avXADoAC158JdPSfva9ECTSePy-tXEvNCbzjDJTSu6_y5tF3oyuBEm73ZyU5gZa3Wb88Y80xuk6d6Yq6ohfeBY-U5KscGsRnAM0L5J8CFQtXqMrTTBOwUokdAtP.jpg`: corpo de pedra largo, ombros maciços, fissuras ciano,
  dois condutores e lâmina larga recortada.
- `cMhiHb5JF-w6c3fOill7XyB3Lym72Mk48mX1eLuRhptY2GRCRSPiD0s4YixfKKHVZ73TOxCWfBFbYGyeoxCjkJ-totyhWSyb0pIB9x4JIyoTiwCaaBZhD9goFVL9VP6l3z2qruahNTQSo5gdh_X8VRu212w3TC5RuoKwC4vZsKYhtv9rjRhTqO55xof9jTbs.jpg`: plataformas suspensas, pilares antigos, pontes/escadarias,
  cristais azuis/violetas, arcos e círculos rúnicos dourados.

## Diálogos de todo o jogo

O mesmo acabamento aparece nas conversas de Pedralta, Margem de Kharn e
Ferrugem, e nas legendas do prólogo, Bizel, Kharn e seu desfecho. A camada
cinematográfica continua sendo o sequenciador existente.

`dialogue-frame.png` é uma moldura transparente redesenhada com imagegen a
partir da referência, aplicada por nove partes (`border-image`). O texto é
real, selecionável e acessível; as opções continuam ligadas às missões e
transações existentes. Mouse, setas e Enter selecionam as opções; Esc mantém
o fechamento anterior. Não foram substituídos os diálogos por imagens de texto.

Lenir usa o retrato da imagem enviada, recortado ao desenhar no navegador.
O Eco usa o sprite da classe atual; Kharn, Bizel e os NPCs usam seus atlas.
O retrato de Kharn acompanha a variante da fase. A narração usa um símbolo,
sem atribuir a fala a um personagem incorreto. Os nomes e textos não são
reescritos a cada frame, preservando a leitura das legendas por tecnologia
assistiva. Guardiã, Iria, Elcio e Nara conservam o sprite de NPC do jogo.

A nova apresentação é inferior, com fundo que permite ver o cenário, em vez
do antigo painel de diálogo central. Moldura, retrato e opções se adaptam à
largura móvel; textos industriais mais longos podem rolar dentro do painel.

## Kharn

O atlas foi redesenhado com imagegen usando tanto o atlas anterior quanto a
referência nova. O modelo ficou mais largo, com anatomia de golem, mãos e
ombros de pedra, fissuras e a lâmina larga da referência; não conserva a
silhueta estreita de cavaleiro do atlas anterior.

São 24 poses em oito colunas e três variantes de fase. Preparação, golpe,
caminhada, recuperação e queda permanecem ligados à IA real. A normalização
em `chapter-atlas.ts` registra os recortes e pontos de apoio. Cada célula em
execução tem 320 × 256 pixels, com pivô dos pés `(160,220)`. O PNG de origem
fica preservado, e a composição mantém transparência e limites entre poses.
Não foram alterados vida, dano, limiares, recompensas ou regras de Kharn.

## Planta e cenário

`ruins-map.ts` remodela os salões como plataformas arredondadas, com vestíbulo,
hub central, alas azul/violeta, corredores e arena com cantos recortados.
`ruins-scenery.ts` compõe pedra, faces verticais texturizadas, névoa no abismo,
círculos/estrelas rúnicos e os degraus dos corredores. Os tiles desenhados
correspondem às mesmas células físicas usadas para colisão. A grade visível
sobre o abismo foi retirada.

A porta da arena e o arco do Núcleo usam o atlas de arco monumental; cristais,
colunas, muralhas e fonte continuam sendo objetos com profundidade e oclusão.
Os pilares foram ajustados à nova borda das plataformas. A referência orienta
arquitetura e distribuição visual, mas a imagem não vira um fundo estático.
Prismas, passagem, fonte, inimigos, baús, objetivos e minimapa continuam reais.

Os IDs e posições das interações da campanha, as duas barreiras e o atalho
foram preservados. O save continua v4. Se uma posição da planta antiga cair
fora do novo piso ou dentro de uma estrutura, a montagem da região a ajusta
ao chão livre mais próximo, sem apagar itens, moedas, mecanismos ou eventos.
O checkpoint e o acesso a Ferrugem continuam funcionando.

As escadarias e a altura das ilhas são visuais: o motor mantém colisão plana,
sem adicionar salto ou física vertical. Não se afirma reprodução pixel a
pixel da referência.

## Validação

- `npm test`: 160 testes passaram em 12 arquivos.
- `npm run build`: TypeScript e build de produção passaram.
- `npm run test:e2e`: 49 testes passaram numa execução completa de 9,1 minutos em Chromium.

Os seis novos testes de navegador verificam os diálogos de Guardiã, Lenir,
Iria, Elcio e Nara em desktop e celular, retratos desenhados, ausência de
scroll horizontal, mundo pausado e escolha por setas/Enter ligada à missão.
O indicador dourado é decorativo e não altera os nomes acessíveis dos botões.
O teste novo de migração cobre uma posição da planta antiga que deixou de
ser piso, verificando chão seguro e preservação de inventário, moedas,
eventos e mecanismos.

A execução completa também confirmou Kharn com as quatro classes, o percurso
real pela planta remodelada, prismas, atalho, morte/retry, recompensa única,
recarga do save, continuidade em Ferrugem, comércio, prólogo, oclusão,
minimapa e os demais sistemas existentes.

## Capturas do jogo

- [Conversa com Lenir](../artifacts/reference-dialogue.png).
- [Conversa no celular](../artifacts/reference-dialogue-mobile.png).
- [Apresentação de Kharn](../artifacts/reference-kharn-intro.png).
- [Arena e luta](../artifacts/reference-kharn-fight.png).
- [Visão geral produzida pelo compositor do jogo](../artifacts/reference-ruins-overview.png).
