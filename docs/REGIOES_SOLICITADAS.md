Próxima etapa: Regiões e continuidade
Eu faria esta etapa antes de investir em mais conteúdo secundário.
Objetivo da atualização
Transformar Vila Pedralta em parte de um mundo conectado, no qual concluir a missão do selo abre a próxima parte da campanha.

1. Mundo conectado
- Criar regiões com identidade visual própria, sem simplesmente remover as barreiras e deixar o mapa vazio.
- Conectar as regiões por estradas, portões, trilhas e passagens.
- Fazer câmera, colisões, minimapa e salvamento respeitarem as novas áreas.
2. Continuação da história
- Criar uma missão após o selo de Kharn.
- Adicionar diálogos, objetivos, personagens e recompensas ligados à história.
- Fazer as ações do jogador alterarem o progresso da campanha.
3. Exploração e inimigos
- Criar caminhos reais entre obstáculos para os inimigos.
- Adicionar encontros e recompensas próprios de cada região.
- Permitir retornar às áreas anteriores sem perder o progresso.
4. Validação
- Percorrer as conexões entre regiões usando teclado e mouse.
- Testar colisões, inimigos, missões, minimapa e salvamento após trocar de área.
- Confirmar que os sistemas existentes continuam funcionando.

Prompt para o Codex
DISTRITO ZERO — ETAPA 2: REGIÕES, EXPLORAÇÃO E CONTINUIDADE DA CAMPANHA
Trabalhe diretamente no repositório atual do Distrito Zero. Antes de alterar o código, leia docs/AUDITORIA_RPG.md, docs/REVISAO_SOLICITADA.md, README.md e os sistemas atuais de mundo, missão, inimigos, minimapa e salvamento.
Objetivo
Implementar a etapa de regiões e continuidade narrativa prevista na auditoria. A missão atual termina no selo de Kharn, e o jogo precisa continuar depois desse ponto.
Não recrie o projeto. Preserve os sistemas funcionais, a árvore de habilidades já implementada, o áudio, os equipamentos, o combate e a compatibilidade com os salvamentos existentes.
1. Estrutura do mundo
Substitua os limites arbitrários do mapa por uma estrutura de regiões conectadas.
- Preserve Vila Pedralta como região inicial.
- Crie pelo menos uma segunda região jogável, integrada à história de Kharn.
- Faça a conexão entre regiões por passagens visíveis e interativas.
- Não remova simplesmente as barreiras atuais para revelar terreno vazio.
- Cada região deve ter limites, obstáculos, identidade visual, inimigos e pontos de interesse próprios.
- Faça câmera, projeção isométrica, colisões, renderização e minimapa usarem as mesmas coordenadas.
- Não permita que casas, árvores, construções, personagens ou efeitos se sobreponham incorretamente.
- Implemente carregamento e transição entre regiões sem reiniciar indevidamente o personagem ou a campanha.
2. Continuidade da história
Após a interação com o selo de Kharn, habilite uma nova etapa da campanha.
- Crie uma continuação coerente com a missão existente.
- Adicione objetivos claros, diálogos, pontos de interesse e recompensas reais.
- Garanta que o jogador saiba para onde ir e o que precisa fazer.
- Registre os objetivos concluídos no estado do jogo e no salvamento.
- Evite repetir recompensas únicas após recarregar a página.
- Preserve a missão inicial e a progressão de jogadores que já possuem um salvamento.
3. IA e navegação
A auditoria identificou que a IA usa desvio local, sem planejamento global de caminhos.
Implemente navegação adequada aos obstáculos e às novas regiões. Os inimigos devem conseguir contornar construções e outros bloqueios, perseguir o jogador por rotas válidas e abandonar a perseguição quando apropriado. Evite atravessar paredes, ficar presos ou oscilar entre dois pontos.
4. Minimap e persistência
- Exiba a região atual e suas conexões no minimapa.
- Mostre os objetivos da missão e os pontos de interesse relevantes.
- Adicione descoberta de áreas quando fizer sentido para a exploração.
- Salve região atual, posição válida, progresso das missões, baús e estado dos encontros.
- Crie migração compatível para salvamentos anteriores. Não apague nem reinicie o progresso antigo.
5. Testes obrigatórios
Teste o percurso completo desde Vila Pedralta até a nova região e o retorno. Verifique colisões, câmera, minimapa, transições, IA, missão, recompensas únicas, recarga da página e compatibilidade dos salvamentos.
Execute npm test, npm run build e npm run test:e2e. Corrija as falhas causadas pelas alterações.
Restrições
Não declare o mundo como aberto se ainda houver limites artificiais ou regiões desconectadas. Não implemente apenas elementos decorativos: passagens, missões, inimigos e recompensas precisam funcionar de verdade.
Ao concluir, informe os arquivos modificados, as funcionalidades realmente implementadas, os testes executados e as limitações restantes. Atualize a documentação do projeto com os resultados reais.




Critério para avançar: a segunda região precisa ser explorável, conectada à primeira, integrada à história e persistente após recarregar o jogo. Só depois eu priorizaria a próxima etapa da auditoria: equipamentos que alteram visualmente o personagem, pois os atributos já mudam, mas as variantes visuais de armas, armaduras e acessórios ainda precisam ser ampliadas.
