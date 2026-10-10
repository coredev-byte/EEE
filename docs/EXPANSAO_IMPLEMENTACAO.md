# Expansão jogável: Bairro da Ferrugem

Pedido: [EXPANSAO_SOLICITADA.md](EXPANSAO_SOLICITADA.md). Base: `119e5fd`. Foram analisados mundo, regiões, combate, IA, missões, save, áudio, oclusão, HUD e os testes existentes antes das alterações. Esta entrega usa a alternativa expressa no pedido: uma região nova completa e a arquitetura para expandir as demais.

## O que está jogável

**Três mapas reais de 28 × 28:** Vila Pedralta, Margem de Kharn e Bairro da Ferrugem. Pedralta e Kharn conservam seus mapas, encontros, recompensas, marcos e diálogos. A nova estrada em Kharn, em `(24,18)`, abre após entregar as três memórias à Guardiã em Pedralta. Use F junto à passagem. Ferrugem tem retorno em `(4,22)`, com chegada em Kharn junto à mesma estrada, e Kharn continua ligado à vila.

Ferrugem contém ruas industriais, oficinas, canal de refrigeração, depósito, abrigo, arena cercada da Fornalha, dois baús, sete objetos de investigação/coleta/reparo, Elcio e Nara. O piso recebe tons de ferrugem; os autômatos possuem desenho próprio em pixel art por código. Construções e NPCs reutilizam os atlas existentes. A ambiência mecânica original usa um loop local adicional, sintetizado e reproduzível; o mixer mantém música e efeitos separados.

O portão térmico não pode ser contornado: as paredes cercam a arena. A bomba abre sua entrada. A passarela opcional abre uma travessia física no canal, reduzindo o retorno ao abrigo. Alterar essas paredes invalida a grade de navegação para não manter rotas antigas.

## Missões e consequências

| Missão                            | Percurso verificável                                                                                                                            | Recompensa e consequência                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| O Eco de Kharn — existente        | Entrada, três ameaças, selo                                                                                                                     | 200 XP, 250 moedas, Memória de Kharn; acesso a Kharn                                                               |
| As Memórias da Margem — existente | Iria, três vigias/marcos, entrega à Guardiã                                                                                                     | 300 XP, 180 moedas, Olho de Kharn; Estrada das Caldeiras                                                           |
| Máquinas Mortas — principal nova  | Entrar em Ferrugem, falar com Elcio, recuperar engrenagem, recuperar fusível, consertar bomba, ler manifesto, derrotar Mestre, entregar a Elcio | 420 XP, 240 moedas, Anel das Caldeiras; Fornalha segura e pista dos fragmentos do Núcleo enviados ao Jardim do Véu |
| Vozes no Depósito — opcional      | Aceitar com Elcio ou no diário após conhecê-lo, ler diário, derrotar Sucateiro Voraz, encontrar Nara, relatar a Elcio                           | 180 XP, 100 moedas, Couraça da vigília; Nara volta ao abrigo e Elcio vende poções por 50 moedas                    |
| Uma Ponte para Casa — opcional    | Aceitar após conhecer Elcio, recuperar manivela, acionar guincho                                                                                | 100 XP, 60 moedas, uma poção; abre a passarela sul                                                                 |

Os componentes e documentos encontrados antes da aceitação ficam registrados e contam quando cabível. Reparar a bomba exige conversa e ambos os componentes; reparar a passarela exige a missão aceita e a manivela. Nara só deixa o depósito após a derrota do Sucateiro. As secundárias não bloqueiam a principal. Recompensas são concedidas uma vez, na conclusão; XP, moeda, poções e equipamentos usam os sistemas atuais. O Anel tem atributos moderados e pode ser equipado pelo inventário.

O Mestre da Fornalha possui 300 HP, combate real, arena acessível após refrigeração, sinal de início, descarga de calor anunciada antes do dano e sobrecarga abaixo de metade da vida. O Sucateiro Voraz possui 180 HP e é opcional. Mortes dos encontros industriais são permanentes, inclusive após retornar ou carregar o save; os inimigos comuns de Pedralta mantêm o comportamento anterior de reaparecimento.

## Missões, HUD e descoberta

`missions.ts` define identificador, contexto, origem, iniciador, pré-requisitos, etapas, eventos, recompensa e consequência. Os estados são bloqueada, disponível, ativa e concluída. As duas missões legadas são adaptadas dos campos existentes `quest` e `campaign`, sem apagar saves nem conceder recompensas antigas novamente. O mesmo catálogo alimenta o diário, os requisitos e a seleção do objetivo; as ações do jogo registram os eventos das novas etapas.

O diário J permite aceitar e rastrear secundárias, voltar ao rastreamento principal, consultar os cinco percursos, regiões visitadas, passagens conhecidas e documentos/componentes. Concluir a missão rastreada devolve o foco à principal. O objetivo usa as posições atuais dos NPCs, objetos e inimigos. Ao estar em outro mapa, indica a passagem correta da rota Pedralta → Kharn → Ferrugem. A nova campanha continua após a entrega das memórias e encerra seu destaque após a entrega do manifesto, deixando exploração livre e secundárias disponíveis.

O minimapa continua circular no canto superior direito. Mostra o jogador azul, passagem aberta verde, passagem bloqueada âmbar, ponto de interesse roxo e objetivo principal ou secundário com símbolos distintos. A estrada nova só é revelada quando encontrada ou informada pela entrega das memórias. Recursos respeitam a descoberta de células; locais opcionais não são revelados antecipadamente. Depósito, canal, pátio da Fornalha e esconderijo têm descoberta persistente com notificação. A oclusão local anterior protege personagem, alvos e interativos próximos; os objetos industriais entram nessa mesma lógica.

## Save e recuperação

Formato **v4**, mantendo a chave `distrito-zero:v1`. Migra v1/v2/v3, conserva personagem, builds, inventário, baús, mortes e progresso legado, acrescentando região industrial vazia de progresso. Saves v3 com as memórias concluídas já podem seguir para Ferrugem. Ao gravar pela primeira vez, o texto antigo é copiado integralmente para `distrito-zero:v1:backup:v1`, `:backup:v2` ou `:backup:v3`, conforme a versão. A cópia não é sobrescrita. Pode ser recuperada pelas ferramentas do navegador, recolocando seu valor na chave original; não há botão de recuperação na interface.

Registra região atual, regiões visitadas, passagens conhecidas/abertas, chefes, mudanças, eventos de missão, aceitação, conclusão e rastreamento, além da descoberta, baús e HP/posição dos encontros por mapa. Estados inválidos são recusados. Uma posição antiga dentro de obstáculo é recuperada para chão válido; portões restaurados são aplicados antes de verificar a posição. Saves corrompidos não impedem começar e salvar uma nova jornada. Saves v4 não são compatíveis com versões antigas do jogo; o backup preserva o dado original para retorno.

## Arquivos alterados

| Grupo                    | Arquivos                                                                                                                                                                                                                                                                                                    | Resultado                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Mundo e continuidade     | `src/regions.ts`, `src/world.ts`, `src/navigation.ts` (reutilizado), `src/save.ts`                                                                                                                                                                                                                          | Registro de três mapas jogáveis e quatro distritos futuros, conexões, composição, portões, progresso e migração |
| Missões e interação      | `src/missions.ts` (novo), `src/game.ts`, `src/mission-ui.ts` (novo), `src/ui.ts`, `src/style.css`                                                                                                                                                                                                           | Catálogo comum, eventos, diálogo, recompensa, diário, comércio e rastreamento                                   |
| Combate e apresentação   | `src/state.ts`, `src/combat.ts`, `src/enemies.ts`, `src/renderer.ts`, `src/objectives.ts`, `src/minimap.ts`, `src/data.ts`                                                                                                                                                                                  | Autômatos, chefe, sinais de combate, objetivos, pontos de interesse e novo acessório                            |
| Áudio                    | `src/audio-catalog.ts`, `src/audio.ts`, `public/audio/ambience/machinery.wav`, `public/audio/inventory.json`, `scripts/create_machinery.py`, `scripts/create_audio.py`, `scripts/test_audio.py`                                                                                                             | Paisagem industrial, arquivo original, inventário e reprodução verificável                                      |
| Testes                   | `tests/missions.test.ts`, `tests/regions.test.ts`, `tests/audio.test.ts`, `tests/skills.test.ts`, `tests/visibility.test.ts`, `tests/e2e/ferrugem.spec.ts`, `tests/e2e/region-helpers.ts`, `tests/e2e/regions.spec.ts`, `tests/e2e/visibility.spec.ts`, `tests/e2e/audio.spec.ts`, `tests/e2e/game.spec.ts` | Progressão, geometria, migração, recompensas, combate, áudio e percursos com controles reais                    |
| Documentação e evidência | `README.md`, este relatório, `docs/EXPANSAO_SOLICITADA.md`, `artifacts/ferrugem-*.png`                                                                                                                                                                                                                      | Instruções atuais, escopo e capturas do percurso                                                                |

## Validação

**Resultados finais:** `npm test` — 93 testes aprovados em oito arquivos; `npm run test:e2e` — 27 cenários Chromium aprovados; `python3 scripts/test_audio.py` — dois testes PCM aprovados; `npm run build` — TypeScript e Vite aprovados; `git diff --check` — sem erros. As contagens antigas de áudio nos testes foram atualizadas para incluir o 54º arquivo e o oitavo loop. Nenhuma verificação foi desativada.

O percurso novo passou usando WASD/Shift, mouse, habilidades 1/2, poções e F, sem escrever no estado de execução. O teste parte de um save legado de Kharn com a missão anterior concluída; atravessa a estrada, conclui as três missões, combate os cinco encontros, recarrega no meio do capítulo, compra provisões, retorna a Kharn e volta a Ferrugem. Verifica recompensa única, morte do chefe, deslocamento de Nara e ausência de erros de JavaScript.

## Pendências explícitas

- Jardim do Véu, Cidade Afogada, Distrito das Cinzas e Distrito Zero têm apenas registro de mundo futuro. Não há transições selecionáveis, mapas vazios ou missões fictícias dessas regiões.
- Os capítulos III–VI, Leda, Lenno, Vark, P11, Ivis e o confronto final permanecem por implementar.
- Bizel e o confronto com Kharn solicitado para reformular o capítulo I não foram acrescentados nesta expansão vertical. O conteúdo anterior de Pedralta/Kharn foi preservado.
- A variedade completa de atividades, decisões entre facções, crafting, interiores e novas habilidades como recompensas não foi implementada. Há duas secundárias completas, documentos, componentes, um atalho, um mini-chefe, baús e comércio.
- A arte industrial usa construções/NPCs existentes e autômatos por código; não inclui um atlas exclusivo de arquitetura, retratos ou animações de NPCs. O áudio é sintetizado de desenvolvimento.
