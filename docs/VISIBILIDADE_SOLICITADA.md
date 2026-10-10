# DISTRITO ZERO — CORREÇÃO DE OBJETIVOS, MINIMAPA E FÍSICA DE CENÁRIOS

Analise o repositório atual antes de modificar qualquer código. Implemente as melhorias abaixo diretamente nos sistemas existentes, preservando a movimentação, o combate, o mapa, as missões, os sprites, o salvamento e a identidade visual do jogo.

O objetivo é deixar a exploração clara e funcional, sem esconder o jogador ou os objetivos atrás de construções.

## 1. Objetivos claros e visíveis

Todo objetivo ativo da missão deve ter uma indicação visual clara no mundo.

- Adicione um marcador acima do local ou personagem relacionado ao objetivo.
- Use um ícone próprio para cada tipo de objetivo: falar com personagem, investigar, coletar item, derrotar inimigo, interagir com objeto ou chegar a um local.
- Mostre o nome curto do objetivo quando o jogador estiver próximo.
- Mantenha o objetivo atual destacado no HUD, com texto simples e direto.
- Atualize o marcador automaticamente quando o objetivo for concluído ou a missão avançar.
- Evite mostrar marcadores de objetivos já concluídos, exceto quando forem necessários para uma missão ativa.
- Quando o objetivo estiver fora da tela, mostre uma indicação discreta na borda da tela apontando para a direção correta.
- Não encha a tela com marcadores desnecessários. A prioridade é sempre o objetivo ativo da missão.

O jogador precisa entender rapidamente o que fazer e para onde ir, sem depender de tentativa e erro.

## 2. Indicadores no minimapa

O minimapa deve mostrar a localização do jogador e a posição do objetivo ativo.

Implemente:

- Um marcador destacado para o objetivo principal.
- Ícones menores para objetivos secundários ativos, quando necessário.
- Um indicador da posição e orientação do jogador.
- Atualização dos marcadores conforme o jogador se movimenta.
- Indicadores de saída, passagem importante, entrada de masmorra e transição entre regiões.
- Uma indicação de direção quando o objetivo estiver fora da área visível do minimapa.
- Uma legenda simples e discreta para os ícones.

O marcador deve corresponder à posição real do objetivo no mapa. Não use posições fixas ou aproximadas apenas para fazer o ícone aparecer.

Se o objetivo estiver dentro de uma construção ou em outro andar, represente isso visualmente com um símbolo secundário, como uma seta para cima ou para baixo, quando o jogo tiver essa informação.

## 3. Objetivos nunca devem ficar escondidos atrás de construções

Corrija a visibilidade do personagem e dos elementos importantes do jogo.

O personagem não pode desaparecer completamente atrás de casas, paredes, árvores, torres ou outras estruturas enquanto estiver sendo controlado.

Implemente uma solução consistente com a câmera isométrica atual:

- Quando uma construção bloquear a visão do jogador, torne transparente a parte da estrutura que está encobrindo o personagem.
- Use transparência gradual, máscara de oclusão ou outra técnica adequada à arquitetura existente.
- Faça a estrutura voltar à opacidade normal quando deixar de bloquear a visão.
- Preserve a aparência das estruturas que não interferem na visibilidade.
- Evite transparência piscando, mudanças bruscas de opacidade ou estruturas desaparecendo por inteiro sem necessidade.
- Dê prioridade à visibilidade do jogador, dos inimigos em combate e do objetivo ativo.

Quando possível, aplique a mesma lógica a NPCs importantes, itens de missão e objetos interativos.

**Importante:** não resolva isso simplesmente desenhando o jogador sempre por cima de tudo. A ordem de profundidade precisa continuar funcionando para árvores, paredes, inimigos, objetos e construções. A transparência deve ser ativada quando houver uma oclusão real.

## 4. Física e colisão atrás das estruturas

Revise a física das construções para que o personagem possa caminhar atrás delas sem atravessar suas partes sólidas.

O problema deve ser resolvido pela separação correta entre aparência visual e área física.

Implemente:

- Áreas de colisão independentes dos sprites das construções.
- Colisões alinhadas com a base física dos objetos, e não com toda a imagem retangular do sprite.
- Paredes e partes sólidas que bloqueiem o movimento de maneira coerente.
- Espaços livres atrás, ao lado e entre construções, quando o cenário visual indicar que é possível passar por eles.
- Colisão correta com árvores, muros, rochas, móveis e demais objetos que realmente bloqueiam o caminho.
- Ajuste de profundidade de desenho para que o personagem apareça atrás ou à frente das estruturas conforme sua posição no espaço.
- Compatibilidade com as coordenadas isométricas e com o sistema de movimentação atual.

Não crie uma parede invisível ao redor de toda a construção se o jogador deveria conseguir contorná-la.

Não use o tamanho completo da imagem como colisão quando a estrutura tiver áreas transparentes ou partes elevadas sem contato com o chão.

## 5. Separar base física e parte visual

Sempre que a arquitetura do jogo permitir, cada estrutura deve ter:

1. **Sprite visual:** a imagem completa da construção.
2. **Base física:** a área que realmente bloqueia o movimento.
3. **Ponto de profundidade:** a posição usada para decidir se o personagem deve ser desenhado à frente ou atrás.
4. **Área de oclusão:** a região que pode ficar transparente quando encobrir o jogador.
5. **Área de interação:** quando a estrutura tiver portas, baús, mecanismos ou outros elementos interativos.

Não é necessário que todos os objetos tenham os cinco elementos. Use apenas os que fizerem sentido para cada tipo de objeto.

Não redesenhe todo o sistema se já existirem estruturas ou dados equivalentes. Reaproveite os componentes atuais e centralize a lógica quando isso reduzir erros.

## 6. Interações e objetivos atrás de portas ou dentro de construções

Quando uma missão exigir que o jogador entre em uma casa, ruína ou edifício:

- Indique a entrada correta no minimapa.
- Mostre um marcador sobre a entrada quando ela for o objetivo atual.
- Permita que o jogador encontre o ponto de interação sem precisar clicar em pixels exatos.
- Mostre uma indicação de interação quando estiver ao alcance.
- Evite que paredes e objetos decorativos bloqueiem interações que deveriam ser possíveis.
- Não permita interações através de paredes sólidas quando isso não fizer sentido.

Se o objetivo estiver em outra área, indique primeiro a passagem necessária. Não coloque um marcador inacessível do outro lado de uma parede sem indicar como chegar lá.

## 7. Prioridade visual e desempenho

A hierarquia visual deve ser:

1. Personagem controlado pelo jogador.
2. Ameaças e elementos relevantes para o combate.
3. Objetivo ativo e objetos de interação.
4. Cenário e elementos decorativos.

Essa hierarquia não significa desenhar tudo em uma camada superior. Use marcadores de HUD, transparência por oclusão e ordenação de profundidade para manter a leitura visual sem destruir a perspectiva do cenário.

Evite recalcular todas as colisões e todas as máscaras de transparência em cada quadro se for possível atualizar apenas os objetos próximos ou relevantes.

## 8. Testes obrigatórios

Após a implementação, teste os seguintes casos:

- O jogador passa atrás de uma casa e continua visível.
- A casa fica transparente apenas na área necessária.
- O jogador não atravessa as paredes sólidas.
- O jogador consegue contornar a construção pelos espaços livres.
- Árvores, muros e rochas mantêm colisões coerentes.
- A ordem de profundidade continua correta quando o jogador passa na frente e atrás de objetos.
- O marcador do objetivo acompanha a posição real do objetivo.
- O minimapa indica corretamente a direção do objetivo.
- O marcador muda quando a missão avança.
- Objetivos concluídos não permanecem destacados indevidamente.
- Entradas de construções e masmorras podem ser encontradas e utilizadas.
- A solução funciona em diferentes posições da câmera e não depende de uma única construção específica.
- Os sistemas de combate, movimentação, missões e salvamento continuam funcionando.

Execute os testes existentes e a compilação do projeto. Corrija os erros introduzidos pela mudança.

## 9. Restrições

- Não substitua o jogo por uma demonstração simplificada.
- Não remova sistemas existentes para facilitar a implementação.
- Não altere a direção artística do Distrito Zero.
- Não esconda problemas de colisão usando apenas transparência.
- Não corrija a visibilidade desenhando o jogador acima de todas as estruturas.
- Não use marcadores de objetivo com coordenadas inventadas.
- Não considere a tarefa concluída apenas porque os ícones aparecem na tela.

Primeiro, identifique como o projeto atual trata renderização, profundidade, colisão, missões e minimapa. Depois implemente as correções integradas à arquitetura existente.

Ao terminar, informe quais arquivos foram alterados, como a solução funciona, quais testes foram executados e quais problemas ainda permaneceram.
