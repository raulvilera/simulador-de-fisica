// Ajuda as cenas a mostrar QUALQUER valor digitado numa pista de tamanho fixo:
// escolhe uma janela [lo, hi] (em unidades reais) que contém os valores, um
// passo "redondo" para as marcas da régua e a conversão real <-> cena.

export function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

export const fmtNum = (v, digits = 2) =>
  (Math.round(v * 10 ** digits) / 10 ** digits).toLocaleString("pt-BR", { maximumFractionDigits: digits });

/**
 * values: valores reais que precisam caber na pista.
 * size:   comprimento da pista na cena (unidades 3D).
 * Retorna { lo, hi, k, step, stepScene, toScene, fromScene, label }.
 * k = unidades da cena por unidade real (1 = escala 1:1).
 */
export function fitTrack(values, size = 14) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  let lo;
  let hi;
  let step;
  if (min >= 0 && max <= size) {
    lo = 0;
    hi = size;
    step = 1;
  } else if (max - min <= size) {
    // cabe em 1:1: só desloca a janela
    lo = Math.floor(min - (size - (max - min)) / 2);
    if (min >= 0) lo = Math.max(0, lo);
    hi = lo + size;
    step = 1;
  } else {
    // não cabe: comprime, com marcas em números redondos
    step = niceStep((max - min) / 12);
    lo = Math.floor(min / step) * step;
    hi = Math.ceil(max / step) * step;
    if (hi - lo < step) hi = lo + step;
  }
  const k = size / (hi - lo);
  return {
    lo,
    hi,
    k,
    step,
    stepScene: step * k,
    toScene: (v) => (v - lo) * k,
    fromScene: (x) => lo + x / k,
    label: (x) => fmtNum(lo + x / k, 2),
  };
}
