# Árvore de habilidades de Distrito Zero

A solicitação original está em [ARVORE_SOLICITADA.md](ARVORE_SOLICITADA.md). Abra **K** no jogo. A árvore ocupa a tela, mostra todos os caminhos e permite selecionar nós bloqueados para consultar os requisitos. **WASD**, ataque principal no mouse e habilidades em **1–4** continuam funcionando.

## Conteúdo e escolhas

- Quatro classes, três especializações por classe, quinze nós principais por especialização: **180 nós principais**, incluindo doze supremas.
- **36 melhorias**, três para a primeira ativa de cada ramo; escolha até duas por habilidade. Impacto Brutal aumenta dano e interrupção; Guarda Reforçada concede escudo após acertar; Ruptura de Defesa aplica exposição.
- **12 conexões híbridas**, com exigência de quatro nós em cada ramo envolvido.
- **12 escolhas de Maestria**, uma selecionada por classe, liberadas no nível 60 após vinte abates, dois baús e a conclusão do selo de Kharn.
- Os dezesseis poderes do jogo anterior permanecem como fundamentos. Dois são gratuitos em cada classe; os outros podem ser aprendidos com pontos.
- Quatro atalhos configuráveis, sem habilidades repetidas e com uma suprema equipada por vez. Passivas não ocupam atalhos.

A personagem ganha um ponto por nível de 2 a 60, totalizando **59 pontos por perfil de classe**. O nível é compartilhado ao trocar de caminho, mas cada classe mantém sua alocação e três builds próprias. Trocar de classe não devolve pontos gastos naquela classe nem duplica seu orçamento. O contador deriva do nível e dos custos dos nós, inclusive ao carregar um save.

Nós têm nível mínimo, ancestrais e investimento mínimo no ramo. Os marcos incluem níveis 5, 15, 25, 35, 45 e 60. As supremas exigem doze nós no próprio ramo. Toda a árvore pode ser explorada antes de gastar pontos.

## Combate

| Classe    | Recurso                                                                       | Comportamentos dos ramos                                                                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Guerreiro | Ímpeto, até 100, gerado por acertos e bloqueios                               | Vanguarda: interrupção, provocação, escudos, retaliação e zona defensiva. Berserker: sequência ofensiva, sangramento, frenesi, execução e recuperação limitada de vida. Cavaleiro Rúnico: marcas, lentidão, prisão, pilar, detonação e interação com o elemento da arma. |
| Arcanista | Essência, representada pela reserva MP, com regeneração                       | Piromancia: queimadura, orbe explosivo, áreas incendiadas, propagação e canalização. Vazio: corrupção, imobilização, atração, ecos atrasados, mobilidade e consumo de marcas. Tecelão: escudos, eficiência, duplicação, interrupção e campos de amplificação.            |
| Assassino | Combo, até 10, gerado por acertos e esquivas precisas, decai após inatividade | Sombra: menor detecção, furtividade, emboscadas, marca e lâmina que retorna. Veneno: toxinas acumuláveis, corrosão, paralisia, transmissão e proteção. Duelista: esquivas, contra-ataque condicionado, variedade de combos e sequências de cortes.                       |
| Atirador  | Foco, até 100, gerado ao ficar parado, acertar e atingir alvos marcados       | Franco-atirador: precisão, marcas, perfuração, ricochete e tiros carregados. Engenhoqueiro: minas, torretas, revelação, controle e detonação remota. Caçador: presa marcada, laços, armadilhas, reposicionamento e recuperação de consumíveis de criaturas.              |

Ataques especiais podem consumir 20 de Ímpeto/Foco ou três de Combo para reforçar o golpe. Supremas exigem 60 de recurso, ou oito de Combo, e têm recarga inicial de 75 segundos. Habilidades canalizadas carregam ao segurar sua tecla, até dois segundos; soltar libera o ataque. As supremas canalizadas têm preparação mínima maior.

Queimadura, veneno, sangramento, marcas e bônus têm limites. Efeitos acumuláveis chegam a cinco acúmulos e doze segundos. Recuperação de vida no frenesi tem orçamento de 5% da vida máxima por segundo. Alvos resistentes, com pelo menos 200 HP máximos, recebem controle reduzido e uma janela de resistência que impede interrupção contínua.

Tiro Fantasma atravessa árvores e cercas; casas e limites continuam bloqueando o projétil. Investidas, atração e movimentação inimiga respeitam as colisões existentes. Recargas pertencem ao ID da habilidade, impedindo que mudar seu atalho as reinicie.

Maestrias alteram comportamentos: proteção durante guarda, frenesi sem penalidade defensiva, ressonância rúnica, explosões de fogo, maior duração de controle dimensional, eficiência de Essência, retorno à furtividade após emboscada, propagação tóxica ampliada, recargas por esquiva, perfuração dos disparos, torretas com dois alvos e mobilidade de caça. Uma aura discreta identifica a escolha.

Os inimigos comuns reaparecem depois de 90 segundos quando o jogador está a mais de oito unidades de seu ponto de origem. Sua vida cresce com o nível. Isso permite continuar ganhando experiência após os nove encontros iniciais, preservando a recompensa única da missão e dos baús.

## Interface e builds

Selecionar um nó mostra descrição, requisitos exatos, custo, recarga, alcance, escala de ataque quando aplicável, melhorias e sinergias. A prévia usa o atlas existente em um Canvas separado e não modifica o combate nem gasta pontos.

Guarde até três builds por classe. A comparação informa pontos, habilidades equipadas e nomes de nós adicionados/removidos. Redistribuir ou carregar uma build custa **25 + 5 × nível** moedas e só funciona fora de combate. Redistribuir pede confirmação, devolve os pontos e preserva nível, inventário, missão e builds salvas. Carregar verifica orçamento e dependências antes de cobrar.

A tela tem três ramos conectados, conexões híbridas, detalhes laterais e rolagem. No celular, a seleção leva aos detalhes. Ações preservam a rolagem. Os slots vazios da HUD abrem a árvore.

## Dados e persistência

- `src/skill-catalog.ts`: nomes, tipos e descrições dos 180 nós originais.
- `src/skills.ts`: IDs estáveis, grafo, melhorias, conexões, requisitos, custos, equipagem, builds e validação.
- `src/skill-engine.ts`: efeitos, recursos, gatilhos de passivas, marcas, áreas, dispositivos e modificadores.
- `src/combat.ts`: preparação, canalização, acertos, projéteis, dano, efeitos periódicos e recompensas.
- `src/skill-panel.ts` e `src/ui.ts`: árvore, prévia, comparação, atalhos e transações.

O payload do save passa a versão **2**, mantendo a chave `distrito-zero:v1` para localizar automaticamente o progresso anterior. Saves v1 migram inventário, equipamentos, nível, missão, baús e poderes já desbloqueados. Os pontos são recalculados pela nova regra; o custo dos antigos desbloqueios continua representado pelos fundamentos pagos. Não é necessário apagar dados do navegador.

A versão 2 salva os quatro perfis, três presets por classe, escolha de Maestria, desafios, recurso e recargas por ID. Saves com dependências inválidas, gasto excessivo, atalhos de outra classe ou múltiplas supremas são recusados. Estados transitórios de combate, como campos ativos e furtividade, são encerrados ao carregar; os poderes aprendidos permanecem disponíveis.

## Arte e balanceamento

Animações e efeitos utilizam os atlas locais existentes, com cores por ramo, indicadores de status, furtividade, partículas discretas e sons sintetizados por elemento. A prévia e o jogo usam nearest-neighbor. Não foram produzidos 180 novos conjuntos de animação exclusivos. O capítulo atual contém bandidos e lobos, sem aliados controlados ou chefe dedicado; os efeitos de proteção têm aplicação no próprio personagem e as regras de resistência atuam nos inimigos resistentes.

Os valores iniciais de dano, alcance, duração, custo e recarga estão nos dados e no motor, para balanceamento posterior. A validação automatizada cobre regras de progressão e efeitos; não representa uma campanha completa até o nível 60 nem equilíbrio competitivo entre todas as combinações.
