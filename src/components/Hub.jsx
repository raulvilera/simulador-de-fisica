import { Link } from "react-router-dom";
import { lessons, unitOf } from "../data/lessons.js";
import { useAppStore } from "../store/useAppStore.js";
import { useInstall } from "../pwa/install.js";
import "./Hub.css";

const UNITS = [
  { name: "Cinemática", range: "Aulas 1 a 9", desc: "do histórico dos estudos do movimento às Leis de Newton" },
  { name: "Astronomia", range: "Aulas 10 a 20", desc: "dos modelos de Universo à exploração espacial" },
];

export default function Hub() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const { canInstall, showIOSHint, install } = useInstall();

  return (
    <div className="hub">
      <header className="hub__header">
        <div>
          <p className="hub__eyebrow">4º bimestre · Ciências · Ensino Fundamental Anos Finais</p>
          <h1>Simulador 3D de Física</h1>
          <p className="hub__subtitle">Aulas 1 a 20 — Cinemática e Astronomia</p>
        </div>
        <div className="hub__modeToggle" role="group" aria-label="Modo de uso">
          <button
            className={mode === "presenter" ? "active" : ""}
            onClick={() => setMode("presenter")}
          >
            🖥️ Apresentação
          </button>
          <button
            className={mode === "interactive" ? "active" : ""}
            onClick={() => setMode("interactive")}
          >
            🙋 Interativo (alunos)
          </button>
        </div>
      </header>

      {showIOSHint && (
        <p className="installHint">
          📲 Para instalar no iPhone/iPad: toque em <strong>Compartilhar</strong> e depois em{" "}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      )}
      {canInstall && (
        <button type="button" className="installBtn" onClick={install}>
          📲 Instalar app
        </button>
      )}

      {UNITS.map((unit) => (
        <section key={unit.name} className="hub__unit">
          <h2 className="hub__unitTitle">
            {unit.name} <span>{unit.range} — {unit.desc}</span>
          </h2>
          <div className="hub__grid">
            {lessons
              .filter((lesson) => unitOf(lesson) === unit.name)
              .map((lesson) => (
                <Link to={`/aula/${lesson.slug}`} key={lesson.id} className="lessonCard">
                  <span className="lessonCard__num">Aula {lesson.id}</span>
                  <h2>{lesson.title}</h2>
                  <p>{lesson.subtitle}</p>
                  {lesson.isChallenge && <span className="lessonCard__badge">Desafio</span>}
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
