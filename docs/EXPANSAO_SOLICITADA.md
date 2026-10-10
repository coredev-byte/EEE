# DISTRITO ZERO — EXPANSÃO DO MUNDO, REGIÕES CONECTADAS E SISTEMA COMPLETO DE MISSÕES

Trabalhe diretamente no repositório atual do Distrito Zero. Antes de alterar qualquer coisa, analise a arquitetura, o código existente, os sistemas implementados e o estado real do jogo.

Esta etapa deve expandir o mundo jogável e aprofundar o sistema de missões, transformando o mapa atual em uma aventura de RPG contínua, explorável e com progressão narrativa.

**Não crie apenas um documento de planejamento ou uma demonstração. Implemente as funcionalidades no jogo.**

## 1. EXPANSÃO REAL DO MUNDO

O Distrito Zero precisa deixar de parecer um mapa pequeno e limitado. Quero um mundo que o jogador possa explorar gradualmente, descobrindo novas regiões conforme avança na campanha.

Use a história já definida como base:

1. Vila Pedralta — região inicial.
2. Ruínas Esquecidas — primeira grande masmorra e confronto com Kharn.
3. Bairro da Ferrugem — região industrial.
4. Jardim do Véu — região de vegetação corrompida e mistérios.
5. Cidade Afogada — área inundada e subterrânea.
6. Distrito das Cinzas — região militar.
7. Distrito Zero — região central da história e localização de Ivis.

Essas regiões devem formar um mundo coerente. Não precisam estar todas acessíveis desde o início, mas precisam fazer parte de uma estrutura de expansão preparada para o futuro.

### Requisitos

- Expanda o mundo sem destruir os mapas, sistemas ou conteúdos que já funcionam.
- Conecte as regiões por estradas, trilhas, pontes, portões, elevadores, túneis, passagens subterrâneas e entradas de masmorras.
- Crie transições funcionais entre mapas.
- Permita voltar a regiões já visitadas.
- Implemente bloqueios de progressão que façam sentido na história, como portas trancadas, mecanismos desativados e passagens perigosas.
- Mostre visualmente quando uma passagem estiver bloqueada e como desbloqueá-la, quando essa informação já for conhecida pelo jogador.
- Evite fronteiras invisíveis sem justificativa.
- Não crie grandes espaços vazios apenas para aumentar o tamanho do mapa.
- Distribua pontos de interesse, inimigos, NPCs, recursos, atalhos, segredos e objetivos de exploração.

Cada região deve ter uma identidade própria, tanto visual quanto sonora, com arquitetura, iluminação, vegetação, objetos, inimigos e atmosfera adequados.

## 2. CONTINUIDADE ENTRE REGIÕES

O jogador deve sentir que está atravessando um mundo, não selecionando fases independentes.

Implemente um sistema de regiões que registre:

- Região atual.
- Regiões descobertas.
- Entradas e saídas conhecidas.
- Passagens desbloqueadas.
- Missões disponíveis em cada região.
- Chefes derrotados.
- Alterações importantes provocadas pelas ações do jogador.

Ao entrar em uma região, carregue o mapa correto, posicione o personagem em um ponto válido e atualize o minimapa, os objetivos e os dados de exploração.

Ao retornar, preserve o progresso. Chefes derrotados não devem reaparecer indevidamente, itens únicos coletados não devem voltar ao estado inicial e portas já abertas devem continuar abertas, salvo quando houver uma razão de jogo explícita.

Garanta que o salvamento continue compatível com os dados existentes. Se precisar alterar sua estrutura, implemente migração segura e mantenha uma forma de recuperar dados antigos.

## 3. MISSÕES PRINCIPAIS COM PROGRESSÃO NARRATIVA

Crie uma campanha principal dividida em capítulos, com começo, desenvolvimento, conclusão e consequências.

### Capítulo 1 — O Selo Partido

O jogador investiga os ataques em Vila Pedralta, enfrenta Bizel e explora as Ruínas Esquecidas.

O confronto com Kharn deve revelar que o guardião estava protegendo algo e que a corrupção está relacionada a um problema muito maior.

A conclusão precisa desbloquear a próxima etapa da história, em vez de encerrar a aventura.

### Capítulo 2 — Máquinas Mortas

O jogador segue para o Bairro da Ferrugem e investiga equipamentos antigos relacionados à Ruptura.

Crie missões envolvendo Elcio, máquinas descontroladas, coleta de componentes, exploração de instalações e confronto com o Mestre da Fornalha.

A conclusão deve revelar pistas sobre o transporte e o uso de fragmentos do Núcleo.

### Capítulo 3 — Memórias do Véu

O jogador explora o Jardim do Véu, investiga acontecimentos estranhos e ajuda Leda a encontrar respostas sobre pessoas desaparecidas.

As missões devem combinar exploração, combate, investigação e descoberta de áreas ocultas.

A conclusão revela que a Ruptura afetou memórias e consciências, além de transformar corpos.

### Capítulo 4 — O Fundo da Cidade

Na Cidade Afogada, o jogador atravessa estruturas inundadas, enfrenta criaturas e acompanha Lenno até uma instalação subterrânea.

As missões devem revelar informações mais concretas sobre os experimentos realizados antes da Ruptura.

### Capítulo 5 — A Guerra das Cinzas

O jogador enfrenta conflitos entre facções, investiga os planos do General Vark e descobre a localização do Distrito Zero.

Inclua missões de infiltração, combate, sabotagem e decisões que alterem a situação de determinados grupos.

### Capítulo 6 — A Verdade Apagada

O jogador acessa o Distrito Zero, enfrenta P11 e descobre a participação de Ivis na origem da catástrofe.

Prepare a região e a estrutura narrativa para o confronto final, sem simplificar o percurso até ele.

**Importante:** se alguma região, personagem ou chefe ainda não existir no código, implemente o conteúdo necessário para torná-lo jogável. Não apresente como concluído algo que apenas foi descrito em texto.

## 4. MISSÕES SECUNDÁRIAS E ATIVIDADES

Além da campanha principal, crie missões secundárias com objetivos e recompensas reais.

Inclua diferentes tipos:

- Investigar desaparecimentos.
- Encontrar pessoas e objetos perdidos.
- Eliminar criaturas que ameaçam comunidades.
- Explorar construções abandonadas.
- Recuperar documentos e registros antigos.
- Coletar materiais para NPCs.
- Consertar mecanismos e abrir caminhos.
- Caçar criaturas raras.
- Investigar áreas contaminadas.
- Ajudar ou enfrentar facções.
- Encontrar equipamentos escondidos.
- Descobrir passagens secretas.
- Enfrentar mini-chefes opcionais.

Evite missões repetitivas que apenas mandam derrotar uma quantidade de inimigos sem contexto.

Cada missão secundária deve ter pelo menos um motivo narrativo, um objetivo verificável e uma recompensa definida.

Algumas missões podem revelar informações opcionais sobre o mundo, enquanto outras podem desbloquear atalhos, equipamentos, comerciantes, áreas ou habilidades.

Não torne todas as missões obrigatórias. A exploração deve permitir que o jogador escolha parte do caminho.

## 5. SISTEMA DE MISSÕES

Revise e amplie o sistema de missões já existente. Não crie um segundo sistema separado se o atual puder ser expandido.

Cada missão deve possuir:

- Identificador único.
- Nome.
- Descrição curta.
- Contexto narrativo.
- Região de origem.
- NPC ou evento que a inicia.
- Objetivos e etapas.
- Condições de conclusão.
- Recompensas.
- Pré-requisitos.
- Estado atual.
- Consequências no mundo, quando aplicável.

Os estados mínimos devem incluir: disponível, ativa, concluída e bloqueada.

Missões com várias etapas precisam avançar corretamente. Por exemplo:

1. Conversar com Lenir.
2. Encontrar um registro nas ruínas.
3. Investigar a área indicada.
4. Derrotar o inimigo responsável.
5. Voltar para entregar as informações.
6. Receber a recompensa e desbloquear a próxima missão.

Cada etapa deve atualizar o sistema de missões automaticamente quando a ação correta acontecer. Não obrigue o jogador a repetir interações sem necessidade.

## 6. OBJETIVOS VISUAIS E MINIMAPA

Os objetivos precisam ser fáceis de entender durante a exploração.

Implemente ou integre ao sistema existente:

- Indicador do objetivo principal no mundo.
- Marcadores para NPCs e objetos importantes.
- Indicadores de entradas e saídas de regiões.
- Marcadores para chefes e locais de missão, quando descobertos.
- Direção para objetivos fora da tela.
- Ícones no minimapa posicionados nas coordenadas reais.
- Distinção visual entre objetivo principal, secundário, passagem e ponto de interesse.
- Atualização automática dos marcadores quando uma etapa for concluída.

O HUD deve mostrar o objetivo atual em uma frase curta, como “Investigue as ruínas ao norte” ou “Encontre a entrada da instalação”.

Se o objetivo estiver atrás de uma construção, aplique a lógica de oclusão e transparência das estruturas. Não esconda o personagem, o marcador ou os objetos necessários para concluir a missão.

Se o jogador ainda não descobriu uma localização, não revele automaticamente todos os seus detalhes no minimapa. A indicação deve respeitar a progressão e o conhecimento adquirido na história.

## 7. EXPLORAÇÃO E DESCOBERTA

Adicione um sistema consistente de descoberta do mundo.

O jogador deve poder encontrar locais por conta própria, receber pistas de NPCs, ler documentos e descobrir caminhos durante a exploração.

Quando uma região ou local importante for descoberto:

- Registre sua descoberta.
- Atualize o mapa ou minimapa.
- Libere as missões associadas, se os pré-requisitos forem atendidos.
- Mostre uma notificação visual discreta.
- Salve o progresso.

Inclua locais opcionais que recompensem a curiosidade, como salas secretas, esconderijos, pequenos santuários, depósitos e áreas contaminadas.

Não transforme a exploração em uma lista de marcadores que o jogador apenas segue. Combine indicações claras com descobertas que dependem de observação.

## 8. NPCs E MUDANÇAS NO MUNDO

Os NPCs devem ter funções claras e participar do progresso da campanha.

Sandro pode continuar ligado a equipamentos e melhorias. Lenir pode fornecer informações e investigações. Lenno pode orientar explorações perigosas. Leda pode conduzir missões do Jardim do Véu. Elcio pode participar das missões industriais.

Crie diálogos curtos e coerentes com a situação de cada personagem. Evite diálogos genéricos que não acrescentem nada à missão.

Quando uma missão importante for concluída, permita mudanças perceptíveis no mundo, como:

- Uma passagem que se abre.
- Uma área que se torna acessível.
- Um NPC que muda de localização.
- Uma comunidade que passa a ocupar um lugar seguro.
- Um comerciante que oferece novos itens.
- Uma facção que passa a agir de forma diferente.
- Uma ameaça que deixa de existir naquela região.

As mudanças precisam estar ligadas às ações do jogador e ser persistentes no salvamento.

## 9. RECOMPENSAS E PROGRESSÃO

As recompensas devem incentivar a exploração sem desequilibrar o combate.

Use uma combinação de:

- Experiência.
- Moeda ou recursos existentes no jogo.
- Equipamentos.
- Materiais de fabricação.
- Itens de missão.
- Acesso a novas regiões.
- Desbloqueio de comerciantes.
- Habilidades ou pontos de progressão, quando compatível com as regras atuais.
- Informações narrativas e registros colecionáveis.

Missões mais difíceis devem oferecer recompensas proporcionais. Evite entregar equipamentos excessivamente fortes cedo demais ou repetir a mesma recompensa em todas as missões.

Integre as recompensas ao sistema de inventário, equipamentos, experiência e árvore de habilidades já implementados.

## 10. INTEGRAÇÃO COM O COMBATE E OS CHEFES

Os chefes devem fazer parte das missões, da exploração e da história.

Quando uma missão envolver um chefe:

- Prepare a aproximação e o contexto do confronto.
- Garanta que a arena ou área de combate seja acessível.
- Mostre claramente quando o confronto começa.
- Atualize o objetivo durante a luta, se houver várias etapas.
- Registre a derrota uma única vez.
- Libere as recompensas e os caminhos associados.
- Atualize os diálogos e as missões dependentes.
- Preserve o estado após salvar e carregar o jogo.

Não transforme todos os chefes em encontros obrigatórios se isso prejudicar a exploração opcional. Diferencie os confrontos principais dos desafios secundários.

## 11. DESEMPENHO, COLISÕES E QUALIDADE DO MAPA

A expansão não pode criar problemas de movimentação ou renderização.

Revise:

- Colisões entre personagem e cenário.
- Passagens estreitas e entradas.
- Ordem de profundidade na perspectiva isométrica.
- Visibilidade atrás das estruturas.
- Posicionamento de NPCs e inimigos.
- Transições entre regiões.
- Posição de reaparecimento após carregar o jogo.
- Navegação de inimigos nas áreas ampliadas.
- Marcadores do minimapa.
- Salvamento e carregamento do progresso.

Não use mapas grandes e vazios para simular uma expansão. Cada região precisa conter caminhos funcionais, pontos de interesse e conteúdo jogável.

## 12. IMPLEMENTAÇÃO EM ETAPAS

Execute o trabalho nesta ordem, concluindo e testando cada parte antes de avançar:

**Etapa A — Estrutura do mundo**
- Sistema de regiões.
- Conexões entre mapas.
- Transições.
- Persistência do estado das regiões.

**Etapa B — Sistema de missões**
- Estrutura única de dados.
- Etapas e pré-requisitos.
- Atualização automática de objetivos.
- Recompensas e persistência.

**Etapa C — Expansão jogável**
- Bairro da Ferrugem.
- Jardim do Véu.
- Cidade Afogada.
- Distrito das Cinzas.
- Preparação e acesso ao Distrito Zero.

**Etapa D — Conteúdo narrativo**
- Missões principais.
- Missões secundárias.
- NPCs, diálogos, pistas e eventos.
- Chefes e recompensas.

**Etapa E — Interface e exploração**
- HUD de objetivos.
- Minimap com marcadores reais.
- Descoberta de locais.
- Entradas, saídas e atalhos.
- Correção da visibilidade atrás das estruturas.

**Etapa F — Validação**
- Testes de transição.
- Testes de progressão das missões.
- Testes de recompensas.
- Testes de salvamento e carregamento.
- Testes de colisão e navegação.
- Compilação e testes automatizados existentes.

Se não for possível concluir todas as etapas em uma única execução, priorize a arquitetura e uma expansão vertical totalmente jogável: uma região nova, conectada ao mapa atual, com missões principais e secundárias funcionais. Deixe a estrutura pronta para adicionar as demais regiões sem reescrever o sistema.

## 13. CRITÉRIOS PARA CONSIDERAR A ETAPA CONCLUÍDA

A implementação só deve ser considerada concluída quando:

- O jogador conseguir sair da região inicial por uma passagem funcional.
- A nova região tiver conteúdo real e explorável.
- A campanha continuar depois de Kharn.
- Existirem missões com várias etapas que avançam corretamente.
- Os objetivos forem claros no HUD e no minimapa.
- Missões concluídas e recompensas forem salvas corretamente.
- O jogador puder retornar a regiões anteriores.
- A progressão não depender de alterar manualmente dados no código.
- Não houver barreiras invisíveis indevidas nem passagens sem colisão correta.
- A compilação e os testes existentes passarem.

Ao finalizar, apresente um relatório objetivo com os arquivos alterados, as regiões efetivamente implementadas, as missões jogáveis, os testes executados e o que ainda ficou pendente.

**Não declare conteúdo como pronto se ele existir apenas como texto, placeholder, mapa vazio ou marcador sem interação real.**