# Operação Reforge — auditoria e contratos

Base inspecionada: `04f54905f877f21c08f4463d7c2bf4c6dd738e1c`.
Pedido integral: [REFORGE_SOLICITADA.md](REFORGE_SOLICITADA.md).
O inventário reproduzível de arquivos, hashes, dimensões, cores e alpha está em
[REFORGE_INVENTARIO.json](REFORGE_INVENTARIO.json). Os relatórios anteriores
registram entregas históricas; números e limitações antigos não representam
necessariamente a versão atual.

## 1. Diagnóstico visual

| Gravidade | Evidência | Consequência e correção necessária |
|---|---|---|
| Crítica | `style.css` força `object-fit: fill`; Canvas lógico 960×540 preenche qualquer proporção | Escalas X/Y diferentes deformam corpo, cenário e armas, especialmente em celular. Manter pixels quadrados com viewport lógico adaptável, sem barras externas. |
| Crítica | `kharn.png`: 2172×724, 249.861 cores visíveis e 893.293 pixels com alpha parcial | Não segue a paleta nem a transparência dos personagens. O recorte em runtime não resolve autoria/escala dos pixels. Preservar fonte, produzir arte revisada em resolução lógica e validar antes de aprovar. |
| Alta | `ruins-objects.png`: 2170×725, 168.200 cores e 288.148 pixels de alpha parcial | Materiais e densidade incompatíveis com os atlas antigos; precisa revisão artística, não apenas filtro. |
| Alta | `chapter-enemies.png`: 444 cores, 2.856 pixels de alpha parcial; vigias vistos como formas muito simples | Bizel e vigias precisam silhuetas, poses e direções adequadas. Os autômatos são desenhados por primitivas no renderer. |
| Alta | Personagens têm armas incorporadas nos frames; troca de item não troca a silhueta completa | Partículas elementais não equivalem a equipamentos visuais. Produzir corpos/variantes compatíveis, âncoras de mão e poses por categoria. |
| Alta | `dialogue-frame.png`: 23.477 cores e 177.019 pixels de alpha parcial | Ornamento redimensionado diverge da escala dos sprites. Criar componente/ornamento nativo e inspecionar no jogo. |
| Média | `inventory.ts` usa SVGs e marcadores de texto; telas têm estilos históricos sobrepostos | Tokens e componentes próprios devem substituir gradualmente os acabamentos divergentes. |
| Média | Rig corporal e tamanho do cabelo variam entre algumas poses | As 192 células têm margens limpas, mas isso não prova anatomia consistente. Revisão por direção e sequência continua obrigatória. |

Os dez atlas de personagens usam até 63 cores da paleta compartilhada e alpha
binário. `enemies.png`, props, tiles, objetos, ícones e efeitos básicos também
seguem a paleta. Imagens de referência, fontes de importação e a ilustração da
capa não devem ser confundidas com atlases nativos de gameplay.

Foram inspecionados sprites sobre quadriculado, interfaces, diálogos, cenário e
Kharn. Capturas históricas com cabeçalho/rodapé descrevem versões antigas:
a versão atual ocupa a janela e já removeu esses comandos. Evidência visual
nova deve ser identificada pelo commit e nunca reutilizada como se fosse atual.

## 2. Diagnóstico técnico

TypeScript, Canvas 2D, Vite e Vitest; Chromium via Playwright. Não há servidor de
jogo, banco ou API externa necessários em execução. Manter esse contrato.

`spatial.ts`, `render-order.ts` e `occlusion.ts` fornecem uma base aproveitável.
A projeção usa pés, colisões têm subpassos e A* tem clearance e evita corte de
cantos. UI, áudio e sequenciador cinematográfico já são módulos separados.

Há concentração excessiva: `game.ts` tem 1.446 linhas, `renderer.ts` 907,
`ui.ts` 910 e `skill-engine.ts` 1.105. Novas regras devem entrar em módulos
próprios; esses arquivos ficam como coordenadores. Não há justificativa para
reescrever classes, árvores, missões, áudio ou cinemáticas funcionais.

O manifesto de animações só descreve o herói e fontes antigas. Não enumera todos
os arquivos carregados, modelos recentes, estados de revisão ou hashes. O
compilador executa ao importar, escreve diretamente em produção e substitui o
manifesto completo, arriscando apagar registros adicionados posteriormente.

## 3. Animação

Quatro direções do herói e folhas separadas de locomação/combate das outras
classes existem. Há idle, caminhada, ataque, dano, conjuração e morte. Corrida
usa cadência maior. Nem cada golpe nem cada categoria de arma têm poses próprias.
Alguns inimigos dependem de perfil/espelhamento e estados com poucos frames.
Kharn tem 24 poses/variantes, mas os recortes e pivôs são números manuais em
`chapter-atlas.ts`, fora do manifesto. Não há gate contra animação vazia ou
inteiramente repetida para novos registros.

## 4. Combate

Preparação, resolução, projéteis, invulnerabilidade, resistência, estados,
recursos, efeitos periódicos e chefes de várias fases são reais. Há janelas de
recuperação e recompensas únicas. Builds e 180 nós principais permanecem.

O básico usa a mesma sequência, sem máquina de combos/buffer. O impacto genérico
ocorre em 0,16s; isso não constitui contrato de eventos por frame/categoria.
Dano cancela visualmente a pose, mas a resolução pendente precisa ser auditada
para interrupção coerente. O cone básico não consulta segmento livre em sua
resolução, diferentemente dos projéteis e vários ataques de chefes: acrescentar
regressão de parede antes de ampliar hitboxes. Não aumentar dificuldade apenas
com atributos. Kharn/Bizel conservam suas máquinas próprias.

## 5. Mundo

Quatro regiões 28×28 com terreno, colisão, descoberta, encontros, portas,
prismas e atalhos reais. A masmorra não é um fundo estático. Pedralta, Margem e
Ferrugem continuam ligados por troca de região; não há coordenada global,
chunks, streaming, mapa global ou navegação entre chunks.

A* percorre uma grade regional de meia célula. O piso é um Canvas inteiro por
região; os assets são carregados em conjunto. Não chamar isso de mundo aberto.
Escadarias e altura das ilhas são visuais, sem física vertical.

## 6. Itens e loot

Nove equipamentos em `data.ts`, IDs estáveis, atributos reais, elementos,
equipagem, comparação e descarte. Poções têm quantidades separadas. O jogador
recebe XP/moedas diretamente e baús/missões entregam itens persistentes.

Não há drops físicos, RNG de loot, tabelas por família, instâncias com affixes,
empilhamento de materiais, venda geral ou probabilidades verificadas. Raridade
mistura qualidade e elemento (`Elemental`, `Rúnica`). O contador `/60` é visual:
o inventário não impõe capacidade 60. Não inventar materiais sem utilização.

## 7. Interface

HUD e minimapa respondem ao estado real, com descoberta, objetivo e legenda.
Diálogos já têm retrato, nome, opções e seleção por teclado. O marcador decorativo
não interfere no nome acessível. Cenas podem ser puladas; preferências de áudio
e movimento reduzido existem.

Ainda faltam design tokens únicos, gerenciador de posicionamento/camadas,
notificações por prioridade, prévia visual transacional de equipamento e
acabamento autoral consistente. Inventário tem paperdoll CSS separado do
renderer; não representa fielmente todos os itens e estados. Não reintroduzir
comandos fora de habilidades/utilitários nem cabeçalho externo.

## 8. Dívidas e prioridades

1. Projeção/pixels quadrados e gate de assets verificável.
2. Paleta, transparência, rig e geometria de armas; revisão de inimigos recentes.
3. Catálogo/instâncias de itens e loot transacional separado de missão.
4. Registro de inimigos com referência real a arte aprovada.
5. Poses de equipamento e combos, respeitando árvores existentes.
6. Coordenadas globais e streaming com migração antes de integração de estradas.
7. Componentes de UI e posicionamento comum; auditoria visual final.

A paleta controlada e alpha binário são requisitos de importação, não prova de
qualidade artística. Não reduzir uma imagem grande e declarar automaticamente
pixel art aprovada. Arte revisada exige inspeção renderizada por humano/agente.

## 9. Contratos e migração

- **ItemDefinition**: base ID estável, categoria, raridade, nível, atributos,
  preço, stack, ícone, visual e elegibilidade. Elemento é campo independente.
  Instância rolada guarda base ID, UID, raridade e affixes validados; todos os
  consumidores resolvem pelo catálogo comum. Preservar IDs antigos.
- **LootRoll**: RNG injetável/persistente; presença → categoria → item elegível
  → raridade/affixes. Nenhuma rolagem ao abrir UI. Recibo de morte/chefe é
  persistido com os drops; coleta é transação idempotente. Item inacessível é
  reposicionado por colisão, não perdido. XP de missão não é repetido.
- **EnemyDefinition**: ID de definição, família, spawn ID, região, nível,
  atributos, resistências, IA, padrões, animação/asset, áudio, loot e política
  de reaparecimento. Não inferir família de `type: bandit` nos autômatos.
- **AssetDefinition**: caminho existente, fonte/proveniência, tamanho, células,
  pivot, direções, estados, paleta/material, hash e revisão visual. Importação
  validada precede alteração do registro. Asset novo invisível é erro.
- **EquipmentPose**: corpos/variantes e âncoras por direção/pose, além de
  categoria de arma; camadas têm ordem explícita. Ícone rotacionado não é arma.
  Prévia usa cópia, sem tocar equipamento confirmado.
- **ComboDefinition**: preparação/impacto/recuperação, eventos de frame,
  buffer limitado, cancelamentos, interrupção, geometria e lista de acertos
  por golpe. Animação corporal e arma devem diferir, não só partículas.
- **WorldAddress**: espaço/instância, região de origem, coordenada global e
  conversão inversa documentada. Ruínas podem continuar como masmorra. Integrar
  regiões existentes com estradas reais; portais antigos podem ser atalhos,
  mas não a única forma de viajar nas áreas declaradas contínuas.
- **ChunkRecord**: células, descoberta, objetos, encontros e mudanças; descarregar
  preserva alterações. A* utiliza os mesmos obstáculos nas bordas. Identidade
  de spawn não depende da ordem de carregamento.
- **UIContract**: tokens comuns, foco, fechamento, camada, âncora, bounds e
  movimento reduzido. Decorações são separadas de nomes acessíveis.

Save atual v4, chave `distrito-zero:v1`. Migrar para v5 somente quando os novos
campos forem necessários. Antes de gravar v5, copiar integralmente o raw v4
para backup próprio sem sobrescrever cópia existente. Migradores puros e
validação de dependências; nunca limpar localStorage como solução. Preservar
classe, XP, árvores/builds, cooldowns, equipamentos, inventário, moedas,
missões, descoberta, baús, derrotas, cenas e recompensas únicas. Posicionamento
novo usa conversão + chão válido. Save incompatível não vira jornada vazia.

## 10. Critérios verificáveis

| Domínio | Gate |
|---|---|
| Arte | Arquivo existente, hash, dimensões/células, alpha, paleta, margem, pivô, direções/poses e revisão renderizada; exceção legada é explícita e bloqueia aprovação artística final |
| Loot | Monte Carlo determinístico + margens estatísticas; elegibilidade por família/nível, idempotência, terreno e reload |
| Equipamento | Comparação de pixels ao trocar item em quatro direções/poses; prévia não muda save; sem arma duplicada |
| Combo | Ordem 1→2→3, buffer, interrupção, reset, alcance/cone/parede e um dano por golpe; estilos das quatro classes |
| Mundo | Deslocamento real entre áreas integradas, sem F obrigatório; colisão e A* em seams, descarregamento/reload, objetivos/discovery coerentes |
| UI | Bounds desktop/celular/tela cheia, foco e nomes acessíveis, quantidade/ícone reais, redução de movimento, ausência de scroll horizontal |
| Save | Fixtures v1–v4, backup exato, round-trip v5, itens/builds/chefes intactos, rejeição de estados impossíveis |
| Regressão | `npm test`, `npm run build`, `npm run test:e2e`, importador e gates novos sem desativar assertions |

Orçamentos iniciais para validar, não resultados já medidos: chunks de 8×8,
até nove chunks quentes por espaço, 64 inimigos ativos, 256 drops ativos e
cache gráfico de 64 MiB. Carregamento limitado por frame, sem percorrer o mundo
inteiro. Medir deslocamentos longos, p95 e crescimento de memória antes de
aprovar esses limites; adaptar ao dispositivo sem inventar um teste de 60 FPS.

## Estado da Reforge

Fase 1: auditoria e contratos registrados. A fase 2 recebeu a correção de
viewport e o pipeline de assets, mas a reconstrução artística continua
pendente. Fases 3–10 precisam de entregas executáveis e seus próprios gates.
O estado atualizado está em [REFORGE_IMPLEMENTACAO.md](REFORGE_IMPLEMENTACAO.md).
A campanha atual funcional é a base de regressão, não evidência de que a
Reforge inteira esteja pronta.
