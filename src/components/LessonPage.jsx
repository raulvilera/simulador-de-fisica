import { useParams, Link } from "react-router-dom";
import { getLessonBySlug } from "../data/lessons.js";
import { useAppStore } from "../store/useAppStore.js";
import "./LessonLayout.css";

import Lesson1History from "../scenes/Lesson1History.jsx";
import Lesson2ReferenceFrame from "../scenes/Lesson2ReferenceFrame.jsx";
import Lesson3Displacement from "../scenes/Lesson3Displacement.jsx";
import Lesson4Velocity from "../scenes/Lesson4Velocity.jsx";
import Lesson5VelocityMulti from "../scenes/Lesson5VelocityMulti.jsx";
import Lesson6NewtonForces from "../scenes/Lesson6NewtonForces.jsx";
import Lesson7NewtonForces2 from "../scenes/Lesson7NewtonForces2.jsx";
import Lesson8LabVelocity from "../scenes/Lesson8LabVelocity.jsx";
import Lesson9LabAcceleration from "../scenes/Lesson9LabAcceleration.jsx";

const SCENE_BY_TYPE = {
  history: Lesson1History,
  "reference-frame": Lesson2ReferenceFrame,
  displacement: Lesson3Displacement,
  velocity: Lesson4Velocity,
  "velocity-multi": Lesson5VelocityMulti,
  "newton-forces": Lesson6NewtonForces,
  "newton-forces-2": Lesson7NewtonForces2,
  "lab-velocity": Lesson8LabVelocity,
  "lab-acceleration": Lesson9LabAcceleration,
};

export default function LessonPage() {
  const { slug } = useParams();
  const lesson = getLessonBySlug(slug);
  const mode = useAppStore((s) => s.mode);

  if (!lesson) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        Aula não encontrada. <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  const SceneComponent = SCENE_BY_TYPE[lesson.sceneType];

  return (
    <div className={`lesson ${mode === "presenter" ? "lesson--presenter" : ""}`}>
      <div style={{ position: "relative", gridColumn: "1 / -1" }}>
        <Link to="/" className="lesson__backBtn">
          ← Todas as aulas
        </Link>
        <span className="lesson__badge">
          Aula {lesson.id} · {mode === "presenter" ? "Apresentação" : "Modo interativo"}
        </span>
        {SceneComponent ? (
          <SceneComponent />
        ) : (
          <div style={{ padding: 40, color: "white" }}>Cena em construção.</div>
        )}
      </div>
    </div>
  );
}
