# DISTRITO ZERO — CAPÍTULO I: O SELO PARTIDO
## Continuação da campanha, Ruínas Esquecidas e confronto cinematográfico contra Kharn

### 1. OBJETIVO PRINCIPAL

Trabalhe diretamente no repositório atual de Distrito Zero.

Sua missão é dar continuidade à campanha a partir do progresso real do jogador, desenvolvendo o restante do Capítulo I — O Selo Partido, até culminar em um confronto completo contra Kharn.

A experiência deve incluir exploração, investigação, novos diálogos, acontecimentos narrativos, confrontos intermediários, uma masmorra própria, apresentação cinematográfica de Kharn, boss fight com múltiplas fases e uma conclusão que prepare o Capítulo II — Máquinas Mortas.

**Não quero somente um roteiro. Quero todas as funcionalidades implementadas, integradas, testadas e jogáveis.**

A luta contra Kharn precisa ser um dos momentos mais marcantes do início do jogo.

---

### 2. CONSULTA OBRIGATÓRIA À BÍBLIA DO JOGO

Antes de qualquer implementação:

1. Leia o `README.md` atualizado.
2. Leia toda a documentação narrativa e de campanha em `docs/`.
3. Consulte `EXPANSAO_SOLICITADA.md`, que estabelece o confronto com Bizel, a exploração das Ruínas Esquecidas e o encontro com Kharn.
4. Analise as missões, diálogos, personagens e acontecimentos já implementados.
5. Identifique exatamente qual é a missão principal ativa na versão atual.
6. Verifique se o prólogo cinematográfico solicitado anteriormente já foi implementado.
7. Identifique como o conteúdo atual de Pedralta e Margem de Kharn deverá ser integrado ao Capítulo I completo.

**A bíblia é a fonte principal de verdade narrativa.**

Não invente a origem, as intenções ou o destino de Kharn quando essas informações já estiverem definidas.

O confronto deve revelar que Kharn estava protegendo algo e que a corrupção está relacionada a uma ameaça maior, conforme a especificação existente.

A forma exata dessa revelação deverá respeitar os documentos canônicos.

---

### 3. CONTINUIDADE DA MISSÃO ATUAL

Não reinicie a campanha nem substitua arbitrariamente as missões existentes.

Detecte o estado atual do jogador e dê continuidade a partir dele.

O sistema precisa atender a três situações:

**Jogador novo:** conclui o prólogo, segue as missões de Pedralta e chega naturalmente ao confronto com Kharn.

**Jogador em progresso:** continua da etapa em que parou, sem perder objetivos, itens ou recompensas.

**Jogador que já concluiu o conteúdo antigo:** recebe a nova etapa narrativa adequada, sem precisar repetir missões concluídas.

Se for necessário reorganizar a sequência de missões do Capítulo I, implemente migração de progresso segura.

O objetivo é estabelecer a seguinte estrutura narrativa, respeitando os detalhes da bíblia:

Investigação em Pedralta → Ameaça de Bizel → Descobertas sobre o selo → Exploração das Ruínas Esquecidas → Encontro com Kharn → Revelação → Continuação da campanha.

Integre os acontecimentos existentes da Margem de Kharn nessa cronologia sem gerar contradições.

---

### 4. PRIMEIRA PARTE — INVESTIGAÇÃO E ESCALADA DE TENSÃO

A missão não deve conduzir imediatamente ao chefe.

Antes de encontrar Kharn, o jogador precisa perceber que os acontecimentos de Pedralta são apenas parte de um problema maior.

Crie uma sequência de objetivos narrativos que inclua:

- Conversar com personagens envolvidos nos ataques.
- Investigar evidências ambientais.
- Encontrar documentos ou registros relevantes.
- Descobrir informações sobre Bizel.
- Enfrentar ameaças relacionadas à investigação.
- Identificar a ligação entre os acontecimentos e as ruínas.
- Descobrir o caminho para a próxima região.

Utilize NPCs existentes, como Lenir, quando suas funções forem compatíveis com a bíblia.

Os diálogos devem mudar conforme as descobertas.

Não entregue todas as informações em uma única conversa.

O jogador deve compreender progressivamente por que precisa entrar nas ruínas.

Cada objetivo deverá possuir gatilhos reais, marcadores corretos e atualização automática no diário.

---

### 5. BIZEL — CONFRONTO INTERMEDIÁRIO

A bíblia estabelece Bizel como parte do Capítulo I.

Implemente sua participação no momento narrativamente adequado.

Antes do confronto, apresente indícios de sua atuação.

Seu encontro deve incluir:

- Preparação narrativa.
- Diálogo coerente com sua personalidade canônica.
- Entrada em cena.
- Combate real, caso seja o papel previsto na bíblia.
- Consequência persistente.
- Uma pista que conduza às Ruínas Esquecidas.

Bizel não deve funcionar apenas como um inimigo comum com mais vida.

Crie identidade visual, animações e comportamento próprios, proporcionais à importância do personagem.

Não atribua a Bizel motivações incompatíveis com o cânone.

---

### 6. NOVA REGIÃO — RUÍNAS ESQUECIDAS

Implemente as Ruínas Esquecidas como uma masmorra real e explorável.

Não reutilize simplesmente o mapa da Margem de Kharn com outro nome.

A região deverá possuir identidade própria.

**Direção artística:**

Pixel art isométrica, com predominância de azul profundo, violeta, pedra envelhecida, vegetação invadindo estruturas e iluminação dourada em pontos importantes.

O ambiente deve transmitir a sensação de que algo muito antigo foi abandonado ou deliberadamente isolado.

Inclua:

- Entrada monumental parcialmente destruída.
- Caminhos e corredores com obstáculos reais.
- Salões com arquitetura antiga.
- Áreas de investigação.
- Mecanismos relacionados à história.
- Inimigos adequados ao local.
- Baús e recompensas opcionais.
- Atalhos desbloqueáveis.
- Um ponto de preparação antes do chefe.
- Arena exclusiva para Kharn.

O percurso não deve ser um corredor vazio até o boss.

Crie uma progressão espacial com começo, desenvolvimento e chegada ao centro das ruínas.

As estruturas precisam possuir colisões corretas, profundidade isométrica, oclusão e iluminação coerentes.

---

### 7. MECÂNICAS DA MASMORRA

A exploração deverá utilizar os sistemas reais de Distrito Zero.

Inclua pelo menos três situações distintas:

**Investigação:** o jogador encontra uma evidência e precisa interpretá-la ou interagir com ela.

**Mecanismo:** o jogador ativa ou restaura uma estrutura que permite avançar.

**Confronto:** o jogador enfrenta inimigos relacionados ao ambiente e à história.

Evite enigmas arbitrários.

Os mecanismos devem possuir pistas ambientais ou narrativas suficientes para serem compreendidos.

As ações realizadas devem alterar fisicamente o cenário.

Exemplo: ao ativar um mecanismo, uma passagem realmente se abre, com animação, som e atualização da colisão.

As mudanças devem permanecer após salvar e carregar.

---

### 8. APROXIMAÇÃO DA ARENA DE KHARN

A aproximação do chefe precisa construir expectativa.

Quando o jogador estiver próximo do salão final:

- Reduza gradualmente os sons de exploração.
- Introduza uma ambiência sonora distinta.
- Apresente sinais visuais de que algo poderoso está próximo.
- Utilize elementos da história para sugerir a função de Kharn.
- Permita encontrar uma última evidência narrativa.
- Ofereça oportunidade de preparar equipamentos e recursos.

Não revele Kharn completamente antes da cutscene.

O jogador deverá encontrar uma entrada monumental para a arena.

Exiba uma interação contextual para atravessá-la.

Após a confirmação, inicie a sequência cinematográfica.

---

### 9. CUTSCENE — A APRESENTAÇÃO DE KHARN

**Esta é uma das partes mais importantes da implementação.**

Crie uma cutscene em tempo real com câmera cinematográfica, animações próprias, iluminação, áudio e diálogos.

Não utilize apenas uma imagem estática com texto.

#### Cena 01 — O salão esquecido

O personagem entra na arena.

A câmera deixa temporariamente de seguir o jogador.

Mostre um plano aberto do salão, destacando sua arquitetura, seus mecanismos e o elemento que Kharn está protegendo.

A música desaparece gradualmente.

O jogador percebe uma presença, mas ainda não consegue identificá-la completamente.

#### Cena 02 — A presença

Utilize movimentos de câmera para revelar progressivamente a figura de Kharn.

A apresentação visual deve respeitar sua descrição canônica.

Não crie uma aparência aleatória ou genérica.

A entrada deve ser imponente, mas não exageradamente longa.

Utilize animações próprias, efeitos de partículas e iluminação ambiental.

#### Cena 03 — O primeiro diálogo

Kharn se dirige ao protagonista, caso isso seja compatível com sua caracterização na bíblia.

O diálogo deve estabelecer um conflito.

O jogador precisa perceber que Kharn não é necessariamente um inimigo comum ou alguém que luta apenas por maldade.

A fala deve sugerir que existe algo importante por trás de suas ações, sem revelar todo o mistério.

Escreva um diálogo com ritmo dramático, pausas e reações do protagonista.

Evite monólogos excessivamente longos.

#### Cena 04 — O início do combate

Após o diálogo, Kharn assume uma postura de combate.

A câmera se afasta gradualmente até retornar à perspectiva isométrica jogável.

Exiba o nome do chefe:

**KHARN**

Abaixo, apresente um subtítulo canônico relacionado ao seu papel na história, caso exista.

A barra de vida do chefe surge com uma animação própria.

A trilha de boss fight começa.

O jogador recebe o controle.

**A transição entre a cutscene e o combate precisa ser contínua, sem tela de carregamento desnecessária.**

---

### 10. BOSS FIGHT — KHARN

Implemente Kharn como um chefe único, com animações, inteligência artificial, ataques e padrões próprios.

Não utilize um inimigo comum com atributos aumentados.

O combate deverá possuir três fases distintas, caso essa estrutura seja compatível com o cânone.

#### Fase 1 — O Guardião

Kharn utiliza ataques relativamente previsíveis.

Objetivo: permitir que o jogador compreenda seus movimentos.

Implemente:

- Ataque básico característico.
- Ataque em área com indicação visual.
- Movimento de aproximação.
- Recuperação após ataques poderosos.
- Janelas reais para contra-atacar.

O jogador deve conseguir aprender os padrões por observação.

#### Fase 2 — O Despertar

Ao atingir aproximadamente 65% da vida, Kharn altera seu comportamento.

Inicie uma transição curta, com animação e alteração musical.

O chefe passa a utilizar ataques mais complexos.

Inclua:
- Novos padrões.
- Combinações de ataques.
- Maior pressão sobre o jogador.
- Efeitos ambientais relacionados ao poder canônico de Kharn.
- Indicações visuais claras antes de golpes perigosos.

A segunda fase não deve consistir apenas em aumentar a velocidade e o dano.

#### Fase 3 — O Último Dever

Ao atingir aproximadamente 30% da vida, Kharn entra em sua fase final.

A transição deve transmitir a importância narrativa do confronto.

Utilize uma breve fala ou reação, caso faça sentido para o personagem.

Introduza um padrão final marcante.

A dificuldade deve aumentar, mas continuar justa.

Evite ataques impossíveis de desviar ou danos inevitáveis.

A fase final precisa testar o domínio das mecânicas aprendidas durante o jogo.

---

### 11. EQUILÍBRIO DO COMBATE

O confronto precisa ser viável para todas as quatro classes:

- Guerreiro.
- Arcanista.
- Assassino.
- Atirador.

Considere diferenças de alcance, mobilidade, recursos e defesa.

Nenhuma classe pode depender de uma habilidade exclusiva de outra para derrotar Kharn.

Implemente:

- Ataques sinalizados.
- Hitboxes corretas.
- Invulnerabilidade temporária coerente.
- Colisões com estruturas.
- Padrões que possam ser aprendidos.
- Intervalos de recuperação.
- Feedback de dano.
- Música dinâmica por fase.

Balanceie o chefe considerando o nível e os equipamentos esperados nesse ponto da campanha.

Não permita exploração trivial de pontos cegos da IA.

O chefe não deve atravessar paredes, sair da arena ou perder o alvo permanentemente.

---

### 12. MORTE, TENTATIVAS E REINÍCIO

Se o jogador morrer durante o confronto:

1. Exiba a interface de derrota existente ou uma versão contextual apropriada.
2. Permita retornar a um ponto seguro anterior ao chefe.
3. Preserve o progresso da exploração.
4. Restaure o estado do chefe para uma nova tentativa.
5. Não repita recompensas.
6. Não obrigue o jogador a percorrer toda a masmorra novamente.

Após assistir à apresentação de Kharn uma vez, permita pular a cutscene em tentativas posteriores.

Não force o jogador a rever diálogos longos após cada derrota.

---

### 13. CUTSCENE — O DESFECHO DO CONFRONTO

Quando a vida de Kharn chegar a zero, não execute imediatamente a animação comum de morte de um inimigo.

Interrompa os ataques e inicie uma sequência narrativa própria.

O desfecho deve respeitar a bíblia, inclusive se Kharn não morrer definitivamente.

#### Cena 01 — O silêncio

A música de combate termina gradualmente.

A câmera destaca Kharn e o protagonista.

Mostre as consequências físicas da batalha.

#### Cena 02 — A verdade parcial

Revele que Kharn estava protegendo algo importante.

A descoberta precisa estar conectada ao mistério da corrupção e à ameaça maior estabelecida na história.

Não transforme essa cena em uma explicação completa de toda a trama.

Revele apenas as informações necessárias para concluir o Capítulo I e motivar o próximo.

#### Cena 03 — A consequência

As ações do jogador provocam uma alteração verificável no mundo.

Pode ser a liberação de uma passagem, a ativação de um mecanismo, a descoberta de um registro ou outro acontecimento canônico.

A consequência precisa existir no estado real do jogo.

#### Cena 04 — O próximo caminho

Apresente uma ligação narrativa com o Bairro da Ferrugem e os acontecimentos de Máquinas Mortas.

O jogador deverá compreender por que sua próxima investigação o levará até lá.

Finalize a cena devolvendo o controle ao jogador.

---

### 14. RECOMPENSAS E PROGRESSÃO

A conclusão do confronto deverá conceder recompensas proporcionais à importância do chefe.

Defina os valores com base na economia e progressão existentes.

As recompensas podem incluir:

- Experiência.
- Moedas.
- Equipamento único.
- Registro narrativo.
- Acesso a novas áreas.
- Atualização do diário.

Não crie um equipamento absurdamente poderoso para esse ponto da campanha.

Não duplique recompensas da missão do selo ou das memórias.

O estado de derrota de Kharn deve ser persistente.

---

### 15. HUD ESPECIAL DE CHEFE

Durante o confronto, apresente uma interface própria.

A barra de vida de Kharn deve ficar em posição central superior, respeitando os demais elementos da HUD.

Inclua:

- Nome do chefe.
- Barra de vida.
- Indicação visual das fases.
- Animação de entrada.
- Feedback de dano.
- Transições visuais entre fases.

Não cubra o personagem nem informações essenciais.

A HUD deve retornar ao estado normal após o confronto.

---

### 16. SISTEMA DE CUTSCENES E CÂMERA

Reutilize o sequenciador cinematográfico criado para o prólogo, se estiver disponível.

Não crie um sistema paralelo desnecessário.

As cutscenes devem suportar:

- Movimentos suaves de câmera.
- Controle de enquadramento.
- Animação de personagens.
- Diálogos.
- Música.
- Efeitos sonoros.
- Partículas.
- Iluminação.
- Bloqueio temporário de controles.
- Pular cenas com segurança.
- Restauração automática da câmera.

O personagem e Kharn devem permanecer nas posições corretas quando a cena terminar.

Pular uma cena não pode duplicar o chefe, impedir a batalha ou quebrar a missão.

---

### 17. DIÁLOGOS E CONSEQUÊNCIAS

Escreva todos os novos diálogos em português brasileiro.

As falas precisam respeitar as personalidades canônicas.

Inclua reações dos NPCs aos acontecimentos.

Após derrotar Kharn, personagens relevantes devem reconhecer as consequências da batalha.

O diário deve registrar as informações descobertas.

Não faça os personagens continuarem dizendo que Kharn ainda precisa ser enfrentado depois da conclusão da missão.

Se houver mudanças no mundo, elas devem aparecer também na exploração e nos objetivos.

---

### 18. PERSISTÊNCIA E COMPATIBILIDADE

Preserve o sistema de salvamento existente.

Registre:

- Etapas da missão.
- Investigações concluídas.
- Estado de Bizel.
- Mecanismos ativados.
- Ruínas descobertas.
- Atalhos desbloqueados.
- Cutscenes assistidas.
- Kharn derrotado.
- Recompensas recebidas.
- Consequências narrativas.

Saves antigos precisam continuar válidos.

Não reinicie automaticamente o Capítulo II de jogadores que já alcançaram Ferrugem.

Crie uma estratégia de migração para permitir que jogadores avançados acessem o novo conteúdo sem destruir seu progresso.

---

### 19. TESTES OBRIGATÓRIOS

Valide:

1. Continuidade a partir de uma nova jornada.
2. Continuidade a partir de um save intermediário.
3. Compatibilidade com saves antigos.
4. Investigação em Pedralta.
5. Confronto com Bizel.
6. Entrada nas Ruínas Esquecidas.
7. Exploração e mecanismos.
8. Acesso à arena.
9. Cutscene de apresentação de Kharn.
10. Transição da cutscene para o combate.
11. Todas as fases do chefe.
12. Funcionamento com as quatro classes.
13. Morte e nova tentativa.
14. Pular cutscenes.
15. Conclusão do combate.
16. Cutscene final.
17. Recompensas únicas.
18. Persistência após recarregar.
19. Liberação da próxima etapa.
20. Ausência de softlocks.

Execute `npm test`, `npm run build` e `npm run test:e2e`.

Corrija falhas antes de declarar a implementação concluída.

---

### 20. ORDEM DE IMPLEMENTAÇÃO

Execute em fases:

**Fase A — Auditoria:** confirme a história, o estado atual do código e o encaixe do novo conteúdo.

**Fase B — Continuidade narrativa:** implemente os objetivos intermediários, diálogos e Bizel.

**Fase C — Ruínas Esquecidas:** crie o mapa, os encontros, mecanismos, caminhos e arena.

**Fase D — Kharn:** implemente sprite, animações, IA, ataques, fases, efeitos e equilíbrio.

**Fase E — Cinematografia:** produza a apresentação e o desfecho com câmera, áudio e diálogos.

**Fase F — Integração:** conecte o resultado ao sistema de missões, recompensas, HUD e save.

**Fase G — Validação:** teste o percurso completo e documente o resultado.

Atualize o README e crie `docs/KHARN_BOSS_IMPLEMENTACAO.md`.

---

### 21. RESULTADO ESPERADO

Ao concluir esta implementação, quero poder iniciar Distrito Zero, avançar pela história, investigar os acontecimentos de Pedralta, explorar as Ruínas Esquecidas e chegar ao confronto com Kharn de maneira natural.

Quero que a entrada do chefe seja cinematográfica.

Quero que suas animações, seus ataques e suas fases tenham personalidade.

Quero que a batalha tenha peso narrativo.

E, principalmente, quero que a conclusão revele algo importante sobre o universo de Distrito Zero, criando uma ligação real com os próximos capítulos.

**Kharn não deve ser apenas um obstáculo. Ele deve ser um personagem fundamental para a história.**

Não entregue apenas documentação, pseudocódigo, um chefe genérico ou uma demonstração isolada.

Implemente o conteúdo real, preservando a identidade visual, a arquitetura e a bíblia do jogo.