import { Link } from "react-router-dom";
import { lessons } from "../data/lessons.js";
import { useAppStore } from "../store/useAppStore.js";
import "./Hub.css";

export default function Hub() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);

  return (
    <div className="hub">
      <header className="hub__header">
        <div>
          <p className="hub__eyebrow">4º bimestre · Ciências · Ensino Fundamental Anos Finais</p>
          <h1>Simulador 3D de Cinemática</h1>
          <p className="hub__subtitle">
            Aulas 1 a 9 — do histórico dos estudos do movimento às Leis de Newton
          </p>
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

      <div className="hub__grid">
        {lessons.map((lesson) => (
          <Link to={`/aula/${lesson.slug}`} key={lesson.id} className="lessonCard">
            <span className="lessonCard__num">Aula {lesson.id}</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.subtitle}</p>
            {lesson.isChallenge && <span className="lessonCard__badge">Desafio</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
