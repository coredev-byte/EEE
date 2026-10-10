# DISTRITO ZERO — REFORMULAÇÃO COMPLETA DO SISTEMA DE ÁUDIO

Atue como um engenheiro de áudio para jogos, sound designer e desenvolvedor sênior especializado em RPGs de ação com pixel art.

Quero reformular profundamente o sistema de áudio do Distrito Zero. Não quero apenas adicionar alguns efeitos sonoros genéricos. Quero um sistema sonoro consistente, detalhado, responsivo e integrado ao combate, à exploração, às habilidades, aos equipamentos, aos diálogos e à interface.

O jogo tem identidade de RPG sombrio e fantasia urbana, com pixel art detalhado. Todos os sons devem combinar com esse universo.

## 1. Antes de implementar

Faça uma auditoria do projeto existente.

- Identifique a tecnologia utilizada e como o áudio está sendo executado.
- Verifique se já existe um sistema de áudio, quais sons estão disponíveis e onde são acionados.
- Localize os pontos de integração com combate, habilidades, inimigos, inventário, diálogos, equipamentos, interface e exploração.
- Identifique sons ausentes, repetitivos, atrasados, sobrepostos ou acionados várias vezes indevidamente.
- Verifique o carregamento dos arquivos, o desempenho, a compatibilidade com navegadores e a política de salvamento das configurações.

Não recrie o jogo do zero. Preserve os sistemas funcionais e integre as melhorias à arquitetura existente.

## 2. Identidade sonora de Distrito Zero

Crie uma direção sonora própria baseada em três camadas:

**Camada ambiental:** vento, ruídos distantes, estruturas antigas, máquinas, água, insetos, ecos e sons específicos de cada região.

**Camada de ação:** ataques, impactos, habilidades, passos, movimentação, inimigos, dano, morte, coleta e equipamentos.

**Camada de interface:** menus, inventário, habilidades, missões, diálogos, notificações, evolução e mudanças de equipamento.

As três camadas precisam coexistir sem competir excessivamente pelo volume ou esconder informações importantes do jogador.

Evite sons genéricos de jogos de celular, efeitos exagerados e áudio que pareça desconectado das ações visíveis.

## 3. Sistema de combate

Cada ação deve possuir um som correspondente ao momento correto da animação.

Implemente sons distintos para:

- Preparação de ataques.
- Movimento e passagem da arma pelo ar.
- Ataques que acertam inimigos.
- Ataques que erram.
- Bloqueios, defesas e esquivas.
- Acertos críticos.
- Interrupções e quebra de defesa.
- Aplicação de queimadura, veneno, sangramento e corrupção.
- Morte de inimigos.
- Dano recebido pelo jogador.
- Ativação, manutenção e término de habilidades.
- Recarga ou falta de recurso para executar uma habilidade.

Os sons de preparação, golpe e impacto devem ser eventos separados, sincronizados com as animações. Não reproduza o som do impacto antes de o golpe atingir o alvo.

O áudio deve respeitar o tipo de arma, o material atingido e a natureza do ataque. Uma lâmina não deve soar como um martelo, e um golpe mágico não deve usar o mesmo impacto de um ataque físico.

Implemente variações de áudio para ataques repetidos, evitando que o mesmo arquivo seja reproduzido de forma idêntica em todos os golpes.

## 4. Identidade sonora das quatro classes

### Guerreiro
- Golpes pesados com impacto metálico ou contundente.
- Bloqueios com escudo e armadura.
- Passos mais pesados.
- Runas com ressonância grave e sobrenatural.
- Golpes supremos com preparação, impacto principal e cauda sonora.

### Arcanista
- Projéteis mágicos com sons de lançamento e impacto distintos.
- Fogo com combustão, estalos e explosões.
- Vazio com distorções, graves controlados e ecos.
- Escudos mágicos com ressonância cristalina.
- Teletransportes com início e término sonoros próprios.

### Assassino
- Passos discretos.
- Cortes rápidos e precisos.
- Furtividade com efeitos sutis, sem silêncio artificial absoluto.
- Veneno com efeitos líquidos, químicos ou sobrenaturais.
- Combos com sons que acompanhem o ritmo dos golpes.

### Atirador
- Disparos compatíveis com o tipo de arma equipada.
- Recuo e mecanismos da arma.
- Projéteis e impactos.
- Recarga e troca de equipamento.
- Armadilhas, torretas, dispositivos e detonações.
- Sons específicos para acertos em pontos fracos.

Cada habilidade da árvore de habilidades deve estar vinculada ao seu próprio conjunto de eventos sonoros. Habilidades aprimoradas podem receber camadas adicionais, variações ou efeitos mais intensos.

## 5. Equipamentos e personalização sonora

O equipamento precisa influenciar a experiência sonora quando fizer sentido.

- Armas diferentes devem ter sons de ataque e impacto adequados.
- Armas pesadas devem transmitir massa; armas leves devem transmitir velocidade.
- Armaduras podem modificar discretamente os sons de passos e movimentação.
- Equipamentos mágicos podem produzir ressonâncias sutis.
- Armas com efeitos elementais podem adicionar camadas de fogo, gelo, energia ou corrupção.
- Equipar, remover, comparar e trocar itens deve produzir sons distintos.
- Itens lendários e únicos podem ter efeitos sonoros exclusivos.

Não associe um som especial apenas à raridade. O efeito precisa fazer sentido para a identidade e as propriedades do item.

## 6. Coleta de itens e notificações

A coleta de itens precisa ser clara e satisfatória.

Crie eventos diferentes para:
- Moedas e recursos comuns.
- Materiais de fabricação.
- Equipamentos comuns.
- Equipamentos raros.
- Equipamentos épicos.
- Itens lendários.
- Itens de missão.
- Itens que não podem ser coletados por falta de espaço ou requisitos.

Quando um inimigo morrer, não reproduza o mesmo som para cada objeto que cair. Organize os eventos para evitar uma sequência caótica de efeitos.

Quando o jogador coletar um item, a interface deve apresentar o ícone, o nome, a raridade e uma descrição curta. O som da notificação deve combinar com a importância do item, sem interromper o combate.

Se vários itens forem coletados rapidamente, agrupe os sons ou aplique limites de repetição.

## 7. Diálogos e narrativa

Implemente áudio para:

- Abertura e encerramento de diálogos.
- Avanço de falas.
- Escolha de respostas.
- Aceitação e conclusão de missões.
- Descoberta de áreas.
- Revelações importantes da história.
- Eventos narrativos e interações especiais.

Não transforme todo diálogo em uma sequência de bipes. Sons de interface devem ser discretos; momentos narrativos importantes podem receber ambientação, música e efeitos próprios.

Se o projeto não tiver dublagem, não invente vozes ou apresente ruídos como se fossem diálogos falados. Use efeitos sutis de interface e reserve a dublagem para uma implementação futura, caso seja desejada.

## 8. Mundo, exploração e inimigos

Cada região precisa ter uma paisagem sonora reconhecível.

Implemente:
- Ambientes em camadas, com variações sutis.
- Transições suaves entre regiões.
- Sons de portas, mecanismos, água, objetos e elementos interativos.
- Passos que variam de acordo com o terreno, quando o jogo possuir esses materiais.
- Sons de detecção, perseguição e ataques dos inimigos.
- Avisos sonoros discretos para inimigos próximos ou ameaças relevantes.
- Identidade sonora para inimigos de elite e chefes.
- Silêncio ou redução de intensidade em momentos narrativos que exijam contraste.

A distância deve influenciar o volume dos sons de mundo e de combate quando a posição da fonte for relevante. A direção do áudio deve acompanhar a posição dos eventos no mapa, quando suportada pela tecnologia utilizada.

Não aplique espacialização artificial a todos os sons de interface.

## 9. Música dinâmica

Crie um sistema de música em camadas, caso a arquitetura e os recursos disponíveis permitam.

Estados sugeridos:
- Exploração segura.
- Exploração em área perigosa.
- Combate comum.
- Combate contra inimigos de elite.
- Batalha contra chefes.
- Vitória ou derrota.
- Eventos narrativos.
- Menu principal.

As transições precisam ser suaves e respeitar o ritmo do jogo. A música não deve reiniciar abruptamente a cada entrada em combate.

Se não existirem composições próprias disponíveis, prepare uma arquitetura que aceite arquivos de música posteriormente. Não use faixas inexistentes nem dependa de links externos instáveis.

## 10. Mixagem, prioridades e controle de volume

Crie categorias de volume independentes:

- Música.
- Ambiente.
- Combate.
- Interface.
- Vozes, caso existam.

Inclua controles de volume principal e por categoria, opção para silenciar e persistência das configurações entre sessões.

Implemente prioridades de áudio. Eventos importantes, como habilidades supremas, alertas de perigo e ataques de chefes, devem ser audíveis sem tornar todos os demais sons excessivamente baixos.

Evite:
- Sons acumulados sem limite.
- Clipping e distorção involuntária.
- Mudanças bruscas de volume.
- Repetição excessiva de sons curtos.
- Sons de itens sobrepondo falas importantes.
- Efeitos que continuam após o evento que os originou.
- Reprodução duplicada causada por múltiplos eventos da mesma ação.

Use limites de vozes simultâneas, intervalos mínimos de repetição e agrupamento de eventos quando necessário.

## 11. Implementação técnica

Crie ou organize uma camada central de áudio, com responsabilidades claras:

- Carregamento e cache de recursos.
- Reprodução de efeitos.
- Reprodução e transição de música.
- Controle de volume por categoria.
- Prioridade de eventos.
- Limite de sons simultâneos.
- Variações aleatórias controladas.
- Controle de distância e posição, quando aplicável.
- Cancelamento de sons relacionados a eventos encerrados.
- Tratamento de erros de carregamento.
- Integração com as configurações salvas.

Os sistemas de combate e interface devem solicitar eventos de áudio por meio dessa camada, em vez de implementar a reprodução de maneira independente em cada componente.

Respeite as restrições de áudio dos navegadores, incluindo a necessidade de iniciar ou liberar a reprodução após uma interação do usuário, quando aplicável.

Não bloqueie a inicialização do jogo se um arquivo sonoro falhar ao carregar. Registre o erro de forma útil e permita que o restante do jogo continue funcionando.

## 12. Qualidade dos arquivos sonoros

Faça um inventário dos arquivos existentes e identifique o que realmente está faltando.

Priorize sons com boa qualidade, sem ruído acidental, cortes abruptos ou volume inconsistente. Use formatos compatíveis com a plataforma, compressão adequada e arquivos organizados por categoria.

Não crie centenas de arquivos artificiais com nomes diferentes para simular variedade. A variedade deve vir de gravações diferentes, camadas, variações bem escolhidas e processamento coerente.

Se for necessário produzir novos sons, crie uma lista organizada por prioridade, com nome, duração aproximada, descrição, evento que o aciona e alternativas necessárias.

Não declare que um efeito sonoro foi criado ou integrado se apenas deixou um caminho de arquivo vazio.

## 13. Testes obrigatórios

Após implementar:

1. Verifique se os sons são acionados nos eventos corretos.
2. Teste ataques rápidos e sequências de habilidades.
3. Teste mortes com vários itens caindo simultaneamente.
4. Teste a abertura e o fechamento de menus durante o combate.
5. Teste troca de armas e equipamentos.
6. Teste música e efeitos durante mudanças de região.
7. Teste controles de volume e persistência das configurações.
8. Teste erros de carregamento e ausência de arquivos.
9. Verifique se os sons param corretamente quando o jogo é reiniciado ou uma cena é encerrada.
10. Confira se não há reprodução duplicada, excesso de efeitos ou quedas perceptíveis de desempenho.

## Resultado esperado

Quero um sistema de áudio de RPG profissional, com identidade própria para Distrito Zero, boa sincronização com as animações, sons diferenciados por classe e equipamento, ambientação coerente, notificações satisfatórias e mixagem controlada.

Implemente em etapas, preservando as funcionalidades existentes. Primeiro corrija os problemas de arquitetura e sincronização; depois integre combate e interface; por fim, expanda a ambientação e a música dinâmica.

Ao terminar, informe quais arquivos foram alterados, quais sistemas funcionam de verdade, quais recursos sonoros ainda precisam ser produzidos e quais testes foram executados. Não marque como concluída uma funcionalidade que esteja apenas parcialmente implementada.
