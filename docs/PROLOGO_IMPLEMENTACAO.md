# Prólogo — roteiro técnico

## Auditoria e limites do cânone

Fontes: README, ESPECIFICACAO, REGIOES_SOLICITADAS, REGIOES_IMPLEMENTACAO,
EXPANSAO_SOLICITADA, EXPANSAO_IMPLEMENTACAO e AUDITORIA_RPG. Pedralta,
a Guardiã, o selo e a Memória de Kharn estão implementados. Bizel e os distritos
futuros pertencem à expansão solicitada. Não são revelados neste prólogo.
As falas acrescentadas são observações da Guardiã e do protagonista, não uma
explicação da Ruptura nem uma identidade ou origem definitiva do Eco.

## Roteiro final e transições

1. **Antes do silêncio**: som ambiente sobre preto; câmera percorre as ruínas
   reais de Pedralta. Narração: “As pedras ficaram. As vozes, não.”
2. **O sinal**: a câmera encontra o selo; pulso de luz e partículas do sistema
   existente. “Alguma coisa ainda responde.”
3. **Despertar**: a câmera retorna ao personagem real em seu ponto seguro.
   “Primeiro, preciso encontrar quem ainda vive aqui.” Controle devolvido.
4. **Primeiros passos**: movimento válido e corrida; encontro com a Guardiã.
   Diálogo manual, missão oficial aceita sem criar outra recompensa.
5. **Primeira ameaça**: combate real contra os inimigos existentes, usando a
   classe escolhida. Após a primeira baixa, **Algo fora do lugar** dirige a
   câmera ao selo: “O vento parou. O eco continuou.”
6. **Preparação**: habilidades reais, consumíveis somente quando necessários,
   baú real, mochila, diário, classe e árvore. Ações antecipadas são reconhecidas.
7. **Primeiro Eco**: as três ameaças e a abertura do selo são os objetivos da
   missão existente. **Evidência**: “Uma memória. Não uma resposta.”
8. **Entrega**: “Kharn está além do selo. A Guardiã ainda espera notícias.”
   Retorno integral ao fluxo Pedralta → Margem de Kharn → três marcos → Guardiã
   → Estrada das Caldeiras → Ferrugem.

Pacing alvo: 12–18 minutos para uma primeira exploração, sem esperas artificiais.
Não é uma medição de jogadores. Quem já domina os sistemas pode avançar antes.
Menus suspendem os relógios; falas avançam apenas por ação do jogador.
Cada cena pode ser pulada; pular executa a mesma conclusão, sem recompensas.

## Contratos

Sequenciador em tempo real dirige câmera, zoom, fade e partículas do renderer.
FSM observa ações verdadeiras, não somente teclas. Dicas possuem prioridade,
duração, histórico e reapresentação. Uma dica visível por vez. O save v4 recebe
um bloco opcional validado; saves anteriores continuam a campanha normalmente.
Cena interrompida reinicia do começo seguro; o jogador nunca é reposicionado
em um tile bloqueado. Progresso e mortes continuam sob os sistemas existentes.

## Implementação e estados persistentes

| Módulo | Responsabilidade |
| --- | --- |
| `prologue-story.ts` | Sete definições de cena, falas e respostas contextuais da Guardiã |
| `cinematics.ts` | Sequenciamento, interpolação, zoom, fade, pulso e retorno da câmera ao personagem |
| `prologue.ts` | FSM observacional, conclusão monotônica, eventos de ações e recuperação |
| `tutorial-hints.ts` | Dicas com prioridade, mínimo/máximo de exposição, silêncio e reapresentação |
| `prologue-ui.ts` | Legendas, botão de pular, dicas temporárias e destaque breve na HUD |
| `game.ts` | Fatos de gameplay, bloqueio de entradas, áudio, morte, câmera e salvamento |
| `save.ts` | Bloco opcional `prologue` no contrato v4, validação e compatibilidade |
| `mission-ui.ts` | Registro do tutorial no diário existente, sem outra missão premiada |

O bloco salva `version`, `step`, `scenes`, `hints`, `events`, `moved`, `ran` e
`complete`. Eventos `done:*` tornam a conclusão monotônica: recuperar a vida e
sofrer dano depois não faz uma lição concluída voltar. O avanço não depende de
uma tecla que pode falhar; depende dos fatos abaixo.

| Etapa | Condição real de conclusão |
| --- | --- |
| Movimento | 1,5 tiles efetivamente percorridos, incluindo 0,5 em corrida |
| Guardiã | Missão aceita pelo diálogo, ou selo já concluído |
| Exploração | Entrada encontrada pela missão oficial |
| Combate | Primeira baixa registrada pela missão |
| Habilidades | Ativação confirmada das habilidades dos slots 1 e 2; prévias e negações não contam |
| Consumíveis | Poção realmente utilizada, ou recursos completos quando a lição chega |
| Baú | Contador real de baús abertos |
| Mochila | Seleção, comparação, equipamento ou remoção válidos |
| Diário, classe, árvore | Respectivo painel acessado durante a jornada |
| Confronto | Três ameaças registradas pela missão |
| Selo | Recompensa oficial recebida uma única vez |

As primeiras três cenas precedem o controle. A anomalia ocorre após a primeira
baixa; o enquadramento da ameaça restante ocorre após duas, caso ainda não
tenham sido vencidas três. Eliminar várias ameaças juntas não obriga a repetir
um confronto. Evidência e entrega seguem a abertura oficial do selo. Cenas
suspendem combate e deslocamento; diálogos e menus suspendem também relógios.
As posições não são teleportadas para objetos decorativos. A câmera aproxima-se
do personagem ao final; pular limpa teclas retidas e restaura sua câmera.

A FSM reconhece ordem livre. Não ergue paredes invisíveis nem remove menus do
jogador. O tutorial não cria inimigos: a IA, as colisões, os telegraphs, a morte,
o retorno à vila, os níveis, os itens e as recargas continuam nos sistemas reais.
O terceiro confronto pode ser antecipado, respeitando ataques em área. A ameaça
restante é uma cena contextual sobre encontros existentes, não um novo chefe.

O consumível deixa de ser obrigatório se ambos os recursos estiverem completos.
O elixir também recusa consumo quando não recuperaria nada. A mochila não exige
equipar algo pior. A árvore não concede pontos artificiais. A Guardiã responde
às baixas já registradas e ao baú encontrado. Sua conversa avança manualmente;
o retrato usa o mesmo atlas de personagem empregado para a NPC no mundo.

## Recuperação, som e acessibilidade

O save continua v4 com `prologue` opcional. Ausência do bloco em v1–v4 significa
jornada anterior: a campanha continua sem outra abertura ou recompensa.
Metadados narrativos malformados são descartados sem apagar personagem e missões.
Backups v1–v3 continuam no mecanismo existente. Só cenas concluídas persistem:
fechar uma cena reinicia essa cena por suas condições canônicas, sem restaurar
zoom, input ou uma câmera transitória. `pagehide` e autosave preservam o avanço.
Sair ao menu durante uma cena permite continuar ou escolher uma nova classe.
A morte não inicia novas cenas antes do despertar.

O mixer existente recebe o estado `narrative`; wind/água/estrutura continuam
ambientando o mapa e pulsos usam o evento `object.portal`. Não há outro player
musical, reset de áudio dentro do sequenciador nem dublagem sintética. Volumes,
mute, desbloqueio por gesto e suspensão de aba continuam no mixer central.

`prefers-reduced-motion` remove deslocamentos e zoom dirigidos e atenua o pulso.
O botão de pular aceita clique e Enter. As dicas podem ser ocultadas e retornam
após um intervalo. Há uma dica por vez; o diário preserva as orientações.
A HUD desaparece nas cenas e retorna com transição de opacidade, desativada em
movimento reduzido. A camada narrativa deixa o canvas receber cliques de combate.

## Validação e limites

Os testes de navegador usam teclado, mouse, baús, diálogos e passagens reais.
O objeto `__DZ` fornece somente observação; nenhum teste do prólogo escreve
progresso em runtime para produzir uma conclusão. Os testes antigos de saves
continuam verificando a migração e as campanhas de Kharn e Ferrugem.

A estimativa de 12–18 minutos é uma meta de ritmo para exploração inicial;
ainda requer avaliação com jogadores. Os testes automatizados pulam cenas e
executam ações rapidamente e não validam essa duração. A implementação usa os
atlas, mapas e mixer existentes; não acrescenta um filme, mapa de prólogo,
nova facção, explicação da Ruptura ou recompensa duplicada.

Resultados executados neste ambiente:

| Comando | Resultado |
| --- | --- |
| `npm test` | 124 testes aprovados, 11 arquivos |
| `npm run build` | TypeScript e build Vite aprovados |
| `npm run test:e2e` | 35 testes aprovados, 4,3 minutos |
| `npx playwright test tests/e2e/prologue.spec.ts` | 8 testes aprovados, 49,2 segundos, após os ajustes finais de acessibilidade |

A execução geral precedeu os últimos ajustes de Enter durante pause, corte da
câmera em movimento reduzido e prevenção de anúncios repetidos. Esses ajustes
receberam testes novos e nova execução de unitários, build e toda a suíte do
prólogo. Há 36 casos distintos de navegador no repositório (o último caso de
acessibilidade foi acrescentado após a execução geral). A suíte cobre também
morte/despertar, quatro classes, baús, inventário, missão inicial, saves antigos,
Kharn completo, Ferrugem e recompensas únicas. Duas execuções iniciais foram
interrompidas ou invalidadas por mudanças de código e recarregamentos do Vite;
os resultados aprovados acima pertencem às execuções estáveis subsequentes.

A inspeção visual confirmou cenas sobre o mapa real, HUD oculta durante a cena,
retorno ao personagem e dicas temporárias no canto inferior esquerdo. Não foi
realizado estudo de ritmo com jogadores nem adicionada dublagem gravada.
