import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLessonBySlug } from "../data/lessons.js";
import { useAppStore } from "../store/useAppStore.js";
import "./LessonLayout.css";
import Annotations from "./Annotations.jsx";
import { useConcepts } from "../scenes/quantities.jsx";
import { usePopupPin } from "../scenes/planetInfo.jsx";

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
    <LessonView key={slug} lesson={lesson} mode={mode} SceneComponent={SceneComponent} />
  );
}

// Gaveta do painel no celular em pé: "min" (só o título), "half" (metade da tela)
// e "full" (quase a tela toda). No computador e com o celular deitado o painel
// continua lateral e a gaveta é ignorada pelo CSS.
const SHEET_ORDER = ["min", "half", "full"];

function LessonView({ lesson, mode, SceneComponent }) {
  const [sheet, setSheet] = useState("half");
  // cada aula começa com todas as etiquetas de conceitos visíveis
  useEffect(() => {
    useConcepts.getState().showAll();
    usePopupPin.getState().setPin(null);
  }, []);
  const touchStartY = useRef(null);

  const step = (dir) =>
    setSheet((s) => SHEET_ORDER[Math.min(2, Math.max(0, SHEET_ORDER.indexOf(s) + dir))]);

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (Math.abs(dy) < 24) return; // foi um toque, não um arrasto: o onClick cuida
    e.preventDefault();
    step(dy < 0 ? 1 : -1);
  };
  const onClick = () => setSheet((s) => (s === "min" ? "half" : "min"));

  const handleLabel = sheet === "min" ? "Mostrar painel" : "Recolher painel";

  return (
    <div className={`lesson lesson--sheet-${sheet} ${mode === "presenter" ? "lesson--presenter" : ""}`}>
      <div className="lesson__stage">
        <Link to="/" className="lesson__backBtn" aria-label="Voltar para todas as aulas">
          ← <span className="lesson__backText">Todas as aulas</span>
          <span className="lesson__backShort">Aulas</span>
        </Link>
        <span className="lesson__badge">
          Aula {lesson.id}
          <span className="lesson__badgeMode"> · {mode === "presenter" ? "Apresentação" : "Modo interativo"}</span>
        </span>
        {SceneComponent ? (
          <SceneComponent />
        ) : (
          <div style={{ padding: 40, color: "white" }}>Cena em construção.</div>
        )}
        <Annotations />
        <button
          type="button"
          className="sheetHandle"
          aria-label={handleLabel}
          aria-expanded={sheet !== "min"}
          onClick={onClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <span className="sheetHandle__bar" />
          <span className="sheetHandle__text">
            {sheet === "min" ? "▴ Mostrar painel" : "▾ Recolher · arraste ↕"}
          </span>
        </button>
      </div>
    </div>
  );
}
