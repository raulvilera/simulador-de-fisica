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
import Lesson10GeoHelio from "../scenes/Lesson10GeoHelio.jsx";
import Lesson11Origin from "../scenes/Lesson11Origin.jsx";
import Lesson12Planets from "../scenes/Lesson12Planets.jsx";
import Lesson13StarLife from "../scenes/Lesson13StarLife.jsx";
import Lesson14SkyObservation from "../scenes/Lesson14SkyObservation.jsx";
import Lesson15IndigenousSky from "../scenes/Lesson15IndigenousSky.jsx";
import Lesson16Planetarium from "../scenes/Lesson16Planetarium.jsx";
import Lesson17Gravitation from "../scenes/Lesson17Gravitation.jsx";
import Lesson18EarthMoon from "../scenes/Lesson18EarthMoon.jsx";
import Lesson19HabitableZone from "../scenes/Lesson19HabitableZone.jsx";
import Lesson20SpaceExploration from "../scenes/Lesson20SpaceExploration.jsx";

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
  "geo-helio": Lesson10GeoHelio,
  "origin": Lesson11Origin,
  "planets": Lesson12Planets,
  "star-life": Lesson13StarLife,
  "sky-observation": Lesson14SkyObservation,
  "indigenous-sky": Lesson15IndigenousSky,
  "planetarium": Lesson16Planetarium,
  "gravitation": Lesson17Gravitation,
  "earth-moon": Lesson18EarthMoon,
  "habitable-zone": Lesson19HabitableZone,
  "space-exploration": Lesson20SpaceExploration,
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
