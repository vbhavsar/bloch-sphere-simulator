// App.jsx — Bloch sphere simulator UI

const { useState, useRef, useEffect, useMemo, useCallback, useReducer } = React;

// ── Tweakable defaults ─────────────────────────────────────────
const TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "meridians": 12,
  "parallels": 6,
  "showLabels": true,
  "animSpeed": 1.0
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweaks] = useState(TWEAKS);
  const [editOpen, setEditOpen] = useState(false);
  const T = THEMES[tweaks.theme];

  // State + history
  const [state, setState] = useState(PRESETS['|0⟩']);
  const [history, setHistory] = useState([]); // list of {label, matrix, axis, angle}
  const [camera, setCamera] = useState({ yaw: 0.55, pitch: 0.35 });

  // Animation
  const [trail, setTrail] = useState([]);
  const [rotAxis, setRotAxis] = useState(null);
  const animRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  // Rx/Ry/Rz angle slider
  const [rotTheta, setRotTheta] = useState(Math.PI / 2);

  // Tweaks protocol
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setEditOpen(true);
      if (d.type === '__deactivate_edit_mode') setEditOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  // Keep body background in sync
  useEffect(() => {
    document.body.style.background = T.bg;
    document.body.style.color = T.text;
  }, [T]);

  // ── Apply gate with animation ──
  const applyGate = useCallback((gate) => {
    if (animating) return;
    const startBloch = stateToBloch(state);
    const axis = vec.norm(gate.axis);
    const angle = gate.angle;
    const duration = Math.max(280, Math.abs(angle) * 420) / tweaks.animSpeed;

    const endState = applyMatrix(gate.matrix, state);
    const endBloch = stateToBloch(endState);

    setRotAxis(axis);
    setAnimating(true);

    const t0 = performance.now();
    const initialTrail = [];

    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      // ease
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const curBloch = rotateAxisAngle(startBloch, axis, angle * eased);
      initialTrail.push(curBloch);
      setTrail([...initialTrail]);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        // Snap to exact end
        setState(endState);
        setAnimating(false);
        setRotAxis(null);
        // keep trail briefly then fade
        setTimeout(() => setTrail([]), 900);
      }
    };
    animRef.current = requestAnimationFrame(step);

    setHistory((h) => [...h, { label: gate.label || 'G', gate }]);
  }, [state, animating, tweaks.animSpeed]);

  // Rebuild state from preset on reset
  const reset = (key) => {
    if (animating) return;
    setState(PRESETS[key]);
    setHistory([]);
    setTrail([]);
    setRotAxis(null);
  };

  const undo = () => {
    if (animating || history.length === 0) return;
    // Recompute from preset not stored — just reset
    // We store gates, so replay all but last from |0⟩
    const prior = history.slice(0, -1);
    let s = PRESETS['|0⟩'];
    for (const h of prior) s = applyMatrix(h.gate.matrix, s);
    setState(s);
    setHistory(prior);
    setTrail([]);
  };

  const clearHistory = () => {
    if (animating) return;
    setHistory([]);
    setTrail([]);
  };

  // Apply custom rotation
  const applyRot = (ax) => {
    const matrices = { x: Rx(rotTheta), y: Ry(rotTheta), z: Rz(rotTheta) };
    const axes = { x: [1,0,0], y: [0,1,0], z: [0,0,1] };
    applyGate({
      label: `R${ax}(${prettyAngle(rotTheta)})`,
      matrix: matrices[ax],
      axis: axes[ax],
      angle: rotTheta,
    });
  };

  // During animation, derive live rendered state from startBloch → we render via trail's latest
  // Trick: while animating, show state.vector live by using the last trail point's bloch.
  // Simplest: update `state` after anim, and during anim pass a synthetic "display state" built from the last trail point.
  const displayState = useMemo(() => {
    if (!animating || trail.length === 0) return state;
    // Reconstruct a pure state from bloch: θ from z, φ from x,y.
    const [x, y, z] = trail[trail.length - 1];
    const theta = Math.acos(Math.max(-1, Math.min(1, z)));
    const phi = Math.atan2(y, x);
    return {
      a: C.mk(Math.cos(theta / 2), 0),
      b: C.fromPolar(Math.sin(theta / 2), phi),
    };
  }, [animating, trail, state]);

  const bloch = stateToBloch(displayState);
  const angles = stateToAngles(displayState);
  const p0 = C.abs2(displayState.a);
  const p1 = C.abs2(displayState.b);

  // ── UI ──
  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: T.bg, color: T.text,
      fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      fontSize: 13,
      display: 'grid',
      gridTemplateColumns: '280px 1fr 340px',
    }}>
      {/* ── LEFT: Gate panel ── */}
      <aside style={{
        borderRight: `1px solid ${T.border}`,
        padding: '24px 20px',
        overflowY: 'auto',
        background: T.bgPanel,
      }}>
        <Header T={T} title="BLOCH" sub="qubit simulator" />

        <SectionTitle T={T}>Reset to</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {Object.keys(PRESETS).map((k) => (
            <PresetBtn key={k} T={T} onClick={() => reset(k)}>{k}</PresetBtn>
          ))}
        </div>

        <SectionTitle T={T}>Pauli</SectionTitle>
        <GateRow T={T} gates={['X','Y','Z']} apply={applyGate} disabled={animating} />

        <SectionTitle T={T}>Hadamard</SectionTitle>
        <GateRow T={T} gates={['H']} apply={applyGate} disabled={animating} />

        <SectionTitle T={T}>Phase</SectionTitle>
        <GateRow T={T} gates={['S','Sdg','T','Tdg']} apply={applyGate} disabled={animating} />

        <SectionTitle T={T}>Rotation</SectionTitle>
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 11, color: T.textDim, marginBottom: 6,
          }}>
            <span>θ</span>
            <span>{prettyAngle(rotTheta)}</span>
          </div>
          <input
            type="range" min={-Math.PI * 2} max={Math.PI * 2} step={Math.PI / 24}
            value={rotTheta}
            onChange={(e) => setRotTheta(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: T.accent }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10, color: T.textDim, marginTop: 2,
          }}>
            <span>−2π</span><span>0</span><span>2π</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {['x','y','z'].map((ax) => (
            <GateBtn key={ax} T={T} disabled={animating} onClick={() => applyRot(ax)}>
              R<sub style={{ fontSize: 9 }}>{ax}</sub>
            </GateBtn>
          ))}
        </div>

        <SectionTitle T={T}>Quick θ</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            ['π/8', Math.PI/8], ['π/4', Math.PI/4],
            ['π/2', Math.PI/2], ['π', Math.PI],
          ].map(([lbl, v]) => (
            <button key={lbl}
              onClick={() => setRotTheta(v)}
              style={{
                ...btnStyle(T), padding: '6px 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                background: Math.abs(rotTheta - v) < 0.01 ? T.accent : T.btnBg,
                color: Math.abs(rotTheta - v) < 0.01 ? (tweaks.theme === 'paper' ? '#fff' : T.bg) : T.text,
                borderColor: Math.abs(rotTheta - v) < 0.01 ? T.accent : T.btnBorder,
              }}
            >{lbl}</button>
          ))}
        </div>

        <div style={{ height: 24 }} />
        <button onClick={undo} disabled={animating || history.length === 0}
          style={{ ...btnStyle(T), width: '100%', marginBottom: 6, opacity: (animating||!history.length) ? 0.4 : 1 }}>
          ← Undo last
        </button>
        <button onClick={clearHistory} disabled={animating || history.length === 0}
          style={{ ...btnStyle(T), width: '100%', opacity: (animating||!history.length) ? 0.4 : 1 }}>
          Clear history
        </button>
      </aside>

      {/* ── CENTER: Sphere ── */}
      <main style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <CornerLabel T={T} pos="tl">BLOCH SPHERE</CornerLabel>
        <CornerLabel T={T} pos="tr">{animating ? 'EVOLVING' : 'IDLE'}</CornerLabel>
        <CornerLabel T={T} pos="bl" onClick={() => setCamera({ yaw: 0.55, pitch: 0.35 })} clickable>
          drag to orbit · θ={(camera.pitch * 180/Math.PI).toFixed(0)}° φ={(camera.yaw * 180/Math.PI).toFixed(0)}° · <span style={{ textDecoration: 'underline' }}>reset view</span>
        </CornerLabel>
        <CornerLabel T={T} pos="br">{history.length} gate{history.length===1?'':'s'} applied</CornerLabel>

        <div style={{ width: 'min(85vh, 85vw, 720px)', aspectRatio: '1 / 1' }}>
          <BlochSphere
            state={displayState}
            trail={trail}
            rotAxis={rotAxis}
            camera={camera}
            onCameraChange={(yaw, pitch) => setCamera({ yaw, pitch })}
            theme={tweaks.theme}
            meridians={tweaks.meridians}
            parallels={tweaks.parallels}
            showLabels={tweaks.showLabels}
            size={720}
          />
        </div>

        {editOpen && (
          <TweakPanel T={T} tweaks={tweaks} updateTweak={updateTweak} />
        )}
      </main>

      {/* ── RIGHT: Readout ── */}
      <aside style={{
        borderLeft: `1px solid ${T.border}`,
        padding: '24px 20px',
        overflowY: 'auto',
        background: T.bgPanel,
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        <Readout T={T} state={displayState} bloch={bloch} angles={angles} p0={p0} p1={p1} />
        <ProbabilityBars T={T} p0={p0} p1={p1} />
        <Circuit T={T} history={history} />
      </aside>
    </div>
  );
}

// ── Subcomponents ──

function Header({ T, title, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11, letterSpacing: 2,
        color: T.textDim, marginBottom: 4,
      }}>{sub}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, letterSpacing: -0.3,
      }}>{title}</div>
    </div>
  );
}

function SectionTitle({ T, children }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 10, letterSpacing: 1.5,
      color: T.textDim,
      textTransform: 'uppercase',
      margin: '22px 0 10px',
    }}>{children}</div>
  );
}

function GateRow({ T, gates, apply, disabled }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(gates.length, 4)}, 1fr)`, gap: 6 }}>
      {gates.map((g) => (
        <GateBtn key={g} T={T} disabled={disabled} onClick={() => apply({ ...GATES[g] })}>
          {GATES[g].label}
        </GateBtn>
      ))}
    </div>
  );
}

function btnStyle(T) {
  return {
    padding: '8px 10px',
    background: T.btnBg,
    border: `1px solid ${T.btnBorder}`,
    borderRadius: 4,
    color: T.text,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.12s, border-color 0.12s',
  };
}

function GateBtn({ T, onClick, disabled, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...btnStyle(T),
        padding: '10px 0',
        background: hover && !disabled ? T.btnBgHover : T.btnBg,
        borderColor: hover && !disabled ? T.accent : T.btnBorder,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function PresetBtn({ T, onClick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...btnStyle(T),
        padding: '8px 0',
        background: hover ? T.btnBgHover : T.btnBg,
        borderColor: hover ? T.accent : T.btnBorder,
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function CornerLabel({ T, pos, children, onClick, clickable }) {
  const positions = {
    tl: { top: 18, left: 20 }, tr: { top: 18, right: 20 },
    bl: { bottom: 18, left: 20 }, br: { bottom: 18, right: 20 },
  };
  return (
    <div onClick={onClick} style={{
      position: 'absolute', ...positions[pos],
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 10, letterSpacing: 1.5,
      color: T.textDim, textTransform: 'uppercase',
      pointerEvents: clickable ? 'auto' : 'none',
      cursor: clickable ? 'pointer' : 'default',
    }}>{children}</div>
  );
}

function Readout({ T, state, bloch, angles, p0, p1 }) {
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
  const fmt = (x, d=3) => (x >= 0 ? ' ' : '') + x.toFixed(d);
  const row = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ color: T.textDim, ...mono, fontSize: 11 }}>{label}</span>
      <span style={{ ...mono, fontSize: 12 }}>{value}</span>
    </div>
  );
  return (
    <div>
      <SectionTitle T={T}>State vector</SectionTitle>
      <div style={{
        ...mono, fontSize: 14, padding: '10px 12px',
        background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
        lineHeight: 1.6,
      }}>
        <div>|ψ⟩ = <span style={{ color: T.accent }}>({C.str(state.a)})</span>|0⟩</div>
        <div style={{ paddingLeft: 28 }}>+ <span style={{ color: T.accent }}>({C.str(state.b)})</span>|1⟩</div>
      </div>

      <div style={{ marginTop: 14 }}>
        {row('α', C.str(state.a, 4))}
        {row('β', C.str(state.b, 4))}
        {row('|α|², |β|²', `${p0.toFixed(4)}, ${p1.toFixed(4)}`)}
      </div>

      <SectionTitle T={T}>Bloch</SectionTitle>
      {row('x', fmt(bloch[0]))}
      {row('y', fmt(bloch[1]))}
      {row('z', fmt(bloch[2]))}
      <div style={{ height: 6 }} />
      {row('θ', `${(angles.theta * 180 / Math.PI).toFixed(1)}°`)}
      {row('φ', `${(angles.phi * 180 / Math.PI).toFixed(1)}°`)}
    </div>
  );
}

function ProbabilityBars({ T, p0, p1 }) {
  return (
    <div>
      <SectionTitle T={T}>Measurement</SectionTitle>
      <ProbBar T={T} label="P(|0⟩)" value={p0} />
      <div style={{ height: 10 }} />
      <ProbBar T={T} label="P(|1⟩)" value={p1} />
    </div>
  );
}

function ProbBar({ T, label, value }) {
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ ...mono, fontSize: 11, color: T.textDim }}>{label}</span>
        <span style={{ ...mono, fontSize: 12 }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{
        height: 6, background: T.bg, border: `1px solid ${T.border}`,
        borderRadius: 2, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          background: T.accent,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function Circuit({ T, history }) {
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
  const sequence = history.map((h) => h.label).join(' · ') || '(identity)';
  return (
    <div>
      <SectionTitle T={T}>Circuit</SectionTitle>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto',
        padding: '14px 10px', minHeight: 64,
        background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
      }}>
        <div style={{
          ...mono, fontSize: 11, color: T.textDim, marginRight: 4, whiteSpace: 'nowrap',
        }}>|0⟩ ─</div>
        {history.length === 0 && (
          <div style={{ ...mono, fontSize: 11, color: T.textDim }}>identity ─</div>
        )}
        {history.map((h, i) => (
          <div key={i} style={{
            ...mono, fontSize: 11,
            padding: '4px 8px',
            background: T.btnBg,
            border: `1px solid ${T.btnBorder}`,
            borderRadius: 3, whiteSpace: 'nowrap',
          }}>{h.label}</div>
        ))}
        <div style={{ ...mono, fontSize: 11, color: T.textDim, marginLeft: 4, whiteSpace: 'nowrap' }}>
          ─ |ψ⟩
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <button
          onClick={() => navigator.clipboard?.writeText(sequence)}
          style={{ ...btnStyle(T), fontSize: 11, padding: '6px 10px', flex: 1 }}>
          Copy sequence
        </button>
        <button
          onClick={() => {
            const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\n' +
              history.map((h) => gateToQasm(h)).filter(Boolean).join('\n');
            navigator.clipboard?.writeText(qasm);
          }}
          style={{ ...btnStyle(T), fontSize: 11, padding: '6px 10px', flex: 1 }}>
          Copy QASM
        </button>
      </div>
      <div style={{
        ...mono, fontSize: 11, color: T.textDim, marginTop: 10, wordBreak: 'break-all',
      }}>{sequence}</div>
    </div>
  );
}

function gateToQasm(h) {
  const map = { X: 'x q[0];', Y: 'y q[0];', Z: 'z q[0];', H: 'h q[0];',
    S: 's q[0];', 'S†': 'sdg q[0];', T: 't q[0];', 'T†': 'tdg q[0];' };
  if (map[h.label]) return map[h.label];
  const m = h.label.match(/^R([xyz])\((.+)\)$/);
  if (m) return `r${m[1]}(${h.gate.angle.toFixed(6)}) q[0];`;
  return null;
}

function TweakPanel({ T, tweaks, updateTweak }) {
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
  return (
    <div style={{
      position: 'absolute', right: 20, bottom: 20,
      width: 240,
      background: T.bgPanel, border: `1px solid ${T.border}`,
      borderRadius: 6, padding: 16,
      fontFamily: "'Inter', system-ui, sans-serif",
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      zIndex: 10,
    }}>
      <div style={{
        ...mono, fontSize: 10, letterSpacing: 2, color: T.textDim,
        textTransform: 'uppercase', marginBottom: 12,
      }}>Tweaks</div>

      <TweakRow T={T} label="Theme">
        <select
          value={tweaks.theme}
          onChange={(e) => updateTweak('theme', e.target.value)}
          style={selectStyle(T)}
        >
          <option value="paper">Paper (light)</option>
          <option value="ink">Ink (dark)</option>
          <option value="blueprint">Blueprint</option>
        </select>
      </TweakRow>

      <TweakRow T={T} label="Meridians" value={tweaks.meridians}>
        <input type="range" min="4" max="24" step="2" value={tweaks.meridians}
          onChange={(e) => updateTweak('meridians', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: T.accent }} />
      </TweakRow>

      <TweakRow T={T} label="Parallels" value={tweaks.parallels}>
        <input type="range" min="2" max="12" step="1" value={tweaks.parallels}
          onChange={(e) => updateTweak('parallels', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: T.accent }} />
      </TweakRow>

      <TweakRow T={T} label="Animation speed" value={`${tweaks.animSpeed.toFixed(1)}×`}>
        <input type="range" min="0.25" max="3" step="0.25" value={tweaks.animSpeed}
          onChange={(e) => updateTweak('animSpeed', parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: T.accent }} />
      </TweakRow>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 8 }}>
        <input type="checkbox" checked={tweaks.showLabels}
          onChange={(e) => updateTweak('showLabels', e.target.checked)} />
        Show basis labels
      </label>
    </div>
  );
}

function TweakRow({ T, label, value, children }) {
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: T.textDim }}>{label}</span>
        {value != null && <span style={{ ...mono, fontSize: 11 }}>{value}</span>}
      </div>
      {children}
    </div>
  );
}

function selectStyle(T) {
  return {
    width: '100%',
    padding: '6px 8px',
    background: T.btnBg,
    border: `1px solid ${T.btnBorder}`,
    borderRadius: 3,
    color: T.text,
    fontSize: 12,
    fontFamily: 'inherit',
  };
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
