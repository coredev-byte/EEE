# Áudio de Distrito Zero: implementação e limites

A auditoria da base anterior está em [AUDIO_AUDITORIA.md](AUDIO_AUDITORIA.md); o pedido completo está em [AUDIO_SOLICITADO.md](AUDIO_SOLICITADO.md). O jogo existente foi preservado. Esta entrega implementa a arquitetura e integra os sistemas presentes, com áudio original sintetizado de desenvolvimento. Não equivale à entrega de uma biblioteca gravada e de uma trilha profissional finalizada.

## O que funciona

- `src/audio.ts`: cache único de fetch e decode, liberação após gesto, erros não bloqueantes, buses, persistência, escolha de variantes sem repetição imediata, distância/pan isométrico, prioridade e cancelamento por dono. Não há osciladores gerados a cada ação.
- `src/audio-catalog.ts`: catálogo de eventos e arquivos reais. Todos os nós da árvore têm uma configuração; as habilidades reutilizam famílias coerentes com elemento/mecânica, variação de processamento e camadas de aprimoramento. Isso **não** significa 256 gravações exclusivas. Passivas usam os eventos das ações que modificam.
- `src/combat.ts`: preparação no início, golpe após a preparação de 160 ms e impacto no contato. Projéteis têm lançamento e colisão separados; magia combina lançamento com transiente de projétil e impacto com o elemento/material. Golpes no vazio, impactos no cenário, críticos, proteção, dano, morte, recurso insuficiente e recarga têm eventos. Dano periódico não dispara impactos incessantes; recompensa/morte é única.
- `src/skill-engine.ts`: manutenção e encerramento de buffs, defesa, furtividade e zonas, com dono estável; canalização cessa ao liberar; torretas disparam com alvo real e armadilhas soam quando detonadas. Reinício, morte, mudança de classe e restauração de build cancelam os donos antigos.
- `src/enemies.ts`: detecção, preparação, ataque e passos de lobos/bandidos, com posição no mundo. Inimigos não herdam arma/armadura do jogador.
- `src/game.ts`: passos do jogador medidos pelo deslocamento, pedra/vegetação conforme o mapa, três ambientes derivados da posição (vila, vegetação, ruínas), baús, portal, poções e descoberta de área. A amostra de madeira está preparada; não foi inventado piso de madeira junto aos bancos.
- `src/ui.ts`, `src/style.css`: controles em **M → Configurações**, volume principal, música, ambiente, combate, interface e mute. Comparar/equipar/remover têm eventos diferentes. Avisos de coleta mostram ícone, nome, raridade, descrição e quantidade; acumulam o mesmo item recebido rapidamente. Conversa textual com a Guardiã permite avançar, escolher resposta e aceitar a missão; não há dublagem simulada.
- `src/state.ts`, `src/save.ts`: aceitação opcional da missão é persistida e validada, mantendo saves anteriores.
- `src/main.ts`: suspensão ao esconder a página, limpeza ao sair e retomada compatível com bfcache.

## Mixagem e desempenho

São até **18 fontes de efeitos** e **7 loops** (4 ambientes + 3 stems). Efeitos relevantes podem substituir fontes de menor prioridade; a substituição imediata evita ultrapassar o orçamento com novas fontes. Cancelamentos normais têm fade de 20 ms. Intervalos por evento evitam metralhadoras de impacto/status. A coleta aguarda 70 ms, seleciona o evento mais importante do lote e limita novos lotes a 350 ms; reiniciar cancela também a fila.

Volumes têm rampas de 40 ms. Música/ambiente reduzem moderadamente por 700 ms em eventos prioritários. O sinal passa por compressor, saturação suave e teto final de ±0,88; o teto final evita o overshoot do filtro de oversampling, encontrado pelo teste de sobrecarga. Isso limita clipping digital; avaliação auditiva e mixagem em diferentes dispositivos ainda são necessárias.

Menus cancelam efeitos de combate e permitem interface/prévias. Ao retornar, uma manutenção só reaparece se a habilidade ainda existir. Página oculta suspende o contexto; arquivos indisponíveis são registrados por caminho e não impedem o jogo. Eventos solicitados antes do decode não são reproduzidos atrasados.

Os stems locais compartilham transporte de 16 s. As transições de 1,2 s alteram ganhos, sem recriar fontes ou reiniciar música. Estados disponíveis: menu, seguro, perigo, combate, elite, chefe, vitória, derrota e narrativa. O jogo atual seleciona os estados reais de menu/exploração/ameaça/combate/narrativa/vitória/derrota; o limiar de 200 HP usa a mesma definição de ameaça resistente já existente no combate. **Chefe só tem suporte no mixer: não há chefe implementado nesta entrega.**

## Recursos realmente entregues

`public/audio/inventory.json` relaciona cada arquivo, duração, pico, RMS e indicação de loop. São **53 WAV PCM mono, 16 bits, 22.050 Hz, aproximadamente 4,15 MiB**: 46 efeitos, 4 ambientes de 8 s e 3 stems de 16 s. `scripts/create_audio.py` reproduz a geração com NumPy e semente fixa, usando ruído filtrado, transientes, ressonadores e envelopes; lâminas, impactos e passos têm três variantes diferentes. Todos os caminhos do catálogo apontam para arquivos existentes. Não há download, serviços externos, gravações atribuídas a terceiros nem faixas fictícias.

A direção usa vento/estrutura graves discretos, água/insetos de fundo, ação seca e interface curta. As três camadas musicais são um esboço original em ré menor, **não** composições completas específicas de cada região ou chefe.

Para substituir assets, forneça arquivos locais e altere `AUDIO_FILES`/`SKILL_AUDIO` em `src/audio-catalog.ts`; stems sincronizados devem ter a mesma duração e ponto de loop. Atualize também o inventário e teste os níveis/seams. WAV facilita compatibilidade; distribuição comprimida OGG com fallback e pré-carga seletiva continuam como otimizações futuras se a biblioteca aumentar.

## Produção sonora ainda necessária

| Prioridade | Recurso                                                     | Duração aproximada / variantes          | Direção / evento                                                                                                                        |
| ---------- | ----------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| P1         | Foley de lâminas, armaduras e impactos de carne/pedra/metal | 0,15–0,8 s; 3–5 tomadas reais           | Preparação/passagem/contato; substituir famílias blade, body, metal e equip                                                             |
| P1         | Fogo, vazio, runas, veneno e escudo                         | 0,3–2 s; ataque, loop e cauda próprios  | Conjuntos mais distintos para activate/sustain/end e supremas                                                                           |
| P1         | Trilha composta de Pedralta                                 | 60–120 s; pad/pulse/motif sincronizados | Exploração, combate e narrativa com composição e mixagem final                                                                          |
| P2         | Disparos e dispositivos                                     | 0,1–1,5 s; mecanismos e detonações      | Refinar identidade do Atirador; recarga real depende de sistema de munição, atualmente ausente                                          |
| P2         | Passos/ambientes gravados                                   | Passos 0,15–0,4 s; ambientes 30–60 s    | Pedra/vegetação e camadas regionais com mais variação, máquinas/portas quando existirem interações reais                                |
| P2         | Biblioteca de inimigos                                      | 0,3–2 s                                 | Detecção/ataque/morte de lobo/bandido mais orgânicos; elites e chefes próprios quando esses personagens forem criados                   |
| P3         | Itens épicos/lendários, fabricação e falha de coleta        | 0,2–2 s                                 | Os eventos existem, mas esses conteúdos/restrições não fazem parte do jogo atual; famílias provisórias, sem afirmar integração fictícia |
| Opcional   | Dublagem                                                    | Por fala, conforme roteiro              | Bus reservado, sem slider inútil enquanto não houver voz; gravação/localização não implementadas                                        |

## Validação

- `npm run build`: TypeScript e build de produção.
- `npm test`: 62 testes; 10 novos cobrem cache, falha parcial, limites/prioridade, donos, menus/prévia, lote de loot, transporte/teardown, volumes, catálogo e sincronização no combate real.
- `npm run test:e2e`: 18 cenários Chromium, incluindo seis novos de áudio. Decode dos 53 arquivos, ataque no vazio, pausa, volumes/mute persistidos, 404 e WAV inválido, rajada de 100 eventos, loops, encerramento, mixagem offline sobrecarregada e conversa real. Os cenários existentes exercitam combate, mortes, habilidade, troca de equipamento, baú e missão.
- `python3 scripts/test_audio.py`: 2 testes sobre todos os WAV: inventário exato, PCM/duração, ausência de silêncio/clipping, fade das extremidades, salto de loop e hashes das variantes.
- `python3 scripts/test_sprite_frames.py`: 4 testes de regressão dos sprites.

A validação automatizada não substitui escuta crítica, testes em Firefox/Safari, comparação com gravações de referência nem medição de desempenho em aparelhos modestos. Capturas da interface: `artifacts/audio-settings.png` e `artifacts/audio-dialogue.png`.
