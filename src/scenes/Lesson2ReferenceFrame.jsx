import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { Vehicle, RulerTrack, Label3D } from "./primitives.jsx";
import { useThrottled } from "./useThrottled.js";
import { Readout } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Concept, Term } from "./quantities.jsx";
import { StandingPerson, SightAngle, ReferenceAxis, EYE_Y, PERSON_H } from "./observer.jsx";
import FormulaCard, { num, nump } from "../components/FormulaCard.jsx";

// Valores do exemplo (podem ser digitados no painel), em m/s no referencial do solo
const EX_JOAO = 3;
const EX_OUTRO = 5;
const f1 = (v) => (Math.round(v * 100) / 100).toLocaleString("pt-BR");

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  ref: { id: "ref", symbol: "Referencial", name: "de onde o movimento é observado", color: "#facc15" },
  vj: { id: "vj", symbol: "v João", name: "velocidade de João", color: "#60a5fa" },
  vo: { id: "vo", symbol: "v outro", name: "velocidade do outro carro", color: "#f87171" },
  traj: { id: "traj", symbol: "Trajetória", name: "caminho seguido pelos carros", color: "#4ade80" },
  ang: { id: "ang", symbol: "θ", name: "ângulo de visão em relação ao sentido do movimento", color: "#e5e9f5" },
};

// Observador (pessoa) parado na calçada do lado da câmera, de costas para nós e
// olhando para a pista — vemos o que ele vê.
const OBS = [0, 0, 2.9];
const LANE_J = -0.62; // faixa do João
const LANE_O = 0.62; // faixa do outro carro
const CAR_Y = 0.3; // altura do "centro" do carro para a linha de visada
const sgn = (v) => (v >= 0 ? "+" : "−") + f1(Math.abs(v));
const Q_LIST = Object.values(Q);

// Os carros andam até ±20 m do observador. Quando um chega lá, o movimento
// termina (nada de "teletransporte" de uma ponta à outra).
const ROAD_END = 20; // mais curto: a câmera não precisa se afastar tanto e os carros não ficam minúsculos

function Road({ playing, frame, vJ: V_JOAO, vO: V_OUTRO, onTick, onEnd, resetKey, clockT = 0, xJ = 0, xO = -4 }) {
  const joaoRef = useRef();
  const outroRef = useRef();
  const x = useRef({ joao: 0, outro: -4 });
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const followed = useRef(0);
  const obsRef = useRef();
  // reinício: carros de volta à largada (a câmera do referencial do João se
  // reajusta sozinha no quadro seguinte)
  useEffect(() => {
    x.current = { joao: 0, outro: -4 };
    clock.current = 0;
  }, [resetKey]);
  const clock = useRef(0); // tempo de movimento (s)
  const tick = useThrottled(onTick, 100);
  const [angJ, setAngJ] = useState(null);
  const [angO, setAngO] = useState(null);
  // olho de quem observa: a pessoa (solo) ou o João dentro do carro
  const eye = () => (frame === "solo" ? [OBS[0], EYE_Y, OBS[2]] : [x.current.joao, 0.5, LANE_J]);
  const origin = () => (frame === "solo" ? OBS : [x.current.joao, 0, LANE_J]);

  useFrame((_, delta) => {
    if (playing) {
      clock.current += delta;
      tick({ t: clock.current });
      x.current.joao += V_JOAO * delta;
      x.current.outro += V_OUTRO * delta;
      // fim da pista: os carros param ali e a ação termina
      const clamp = (v) => Math.max(-ROAD_END, Math.min(ROAD_END, v));
      if (Math.abs(x.current.joao) >= ROAD_END || Math.abs(x.current.outro) >= ROAD_END) {
        x.current.joao = clamp(x.current.joao);
        x.current.outro = clamp(x.current.outro);
        onEnd?.();
      }
    }

    if (joaoRef.current) joaoRef.current.position.x = x.current.joao;
    if (outroRef.current) outroRef.current.position.x = x.current.outro;

    // Referencial do solo: a câmera fica parada na beira da pista.
    // Referencial do carro de João: a câmera viaja junto com o João. Ele fica
    // parado no centro da tela e é a pista (com as marcas e as zebras) que
    // passa para trás — como quem olha de dentro do carro.
    const follow = frame === "joao" ? x.current.joao : 0;
    const shift = follow - followed.current;
    if (shift !== 0) {
      camera.position.x += shift;
      if (controls) controls.target.x += shift;
      followed.current = follow;
    }
  });

  return (
    <>
      <RulerTrack length={60} start={-30} step={2} z={0} />
      <group ref={joaoRef} position={[0, 0.3, -0.62]}>
        <Vehicle color="#3b82f6" rotationY={V_JOAO < 0 ? Math.PI : 0} />
        <Label3D position={[0, 1.3, 0]} fontSize={0.26} color="#93c5fd">
          João
        </Label3D>
        <QuantityTag
          q={Q.vj}
          position={[0, 2.05, 0]}
          value={frame === "solo" ? `= ${f1(V_JOAO)} m/s · x = ${num(xJ, 1)} m` : "= 0 m/s · x = 0 m"}
          name={frame === "solo" ? "em relação à rua" : "em relação a ele mesmo: parado"}
        />
        {frame === "joao" && (
          <QuantityTag q={Q.ref} position={[0, 3.45, 0]} value="carro do João" name="o observador viaja com João" />
        )}
      </group>
      <group ref={outroRef} position={[-4, 0.3, 0.62]}>
        <Vehicle color="#f87171" rotationY={V_OUTRO < 0 ? Math.PI : 0} />
        <Label3D position={[0, 1.3, 0]} fontSize={0.26} color="#fca5a5">
          outro carro
        </Label3D>
        <QuantityTag
          q={Q.vo}
          position={[0, 2.95, 0]}
          value={
            frame === "solo"
              ? `= ${f1(V_OUTRO)} m/s · x = ${num(xO, 1)} m`
              : `= ${f1(V_OUTRO - V_JOAO)} m/s · x = ${num(xO - xJ, 1)} m`
          }
          name={frame === "solo" ? "em relação à rua" : `vista por João (${f1(V_OUTRO)} − ${f1(V_JOAO)})`}
        />
      </group>
      {/* tempo e distância entre os carros, mudando durante o movimento */}
      {clockT > 0 && (
        <>
          <QuantityTag
            id="tempo"
            position={[OBS[0] + 1.6, 0.25, OBS[2]]}
            color="#a78bfa"
            symbol="t"
            value={`= ${num(clockT, 1)} s`}
            name="tempo de movimento"
          />
          <QuantityTag
            id="entre"
            position={[(xJ + xO) / 2, 0.15, 2.3]}
            color="#e5e9f5"
            symbol="distância"
            value={`= ${num(Math.abs(xO - xJ), 1)} m`}
            name={`entre os carros: muda ${num(Math.abs(V_OUTRO - V_JOAO))} m a cada segundo (v rel)`}
          />
        </>
      )}
      {/* observador: uma pessoa parada na beira da pista */}
      <group ref={obsRef}>
        <StandingPerson position={OBS} rotationY={Math.PI} />
      </group>
      {/* no referencial da rua, a câmera acompanha os dois carros (e o observador) */}
      <KeepInView targets={[joaoRef, outroRef, obsRef]} enabled={frame === "solo"} axes={[1, 1, 0]} />
      <QuantityTag
        q={Q.ref}
        position={[OBS[0], PERSON_H + 0.75, OBS[2]]}
        symbol={frame === "solo" ? "Observador (referencial)" : "Observador na rua"}
        value={frame === "solo" ? "x = 0" : undefined}
        name={frame === "solo" ? "pessoa parada: origem das posições" : "agora o referencial é o João"}
      />

      {/* eixo de referência (sentido +x do movimento) e ângulos de visão */}
      <Concept id="ang">
        <ReferenceAxis getOrigin={origin} color={Q.ref.color} />
        {frame === "solo" && (
          <SightAngle
            getEye={eye}
            getTarget={() => [x.current.joao, CAR_Y, LANE_J]}
            color="#60a5fa"
            radius={1.2}
            onAngle={setAngJ}
          />
        )}
        <SightAngle
          key={frame}
          getEye={eye}
          getTarget={() => [x.current.outro, CAR_Y, LANE_O]}
          color="#f87171"
          radius={frame === "solo" ? 1.8 : 1.5}
          onAngle={setAngO}
        />
      </Concept>
      {frame === "solo" && angJ && (
        <QuantityTag
          id="ang"
          position={angJ.mid}
          color="#60a5fa"
          symbol="θ João"
          value={`= ${Math.round(angJ.deg)}°`}
          name={`x = ${sgn(angJ.dx)} m do observador`}
        />
      )}
      {angO && (
        <QuantityTag
          id="ang"
          position={
            frame === "solo"
              ? [angO.mid[0], 0.75, angO.mid[2]]
              : [x.current.joao + 2.4, 0.4, (LANE_J + LANE_O) / 2 + 1.4]
          }
          color="#f87171"
          symbol="θ outro"
          value={`= ${Math.round(angO.deg)}°`}
          name={`x = ${sgn(angO.dx)} m ${frame === "solo" ? "do observador" : "do João"}`}
        />
      )}
      <QuantityTag q={Q.traj} position={[-7, 0.45, 1.6]} value="reta" name="caminho seguido pelos carros" />
    </>
  );
}

export default function Lesson2ReferenceFrame() {
  const [playing, setPlaying] = useState(false);
  const [roadKey, setRoadKey] = useState(0); // reinício: carros voltam à largada
  const [frame, setFrame] = useState("solo");

  const [V_JOAO, setVJ] = useState(EX_JOAO);
  const [V_OUTRO, setVO] = useState(EX_OUTRO);
  const [clock, setClock] = useState({ t: 0 }); // tempo desde que os carros começaram a andar
  const relativeSpeed = frame === "solo" ? f1(V_OUTRO) : f1(V_OUTRO - V_JOAO);

  // posições do instante atual (em relação ao observador, x = 0); param no fim da pista
  const lim = (v) => Math.max(-ROAD_END, Math.min(ROAD_END, v));
  const xJnow = lim(V_JOAO * clock.t);
  const xOnow = lim(-4 + V_OUTRO * clock.t);

  return (
    <div className="lesson__canvas">
      <SceneShell fov={46} cameraPosition={[-1.5, 2.7, 10.5]} controlsTarget={[0, 0.3, 0]} maxDistance={45}>
        <Road
          resetKey={roadKey}
          playing={playing}
          frame={frame}
          vJ={V_JOAO}
          vO={V_OUTRO}
          onTick={setClock}
          onEnd={() => setPlaying(false)}
          clockT={clock.t}
          xJ={xJnow}
          xO={xOnow}
        />
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 2 · Referencial</p>
        <h1>De quem é o ponto de vista?</h1>
        <div className="controls">
          <div className="controls__row">
            <span>Referencial</span>
            <div className="btnRow" style={{ marginTop: 0 }}>
              <button
                className={`btn ${frame === "solo" ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setFrame("solo")}
              >
                Solo (rua)
              </button>
              <button
                className={`btn ${frame === "joao" ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setFrame("joao")}
              >
                Carro do João
              </button>
            </div>
          </div>
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? "⏸ Pausar" : "▶ Iniciar"}
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setPlaying(false);
                setClock({ t: 0 });
                setRoadKey((k) => k + 1);
              }}
            >
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: "Velocidade de João (solo)", value: `${f1(V_JOAO)} m/s` },
              { label: "Vel. do outro carro (solo)", value: `${f1(V_OUTRO)} m/s` },
              {
                label: "Vel. do outro carro vista por João",
                value: `${relativeSpeed} m/s`,
              },
              { label: "Referencial atual", value: frame === "solo" ? "Rua" : "Carro do João" },
            ]}
          />
        </div>
        <FormulaCard
          title="Velocidade relativa"
          formula={
            <>
              v<sub>rel</sub> ={" "}
              <Term q={Q.vo}>
                v<sub>outro</sub>
              </Term>{" "}
              −{" "}
              <Term q={Q.vj}>
                v<sub>João</sub>
              </Term>
            </>
          }
          terms={[
            {
              symbol: "vrel",
              name: "velocidade do outro carro vista por João (referencial no carro de João)",
              unit: "m/s",
              color: Q.ref.color,
            },
            { symbol: "voutro", name: "velocidade do outro carro em relação à rua", unit: "m/s", color: Q.vo.color },
            { symbol: "vJoão", name: "velocidade de João em relação à rua", unit: "m/s", color: Q.vj.color },
          ]}
          inputs={[
            {
              key: "vj",
              symbol: "vJoão",
              unit: "m/s",
              value: V_JOAO,
              onChange: setVJ,
              min: -1e12,
              max: 1e12,
              color: Q.vj.color,
            },
            {
              key: "vo",
              symbol: "voutro",
              unit: "m/s",
              value: V_OUTRO,
              onChange: setVO,
              min: -1e12,
              max: 1e12,
              color: Q.vo.color,
            },
          ]}
          steps={
            <>
              v<sub>rel</sub> = {num(V_OUTRO)} − {nump(V_JOAO)} = <b>{num(V_OUTRO - V_JOAO)} m/s</b>
              <br />
              {V_OUTRO - V_JOAO > 0
                ? "João vê o outro carro se afastar para frente."
                : V_OUTRO - V_JOAO < 0
                  ? "João vê o outro carro ficar para trás."
                  : "João vê o outro carro parado ao lado dele."}
            </>
          }
          live={
            clock.t > 0 ? (
              <>
                t = <b>{num(clock.t)} s</b> de movimento
                <br />
                João andou ΔS = v · t = {num(V_JOAO)} × {nump(clock.t)} = <b>{num(V_JOAO * clock.t, 1)} m</b>
                <br />o outro andou {num(V_OUTRO)} × {nump(clock.t)} = <b>{num(V_OUTRO * clock.t, 1)} m</b>
                <br />
                para João, o outro se afastou v<sub>rel</sub> · t = {num(V_OUTRO - V_JOAO)} × {nump(clock.t)} ={" "}
                <b>{num((V_OUTRO - V_JOAO) * clock.t, 1)} m</b>
              </>
            ) : (
              <>Aperte ▶ Iniciar para ver o tempo e as distâncias mudarem enquanto os carros andam.</>
            )
          }
          note="Os carros da cena usam os valores digitados (negativo = sentido contrário). Valores muito altos ficam rápidos demais para acompanhar a olho."
          onReset={() => {
            setVJ(EX_JOAO);
            setVO(EX_OUTRO);
          }}
        />

        <section className="panel__section fcard">
          <h3>Ângulo de visão do observador</h3>
          <div className="fcard__formula">θ = ângulo entre a linha de visada e o sentido do movimento (+x)</div>
          <ul className="fcard__terms">
            <li>
              <b style={{ color: Q.ref.color }}>O</b>
              <span>observador (pessoa parada na rua): é a origem, x = 0. Linha amarela: sentido +x do movimento.</span>
            </li>
            <li>
              <b style={{ color: "#60a5fa" }}>θ</b>
              <span>
                θ &lt; 90°: o carro está à frente (x &gt; 0); θ = 90°: bem diante do observador; θ &gt; 90°: ainda não
                passou (x &lt; 0). Com os carros andando, o ângulo muda o tempo todo.
              </span>
            </li>
            <li>
              <b style={{ color: "#f87171" }}>João</b>
              <span>
                no referencial “Carro do João”, quem observa é o João: ele se vê parado e mede o ângulo até o outro
                carro, que muda mais devagar (velocidade relativa).
              </span>
            </li>
          </ul>
        </section>

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Mude o referencial para "Carro do João": repare que o carro dele passa a ficar parado no centro da cena, e a
          velocidade do outro carro muda — porque a descrição do movimento depende do referencial escolhido.
        </p>
      </div>
    </div>
  );
}
