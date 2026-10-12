# Capítulo I — O Selo Partido e Kharn

## Auditoria e cânone

Base da entrega: `8cd3dd3`. Foram consultados README, ESPECIFICACAO,
EXPANSAO_SOLICITADA, EXPANSAO_IMPLEMENTACAO, REGIOES_SOLICITADAS,
REGIOES_IMPLEMENTACAO, PROLOGO_IMPLEMENTACAO e AUDITORIA_RPG. O prólogo já
existe. O conteúdo antigo inclui O Eco de Kharn e As Memórias da Margem,
seguido de Máquinas Mortas. As recompensas e regiões anteriores foram mantidas.

A bíblia estabelece investigação em Pedralta, Bizel, Ruínas Esquecidas e Kharn
como guardião que protegia algo, com corrupção ligada a uma ameaça maior.
Não define personalidade detalhada, origem ou destino definitivo de Bizel/Kharn.
Esta implementação acrescenta falas curtas de confronto e investigação. Lenir
assume sua função de investigadora, já prevista no documento de expansão.
A ligação das memórias com a entrada isolada mantém a cronologia existente.

A revelação escolhida, documentada como adição compatível, é um fragmento do
Núcleo mantido sob o selo: os carregamentos apontam para as caldeiras. Ela liga
Kharn à investigação industrial já canônica. Não explica a Ruptura, não antecipa
Ivis/P11 e não revela quem deu as ordens. Kharn permanece ajoelhado no salão;
a derrota mecânica não é uma declaração de morte definitiva do personagem.

As referências enviadas orientam plataformas, cristais, azul/violeta, pedra e
ornamentos dourados; Kharn tem placas de pedra escura, fissuras ciano, dois
condutores e uma grande lâmina. Os atlas são arte nova: modelos gerados por código e refinamento visual com
imagegen para Kharn e os objetos das ruínas. Não são recortes dos JPGs nem
reprodução idêntica das imagens. Os modelos ficam em `chapter-art.ts` e
`ruins-art.ts`. `scripts/export_chapter_art.mjs` exporta rascunhos em
`/tmp/distrito-zero-chapter-templates` sem sobrescrever a arte refinada.
`chapter-atlas.ts` normaliza os recortes transparentes ao carregar, com pivôs
os pés, preservando a escala e a ordenação compartilhada. Os PNGs refinados
são locais e não exigem geração ou conexão externa durante o jogo.

## Percurso jogável

Depois do prólogo e da primeira missão, restaure as memórias da Margem e entregue
à Guardiã. A missão **O Selo Partido** continua no mesmo catálogo de missões:

1. Lenir, em `(11,15)`, pede uma investigação.
2. Registro chamuscado em `(12,17)`; leve a evidência à Guardiã em `(10,14)`.
3. Bizel aparece na trilha leste `(23,19)`, com apresentação dirigida, lâmina,
   projétil linear anunciado e brasas em sua segunda fase.
4. Leia o mapa em `(22,19)` e retorne a Lenir. A entrada isolada fica em
   `(25,6)` na Margem de Kharn. Use F para atravessar.
5. Leia a inscrição do vestíbulo. Visite a ala oeste, derrote o vigia e afine
   o Prisma Azul. A muralha central abre fisicamente.
6. Leia o registro dos condutores. Na ala leste, derrote o vigia e afine o
   Prisma Violeta; leia o registro do Núcleo.
7. A escadaria lateral é um atalho opcional. Dois baús recompensam exploração.
8. A fonte `(14,12)` recupera vida/mana e estabelece o ponto de preparação.
   I/K permanecem disponíveis. Confirme a porta em `(14,11)` para entrar.
9. Após Kharn, a revelação conclui o capítulo e a Estrada das Caldeiras permite
   seguir a Ferrugem. Lenir, Guardiã e Iria reconhecem o acontecimento.

O diário e a HUD usam o catálogo `MISSIONS` e eventos existentes. Os alvos
resolvem os objetos e inimigos reais; viagens para outra região usam suas
passagens. Não existe outro sistema de recompensas de missão.

## Masmorra real

Ruínas Esquecidas é um quarto mapa, com planta independente da Margem: vestíbulo,
ala oeste, átrio, ala leste, fonte, escadarias e salão exclusivo. Plataformas de
pedra são cercadas por abismos não caminháveis. Corredores têm colisões e os dois
portões atravessam as únicas aberturas nas muralhas; não podem ser contornados.
Os prismas exigem inscrição e vigia derrotado. Som, partículas e dissolução da
muralha acompanham a mudança física. Reativar não concede recursos novamente.
O atalho altera colisão e invalida a grade de navegação. Colunas, cristais e
portais usam atlas próprio e o mesmo compositor de oclusão dos demais cenários.

O mapa usa o contrato isométrico plano existente. Escadarias são ornamentação
das plataformas, sem física em altura ou salto. Não há mapa vazio, seleção de
fases ou imagem estática usada como chão navegável. Terreno, objetos, encontros,
minimapa e descoberta são dados reais.

## Kharn e combate

720 HP, arena contida, três fases, atlas transparente próprio de 24 frames
(oito poses em três variantes de luz) e pivô compartilhado de pés. Idle,
caminhada, preparação, golpe, recuperação e queda usam frames próprios.

| Fase | Limiar e padrões |
| --- | --- |
| I — O Guardião | Cone de lâmina e impacto no ponto anunciado; recuperação após cada ataque |
| II — O Despertar | A 65%: cruz de energia e investida, combinadas aos ataques anteriores |
| III — O Último Dever | A 30%: anel com centro seguro, cristais em três áreas, cruz e investida |

O alvo e as áreas perigosas são fixados durante a preparação. Ataques possuem
0,85–1,6 segundo de aviso e recuperação real; dano respeita defesa,
invulnerabilidade temporária e linha de visão. Cruz, cone, anel e impactos usam
geometrias compartilhadas para sinais e dano. A investida usa movimento com
colisão. Kharn procura todo o interior da arena e não abandona o jogador em
um canto. Golpes recebidos não reiniciam seus relógios, evitando stagger
permanente. Limiar de fase limita o dano de uma rajada para não eliminar as
três fases com um único golpe de uma build avançada.

Todas as classes usam suas habilidades e recursos reais. Nenhuma habilidade de
uma classe específica é requisito do chefe. A barra especial fica na parte
superior central; a HUD de missão se recolhe durante o confronto e retorna após
a vitória. Preparação e desfecho ocultam a HUD, sem desativar o mixer.

## Cinematografia e áudio

O mesmo `Cinematics` do prólogo aceita definições de cena adicionais, com câmera,
zoom, enquadramento, música, pose e destino do personagem. A camada de legendas
e o botão de pular são compartilhados. Os movimentos respeitam a preferência
por movimento reduzido.

**Apresentação:** salão e selo → presença e condutores iluminados → diálogo
sobre o dever do guardião → reação do Eco → postura de combate → nome e barra.
Não há carregamento entre apresentação e luta. A arena fecha fisicamente.

**Transições:** duas cenas curtas, uma para O Despertar e outra para O Último
Dever, com pulso, fala, pose e nova mistura musical.

**Desfecho:** silêncio → Kharn permanece junto ao selo → fragmento e corrupção
externa → marcas de transporte → caminho para Elcio/Ferrugem. A recompensa
acontece na conclusão da revelação, inclusive quando pulada.

O mixer central ganhou estados `silence`, `threshold`, `boss2` e `boss3`, usando
os loops locais existentes e misturas próprias. Aproximação reduz música e
vento. Volume, mute, gesto inicial, suspensão e limiter são preservados. Não há
segundo player de música nem dublagem gravada nesta entrega.

## Morte, salvamento e migração

O contrato continua **v4**, com região `ruins` e bloco opcional `chapter` em
`Exploration`: versão, estrada legada, cenas assistidas, estado da arena e
checkpoint. Investigações, mecanismos, derrotas, registros e recompensa vivem
nos eventos, mudanças e encontros do save existente.

Saves antigos recebem progresso vazio da masmorra. Quem já tinha as memórias
concluídas conserva a estrada antiga de Ferrugem e pode retornar para aceitar
o capítulo com Lenir. Conteúdo industrial e recompensas anteriores não são
reiniciados. Novas jornadas completam O Selo Partido antes de abrir a estrada.
Os backups v1–v3 continuam existentes. Antes da primeira gravação de um v4
sem o capítulo ou as ruínas, a cópia exata também é guardada em
`distrito-zero:v1:backup:chapter-I` no localStorage do mesmo navegador. Isso permite
recuperação manual do save anterior sem alterar a evolução já salva.

Fechar durante apresentação reinicia sua sequência segura. Fechar durante luta
retoma antes da arena, com Kharn restaurado e mecanismos preservados. Fechar no
desfecho mantém a derrota e retoma a revelação. Kharn não reaparece depois da
conclusão. Morrer retorna à fonte, custa 25 moedas e reinicia apenas o encontro;
salas e documentos permanecem resolvidos. A apresentação pode ser pulada em
cada tentativa. O Selo do Vigia entra uma vez no inventário, com 520 XP e 220
moedas pela missão. Seus atributos são moderados: ataque 2, defesa 3 e vida 24.

## Módulos

| Arquivo | Função |
| --- | --- |
| `chapter-data.ts` | Estado, encontros, cenas e registros narrativos |
| `chapter-runtime.ts` | Interações, cenas, checkpoint, consequências e recuperação |
| `chapter-boss.ts` | IA própria, fases, geometria e relógios dos ataques |
| `chapter-art.ts`, `ruins-art.ts`, `chapter-atlas.ts` | Modelos, sinais de ataques e normalização da arte refinada |
| `ruins-map.ts` | Planta, plataformas, mecanismos e bounds de arena |
| `chapter-ui.ts` | Barra de chefe e interação contextual da porta |
| `missions.ts`, `mission-ui.ts` | Catálogo compartilhado, eventos, diário e recompensas |
| `regions.ts`, `world.ts`, `save.ts` | Conexões, colisões e migração |
| `game.ts`, `renderer.ts`, `spatial.ts` | Coordenação, profundidade, câmera e pivôs |
| `cinematics.ts`, `prologue-ui.ts`, `audio*.ts` | Infraestrutura reutilizada e música por fase |

## Validação da primeira entrega

- `npm test`: 159 testes passaram, em 12 arquivos.
- `npm run build`: TypeScript e build de produção passaram.
- `npm run test:e2e`: 43 testes passaram em Chromium, uma execução completa de 8,8 minutos.

Os sete testes novos de navegador cobrem as quatro classes, fases, desfecho,
recompensa única, reload, percurso real Lenir → Bizel → ruínas → mecanismos →
atalho → Kharn → Ferrugem, morte/retry e saída para o menu durante a cena.
O percurso usa teclado, mouse e interações reais, sem escrever no estado do
jogo em execução. As fixtures partem das memórias concluídas, nível 5 e arma
Brasa; os testes existentes verificam também a nova jornada e o prólogo.

Os testes unitários cobrem migração de saves intermediários e avançados,
backup v4, requisitos narrativos, colisões/abismos, alcance dos interativos,
checkpoint, skip, recuperação do desfecho interrompido, limiares de fase,
geometria de áreas seguras, perseguição com obstáculos e recompensas únicas.
A normalização dos dois atlas foi conferida em Chromium e as capturas abaixo
registram a apresentação e a HUD no compositor real.

O resultado verifica esses percursos automatizados e contratos; o balanceamento
para todas as builds possíveis ainda depende de sessões de jogo humanas.

## Evidência visual

Capturas do jogo real com os atlas refinados: [apresentação](../artifacts/chapter-kharn-intro.png) e [combate](../artifacts/chapter-kharn-fight.png).

## Atualização visual

As três imagens adicionadas posteriormente foram aplicadas aos diálogos, ao modelo de Kharn e ao cenário. Veja [a implementação e a validação atuais](REFERENCIAS_DIALOGO_KHARN.md).
