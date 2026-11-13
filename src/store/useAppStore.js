import { create } from "zustand";

// Modo "presenter": controles grandes, visão de projetor, o professor comanda.
// Modo "interactive": alunos também podem mexer nos parâmetros pelo próprio dispositivo
// (nesta versão local, os dois modos compartilham a mesma tela/estado — pensado para
// já funcionar como ponto de partida de uma versão em rede, onde os alunos entrariam
// por um link e o estado seria sincronizado).
export const useAppStore = create((set) => ({
  mode: "presenter", // "presenter" | "interactive"
  setMode: (mode) => set({ mode }),

  currentLessonId: null,
  setCurrentLessonId: (id) => set({ currentLessonId: id }),

  // Controles de reprodução compartilhados entre as cenas
  playing: false,
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),

  resetSignal: 0,
  reset: () => set((s) => ({ resetSignal: s.resetSignal + 1, playing: false })),

  simSpeed: 1,
  setSimSpeed: (simSpeed) => set({ simSpeed }),
}));
