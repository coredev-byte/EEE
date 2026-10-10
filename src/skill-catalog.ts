// Catálogo dos 180 nós da especificação do jogador.
export const CATALOG = [
  {
    classId: "guerreiro",
    name: "Vanguarda",
    role: "tanque, proteção de aliados e controle de inimigos.",
    nodes: [
      [
        "Golpe de Escudo",
        "Ativa",
        "Golpe frontal que causa dano e interrompe inimigos pequenos.",
      ],
      [
        "Postura de Ferro",
        "Passiva",
        "Reduz parte do dano recebido enquanto parado ou avançando lentamente.",
      ],
      [
        "Provocação",
        "Ativa",
        "Atrai a atenção dos inimigos próximos por alguns segundos.",
      ],
      [
        "Guarda Reativa",
        "Passiva",
        "Bloquear um ataque fortalece o próximo golpe.",
      ],
      [
        "Investida Implacável",
        "Ativa",
        "Avança em linha reta, empurrando inimigos atingidos.",
      ],
      [
        "Armadura Adaptativa",
        "Passiva",
        "Receber vários golpes seguidos aumenta temporariamente a resistência.",
      ],
      [
        "Muralha",
        "Ativa",
        "Cria uma postura defensiva que reduz muito o dano frontal.",
      ],
      ["Retaliação", "Passiva", "Bloqueios perfeitos causam dano ao agressor."],
      [
        "Quebra-Formação",
        "Ativa",
        "Golpe em área que reduz a defesa dos inimigos.",
      ],
      [
        "Guardião de Aço",
        "Passiva",
        "Aumenta a proteção de aliados próximos ou de companheiros controlados pela IA, caso existam.",
      ],
      [
        "Última Linha",
        "Passiva",
        "Quando a vida fica baixa, recebe uma proteção temporária, com recarga.",
      ],
      [
        "Prisão de Guerra",
        "Ativa",
        "Golpe pesado que prende brevemente um alvo comum.",
      ],
      [
        "Comandante",
        "Passiva",
        "Provocações fortalecem a resistência e o dano contra inimigos provocados.",
      ],
      [
        "Fortaleza Ambulante",
        "Ativa",
        "Avança lentamente com defesa elevada, empurrando inimigos pelo caminho.",
      ],
      [
        "Bastião de Pedralta",
        "Suprema",
        "Cria uma zona defensiva por tempo limitado. Inimigos dentro dela causam menos dano, e o Guerreiro fica muito difícil de derrubar.",
      ],
    ],
  },
  {
    classId: "guerreiro",
    name: "Berserker",
    role: "dano físico elevado, agressividade e risco calculado.",
    nodes: [
      ["Corte Selvagem", "Ativa", "Ataque amplo com a arma."],
      [
        "Fúria Crescente",
        "Passiva",
        "Acertar ataques consecutivos aumenta o dano até um limite.",
      ],
      ["Sangue Quente", "Passiva", "Causar dano gera Ímpeto adicional."],
      [
        "Ruptura",
        "Ativa",
        "Golpe pesado que causa dano extra contra inimigos com muita vida.",
      ],
      ["Ferida Aberta", "Passiva", "Ataques fortes aplicam sangramento."],
      ["Avanço Brutal", "Ativa", "Investida ofensiva que termina em um golpe."],
      [
        "Dor Alimenta",
        "Passiva",
        "Sofrer dano gera um bônus ofensivo temporário, com limite.",
      ],
      [
        "Carnificina",
        "Ativa",
        "Sequência de golpes rápidos; cada acerto aumenta o custo do próximo golpe.",
      ],
      [
        "Predador Ferido",
        "Passiva",
        "Causa mais dano contra inimigos com pouca vida.",
      ],
      [
        "Frenesi",
        "Ativa",
        "Aumenta a velocidade de ataque, mas reduz a defesa.",
      ],
      [
        "Sangue por Sangue",
        "Passiva",
        "Parte do dano causado durante Frenesi restaura vida, com limite por segundo.",
      ],
      [
        "Execução",
        "Ativa",
        "Ataque lento e poderoso contra alvos debilitados.",
      ],
      [
        "Fúria Incontrolável",
        "Passiva",
        "Ao atingir um limite de Ímpeto, o próximo golpe ganha alcance e força.",
      ],
      [
        "Devorador de Batalhas",
        "Passiva",
        "Derrotar inimigos prolonga parte dos bônus ofensivos ativos.",
      ],
      [
        "Eclipse Rubro",
        "Suprema",
        "Entra em frenesi por alguns segundos, aumentando dano e velocidade. Derrotas durante o efeito prolongam sua duração, até um máximo.",
      ],
    ],
  },
  {
    classId: "guerreiro",
    name: "Cavaleiro Rúnico",
    role: "dano físico e mágico, marcas rúnicas e controle de área.",
    nodes: [
      [
        "Lâmina Rúnica",
        "Ativa",
        "Reforça a arma com energia arcana por tempo limitado.",
      ],
      [
        "Inscrição de Guerra",
        "Passiva",
        "Ataques aplicam marcas rúnicas acumuláveis.",
      ],
      [
        "Selo de Pedra",
        "Ativa",
        "Marca o chão e reduz a velocidade de inimigos na área.",
      ],
      [
        "Casca Rúnica",
        "Passiva",
        "Marcas acumuladas concedem resistência temporária.",
      ],
      ["Corte Sísmico", "Ativa", "Golpe no chão que causa dano em uma linha."],
      [
        "Runa Explosiva",
        "Passiva",
        "Consumir marcas causa uma pequena explosão adicional.",
      ],
      [
        "Passo Gravado",
        "Ativa",
        "Avança até uma posição curta, deixando uma marca no ponto de origem.",
      ],
      [
        "Circuito Arcano",
        "Passiva",
        "Alternar entre habilidades rúnicas reduz parcialmente suas recargas.",
      ],
      [
        "Prisão de Glifos",
        "Ativa",
        "Forma runas ao redor de um inimigo, imobilizando-o brevemente.",
      ],
      [
        "Arma Desperta",
        "Passiva",
        "A arma rúnica ganha efeitos adicionais conforme o tipo de equipamento.",
      ],
      [
        "Ressonância",
        "Passiva",
        "Explosões rúnicas podem ativar marcas próximas.",
      ],
      [
        "Pilar Ancestral",
        "Ativa",
        "Invoca um pilar que atinge inimigos ao redor.",
      ],
      [
        "Marca do Colosso",
        "Passiva",
        "Inimigos marcados causam menos dano ao Guerreiro.",
      ],
      [
        "Sobrecarga Rúnica",
        "Ativa",
        "Consome todas as marcas para gerar uma explosão proporcional às marcas consumidas.",
      ],
      [
        "Coração da Ruína",
        "Suprema",
        "Cria um campo de runas que fortalece ataques, detona marcas e causa dano periódico aos inimigos dentro da área.",
      ],
    ],
  },
  {
    classId: "arcanista",
    name: "Piromancia",
    role: "dano em área, queimadura e explosões em cadeia.",
    nodes: [
      ["Faísca Ígnea", "Ativa", "Projétil rápido de fogo."],
      ["Combustão", "Passiva", "Aumenta o dano periódico de queimadura."],
      ["Brasa Persistente", "Passiva", "Queimaduras duram mais tempo."],
      [
        "Orbe Flamejante",
        "Ativa",
        "Projétil lento que explode ao atingir um alvo ou obstáculo.",
      ],
      [
        "Calor Instável",
        "Passiva",
        "Acertos consecutivos contra o mesmo alvo fortalecem o próximo feitiço de fogo.",
      ],
      [
        "Muralha de Chamas",
        "Ativa",
        "Cria uma barreira que causa dano ao atravessá-la.",
      ],
      [
        "Cinzas Vivas",
        "Passiva",
        "Inimigos derrotados enquanto queimam deixam brasas que causam dano.",
      ],
      ["Chuva de Meteoros", "Ativa", "Atinge uma área com múltiplos impactos."],
      [
        "Ignição Encadeada",
        "Passiva",
        "A explosão de um inimigo queimando espalha parte da queimadura aos próximos.",
      ],
      [
        "Corpo Incandescente",
        "Ativa",
        "Envolve o Arcanista em fogo, causando dano próximo e melhorando a mobilidade.",
      ],
      [
        "Combustível Arcano",
        "Passiva",
        "Gastar Essência em feitiços de fogo aumenta temporariamente o dano do próximo.",
      ],
      [
        "Núcleo Explosivo",
        "Ativa",
        "Carrega uma esfera que causa mais dano quanto mais tempo for canalizada.",
      ],
      [
        "Fogo Faminto",
        "Passiva",
        "Dano de fogo contra alvos queimando recupera uma pequena quantidade de Essência, com limite.",
      ],
      [
        "Inferno Concentrado",
        "Passiva",
        "Feitiços de fogo causam mais dano contra alvos isolados, mas menos dano em área.",
      ],
      [
        "Sol Negro",
        "Suprema",
        "Cria uma esfera de fogo que atrai inimigos para o centro e explode, deixando uma área incendiada.",
      ],
    ],
  },
  {
    classId: "arcanista",
    name: "Vazio",
    role: "enfraquecimento, aprisionamento, distorção e dano sombrio.",
    nodes: [
      [
        "Estilhaço do Vazio",
        "Ativa",
        "Disparo sombrio que atravessa parte dos inimigos.",
      ],
      [
        "Corrupção",
        "Passiva",
        "Habilidades do Vazio aplicam uma marca que amplifica efeitos posteriores.",
      ],
      [
        "Peso da Escuridão",
        "Ativa",
        "Reduz a velocidade dos inimigos numa área.",
      ],
      [
        "Fenda Instável",
        "Passiva",
        "Alvos corrompidos recebem mais dano de habilidades do Vazio.",
      ],
      ["Prisão Abissal", "Ativa", "Prende um inimigo comum numa pequena zona."],
      [
        "Dreno Dimensional",
        "Passiva",
        "Causar dano a alvos corrompidos recupera uma fração de Essência.",
      ],
      [
        "Passagem Sombria",
        "Ativa",
        "Teleporta o Arcanista a uma curta distância.",
      ],
      [
        "Distorção",
        "Passiva",
        "Após usar Passagem Sombria, o próximo ataque mágico ganha alcance.",
      ],
      [
        "Buraco Negro",
        "Ativa",
        "Cria um campo que puxa inimigos para o centro.",
      ],
      [
        "Eco do Abismo",
        "Passiva",
        "Uma parte do dano mágico é repetida após um breve atraso.",
      ],
      [
        "Maldição Persistente",
        "Passiva",
        "Aumenta a duração das marcas de corrupção.",
      ],
      [
        "Ruptura Dimensional",
        "Ativa",
        "Abre uma fenda que causa dano em pulsos.",
      ],
      [
        "Devorador de Luz",
        "Passiva",
        "Derrotar inimigos corrompidos restaura uma pequena quantidade de vida ou Essência, conforme a melhoria escolhida.",
      ],
      [
        "Colapso",
        "Ativa",
        "Consome marcas de corrupção para causar dano imediato.",
      ],
      [
        "Boca do Abismo",
        "Suprema",
        "Abre uma singularidade que atrai inimigos, aplica corrupção e termina com uma explosão dimensional.",
      ],
    ],
  },
  {
    classId: "arcanista",
    name: "Tecelão Arcano",
    role: "versatilidade, escudos, controle e manipulação de feitiços.",
    nodes: [
      ["Dardo Arcano", "Ativa", "Projétil mágico de baixo custo."],
      [
        "Fluxo Eficiente",
        "Passiva",
        "Reduz ligeiramente o custo de feitiços básicos.",
      ],
      ["Escudo de Éter", "Ativa", "Absorve parte do dano recebido."],
      ["Reserva Expandida", "Passiva", "Aumenta a Essência máxima."],
      [
        "Campo de Lentidão",
        "Ativa",
        "Cria uma área que reduz a velocidade de inimigos e projéteis.",
      ],
      [
        "Ritmo Mágico",
        "Passiva",
        "Alternar tipos de feitiço reduz parte da recarga do próximo.",
      ],
      [
        "Duplicação",
        "Ativa",
        "O próximo projétil elegível gera uma cópia com dano reduzido.",
      ],
      [
        "Precisão Arcana",
        "Passiva",
        "Feitiços que atingem o centro do alvo causam dano adicional.",
      ],
      [
        "Desvio Etéreo",
        "Ativa",
        "Converte parte do dano recebido em uma proteção temporária, com recarga.",
      ],
      [
        "Nó de Convergência",
        "Passiva",
        "Usar três tipos diferentes de feitiço concede um bônus temporário.",
      ],
      [
        "Ruptura de Canal",
        "Ativa",
        "Interrompe uma habilidade inimiga canalizada.",
      ],
      [
        "Reciclagem de Éter",
        "Passiva",
        "Abater um inimigo com feitiço recupera parte do custo da habilidade.",
      ],
      [
        "Campo de Amplificação",
        "Ativa",
        "Cria uma área que fortalece feitiços lançados de dentro dela.",
      ],
      [
        "Mestre dos Fluxos",
        "Passiva",
        "Reduz a penalidade de custo ao combinar habilidades de ramos diferentes.",
      ],
      [
        "Convergência Absoluta",
        "Suprema",
        "Cria um campo arcano que reduz recargas, amplifica feitiços e permite lançar uma sequência de poderes com custo reduzido.",
      ],
    ],
  },
  {
    classId: "assassino",
    name: "Sombra",
    role: "furtividade, emboscada e execução de alvos prioritários.",
    nodes: [
      [
        "Corte Silencioso",
        "Ativa",
        "Ataque rápido com bônus ao atingir um alvo desprevenido.",
      ],
      ["Passos Leves", "Passiva", "Reduz o alcance de detecção dos inimigos."],
      [
        "Véu Sombrio",
        "Ativa",
        "Entra em furtividade por um período limitado, se não estiver sob condições que a impeçam.",
      ],
      [
        "Ataque Oportuno",
        "Passiva",
        "Primeiro golpe saindo da furtividade causa dano adicional.",
      ],
      [
        "Salto das Sombras",
        "Ativa",
        "Avança até um inimigo próximo e o ataca.",
      ],
      [
        "Presença Apagada",
        "Passiva",
        "Derrotar um inimigo sem ser detectado reduz brevemente a detecção de outros.",
      ],
      [
        "Marca da Presa",
        "Ativa",
        "Marca um alvo; ataques contra ele ganham um bônus.",
      ],
      [
        "Silêncio Mortal",
        "Passiva",
        "Golpes pelas costas aumentam a duração de efeitos negativos aplicados.",
      ],
      [
        "Desaparecimento",
        "Ativa",
        "Remove temporariamente a atenção dos inimigos comuns e permite reposicionamento.",
      ],
      [
        "Caçador Invisível",
        "Passiva",
        "Mover-se fora da visão dos inimigos acelera a recuperação de Combo.",
      ],
      [
        "Lâmina Fantasma",
        "Ativa",
        "Lança uma lâmina que causa dano e retorna.",
      ],
      [
        "Eco da Emboscada",
        "Passiva",
        "O primeiro ataque após a furtividade deixa um golpe atrasado.",
      ],
      [
        "Execução Sombria",
        "Ativa",
        "Golpe de alto dano contra alvo enfraquecido, com condição de uso.",
      ],
      [
        "Predador Noturno",
        "Passiva",
        "Derrotar alvos marcados reduz a recarga de uma habilidade de mobilidade.",
      ],
      [
        "Dança do Eclipse",
        "Suprema",
        "Marca vários alvos e executa uma sequência de investidas entre eles, priorizando os mais vulneráveis.",
      ],
    ],
  },
  {
    classId: "assassino",
    name: "Veneno",
    role: "dano ao longo do tempo, enfraquecimento e desgaste.",
    nodes: [
      ["Lâmina Envenenada", "Ativa", "Aplica veneno aos próximos ataques."],
      ["Toxina Concentrada", "Passiva", "Aumenta o dano periódico do veneno."],
      ["Dardo Tóxico", "Ativa", "Projétil que envenena o alvo."],
      [
        "Metabolismo Cruel",
        "Passiva",
        "Aplicar veneno em um alvo já envenenado prolonga o efeito até um limite.",
      ],
      [
        "Nuvem Venenosa",
        "Ativa",
        "Cria uma área tóxica que afeta inimigos dentro dela.",
      ],
      [
        "Sangue Contaminado",
        "Passiva",
        "Alvos envenenados causam menos dano por um curto período.",
      ],
      [
        "Veneno Paralisante",
        "Ativa",
        "Aplica uma toxina que reduz muito a velocidade; chefes recebem efeito reduzido.",
      ],
      [
        "Mistura Instável",
        "Passiva",
        "Alternar tipos de veneno adiciona efeitos secundários.",
      ],
      [
        "Frasco Corrosivo",
        "Ativa",
        "Reduz temporariamente a defesa do alvo atingido.",
      ],
      [
        "Dose Letal",
        "Passiva",
        "Veneno causa dano adicional em inimigos com pouca vida.",
      ],
      [
        "Transmissão",
        "Passiva",
        "Alvos derrotados envenenados espalham uma pequena quantidade de toxina.",
      ],
      [
        "Infusão Dupla",
        "Ativa",
        "Combina duas toxinas equipadas num único ataque.",
      ],
      [
        "Antídoto Sombrio",
        "Ativa",
        "Remove um efeito negativo do Assassino e concede resistência temporária.",
      ],
      [
        "Química Mortal",
        "Passiva",
        "Aumenta a duração das toxinas, mas não permite acumulação infinita.",
      ],
      [
        "Jardim da Agonia",
        "Suprema",
        "Espalha uma névoa venenosa ampla, que enfraquece inimigos e intensifica o dano dos venenos já aplicados.",
      ],
    ],
  },
  {
    classId: "assassino",
    name: "Duelista",
    role: "combate corpo a corpo técnico, esquivas e combos.",
    nodes: [
      ["Estocada Rápida", "Ativa", "Ataque frontal veloz."],
      [
        "Reflexos Treinados",
        "Passiva",
        "Melhora a janela de esquiva perfeita.",
      ],
      [
        "Esquiva Cortante",
        "Ativa",
        "Esquiva que causa dano ao atravessar um inimigo.",
      ],
      [
        "Ritmo de Combate",
        "Passiva",
        "Ataques consecutivos aumentam temporariamente a velocidade de ataque.",
      ],
      ["Contra-ataque", "Ativa", "Golpe executado após uma esquiva precisa."],
      [
        "Leitura de Movimento",
        "Passiva",
        "Após evitar um ataque, o próximo golpe causa dano adicional.",
      ],
      ["Corte Cruzado", "Ativa", "Dois golpes em direções diferentes."],
      [
        "Combo Fluido",
        "Passiva",
        "Usar habilidades diferentes em sequência gera Combo extra.",
      ],
      [
        "Passo Lateral",
        "Ativa",
        "Reposiciona-se rapidamente para o lado do alvo.",
      ],
      [
        "Ponto Fraco",
        "Passiva",
        "Ataques após reposicionamento ignoram uma parcela da defesa.",
      ],
      [
        "Desarme",
        "Ativa",
        "Interrompe ataques de certos inimigos; chefes não perdem armas, mas podem sofrer interrupção limitada.",
      ],
      [
        "Cadência Mortal",
        "Passiva",
        "Atingir o máximo de Combo fortalece o próximo ataque especial.",
      ],
      [
        "Dança de Lâminas",
        "Ativa",
        "Sequência de golpes rápidos ao redor do alvo.",
      ],
      [
        "Perfeição Técnica",
        "Passiva",
        "Esquivas perfeitas reduzem parte da recarga das habilidades de combate.",
      ],
      [
        "Um Segundo de Silêncio",
        "Suprema",
        "Executa uma série de cortes extremamente rápidos; o dano aumenta conforme a quantidade de ataques e esquivas precisas realizadas antes da ativação.",
      ],
    ],
  },
  {
    classId: "atirador",
    name: "Franco-atirador",
    role: "precisão, dano concentrado e eliminação de alvos distantes.",
    nodes: [
      [
        "Tiro Preciso",
        "Ativa",
        "Disparo que causa dano adicional quando acerta um ponto fraco.",
      ],
      [
        "Mira Estável",
        "Passiva",
        "Ficar parado por um curto período melhora a precisão.",
      ],
      [
        "Marcação Óptica",
        "Ativa",
        "Marca um inimigo e revela sua posição por tempo limitado.",
      ],
      [
        "Anatomia de Combate",
        "Passiva",
        "Aumenta o dano contra pontos fracos.",
      ],
      [
        "Disparo Perfurante",
        "Ativa",
        "Projétil que atravessa inimigos alinhados.",
      ],
      [
        "Controle de Recuo",
        "Passiva",
        "Disparos consecutivos ficam mais precisos quando o jogador controla o ritmo.",
      ],
      [
        "Mira Concentrada",
        "Ativa",
        "Canaliza Foco para aumentar o dano do próximo disparo.",
      ],
      [
        "Alvo Exposto",
        "Passiva",
        "Inimigos marcados recebem dano adicional do primeiro disparo.",
      ],
      [
        "Tiro Ricochete",
        "Ativa",
        "Projétil que ricocheteia em superfícies válidas.",
      ],
      ["Foco Letal", "Passiva", "Acertos precisos geram Foco extra."],
      [
        "Disparo Supressor",
        "Ativa",
        "Causa dano e reduz temporariamente a capacidade ofensiva de inimigos comuns.",
      ],
      [
        "Distância Ideal",
        "Passiva",
        "Causa mais dano dentro da faixa ideal da arma equipada.",
      ],
      [
        "Tiro Fantasma",
        "Ativa",
        "Disparo carregado que atravessa obstáculos específicos definidos pelo jogo.",
      ],
      [
        "Especialista em Chefes",
        "Passiva",
        "Acertos consecutivos no mesmo chefe aumentam o dano até um limite.",
      ],
      [
        "Último Horizonte",
        "Suprema",
        "Disparo extremamente potente, com preparação longa, capaz de atravessar vários inimigos e causar dano elevado a um alvo prioritário.",
      ],
    ],
  },
  {
    classId: "atirador",
    name: "Engenhoqueiro",
    role: "armadilhas, dispositivos, controle de terreno e dano preparado.",
    nodes: [
      [
        "Mina de Impacto",
        "Ativa",
        "Coloca uma mina que explode ao detectar um inimigo.",
      ],
      [
        "Montagem Rápida",
        "Passiva",
        "Reduz o tempo de implantação de dispositivos.",
      ],
      [
        "Torreta Compacta",
        "Ativa",
        "Instala uma torreta que ataca inimigos próximos.",
      ],
      [
        "Circuitos Eficientes",
        "Passiva",
        "Aumenta a duração dos dispositivos.",
      ],
      ["Armadilha de Choque", "Ativa", "Imobiliza brevemente inimigos comuns."],
      [
        "Sobrecarga",
        "Passiva",
        "Dispositivos causam dano extra após permanecerem ativos por um período.",
      ],
      [
        "Drone de Reconhecimento",
        "Ativa",
        "Revela inimigos numa área e destaca recursos importantes.",
      ],
      [
        "Sinalizador Tático",
        "Passiva",
        "Inimigos revelados recebem um pequeno bônus de dano dos disparos.",
      ],
      [
        "Campo de Lentidão",
        "Ativa",
        "Implanta um dispositivo que reduz a velocidade dos inimigos.",
      ],
      [
        "Reciclagem Mecânica",
        "Passiva",
        "Destruir ou recolher dispositivos recupera parte da recarga.",
      ],
      [
        "Torreta Perfurante",
        "Melhoria ativa",
        "Modifica a torreta para priorizar alvos resistentes.",
      ],
      [
        "Armadilha Encadeada",
        "Passiva",
        "Uma armadilha ativada pode reduzir a recarga de outra próxima.",
      ],
      [
        "Carga Remota",
        "Ativa",
        "Detona dispositivos colocados anteriormente dentro do alcance permitido.",
      ],
      [
        "Arsenal Modular",
        "Passiva",
        "Permite escolher modificações para os dispositivos equipados.",
      ],
      [
        "Protocolo Cerco",
        "Suprema",
        "Implanta um conjunto de dispositivos que combina torreta, minas e controle de área durante uma janela de combate.",
      ],
    ],
  },
  {
    classId: "atirador",
    name: "Caçador",
    role: "perseguição, sobrevivência, armadilhas naturais e combate contra monstros.",
    nodes: [
      [
        "Flecha ou Disparo Marcador",
        "Ativa",
        "Marca uma presa e facilita persegui-la.",
      ],
      [
        "Rastreador",
        "Passiva",
        "Revela rastros de inimigos e recursos próximos quando aplicável.",
      ],
      [
        "Armadilha de Laço",
        "Ativa",
        "Prende um inimigo comum por um breve período.",
      ],
      [
        "Instinto de Sobrevivência",
        "Passiva",
        "Receber dano de um inimigo marcado concede velocidade temporária.",
      ],
      [
        "Disparo de Caça",
        "Ativa",
        "Ataque que causa dano adicional contra a presa marcada.",
      ],
      [
        "Predador Paciente",
        "Passiva",
        "Esperar antes do primeiro disparo melhora seu dano inicial.",
      ],
      [
        "Armadilha Explosiva",
        "Ativa",
        "Prepara uma armadilha de dano em área.",
      ],
      [
        "Conhecimento da Presa",
        "Passiva",
        "Repetir ataques contra o mesmo tipo de inimigo melhora a eficácia contra ele durante o combate.",
      ],
      [
        "Passo de Caçador",
        "Ativa",
        "Deslocamento rápido que deixa uma isca temporária.",
      ],
      [
        "Isca Tática",
        "Passiva",
        "Inimigos atraídos pela isca ficam vulneráveis a armadilhas.",
      ],
      [
        "Tiro de Interrupção",
        "Ativa",
        "Disparo que interrompe certas ações inimigas.",
      ],
      [
        "Colheita de Recursos",
        "Passiva",
        "Aumenta a chance de obter materiais comuns de criaturas, respeitando limites de balanceamento.",
      ],
      [
        "Marca da Extinção",
        "Ativa",
        "Marca um alvo resistente e acumula progresso ao acertá-lo.",
      ],
      [
        "Anatomia Monstruosa",
        "Passiva",
        "Aumenta a eficácia contra inimigos de elite e chefes após identificar seus padrões.",
      ],
      [
        "Caçada Implacável",
        "Suprema",
        "Marca uma presa prioritária, revela seus pontos fracos e fortalece os ataques do Atirador contra ela durante um período limitado.",
      ],
    ],
  },
] as const;
