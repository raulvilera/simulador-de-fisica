// Características dos planetas mostradas no pop-up das aulas de Astronomia.
// Valores médios/aproximados. Distância média ao Sol em milhões de km e em UA
// (1 UA = distância média Terra–Sol ≈ 150 milhões de km).
// Número de luas: contagem conhecida em 2026 (muda com novas descobertas).

export const CLASSES = {
  Rochoso:
    "Planeta rochoso (telúrico): pequeno, denso e com superfície sólida de rochas e metais. Fica mais perto do Sol, antes do cinturão de asteroides.",
  Gasoso:
    "Planeta gasoso (gigante): muito grande, formado principalmente por gases (hidrogênio e hélio), sem superfície sólida, com anéis e muitas luas. Fica além do cinturão de asteroides.",
};

export const PLANET_INFO = {
  Mercúrio: {
    type: "Rochoso",
    temp: "−173 °C (noite) a 427 °C (dia)",
    translation: "88 dias",
    rotation: "59 dias",
    moons: "0",
    distKm: 58,
    distUA: 0.39,
  },
  Vênus: {
    type: "Rochoso",
    temp: "≈ 464 °C (o mais quente: efeito estufa)",
    translation: "225 dias",
    rotation: "243 dias (gira ao contrário)",
    moons: "0",
    distKm: 108,
    distUA: 0.72,
  },
  Terra: {
    type: "Rochoso",
    temp: "≈ 15 °C",
    translation: "365 dias e 6 horas",
    rotation: "≈ 24 horas",
    moons: "1 (a Lua)",
    distKm: 150,
    distUA: 1,
  },
  Marte: {
    type: "Rochoso",
    temp: "≈ −63 °C",
    translation: "687 dias",
    rotation: "≈ 24 h 37 min",
    moons: "2 (Fobos e Deimos)",
    distKm: 228,
    distUA: 1.52,
  },
  Júpiter: {
    type: "Gasoso",
    temp: "≈ −110 °C (topo das nuvens)",
    translation: "≈ 12 anos",
    rotation: "≈ 10 horas (a mais rápida)",
    moons: "101",
    distKm: 778,
    distUA: 5.2,
  },
  Saturno: {
    type: "Gasoso",
    temp: "≈ −140 °C",
    translation: "≈ 29 anos",
    rotation: "≈ 10 h 40 min",
    moons: "285 (o recordista)",
    distKm: 1434,
    distUA: 9.6,
  },
  Urano: {
    type: "Gasoso",
    temp: "≈ −195 °C",
    translation: "84 anos",
    rotation: "≈ 17 horas (gira \"deitado\")",
    moons: "28",
    distKm: 2870,
    distUA: 19.2,
  },
  Netuno: {
    type: "Gasoso",
    temp: "≈ −200 °C",
    translation: "165 anos",
    rotation: "≈ 16 horas",
    moons: "16",
    distKm: 4500,
    distUA: 30,
  },
};

export const PLANET_ORDER = ["Mercúrio", "Vênus", "Terra", "Marte", "Júpiter", "Saturno", "Urano", "Netuno"];

export const fmtDist = (p) =>
  `${p.distKm.toLocaleString("pt-BR")} milhões de km (${p.distUA.toLocaleString("pt-BR")} UA)`;
