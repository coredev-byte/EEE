# DISTRITO ZERO — OPERAÇÃO REFORGE
## Reconstrução artística e sistêmica definitiva do RPG

### MISSÃO PRINCIPAL

Você atuará como diretor técnico, diretor de arte pixel art, engenheiro de gameplay, designer de combate, arquiteto de sistemas RPG, level designer, especialista em interfaces e responsável pela qualidade final de Distrito Zero.

Sua missão é realizar uma refatoração profunda do projeto, transformando a experiência atual em um RPG isométrico coeso, visualmente consistente, tecnicamente escalável e com sistemas de progressão interligados.

**Não quero uma atualização superficial. Quero uma reconstrução criteriosa dos sistemas que ainda apresentam limitações.**

O objetivo não é aumentar indiscriminadamente a quantidade de funcionalidades, mas elevar a qualidade, profundidade, consistência e acabamento do jogo.

Trabalhe diretamente no repositório existente `coredev-byte/EEE`.

Não recrie o projeto do zero.

Não substitua sistemas funcionais sem justificativa técnica.

Não remova conteúdo narrativo, classes, missões, equipamentos ou progresso existente.

---

# PARTE I — AUDITORIA COMPLETA DO PROJETO

Antes de alterar qualquer código, examine:

- `README.md`
- `docs/ART.md`
- `docs/AUDITORIA_RPG.md`
- `docs/HUD_REFERENCIA.md`
- `docs/ARVORE_IMPLEMENTACAO.md`
- `docs/REGIOES_IMPLEMENTACAO.md`
- `docs/EXPANSAO_IMPLEMENTACAO.md`
- Todos os documentos narrativos e da bíblia.
- Todos os arquivos de `src/` relacionados a combate, renderização, mundo, personagens, inimigos, inventário, equipamentos, animações, interfaces, missões e salvamento.
- Todos os assets existentes em `public/assets/`.
- Os scripts de geração, compilação e inspeção de sprites.
- Os testes automatizados.

Verifique também as implementações realizadas após a última atualização do README, incluindo o prólogo e o confronto com Kharn, caso já existam.

Identifique o que realmente funciona, o que está incompleto, o que é provisório e o que precisa ser reconstruído.

Crie `docs/REFORGE_AUDITORIA.md` com:

1. Diagnóstico visual.
2. Diagnóstico técnico.
3. Problemas de animação.
4. Limitações do combate.
5. Limitações do mundo.
6. Estado do sistema de itens.
7. Problemas de interface.
8. Dívidas técnicas.
9. Plano de migração.
10. Critérios verificáveis de qualidade.

**Não confunda funcionalidade existente com funcionalidade satisfatória.**

Uma arma que altera atributos, mas não muda corretamente o visual, não está artisticamente concluída.

Um mundo com várias regiões conectadas por teletransporte ainda não oferece a sensação de mundo aberto contínuo.

Um inimigo que funciona mecanicamente, mas reutiliza um sprite inadequado, ainda está visualmente incompleto.

---

# PARTE II — RECONSTRUÇÃO DA PIXEL ART

## 1. Identidade artística obrigatória

Distrito Zero deverá possuir uma identidade visual única e reconhecível.

A direção artística será:

- RPG isométrico em pixel art.
- Mundo em ruínas, com fantasia sombria e vestígios de tecnologia.
- Predominância de azul profundo, índigo, violeta e tons frios.
- Iluminação quente em lanternas, interiores, mecanismos e pontos narrativos.
- Vegetação invadindo construções abandonadas.
- Arquitetura antiga, decadente e detalhada.
- Atmosfera misteriosa, melancólica e imersiva.

Não transforme o jogo em um RPG medieval genérico.

Não transforme o mundo em uma cidade cyberpunk neon.

Não misture estilos artísticos incompatíveis.

As referências visuais existentes no repositório devem ser respeitadas.

## 2. Padronização dos pixels

A documentação atual estabelece:

- Resolução lógica de 960 × 540.
- Tiles isométricos de 80 × 40.
- Frames de personagem de 96 × 112.
- Pivô nos pés em (48,108).
- Paleta compartilhada de 63 cores.

Esses valores devem ser usados como ponto de partida, não alterados arbitrariamente.

Audite os assets para encontrar:

- Pixels borrados.
- Contornos inconsistentes.
- Diferenças indevidas de resolução.
- Personagens com proporções variáveis entre frames.
- Objetos com perspectivas incompatíveis.
- Sprites excessivamente detalhados em comparação aos demais.
- Sombras inconsistentes.
- Elementos com aparência de imagem reduzida artificialmente.
- Artefatos de transparência.
- Frames desalinhados.
- Materiais sem linguagem visual uniforme.

Refaça os assets problemáticos.

Use nearest-neighbor quando houver redimensionamento.

Não aplique filtros que simulem pixel art sobre imagens de alta resolução como substituto da produção correta.

Preserve uma escala de pixels consistente.

## 3. Sistema de produção de assets

Crie um pipeline padronizado que suporte:

1. Definição artística do asset.
2. Escolha de paleta e materiais.
3. Criação ou importação do sprite.
4. Validação de proporções.
5. Validação de transparência.
6. Definição de pivôs.
7. Geração ou organização das animações.
8. Compilação do atlas.
9. Registro no manifesto.
10. Testes visuais.
11. Integração ao jogo.

Reutilize e amplie `scripts/compile_assets.py`, `animations/manifest.json` e as ferramentas existentes.

**Não declare que um sprite foi gerado se apenas foi criada uma configuração JSON apontando para uma imagem inexistente.**

Se houver ferramenta de geração de imagens disponível no ambiente, integre-a por um processo de importação e validação.

Se não houver, implemente um gerador procedural de pixel art quando tecnicamente apropriado ou um fluxo de produção assistida que receba assets externos.

Não dependa de uma API externa não configurada para o jogo funcionar.

---

# PARTE III — SISTEMA COMPLETO DE DROPS E LOOT

## 1. Arquitetura de itens

Crie ou amplie um catálogo central de itens.

Cada item deverá possuir, quando aplicável:

- ID único.
- Nome.
- Categoria.
- Subcategoria.
- Descrição.
- Raridade.
- Nível mínimo.
- Atributos.
- Modificadores.
- Valor de venda.
- Peso, se o jogo utilizar esse sistema.
- Limite de empilhamento.
- Sprite de inventário.
- Asset visual equipado.
- Efeitos elementais.
- Fonte de obtenção.
- Regras de utilização.
- Regras de progressão.

Evite duplicar definições de itens em vários arquivos.

## 2. Sistema de raridades

Implemente as seguintes raridades iniciais:

| Raridade | Cor | Identidade |
|---|---|---|
| Comum | Cinza | Equipamentos básicos |
| Incomum | Verde | Pequenas melhorias |
| Raro | Azul | Atributos especiais |
| Épico | Roxo | Equipamentos avançados |
| Lendário | Dourado | Itens excepcionais |
| Relíquia | Ciano antigo | Artefatos ligados à história |

A raridade Relíquia deverá ser utilizada com cuidado e coerência narrativa.

Não torne todo item raro visualmente exagerado.

A raridade deve afetar a apresentação, os atributos e as possibilidades de modificadores.

## 3. Tabelas de drops

Implemente tabelas específicas para cada família de inimigos.

Cada inimigo deverá possuir uma tabela de loot configurável.

Exemplo inicial de distribuição para um inimigo comum, sujeito a balanceamento:

| Raridade | Chance |
|---|---:|
| Comum | 55% |
| Incomum | 25% |
| Raro | 12% |
| Épico | 6% |
| Lendário | 1,8% |
| Relíquia | 0,2% |

Esses percentuais são uma referência para a seleção de raridade quando houver um equipamento elegível, não a probabilidade de um inimigo soltar qualquer item.

Separe explicitamente:

**Primeira rolagem:** se haverá drop.

**Segunda rolagem:** qual categoria será selecionada.

**Terceira rolagem:** qual item elegível será escolhido.

**Quarta rolagem:** qual raridade e quais modificadores serão aplicados, quando permitidos.

Evite resultados impossíveis ou itens incompatíveis com a fonte de obtenção.

## 4. Drops baseados nos inimigos

O loot precisa fazer sentido.

Exemplos:

**Bandidos:** moedas, armas desgastadas, equipamentos roubados, suprimentos.

**Lobos:** materiais orgânicos e recursos relacionados à criatura, se existirem sistemas para utilizá-los.

**Autômatos:** engrenagens, peças, núcleos mecânicos e componentes.

**Inimigos corrompidos:** materiais e fragmentos relacionados à corrupção.

**Chefes:** recompensas próprias e itens exclusivos.

Não permita que um lobo comum derrube aleatoriamente uma armadura industrial completa sem justificativa.

As tabelas devem considerar:

- Família do inimigo.
- Região.
- Nível.
- Tipo de encontro.
- Raridade.
- Progressão da campanha.
- Itens exclusivos.
- Estado do mundo.

## 5. Drops de chefes

Chefes deverão possuir tabelas especiais.

Implemente:

- Recompensas garantidas, quando apropriadas.
- Drops raros adicionais.
- Equipamentos exclusivos.
- Materiais especiais.
- Chances configuráveis.
- Proteção contra recompensas duplicadas.
- Persistência após a derrota.

Chefes de campanha derrotados permanentemente não podem ser explorados infinitamente para obter itens.

Caso exista um sistema futuro de revanche, ele deverá possuir regras próprias de recompensa.

## 6. Drops físicos no mundo

Os itens devem aparecer no chão após a derrota dos inimigos, quando houver loot.

Crie sprites de drops com:

- Representação visual por categoria.
- Indicador discreto de raridade.
- Pequena animação de surgimento.
- Sombra coerente.
- Interação de coleta.
- Nome do item ao aproximar.
- Feedback sonoro.
- Efeito de coleta.

Não utilize uma esfera brilhante genérica para representar todos os itens.

O objeto precisa ser reconhecível.

Os drops devem respeitar a posição dos inimigos, colisões e terreno.

Não podem aparecer dentro de paredes, sobre áreas inacessíveis ou fora do mapa.

## 7. Sistema de probabilidades

Utilize um gerador de números aleatórios testável.

As probabilidades precisam ser matematicamente verificáveis.

Crie testes estatísticos com muitas simulações para conferir a distribuição esperada.

Evite resultados manipulados sem documentação.

Se implementar proteção contra azar extremo, documente claramente sua regra.

Não altere secretamente as chances conforme o jogador abre o inventário ou reinicia a interface.

---

# PARTE IV — GERAÇÃO E INTEGRAÇÃO AUTOMÁTICA DE INIMIGOS

## 1. Registro central de inimigos

Crie um sistema declarativo para novos inimigos.

Cada definição deve incluir:

- ID.
- Nome.
- Família.
- Região.
- Nível.
- Atributos.
- Resistências.
- Fraquezas.
- Comportamento.
- Padrões de ataque.
- Animações.
- Sprite ou atlas.
- Sons.
- Efeitos.
- Tabela de loot.
- Recompensas de XP.
- Regras de aparecimento.

O objetivo é que adicionar um inimigo não exija modificar manualmente vários sistemas independentes.

## 2. Pipeline visual automático

Quando um novo inimigo for registrado, o sistema de desenvolvimento deverá:

1. Identificar sua família e função.
2. Consultar a direção artística de Distrito Zero.
3. Determinar proporções e paleta.
4. Criar ou solicitar os assets necessários.
5. Validar transparência e pivôs.
6. Verificar direções e animações.
7. Gerar ou compilar o atlas.
8. Registrar os assets.
9. Associar ataques e efeitos.
10. Validar sua renderização no mundo.
11. Integrar a tabela de loot.
12. Executar testes.

A geração deve ser automatizada sempre que as ferramentas disponíveis permitirem.

**Importante:** automatizar a integração não significa que uma IA deva gerar imagens em tempo real toda vez que um inimigo aparecer.

O pipeline deve produzir assets persistentes, versionados e revisáveis.

Se a geração falhar, não publique automaticamente um inimigo invisível ou com sprite inadequado.

## 3. Animações obrigatórias

Cada inimigo deve possuir, conforme suas características:

- Idle.
- Movimentação.
- Preparação de ataque.
- Ataque.
- Recuperação.
- Recebimento de dano.
- Morte.
- Habilidade especial, quando aplicável.

As animações devem possuir orientação espacial coerente.

Não utilize apenas espelhamento horizontal para representar todas as direções se isso causar erros visuais.

## 4. IA e personalidade

Inimigos diferentes devem se comportar de maneira diferente.

Exemplos:

**Lobo:** aproximação rápida, perseguição, recuo e ataques curtos.

**Bandido:** posicionamento, aproximação estratégica e ataques coordenados quando apropriado.

**Autômato:** movimentos mecânicos, preparação de ataques e padrões previsíveis.

**Criatura corrompida:** comportamento específico de sua condição, sem movimentos aleatórios injustificáveis.

**Chefe:** máquina de estados própria e padrões complexos.

Reutilize a navegação A* existente.

Não permita atravessar obstáculos, atacar através de paredes ou ficar preso indefinidamente.

---

# PARTE V — EQUIPAMENTOS VISUAIS NO PERSONAGEM

## 1. Problema atual

O jogo já permite equipar itens e alterar atributos, mas a representação visual precisa acompanhar efetivamente os equipamentos.

Quero que trocar de arma produza uma mudança perceptível no personagem durante toda a jogabilidade.

## 2. Sistema de equipamentos renderizáveis

Implemente um sistema de camadas ou variantes de sprites adequado à arquitetura existente.

Considere:

- Corpo.
- Arma principal.
- Arma secundária, quando aplicável.
- Armadura.
- Capacete.
- Capa.
- Acessórios visíveis.
- Efeitos elementais.

Nem todo acessório precisa ser visualmente representado.

A prioridade é garantir fidelidade dos equipamentos importantes.

## 3. Armas

Cada tipo de arma deverá possuir identidade própria.

Espadas, adagas, arcos, cajados e demais categorias existentes não podem utilizar a mesma animação genérica.

A arma equipada deve aparecer corretamente:

- Parada.
- Caminhando.
- Correndo.
- Atacando.
- Utilizando habilidades.
- Recebendo dano.
- Durante cutscenes.
- Na prévia do inventário.

O sprite deve acompanhar a mão e a orientação do personagem.

Não utilize um ícone de inventário rotacionado como substituto de uma arma desenhada corretamente.

## 4. Animação por categoria

Implemente conjuntos de animações compatíveis com cada categoria de arma.

Exemplos:

**Espadas:** cortes horizontais, diagonais e golpes de avanço.

**Adagas:** movimentos curtos, rápidos e alternados.

**Arcos:** preparação, puxada da corda, disparo e recuperação.

**Cajados:** canalização, gestos e emissão de projéteis.

As animações devem respeitar a identidade de cada classe.

## 5. Prévia de equipamento

Ao selecionar um item no inventário, permita visualizar seu impacto no personagem.

Mostre diferenças de atributos e, quando houver variante visual, a aparência resultante.

Não permita que a prévia altere permanentemente o equipamento antes da confirmação.

---

# PARTE VI — RECONSTRUÇÃO DO SISTEMA DE COMBATE

## 1. Objetivo

O combate atual não deve continuar baseado na repetição visual do mesmo golpe.

Quero um sistema expressivo, responsivo e variado.

Cada ataque precisa possuir preparação, impacto e recuperação.

## 2. Sistema de combos

Implemente uma máquina de estados de combate.

O ataque básico deverá possuir sequências.

Exemplo para espada:

**Ataque 1:** corte horizontal.

**Ataque 2:** corte diagonal contrário.

**Ataque 3:** golpe vertical ou finalizador.

O terceiro ataque deve possuir identidade própria, sem ser necessariamente muito mais forte.

As sequências deverão variar conforme a arma e a classe.

Não reutilize a mesma pose com efeitos diferentes para fingir novos golpes.

## 3. Janelas de combo

Crie regras de:

- Entrada de comando.
- Buffer de ataque.
- Cancelamento permitido.
- Tempo de recuperação.
- Interrupção por dano.
- Reinício de sequência.
- Orientação para o alvo.
- Consumo de recursos, quando aplicável.

O jogador deve conseguir encadear ataques de forma responsiva.

Não permita spam infinito sem consequências.

## 4. Hitboxes e sincronização

O dano deve acontecer no momento visual do impacto.

Não aplique dano antes de a arma atingir o alvo.

Associe os eventos de acerto aos frames corretos.

Implemente hitboxes adequadas a cada golpe.

Verifique alcance, ângulo e colisões.

Evite acertar múltiplas vezes o mesmo inimigo por um único golpe, salvo quando essa for a mecânica explícita.

## 5. Feedback

Melhore:

- Efeitos de impacto.
- Reação dos inimigos.
- Sons por material.
- Partículas.
- Pequenas vibrações de câmera.
- Indicadores de dano.
- Sensação de peso.
- Recuperação após ataques.

Não exagere no screen shake.

Não transforme todos os ataques em explosões luminosas.

O combate deve continuar legível.

## 6. Diferenças entre classes

**Guerreiro:** golpes com peso, controle de alcance e combinações de cortes.

**Assassino:** ataques rápidos, alternância de movimentos e oportunidades de precisão.

**Arcanista:** gestos de conjuração variados, projéteis e habilidades com preparação própria.

**Atirador:** disparos com animação de preparação, recuo e recuperação.

Preserve as habilidades e árvores já existentes.

Integre as melhorias de combate sem apagar builds.

## 7. Inimigos e chefes

Inimigos também devem utilizar padrões variados.

Chefes precisam possuir sequências próprias, telegráficos claros e transições entre fases.

Não implemente dificuldade apenas aumentando HP e dano.

A dificuldade deve surgir de padrões que o jogador aprende e domina.

---

# PARTE VII — MUNDO ABERTO E CONTÍNUO

## 1. Problema estrutural

Distrito Zero não deve parecer uma coleção de mapas pequenos e isolados.

Atualmente, a arquitetura documentada utiliza regiões finitas de 28 × 28 conectadas por passagens.

Quero evoluir essa estrutura para um mundo explorável e espacialmente coerente.

**Não basta aumentar os mapas ou esconder as transições com uma animação.**

## 2. Arquitetura do mundo

Projete um sistema de coordenadas globais para o mundo.

Implemente regiões conectadas por terreno navegável sempre que a geografia permitir.

Utilize:

- Chunks.
- Carregamento por proximidade.
- Descarregamento de áreas distantes.
- Persistência de alterações.
- Coordenadas globais.
- Streaming de cenário.
- Controle de entidades ativas.
- Culling de renderização.
- Navegação entre chunks.

Não carregue o mundo inteiro na memória.

O mundo deverá crescer sem exigir uma reescrita completa da renderização.

## 3. Conexões naturais

Vila Pedralta, Margem de Kharn, Ruínas Esquecidas e Bairro da Ferrugem deverão possuir relações geográficas coerentes.

Crie estradas, pontes, trilhas, passagens e acidentes geográficos.

Não conecte duas regiões apenas porque são capítulos consecutivos.

A posição das regiões deve fazer sentido no mapa global.

Masmorras e interiores podem continuar utilizando transições próprias quando houver justificativa física.

## 4. Migração dos mapas existentes

Não descarte os mapas atuais.

Converta ou integre suas estruturas ao novo sistema.

Preserve:

- Pontos de interesse.
- Missões.
- NPCs.
- Baús.
- Inimigos.
- Passagens.
- Descoberta.
- Estados persistidos.
- Coordenadas de objetivos.

Crie mapeamento entre coordenadas antigas e novas.

Saves existentes precisam ser migrados para posições válidas.

## 5. Densidade do mundo

Não crie quilômetros de terreno vazio.

Cada área deverá possuir uma função.

Distribua:

- Estradas.
- Ruínas.
- Pequenos assentamentos.
- Acampamentos.
- Locais de investigação.
- Recursos.
- Inimigos.
- Segredos.
- Eventos ambientais.
- Atalhos.
- Elementos narrativos.

Nem tudo precisa ser uma missão.

O mundo deve recompensar observação e exploração.

## 6. Biomas e identidade regional

Cada região precisa ter:

- Paleta secundária própria.
- Arquitetura.
- Materiais.
- Vegetação.
- Inimigos.
- Ambiência.
- Iluminação.
- Condições ambientais.

Preserve a identidade artística geral.

Evite mudanças bruscas de estilo entre áreas vizinhas.

## 7. Minimapa e mapa global

Adapte o minimapa ao sistema de coordenadas globais.

Implemente um mapa maior consultável, com descoberta persistente.

Mostre apenas as informações que o jogador realmente conhece.

Objetivos devem continuar rastreáveis entre regiões.

Não revele todos os segredos automaticamente.

## 8. Desempenho

Estabeleça orçamentos de renderização, memória e entidades ativas.

Teste o jogo durante deslocamentos longos.

Evite:

- Travamentos ao carregar chunks.
- Pop-in excessivo.
- NPCs desaparecendo indevidamente.
- Inimigos reaparecendo fora das regras.
- Falhas de colisão nas bordas dos chunks.
- Perda de eventos de missão.
- Descontinuidade visual do terreno.

---

# PARTE VIII — REFORMULAÇÃO COMPLETA DOS POPUPS E INTERFACES

## 1. Objetivo

Quero eliminar interfaces genéricas que não parecem pertencer ao universo de Distrito Zero.

A interface deve parecer parte de um RPG autoral em pixel art.

Reformule:

- Balões de diálogo.
- Caixas de escolhas.
- Popups de recompensa.
- Notificações.
- Mensagens de missão.
- Tooltips.
- Inventário.
- Comparação de equipamentos.
- Telas de habilidades.
- Menus de confirmação.
- Alertas de combate.
- Telas de morte.
- Interfaces de chefes.

## 2. Sistema de design

Crie tokens centralizados para:

- Paleta.
- Tipografia.
- Bordas.
- Espaçamentos.
- Ícones.
- Sombras.
- Estados de foco.
- Estados de seleção.
- Animações.
- Camadas de interface.

Use como referência os moldes já existentes em `HUD.JPG`, `MAPAA.PNG` e `MISSOES.PNG`.

Não misture componentes com bordas arredondadas modernas e componentes pixelados sem uma justificativa artística.

## 3. Balões de diálogo

Os diálogos deverão utilizar:

- Painéis escuros.
- Bordas douradas discretas.
- Ornamentos pixelados.
- Nome do personagem.
- Retrato, quando disponível.
- Texto legível.
- Indicador de continuidade.
- Opções de escolha integradas.
- Estados de seleção por teclado e mouse.

A interface deve se adaptar à resolução.

Não permita que diálogos fiquem fora da tela.

Não sobreponha caixas de escolha à barra de vida ou a controles essenciais.

## 4. Popups de recompensa

Quando o jogador obtiver um item:

- Exiba o ícone correto.
- Nome.
- Raridade.
- Quantidade.
- Animação discreta.
- Som apropriado.

Itens comuns devem produzir feedback discreto.

Itens raros podem receber uma apresentação mais marcante.

Não utilize a mesma animação extravagante para uma moeda e um item lendário.

## 5. Posicionamento inteligente

Implemente um gerenciador de camadas e posicionamento de UI.

Evite:

- Popups cortados.
- Tooltips fora da janela.
- Textos sobrepostos.
- Botões inacessíveis.
- Interfaces escondidas atrás de outras.
- Elementos que bloqueiam o personagem.
- Notificações infinitas.
- Menus que permanecem abertos indevidamente.

O sistema deve respeitar desktop, resoluções menores e tela cheia.

## 6. Acessibilidade

Garanta:

- Contraste adequado.
- Tamanho de texto legível.
- Navegação por teclado.
- Foco visível.
- Redução de movimento.
- Feedback que não dependa exclusivamente de cores.
- Possibilidade de avançar diálogos manualmente.

Não sacrifique usabilidade em nome da estética.

---

# PARTE IX — ELIMINAÇÃO DE AI SLOP E IDENTIDADE AUTORAL

## 1. Definição do problema

Neste projeto, considere "AI slop" qualquer elemento que pareça genérico, inconsistente, artificialmente produzido ou desconectado da identidade de Distrito Zero.

Isso inclui:

- Sprites com anatomia inconsistente.
- Pixel art borrada.
- Objetos sem perspectiva correta.
- Efeitos exagerados.
- Textos genéricos.
- Diálogos sem personalidade.
- Ícones de bibliotecas visivelmente incompatíveis.
- Gradientes modernos desnecessários.
- Glassmorphism.
- Neon excessivo.
- Painéis sem hierarquia.
- Animações repetidas artificialmente.
- Inimigos com aparência genérica.
- Cenários compostos por assets que não combinam.
- Popups com aparência de template web.
- Imagens de alta resolução reduzidas para parecer pixel art.

## 2. Auditoria artística

Inspecione todas as telas principais.

Identifique elementos que não parecem pertencer ao mesmo jogo.

Classifique cada problema por gravidade:

**Crítico:** quebra a identidade visual ou prejudica a jogabilidade.

**Alto:** causa inconsistência perceptível.

**Médio:** reduz o acabamento.

**Baixo:** refinamento opcional.

Corrija primeiro os problemas críticos.

## 3. Biblioteca de componentes autorais

Crie componentes reutilizáveis específicos de Distrito Zero.

Padronize:

- Painéis.
- Botões.
- Barras.
- Molduras.
- Ícones.
- Indicadores.
- Seletores.
- Tooltips.
- Diálogos.
- Notificações.
- Retratos.
- Animações de interface.

Evite incorporar novos estilos sem necessidade.

## 4. Coerência narrativa

Revise os textos existentes.

Remova falas artificiais e excessivamente explicativas.

Os personagens devem possuir personalidade e conhecimento limitados ao que realmente sabem.

Evite repetir termos como "destino", "sombras", "poder ancestral" e "segredos esquecidos" sem função narrativa.

Não reescreva o cânone para torná-lo mais genérico.

---

# PARTE X — ARQUITETURA E INTEGRAÇÃO

Todos os novos sistemas devem ser modulares.

Separe responsabilidades de:

- Catálogo de itens.
- Geração de loot.
- Tabelas de drops.
- Registro de inimigos.
- Pipeline de assets.
- Renderização de equipamentos.
- Estados de combate.
- Combos.
- Hitboxes.
- Streaming de mundo.
- Persistência global.
- Design system.
- Gerenciamento de popups.

Não transforme `game.ts`, `renderer.ts` ou `ui.ts` em arquivos gigantes com todas as regras concentradas.

Utilize interfaces TypeScript claras.

Evite dependências circulares.

Mantenha o jogo executável em todas as fases da implementação.

---

# PARTE XI — COMPATIBILIDADE COM SAVES

Esta é uma exigência crítica.

Não apague o progresso dos jogadores.

Preserve:

- Personagem.
- Classe.
- Nível.
- Experiência.
- Atributos.
- Habilidades.
- Equipamentos.
- Inventário.
- Moedas.
- Missões.
- Regiões.
- Descoberta.
- Chefes derrotados.
- Recompensas únicas.
- Escolhas narrativas.

Se o formato de salvamento precisar evoluir, implemente uma nova versão com migração e backup.

Não faça alterações destrutivas no localStorage.

Itens antigos precisam ser mapeados para o novo catálogo.

Equipamentos existentes devem receber suas novas representações visuais sem desaparecer do inventário.

---

# PARTE XII — VALIDAÇÃO PROFISSIONAL

Implemente testes para cada sistema.

## Testes de loot

- Distribuição estatística.
- Drops por família.
- Drops de chefes.
- Recompensas únicas.
- Coleta.
- Inventário cheio, se aplicável.
- Persistência.

## Testes de combate

- Sequência de combos.
- Interrupção.
- Hitboxes.
- Dano.
- Orientação.
- Ataques por classe.
- Troca de arma.
- Sincronização com animação.

## Testes visuais

- Proporção dos sprites.
- Pivôs.
- Transparência.
- Alinhamento.
- Direções.
- Variantes de equipamento.
- Consistência de paleta.
- Renderização em diferentes resoluções.

## Testes de mundo

- Streaming.
- Colisões entre chunks.
- Transições.
- Navegação de inimigos.
- Persistência de regiões.
- Descoberta.
- Objetivos.
- Desempenho.

## Testes de UI

- Posicionamento.
- Foco.
- Navegação.
- Tooltips.
- Popups.
- Diálogos.
- Responsividade.
- Tela cheia.

Execute os comandos de validação existentes, incluindo:

`npm test`

`npm run build`

`npm run test:e2e`

Não desative testes para conseguir aprovação artificial.

---

# PARTE XIII — ORDEM OBRIGATÓRIA DE EXECUÇÃO

A refatoração é extensa. Não tente implementar tudo de forma desorganizada.

Execute em etapas verificáveis.

### Fase 1 — Auditoria e arquitetura

Inspecione o projeto e produza o diagnóstico técnico e artístico.

Defina contratos e critérios de aceitação.

### Fase 2 — Identidade visual e pipeline de assets

Padronize a pixel art, os sprites, a paleta e a produção de novos assets.

### Fase 3 — Loot e inventário

Implemente tabelas, probabilidades, drops físicos, raridades e persistência.

### Fase 4 — Inimigos

Crie o registro declarativo, pipeline visual, animações e integração automática.

### Fase 5 — Equipamentos

Implemente variantes visuais, anexação correta de armas e prévias.

### Fase 6 — Combate

Implemente combos, novas animações, hitboxes, feedback e diferenças entre classes.

### Fase 7 — Mundo aberto

Implemente coordenadas globais, chunks, streaming e migração gradual dos mapas.

### Fase 8 — Interface

Refaça os popups, diálogos, HUD e componentes incompatíveis com a direção artística.

### Fase 9 — Polimento autoral

Revise cada tela, cenário, personagem, animação e efeito.

Elimine inconsistências remanescentes.

### Fase 10 — Testes e documentação

Execute regressões completas.

Documente o resultado real.

Cada fase deve terminar com uma versão funcional do jogo.

Se a execução atingir limites de contexto ou tempo, conclua a fase atual em estado estável, registre o progresso e forneça instruções precisas para continuar.

Não apresente fases incompletas como concluídas.

---

# PARTE XIV — CRITÉRIOS FINAIS DE ACEITAÇÃO

A reconstrução somente será considerada concluída quando:

1. A pixel art possuir escala e linguagem visual consistentes.
2. Os personagens não apresentarem mudanças indevidas de anatomia entre animações.
3. Os inimigos tiverem representações visuais adequadas.
4. Novos inimigos puderem ser registrados por um pipeline reproduzível.
5. Os drops funcionarem com probabilidades verificáveis.
6. O loot depender da natureza dos inimigos.
7. Chefes possuírem recompensas próprias.
8. Os drops aparecerem fisicamente no mundo.
9. As armas equipadas aparecerem corretamente no personagem.
10. Os ataques básicos tiverem variações reais.
11. O combate possuir feedback, alcance e hitboxes coerentes.
12. O mundo permitir exploração contínua nas áreas integradas.
13. O carregamento de chunks não provocar travamentos graves.
14. Os popups não apresentarem cortes ou sobreposições.
15. Os diálogos seguirem a identidade artística.
16. Os saves antigos permanecerem utilizáveis.
17. A campanha continuar funcionando.
18. O jogo não depender de serviços externos para executar.
19. Os testes automatizados passarem.
20. A experiência possuir uma identidade própria e consistente.

---

# PARTE XV — RELATÓRIO FINAL

Ao terminar, apresente:

- Arquivos modificados.
- Sistemas implementados.
- Assets criados ou substituídos.
- Inimigos integrados.
- Tabelas de loot.
- Armas com variantes visuais.
- Novas animações.
- Regiões migradas.
- Interfaces reformuladas.
- Testes executados.
- Evidências visuais.
- Limitações remanescentes.

Crie `docs/REFORGE_IMPLEMENTACAO.md`.

Inclua capturas comparativas antes/depois, quando possível.

Não afirme que uma melhoria visual foi concluída sem inspecionar seu resultado renderizado.

---

# DIRETRIZ FINAL — A IDENTIDADE DE DISTRITO ZERO

Distrito Zero precisa deixar de parecer uma coleção de sistemas independentes.

Quero que os inimigos, as armas, o combate, os cenários, o inventário, os diálogos e a exploração compartilhem uma mesma linguagem.

Quando o jogador encontrar uma arma rara, ela deve parecer especial.

Quando equipá-la, deve enxergar a diferença.

Quando atacar, deve perceber peso, direção e variação.

Quando derrotar um inimigo, o loot deve fazer sentido.

Quando descobrir uma região, ela deve parecer parte de um mundo maior.

Quando conversar com um personagem, a interface deve parecer criada especificamente para Distrito Zero.

**O objetivo não é simplesmente adicionar mais conteúdo. É fazer com que todos os elementos existentes e futuros tenham qualidade, propósito e identidade.**

Implemente, valide, revise e refine.

Não aceite placeholders como solução definitiva.

Não substitua qualidade artística por quantidade de assets.

Não substitua profundidade de gameplay por efeitos visuais exagerados.

Não substitua mundo aberto por mapas vazios.

Não substitua automação por resultados genéricos.

**Transforme Distrito Zero em um RPG coeso, autoral, tecnicamente sólido e visualmente memorável.**