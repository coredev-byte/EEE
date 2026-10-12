# HUD conforme os moldes enviados

A interface atual usa as referências em `public/assets/interface/HUD.JPG`, `MAPAA.PNG` e `MISSOES.PNG`. As imagens originais ficam preservadas no repositório. As anotações explicativas dos moldes não são incorporadas à tela do jogo.

`HUD.JPG` orienta os quadros escuros com borda dourada fina, detalhes nos cantos, itens em pixel art, espaços vazios com sinal de adição e teclas abaixo da barra rápida. Inventário, equipamento, habilidades e atalhos compartilham esse acabamento. Seleção, comparação, uso, equipagem e recarga continuam ligados aos sistemas existentes; os ícones conservam o significado dos itens e poderes reais.

`MISSOES.PNG` orienta o retrato em losango, nível acima das barras, vida vermelha, mana azul, XP em faixa fina ciano e lista de objetivos com moldura dourada. O retrato é recortado da própria referência durante a renderização. Vida, mana, experiência e nível usam os valores reais do personagem. A missão rastreada mostra o objetivo ativo e até duas outras etapas, com estados concluído e pendente derivados do diário. No celular, a lista compacta conserva o objetivo atual para deixar o mundo e os atalhos acessíveis.

`MAPAA.PNG` orienta o minimapa retangular no canto superior direito, com moldura dourada e projeção isométrica. Terreno descoberto, construções, árvores, jogador, inimigos e objetivos usam as posições reais da região atual. `minimapIsoPoint`, em `src/spatial.ts`, compartilha a projeção entre os elementos. Os marcadores de campanha, descoberta e passagens mantêm as regras do jogo. A legenda abre em **?**; o atalho M continua reservado às configurações.

O título da capa usa a fonte pixelada local Press Start 2P. Os inimigos decorativos percorrem trajetórias medidas sobre o piso das duas pontes da imagem de fundo; a altura dos pés e das sombras acompanha a inclinação do caminho, inclusive no combate. Esses atores não alteram a campanha ou os salvamentos.

## Validação

`npm test`: 98 testes aprovados. `npm run build`: TypeScript e produção aprovados. Dez cenários Chromium selecionados verificaram inicialização, movimento, combate, inventário, comparação, equipamento, classes, persistência, recargas, poções, pausa, layouts menores, tela cheia, objetivos e minimapa. O caso de inventário foi atualizado para os 55 arquivos de áudio atuais e passou na reexecução. Os testes de geometria verificam o novo formato do mapa e o marcador de um inimigo vivo na projeção isométrica.

A revisão no Chromium também conferiu o título pixelado, a posição dos atores nas pontes, o retrato, barras visíveis com valores reais e abertura de inventário/habilidades em desktop e celular. Os acabamentos são componentes CSS e Canvas, para acompanhar o estado real do jogo, em vez de uma captura estática contendo números ou missões de exemplo.
