import { useCallback, useEffect, useRef, useState } from "react";
import "./Annotations.css";
import { useConcepts } from "../scenes/quantities.jsx";

// Caneta de anotação por cima da cena 3D. Com a caneta ligada, o toque/mouse
// desenha em vez de girar a câmera; com ela desligada, os traços continuam
// visíveis e a cena volta a responder normalmente.
// Os traços ficam guardados como pontos (em px da área da cena), para serem
// redesenhados com nitidez quando a tela muda de tamanho.

const COLORS = [
  { value: "#facc15", name: "Amarelo" },
  { value: "#f87171", name: "Vermelho" },
  { value: "#4ade80", name: "Verde" },
  { value: "#38bdf8", name: "Azul" },
  { value: "#e879f9", name: "Rosa" },
  { value: "#ffffff", name: "Branco" },
  { value: "#111827", name: "Preto" },
];

const SIZES = [
  { value: 2, name: "Fina" },
  { value: 5, name: "Média" },
  { value: 10, name: "Grossa" },
  { value: 18, name: "Extra grossa" },
];

const TOOLS = [
  { value: "pen", icon: "✏️", name: "Caneta" },
  { value: "marker", icon: "🖍️", name: "Marca-texto (translúcido)" },
  { value: "eraser", icon: "🧽", name: "Borracha" },
];

function drawStroke(ctx, s) {
  const pts = s.points;
  if (!pts.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (s.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = s.size * 2.5;
  } else {
    ctx.globalAlpha = s.tool === "marker" ? 0.35 : 1;
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.tool === "marker" ? s.size * 2.2 : s.size;
  }
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // curva suave passando pelos pontos médios
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();
  }
  ctx.restore();
}

export default function Annotations() {
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const [count, setCount] = useState(0); // nº de traços (para habilitar desfazer/limpar)
  const hiddenTags = useConcepts((s) => s.hidden.size);
  const showAllTags = useConcepts((s) => s.showAll);

  const canvasRef = useRef(null);
  const strokes = useRef([]);
  const current = useRef(null);

  const redraw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const dpr = cv.width / Math.max(1, cv.clientWidth);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const s of strokes.current) drawStroke(ctx, s);
    if (current.current) drawStroke(ctx, current.current);
  }, []);

  // Mantém a resolução do canvas igual à da área da cena
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [redraw]);

  // Atalhos: Esc desliga a caneta, Ctrl+Z desfaz
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setActive(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && strokes.current.length) {
        e.preventDefault();
        strokes.current.pop();
        setCount(strokes.current.length);
        redraw();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redraw]);

  const pointOf = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const onPointerDown = (e) => {
    if (!active || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    current.current = { tool, color, size, points: [pointOf(e)] };
    redraw();
  };
  const onPointerMove = (e) => {
    if (!current.current) return;
    const evts = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of evts) current.current.points.push(pointOf(ev));
    redraw();
  };
  const finish = () => {
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    setCount(strokes.current.length);
    redraw();
  };

  const undo = () => {
    strokes.current.pop();
    setCount(strokes.current.length);
    redraw();
  };
  const clear = () => {
    strokes.current = [];
    setCount(0);
    redraw();
  };

  const previewColor = tool === "eraser" ? "#94a3b8" : color;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`annot__canvas${active ? " annot__canvas--active" : ""}${tool === "eraser" ? " annot__canvas--eraser" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-hidden="true"
      />

      <div className={`annot__bar${active ? " annot__bar--open" : ""}`} role="toolbar" aria-label="Caneta de anotação">
        <button
          type="button"
          className={`annot__toggle${active ? " is-on" : ""}`}
          onClick={() => setActive((a) => !a)}
          aria-pressed={active}
          title={active ? "Desligar caneta (Esc) — volta a girar a cena" : "Ligar caneta para marcar na cena"}
        >
          <span aria-hidden="true">{active ? "✋" : "✏️"}</span>
          <span className="annot__toggleText">{active ? "Mover cena" : "Caneta"}</span>
        </button>

        {active && (
          <>
            <div className="annot__group">
              {TOOLS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`annot__tool${tool === t.value ? " is-on" : ""}`}
                  onClick={() => setTool(t.value)}
                  title={t.name}
                  aria-label={t.name}
                  aria-pressed={tool === t.value}
                >
                  {t.icon}
                </button>
              ))}
            </div>

            <div className="annot__group annot__colors">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`annot__swatch${color === c.value && tool !== "eraser" ? " is-on" : ""}`}
                  style={{ background: c.value }}
                  onClick={() => {
                    setColor(c.value);
                    if (tool === "eraser") setTool("pen");
                  }}
                  title={c.name}
                  aria-label={`Cor ${c.name}`}
                />
              ))}
            </div>

            <div className="annot__group">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`annot__size${size === s.value ? " is-on" : ""}`}
                  onClick={() => setSize(s.value)}
                  title={`Ponta ${s.name.toLowerCase()}`}
                  aria-label={`Ponta ${s.name.toLowerCase()}`}
                >
                  <span
                    style={{ width: Math.max(4, s.value), height: Math.max(4, s.value), background: previewColor }}
                  />
                </button>
              ))}
            </div>

            <div className="annot__group">
              <button
                type="button"
                className="annot__tool"
                onClick={undo}
                disabled={!count}
                title="Desfazer (Ctrl+Z)"
                aria-label="Desfazer"
              >
                ↶
              </button>
              <button
                type="button"
                className="annot__tool"
                onClick={clear}
                disabled={!count}
                title="Apagar todas as marcações"
                aria-label="Apagar tudo"
              >
                🗑️
              </button>
            </div>
          </>
        )}

        {hiddenTags > 0 && (
          <button
            type="button"
            className="annot__tool annot__showTags"
            onClick={showAllTags}
            title="Mostrar de novo as etiquetas que foram ocultadas"
            aria-label={`Mostrar ${hiddenTags} etiqueta(s) ocultada(s)`}
          >
            👁<span className="annot__badge">{hiddenTags}</span>
          </button>
        )}

        {!active && count > 0 && (
          <button
            type="button"
            className="annot__tool annot__clearMini"
            onClick={clear}
            title="Apagar todas as marcações"
            aria-label="Apagar marcações"
          >
            🗑️
          </button>
        )}
      </div>
    </>
  );
}
