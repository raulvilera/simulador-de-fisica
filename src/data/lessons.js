// Conteúdo extraído das Aulas 1-9 (4º bimestre, Cinemática) — Ciências, Ensino Fundamental Anos Finais
// Fonte: material SEDUC-SP fornecido pelo professor.

export const lessons = [
  {
    id: 1,
    slug: "historia-movimento",
    title: "História do estudo dos movimentos",
    subtitle: "Aristóteles, Ptolomeu, Buridan e Galileu",
    objective:
      "Explicar historicamente os estudos sobre os movimentos, destacando as ideias de Ptolomeu, Aristóteles e Jean Buridan, e comparando-as à superação científica promovida por Galileu.",
    topics: [
      "Movimento natural e movimento violento",
      "Hipótese dos quatro elementos (Aristóteles)",
      "Geocentrismo (Aristóteles e Ptolomeu)",
      "Impetus (Jean Buridan)",
      "A revolução de Galileu Galilei — ausência de forças de resistência",
      "Experimento da Torre de Pisa e o teste da pena e do martelo na Lua",
    ],
    sceneType: "history",
    hasSimulation: true,
  },
  {
    id: 2,
    slug: "referencial-primeira-lei",
    title: "Introdução à Cinemática e Primeira Lei de Newton",
    subtitle: "Referencial, posição, trajetória e inércia",
    objective:
      "Explicar e utilizar os conceitos de trajetória, posição, ponto material, corpo extenso e referencial; introduzir a Primeira Lei de Newton.",
    topics: [
      "Referencial: sistema de referências escolhido pelo observador",
      "Movimento e repouso dependem do referencial",
      "Posição: localização de um corpo em relação a um referencial",
      "Trajetória: conjunto de posições ocupadas ao longo do tempo",
      "Corpo, ponto material e corpo extenso",
      "Primeira Lei de Newton (Lei da Inércia)",
    ],
    sceneType: "reference-frame",
    hasSimulation: true,
  },
  {
    id: 3,
    slug: "posicao-distancia-espaco",
    title: "Posição, distância e espaço percorrido",
    subtitle: "Deslocamento x distância percorrida",
    objective:
      "Explicar e utilizar os conceitos de posição, distância percorrida e espaço percorrido, exemplificando origem e deslocamento em segmentos de reta.",
    topics: [
      "Origem do referencial (ponto zero)",
      "Distância percorrida: soma de todo o trajeto",
      "Deslocamento: ΔS = Sf − S0 (depende só de início e fim)",
      "Deslocamento pode ser zero mesmo havendo movimento",
    ],
    formulas: ["ΔS = Sf − S0"],
    sceneType: "displacement",
    hasSimulation: true,
  },
  {
    id: 4,
    slug: "velocidade-parte-1",
    title: "Velocidade — Parte 1",
    subtitle: "Velocidade média e instantânea",
    objective:
      "Descrever e calcular a velocidade, apresentando a equação da velocidade média e diferenciando-a da velocidade escalar instantânea.",
    topics: [
      "Velocidade: relação entre deslocamento e tempo",
      "Velocidade média: v = ΔS/Δt",
      "Velocidade instantânea (o que o velocímetro mostra)",
      "Unidades SI: m (deslocamento), s (tempo), m/s (velocidade)",
    ],
    formulas: ["v = ΔS / Δt"],
    sceneType: "velocity",
    hasSimulation: true,
  },
  {
    id: 5,
    slug: "velocidade-parte-2",
    title: "Velocidade — Parte 2",
    subtitle: "Trechos múltiplos e velocidade média total",
    objective:
      "Consolidar o cálculo de velocidade média em percursos com múltiplos trechos, paradas e velocidades diferentes.",
    topics: [
      "Velocidade média de percurso completo (soma de distâncias / soma de tempos)",
      "Erro comum: média aritmética das velocidades não é a velocidade média real",
      "Conversão entre km/h e m/s",
    ],
    formulas: ["v = ΔS_total / Δt_total"],
    sceneType: "velocity-multi",
    hasSimulation: true,
  },
  {
    id: 6,
    slug: "aceleracao-newton-1",
    title: "Aceleração, força e Leis de Newton — Parte 1",
    subtitle: "Aceleração média, 2ª e 3ª Leis de Newton",
    objective:
      "Calcular o valor de aceleração média usando a equação e demonstrar como o conceito de aceleração está presente na segunda e terceira leis de Newton.",
    topics: [
      "Aceleração: variação da velocidade no tempo",
      "Aceleração negativa (desaceleração)",
      "Força resultante determina a aceleração",
      "2ª Lei de Newton: FRes = m · a",
      "3ª Lei de Newton: ação e reação (forças em corpos diferentes)",
    ],
    formulas: ["a = ΔV / Δt", "FRes = m · a"],
    sceneType: "newton-forces",
    hasSimulation: true,
  },
  {
    id: 7,
    slug: "aceleracao-newton-2",
    title: "Aceleração, força e Leis de Newton — Parte 2",
    subtitle: "Exercícios de aceleração e conversão de unidades",
    objective:
      "Calcular a aceleração média usando a equação e demonstrar a relação com a 2ª e 3ª Leis de Newton em problemas contextualizados.",
    topics: [
      "Conversão km/h → m/s (dividir por 3,6)",
      "Aceleração média em problemas de corrida/trânsito",
      "Relação entre massa, força resultante e aceleração",
    ],
    formulas: ["a = ΔV / Δt", "FRes = m · a", "km/h ÷ 3,6 = m/s"],
    sceneType: "newton-forces-2",
    hasSimulation: true,
  },
  {
    id: 8,
    slug: "desafio-velocidade",
    title: "Aula desafio: cálculo da velocidade escalar média",
    subtitle: "Experimento com carrinhos de fricção",
    objective:
      "Medir a distância percorrida e o tempo de deslocamento de carrinhos de fricção e calcular a velocidade média experimentalmente.",
    topics: [
      "Montagem da pista e marcação de início/fim",
      "Medição de tempo com cronômetro (5 medições)",
      "Cálculo: V = ΔS / Δt",
    ],
    formulas: ["V = ΔS / Δt"],
    sceneType: "lab-velocity",
    hasSimulation: true,
    isChallenge: true,
  },
  {
    id: 9,
    slug: "desafio-aceleracao",
    title: "Aula desafio: cálculo de aceleração escalar média",
    subtitle: "Continuação do experimento com carrinhos",
    objective:
      "Calcular a aceleração média dos carrinhos a partir dos dados de velocidade obtidos na aula anterior.",
    topics: [
      "Uso dos dados da Aula 8 (ΔS, Δt, velocidade)",
      "Cálculo: a = ΔV / Δt",
      "Discussão de resultados e fontes de erro experimental",
    ],
    formulas: ["a = ΔV / Δt"],
    sceneType: "lab-acceleration",
    hasSimulation: true,
    isChallenge: true,
  },
];

export const getLessonBySlug = (slug) => lessons.find((l) => l.slug === slug);
export const getLessonById = (id) => lessons.find((l) => l.id === Number(id));
