# Operação Reforge — implementação e ponto de retomada

Este documento descreve uma **entrega parcial verificável**, não a conclusão
da Operação Reforge. O pedido integral está em
[REFORGE_SOLICITADA.md](REFORGE_SOLICITADA.md); a auditoria e os contratos estão
em [REFORGE_AUDITORIA.md](REFORGE_AUDITORIA.md).

## Estado das fases

| Fase | Estado real |
|---|---|
| 1. Auditoria e arquitetura | Diagnóstico, inventário com hashes e contratos registrados |
| 2. Identidade visual e pipeline | Viewport corrigido, registro e importação/compilação seguros implementados; reconstrução artística e contratos completos de animação **pendentes** |
| 3. Loot e inventário | Ainda não implementada pela Reforge |
| 4. Inimigos declarativos | Ainda não implementada pela Reforge |
| 5. Equipamentos visuais | Ainda não implementada pela Reforge |
| 6. Combos | Ainda não implementada pela Reforge |
| 7. Mundo contínuo/chunks | Ainda não implementada pela Reforge |
| 8. Sistema de UI | Ainda não implementada pela Reforge |
| 9. Polimento autoral | Ainda não concluído |
| 10. Validação final da Reforge | Não concluída; regressões desta entrega são registradas abaixo |

A campanha existente permanece a base funcional. Não foram adicionados
catálogos vazios, drops invisíveis, gerações em runtime ou mapas falsamente
declarados contínuos. O save continua em v4: esta entrega não necessita de
novos campos persistentes nem altera coordenadas ou o inventário.

## Mudanças executáveis

`src/viewport.ts` ajusta a resolução lógica do Canvas à janela. Mantém a
referência 960×540 em sua proporção nativa e usa escala inteira quando cabe;
outras proporções revelam uma área diferente do mundo. O cenário ocupa toda
a janela com pixels proporcionais, sem deformação independente por eixo.
Projeção, culling, mira e bounds da HUD usam o viewport da instância do
renderer. Redimensionar não muda a posição física do jogador nem o save.
O renderer reaplica `imageSmoothingEnabled=false` após reset do Canvas.

A regressão também expôs um problema existente no início do ataque: o dt da
primeira atualização podia incluir tempo anterior ao clique, adiantando o
impacto e o áudio. O contexto de combate do navegador agora fornece um relógio
monotônico; o avanço do ataque é limitado ao tempo realmente decorrido desde
a entrada/atualização anterior. Os testes de lógica continuam usando dt
determinístico quando não há relógio. Isso corrige o windup atual, sem afirmar
que a máquina de combos da fase 6 esteja implementada.

`src/asset-registry.ts` substitui a lista independente de caminhos no loader.
Os vinte assets carregados pelo Canvas vêm do manifesto canônico; dimensões
decodificadas divergentes falham antes da renderização. O manifesto contém
28 registros, inclusive ícones de equipamento e o quadro de diálogo externo.
Os recortes, escalas e pés dos modelos legados saíram de números duplicados
em `chapter-atlas.ts` e foram preservados no contrato de normalização.

`scripts/asset_registry.py` valida hash, arquivo, dimensões/células, pivôs,
margens, paleta, alpha e animações. Importações rejeitadas não alteram o
manifesto nem produção. A compilação agora usa staging, valida as saídas,
preserva registros alheios e faz rollback se a publicação falhar. O script
não executa mais ao ser importado. Importação/compilação não aprovam arte.
Veja [REFORGE_PIPELINE.md](REFORGE_PIPELINE.md) para comandos e limites.

## Evidências renderizadas

Capturas novas usam o mesmo save inicial v4 e o mesmo navegador, com movimento
reduzido. A versão anterior foi servida de uma cópia descartável do commit
`04f54905f877f21c08f4463d7c2bf4c6dd738e1c`; a posterior usa esta entrega.
Não são capturas históricas reapresentadas como atuais. O tempo de idle e
posições de patrulha podem variar ligeiramente entre capturas.

As capturas comparativas do viewport antecedem o ajuste do windup, que não
altera a projeção ou os PNGs. O smoke test de produção foi repetido com esse
ajuste incluído.

| Janela | Antes: escala X/Y | Depois: escala X/Y |
|---|---|---|
| 1440×1000 | 1,500 / 1,852 | 1,000 / 1,000 |
| 390×844 | 0,406 / 1,563 | 1,000 / 1,000 |

Dados completos: [reforge-viewport-metrics.json](../artifacts/reforge-viewport-metrics.json).
As quatro sessões não registraram `pageerror`.

- [Desktop antes](../artifacts/reforge-antes-1440x1000.png) e
  [desktop depois](../artifacts/reforge-depois-1440x1000.png).
- [Celular antes](../artifacts/reforge-antes-390x844.png) e
  [celular depois](../artifacts/reforge-depois-390x844.png).
- [48 frames do herói](../artifacts/reforge-hero-inspecao.png), com pivôs.
- [24 recortes legados de Kharn](../artifacts/reforge-kharn-inspecao.png), com
  estado `reconstruction-required` explicitado.

Inspeção: a deformação forte no celular foi removida; HUD e piso continuam
visíveis. A resolução mais ampla no desktop revela mais cenário e os sprites
ficam menores em relação à janela. Isso não significa que a escala artística
final esteja aprovada. A folha do herói confirma variação de orientação em
alguns passos frontais e armas/efeitos incorporados nos frames; Kharn mantém
densidade de detalhe/alpha incompatíveis com os sprites nativos. A nova
infraestrutura permite detectar e revisar esses problemas, mas não os
redesenha automaticamente.

## Validação desta entrega

- `npm test`: 171 testes executados e aprovados, incluindo viewport, inversão
  de mira e registro de assets.
- `npm run build`: TypeScript e build de produção aprovados.
- `scripts/test_asset_registry.py`: oito testes aprovados, cobrindo importação,
  alpha/paleta, caminhos, sobrescrita, frames, pivôs, direções, preservação e rollback.
- `scripts/test_sprite_frames.py`: quatro testes aprovados no ambiente isolado.
- Recompilação `--characters-only`: aprovada, sem mudar os PNGs existentes.
- `npm ci` com o lock atualizado: aprovado em diretório descartável.
- Build de produção servido em Chromium: desktop e celular aprovados com
  movimento real, HP positivo, escala X/Y igual e nenhum erro HTTP/JavaScript.
  [Dados do smoke test](../artifacts/reforge-production-smoke.json).
- `asset_registry.py validate`: zero erros técnicos, 28 revisões pendentes.
- `asset_registry.py validate --release`: falha esperada em 28 registros sem
  aprovação artística; esse gate continua ativo.
- `npm run test:e2e`: 49 testes executados e aprovados em 10,4 minutos, sem
  skips ou assertions desativadas. Cobre prólogo, campanha, quatro classes,
  Kharn, morte/retry, Ferrugem, save legado/reload, mira, HUD, áudio e oclusão.
- Regressão específica do áudio/preparação: cinco execuções consecutivas
  aprovadas após a correção, mantendo o limite temporal original do teste.

## Retomar exatamente daqui

1. Começar pela fase 2, não pular diretamente para loot ou mundo aberto.
   Ler a auditoria, esta implementação e o manifesto. Preservar as imagens
   originais e o save v4. Conferir o estado do Git antes de editar.
2. Corrigir orientação/rig dos frames frontais do herói e separar armas
   incorporadas para permitir as variantes reais exigidas na fase 5.
   Completar metadados das outras classes sem inventar direções ou poses.
3. Reconstruir Kharn, vigias/Bizel, autômatos, objetos das ruínas e ornamentos
   em resolução nativa, usando as referências já presentes. Não trocar isso
   por filtro, quantização de ilustração ou modelos geométricos inferiores.
4. Importar cada atlas offline. Inspecionar folhas, ciclos em movimento,
   pivôs e comparação renderizada com o jogador e cenário. Registrar os
   hashes e capturas correspondentes antes de alterar o estado de revisão.
5. Fechar a fase 2 com validação técnica e revisão artística real. Depois
   seguir as fases 3–10 na ordem do pedido. Os contratos da auditoria definem
   catálogo/instância/raridade, inimigos, combos, WorldAddress e chunks.
6. Introduzir save v5 só quando houver dados novos persistentes, com migrador
   puro, fixtures antigas e backup integral do raw v4 antes da primeira gravação.
7. Executar unitários, build, pipeline e E2E sem alterar código durante o
   percurso de navegador. Guardar as capturas históricas; novas evidências
   devem ter nomes próprios e identificar exatamente a versão renderizada.

O ambiente já dispõe de Node 24.19, npm 11.9, Chromium e um venv com Pillow
12.3. Os campos `install_script` e `start_skill` foram atualizados no rascunho
do ambiente. Esse salvamento não publica uma nova versão do ambiente.

Este é o checkpoint estável da auditoria e infraestrutura da fase 2. As fases
incompletas permanecem explicitamente abertas; a próxima entrega deve retomar
a reconstrução nativa e o consumo completo de células/pivôs/animações nos
renderers. `Assets.draw` ainda usa os pivôs espaciais compatíveis existentes
para atlases nativos; apenas o normalizador legado lê seus recortes/pés do
manifesto. Não declarar novas variantes integradas só por registrar o PNG.
