# DISTRITO ZERO — REVISÃO ESTRUTURAL E EVOLUÇÃO DO RPG

Trabalhe no projeto existente Distrito Zero. O objetivo é evoluir o jogo para um RPG de ação isométrico de fantasia urbana sombria, com mundo explorável, personalização profunda, combate satisfatório e identidade visual própria.

**Não recrie o projeto do zero. Não remova funcionalidades existentes apenas para simplificar o código. Não substitua sistemas complexos por versões básicas.** Antes de alterar qualquer coisa, analise a implementação atual, identifique os sistemas existentes e preserve o que já funciona.

## 1. Dimensionamento, profundidade e renderização

Este é um dos problemas mais importantes.

- Investigue por que personagens, armas, efeitos, objetos e elementos da interface ficam sobrepostos ou aparecem em posições incorretas.
- Defina regras consistentes para escala, coordenadas do mundo, coordenadas da tela e posicionamento da interface.
- Corrija a ordem de desenho de personagens, inimigos, paredes, árvores, construções, objetos e efeitos, respeitando a profundidade no mapa isométrico.
- Evite que personagens pareçam flutuar, afundar no chão, atravessar objetos indevidamente ou ficar visualmente atrás de elementos que deveriam estar à frente.
- Separe a renderização do mundo da renderização da HUD.
- Garanta que a interface se adapte ao tamanho da janela sem distorcer o jogo, cortar informações ou provocar sobreposições.
- Preserve o pixel art nítido, sem suavização que destrua os pixels.

Não corrija posições por meio de valores aleatórios espalhados pelo código. Identifique a causa e crie regras reutilizáveis.

## 2. Mundo aberto e continuidade da história

O mundo atual apresenta barreiras que limitam a exploração. Investigue como elas são criadas e remova as barreiras artificiais que não tenham justificativa no mundo do jogo.

- Crie uma estrutura de mapa conectado, com ruas, passagens, áreas de exploração, interiores ou regiões acessíveis conforme a progressão.
- Preserve colisões necessárias para paredes, construções e obstáculos reais.
- Não permita atravessar tudo indiscriminadamente: o objetivo é eliminar bloqueios arbitrários, não eliminar a física do jogo.
- Faça a navegação dos inimigos e do jogador funcionar de forma coerente com o mapa.
- Estruture a progressão para que missões, diálogos, acontecimentos e novas regiões façam parte de uma mesma história.
- Garanta que o jogador entenda onde está, para onde pode ir e por que precisa explorar cada região.
- Evite que o jogo termine abruptamente depois de uma missão inicial. Prepare uma estrutura que permita acrescentar capítulos, personagens, áreas e acontecimentos sem reconstruir tudo.

Não crie um mapa enorme e vazio apenas para afirmar que o mundo é aberto. Priorize exploração significativa, caminhos coerentes e regiões com identidade.

## 3. Personalização visual real

A personalização deve ser percebida no próprio personagem durante a exploração e o combate, não apenas nos números dos atributos ou nos ícones dos menus.

- Equipamentos devem alterar visualmente o personagem sempre que aplicável.
- Armas precisam acompanhar corretamente as mãos e as animações.
- Armaduras, acessórios, capacetes, mantos e outros equipamentos devem ter representações visuais compatíveis com o sistema de sprites.
- Equipamentos raros ou especiais podem ter silhuetas, detalhes e efeitos próprios.
- Elementos de fogo, gelo, energia arcana e outros poderes devem aparecer de maneira integrada ao equipamento e às animações.
- A troca de item deve atualizar os atributos e a aparência sem inconsistências.
- A progressão de nível, classe e especialização deve permitir construir personagens visualmente e funcionalmente diferentes.

Não finja que a personalização é completa apenas porque o item equipado aparece em uma lista. Identifique quais equipamentos já possuem representação visual e implemente o sistema de forma incremental para os demais.

## 4. Árvore de habilidades complexa

O projeto precisa de uma árvore de habilidades mais profunda do que o sistema simplificado atual.

- Inspecione a implementação existente e recupere qualquer sistema anterior de habilidades que ainda esteja disponível no histórico do Git.
- Preserve as quatro classes: Guerreiro, Arcanista, Assassino e Atirador.
- Crie árvores com ramificações, requisitos, custos em pontos, níveis mínimos, habilidades passivas, habilidades ativas e especializações.
- Permita escolhas diferentes dentro da mesma classe, criando estilos de jogo distintos.
- Faça as habilidades interagirem com atributos, equipamentos, efeitos elementais, combate e progressão.
- Exiba requisitos, custos, efeitos, melhorias e habilidades bloqueadas com clareza.
- Impeça que pontos sejam gastos em habilidades sem cumprir os requisitos.
- Salve a progressão corretamente e mantenha compatibilidade com os dados existentes, usando migrações quando necessário.

Não transforme a árvore em uma lista de quatro habilidades. Ela deve oferecer decisões significativas e espaço para expansão futura.

## 5. Combate, dano e efeitos

O combate precisa fornecer informações visuais e sonoras claras.

- Diferencie dano causado, dano recebido, cura, bloqueio, esquiva, acerto crítico e efeitos de estado.
- Use números de dano e efeitos visuais com tamanho, duração e contraste adequados.
- Sincronize os impactos com o momento real em que o dano é aplicado.
- Melhore animações de ataque, preparação, recuperação e morte.
- Faça projéteis e habilidades terem trajetória, velocidade, impacto e efeitos compatíveis com seu tipo.
- Evite efeitos que escondam o personagem ou cubram a tela.
- Garanta que os indicadores permaneçam legíveis sem gerar excesso de informação.

## 6. Áudio de qualidade

O áudio deve ser tratado como parte do combate e da identidade do jogo.

Crie ou integre efeitos sonoros distintos e consistentes para:

- Passos e deslocamento em diferentes superfícies, quando aplicável.
- Ataques, golpes, bloqueios, esquivas e impactos.
- Cada família de habilidades e efeitos elementais.
- Receber dano, morrer, subir de nível e concluir missões.
- Encontrar, recolher, equipar e descartar itens.
- Abrir menus, navegar pela interface e confirmar ações.
- Falas, diálogos e acontecimentos importantes da história.

Inclua controle de volume, separação entre música e efeitos, prevenção de sons sobrepostos em excesso e tratamento adequado para navegadores.

Não use o mesmo som para todas as ações. Não declare o sistema de áudio concluído enquanto os eventos não estiverem conectados às ações reais do jogo.

## 7. Drops e apresentação de itens

O sistema de drops precisa comunicar claramente o que o jogador encontrou.

- Identifique o item no momento da queda e da coleta.
- Mostre nome, ícone ou imagem, raridade e efeitos visuais adequados.
- Diferencie itens comuns, incomuns, raros, épicos e lendários por critérios consistentes.
- Ao recolher um item, mostre uma notificação organizada com imagem, nome e descrição breve.
- A notificação deve aparecer em uma área definida da interface, não em posições aleatórias.
- Permita que várias notificações coexistam sem se sobrepor, desaparecerem imediatamente ou cobrirem informações importantes.
- Inclua efeitos sonoros específicos por categoria de item, sem exagerar no volume.
- Na hora de equipar, apresente atributos atuais e novos, vantagens, desvantagens e mudanças visuais previstas.
- Informe quando um item não puder ser usado pela classe, nível ou requisitos do personagem.

A coleta precisa ser clara e satisfatória. Não use apenas uma mensagem textual genérica como confirmação de drop.

## 8. HUD e minimapa

A HUD atual funciona como base, mas precisa deixar de parecer uma interface genérica.

Crie uma identidade própria para Distrito Zero, com fantasia urbana sombria, materiais, símbolos, tipografia, hierarquia visual e detalhes coerentes com o universo do jogo.

- Preserve a legibilidade de vida, mana, experiência, habilidades, missão e localização.
- Melhore os indicadores de recarga e os estados das habilidades.
- Organize os elementos para não encobrir o personagem nem informações importantes.
- Torne o minimapa mais informativo e reconhecível, com ruas, obstáculos, jogador, inimigos quando aplicável, objetivos, pontos de interesse e áreas descobertas.
- Diferencie o que já foi explorado do que ainda não foi descoberto.
- Mantenha o mapa sincronizado com o mundo real, sem marcadores deslocados ou informações desatualizadas.
- Garanta que HUD e minimapa se adaptem a diferentes resoluções.

Evite excesso de ornamentos. Sofisticação significa identidade visual consistente, boa hierarquia e acabamento, não apenas acrescentar bordas, brilhos e texturas.

## 9. Processo obrigatório de implementação

Antes de modificar os sistemas:

1. Inspecione a estrutura atual e os arquivos relacionados a renderização, mundo, combate, habilidades, inventário, áudio e interface.
2. Verifique o histórico do Git em busca de funcionalidades anteriores que tenham sido removidas ou simplificadas.
3. Identifique as causas dos problemas e os arquivos que precisam mudar.
4. Defina uma sequência de implementação com critérios objetivos de conclusão.
5. Faça alterações em etapas pequenas, preservando os sistemas existentes.
6. Execute os testes disponíveis e acrescente testes para os comportamentos corrigidos.
7. Verifique colisões, renderização, salvamento, progressão e compatibilidade dos dados.
8. Atualize a documentação com o que foi realmente implementado e o que ainda está pendente.

Não marque uma funcionalidade como concluída apenas porque o código compila. Verifique o comportamento real sempre que houver meios de testá-lo.

## Resultado esperado

Distrito Zero deve evoluir para um RPG isométrico de fantasia urbana sombria com:

- Mundo conectado e exploração coerente.
- Personagens e equipamentos visualmente consistentes.
- Combate legível e satisfatório.
- Árvore de habilidades profunda.
- Drops bem apresentados e equipamentos que realmente mudam o personagem.
- Áudio integrado às ações do jogo.
- HUD e minimapa com identidade própria.
- Código organizado e preparado para expansão.

**Comece pela auditoria e pela correção dos problemas estruturais. Não tente implementar tudo em uma única alteração. Ao final de cada etapa, informe o que mudou, quais arquivos foram alterados, quais testes passaram e quais problemas permanecem.**