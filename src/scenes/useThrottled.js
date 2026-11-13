import { useRef } from "react";

// Limita quantas vezes por segundo uma cena 3D avisa o painel (React) sobre
// novos valores. A animação continua a 60 qps dentro do Three.js; só os
// números do painel são atualizados ~10x por segundo. Sem isso, a tela inteira
// era redesenhada a cada quadro e a animação engasgava em PCs mais simples.
export function useThrottled(fn, ms = 100) {
  const last = useRef(0);
  return (value, force = false) => {
    const now = performance.now();
    if (!force && now - last.current < ms) return;
    last.current = now;
    fn?.(value);
  };
}
