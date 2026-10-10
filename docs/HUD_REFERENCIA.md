# HUD conforme a referência visual

Modelo enviado pelo usuário: retrato com moldura metálica em cantos cortados, nível em losango, vida vermelha com coração, mana azul com gota, XP roxo com estrela, atalhos verticais e minimapa circular. A referência orienta a HUD do jogo existente; os números da imagem não substituem os atributos reais do personagem.

A composição foi aplicada em `src/ui.ts` e `src/style.css`. O retrato conserva a arte do personagem existente. Molduras escuras, detalhes em bronze, barras com pontas angulares e medalhão acompanham o modelo. Inventário, missões e configurações abrem os painéis existentes pelos três botões. As versões de desktop e celular conservam espaço para o medalhão e evitam sobreposição com os ícones.

`src/hud-icons.ts` reúne os símbolos usados na HUD e na legenda: coração, gota, estrela, bolsa, pergaminho, engrenagem, setas, saída e inimigo. O jogador aparece azul, o objetivo principal dourado, as saídas verdes, as ameaças com caveira vermelha e os marcos não afinados roxos. O tipo da ação continua indicado pelo marcador do mundo; no minimapa, o objetivo usa a seta dourada dentro de um círculo. Não há objetivo secundário ou chefe acrescentado apenas para preencher a legenda.

O minimapa mostra a região completa dentro do mostrador circular. `minimapPadding` em `src/spatial.ts` calcula o espaço para acomodar os cantos e os marcadores sem cortá-los pelo círculo. `src/minimap.ts` usa essa mesma escala para terreno, jogador, encontros e objetivos. O dial inclui anéis, marcas de bússola e norte. A legenda abre no botão **?**, com descoberta/coordenadas e a passagem atual; tem rolagem em celular. A chave dos ícones da HUD também aparece em Como jogar.

O cache de limites da HUD e os indicadores de objetivo da entrega anterior continuam funcionando com o novo layout. O inventário mede o medalhão inteiro ao posicionar seu painel. Dados de vida, mana, XP, nível, missão, região e save permanecem derivados do jogo; o formato v3 não foi alterado.

## Validação

Regressão aprovada: `npm test` passou com **83 testes**, `npm run test:e2e` passou com **25 cenários Chromium** e `npm run build` concluiu sem erros. O ajuste final do símbolo de inimigo foi verificado novamente pelos cinco cenários de visibilidade e pelo build. `git diff --check` não encontrou erros de whitespace. A suíte de navegador foi ampliada para usar os três novos atalhos e capturar a HUD em desktop e celular. Os testes existentes continuam verificando objetivos em movimento, posição real no minimapa, direção fora da HUD nas três larguras, progressão, combate, inventário e reload. O teste espacial adicional confirma que todos os cantos e marcadores cabem no mapa circular em diferentes tamanhos.

Capturas: `artifacts/hud-reference.png` e `artifacts/hud-reference-mobile.png`.

Ajuste posterior solicitado: minimapa restaurado ao canto superior direito, a 2% da borda direita. A moldura e o canvas mantêm proporção 1:1 em desktop e celular, formando um círculo completo. A legenda abre abaixo do botão para permitir fechá-la sem sobreposição. Os cinco cenários de visibilidade passaram novamente, incluindo verificações geométricas do círculo e de sua posição, e o build foi aprovado.

## Limites

O retrato usa os sprites atuais, não o desenho de perfil novo da imagem enviada. O acabamento da moldura é criado com CSS, e os pictogramas são vetoriais com formas angulares, sem um novo atlas de interface desenhado à mão. A legenda exemplifica objetivo secundário e chefe, mas a campanha existente continua com um objetivo principal ativo e os encontros já implementados.
