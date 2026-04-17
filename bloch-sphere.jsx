// Bloch sphere renderer — SVG-based orthographic projection.
// Draws: wireframe sphere (longitude + latitude), xyz axes with |0⟩|1⟩|+⟩|−⟩|+i⟩|−i⟩ labels,
// state vector with arrowhead, optional trail, optional rotation-axis guide.

const { useState, useRef, useEffect, useMemo, useCallback } = React;

// ── 3D helpers ──────────────────────────────────────────────────
const vec = {
  add: (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
  sub: (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
  scale: (a, s) => [a[0]*s, a[1]*s, a[2]*s],
  dot: (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
  cross: (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = vec.len(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; },
};

// Camera: two angles (yaw, pitch) → rotation matrix in our world (x right, y depth, z up)
function makeCam(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  // rotate about z (yaw), then about x (pitch)
  // Forward (into screen) starts as +y; after yaw Rz then pitch Rx…
  // We'll compute basis: right, up, forward
  // First rotate world by -yaw about z, then by -pitch about x
  const Rz = [[cy, sy, 0], [-sy, cy, 0], [0, 0, 1]];
  const Rx = [[1, 0, 0], [0, cp, sp], [0, -sp, cp]];
  const M = mul3(Rx, Rz);
  return M;
}
function mul3(A, B) {
  const r = [[0,0,0],[0,0,0],[0,0,0]];
  for (let i=0;i<3;i++) for (let j=0;j<3;j++) r[i][j] = A[i][0]*B[0][j]+A[i][1]*B[1][j]+A[i][2]*B[2][j];
  return r;
}
function apply3(M, v) {
  return [
    M[0][0]*v[0]+M[0][1]*v[1]+M[0][2]*v[2],
    M[1][0]*v[0]+M[1][1]*v[1]+M[1][2]*v[2],
    M[2][0]*v[0]+M[2][1]*v[1]+M[2][2]*v[2],
  ];
}

// Project camera-space point → screen.
// Cam-space: x right, y into screen (depth), z up. Orthographic.
function project(p, cx, cy, R) {
  return [cx + p[0] * R, cy - p[2] * R];
}

// ── Main component ──────────────────────────────────────────────
function BlochSphere({
  state,           // {a, b} current pure state
  trail,           // array of bloch vectors [x,y,z] (world), oldest first
  rotAxis,         // [x,y,z] unit (world) or null
  onCameraChange,  // (yaw, pitch) => void, optional
  camera,          // {yaw, pitch} — controlled
  theme,           // 'paper' | 'ink' | 'blueprint'
  meridians = 12,
  parallels = 6,
  showLabels = true,
  size = 640,
}) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const yaw = camera.yaw;
  const pitch = camera.pitch;

  // Theme tokens
  const T = THEMES[theme];

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: e.pointerId, x: e.clientX, y: e.clientY, yaw, pitch });
  };
  const onPointerMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const nYaw = drag.yaw + dx * 0.008;
    let nPitch = drag.pitch + dy * 0.008;
    nPitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, nPitch));
    onCameraChange?.(nYaw, nPitch);
  };
  const onPointerUp = (e) => {
    if (drag && e.pointerId === drag.id) setDrag(null);
  };

  const cam = useMemo(() => makeCam(yaw, pitch), [yaw, pitch]);
  const cx = size / 2, cy = size / 2;
  const R = size * 0.36;

  // Helper: project world vector
  const P = (v) => project(apply3(cam, v), cx, cy, R);
  // Depth (into-screen): camera-space y; larger = deeper.
  const depth = (v) => apply3(cam, v)[1];

  // ── Build sphere wireframe ──
  // Meridians (great circles through poles): N lines at phi = k*π/N
  const segs = 64;
  const wirePaths = useMemo(() => {
    const lines = [];
    // Meridians
    for (let k = 0; k < meridians; k++) {
      const phi = (k * Math.PI) / meridians;
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        pts.push([Math.cos(t) * Math.cos(phi), Math.cos(t) * Math.sin(phi), Math.sin(t)]);
      }
      lines.push(pts);
    }
    // Parallels (latitudes): skip poles
    for (let k = 1; k < parallels; k++) {
      const lat = -Math.PI/2 + (k * Math.PI) / parallels;
      const r = Math.cos(lat), z = Math.sin(lat);
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        pts.push([r * Math.cos(t), r * Math.sin(t), z]);
      }
      lines.push(pts);
    }
    return lines;
  }, [meridians, parallels]);

  // Classify each wire segment as front-facing or back-facing (for different stroke).
  // Use camera forward in world space = inverse of cam applied to [0,1,0]
  const camFwdWorld = useMemo(() => {
    // camera forward (into screen) in cam space is +y. World = cam^T * [0,1,0]
    return [cam[0][1], cam[1][1], cam[2][1]]; // transpose column 1
  }, [cam]);

  // Bloch vector of current state
  const bloch = stateToBloch(state);
  const blochLen = vec.len(bloch);
  const blochN = blochLen > 0.001 ? vec.scale(bloch, 1/blochLen) : [0,0,1];

  // Screen coords for main elements
  const origin2D = P([0,0,0]);
  const tip2D = P(bloch);
  const tipDepth = depth(bloch);

  // Axis endpoints (slightly beyond sphere for labels)
  const axisEnds = [
    { v: [1,0,0],  label: '|+⟩',  pos: 'x+' },
    { v: [-1,0,0], label: '|−⟩',  pos: 'x-' },
    { v: [0,1,0],  label: '|+i⟩', pos: 'y+' },
    { v: [0,-1,0], label: '|−i⟩', pos: 'y-' },
    { v: [0,0,1],  label: '|0⟩',  pos: 'z+' },
    { v: [0,0,-1], label: '|1⟩',  pos: 'z-' },
  ];

  // Trail path
  const trailPath = useMemo(() => {
    if (!trail || trail.length < 2) return null;
    return trail.map((v) => {
      const [x, y] = P(v);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }, [trail, cam, cx, cy, R]);

  // Arrowhead for state vector
  const arrowAngle = Math.atan2(tip2D[1] - origin2D[1], tip2D[0] - origin2D[0]);
  const arrowLen = 10;
  const arrowW = 5;

  // Front/back clipping using mask: front hemisphere visible, back dimmed.
  // We decide per-point whether it's front (dot with camFwd < 0) or back.
  // For each wire (polyline), split into front/back runs.
  const frontWires = [], backWires = [];
  for (const pts of wirePaths) {
    let run = [];
    let lastFront = null;
    for (const p of pts) {
      const d = vec.dot(p, camFwdWorld); // negative = in front
      const isFront = d <= 0;
      if (lastFront === null || isFront === lastFront) {
        run.push(p);
      } else {
        // push run to its bucket, start new
        (lastFront ? frontWires : backWires).push(run);
        run = [p];
      }
      lastFront = isFront;
    }
    if (run.length) (lastFront ? frontWires : backWires).push(run);
  }

  const toPathD = (pts) => pts.map((p, i) => {
    const [x, y] = P(p);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  // Silhouette (great circle perpendicular to view direction) for crisp edge
  const silhouettePts = useMemo(() => {
    // Build basis in plane perp. to camFwd
    const n = vec.norm(camFwdWorld);
    // pick any vec not parallel
    let up = [0,0,1];
    if (Math.abs(vec.dot(up, n)) > 0.95) up = [0,1,0];
    const u = vec.norm(vec.cross(up, n));
    const v = vec.cross(n, u);
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      pts.push(vec.add(vec.scale(u, Math.cos(t)), vec.scale(v, Math.sin(t))));
    }
    return pts;
  }, [camFwdWorld]);

  // Rotation axis guide: dashed line through origin along ±axis
  const rotAxisEnds = rotAxis ? [vec.scale(rotAxis, -1.2), vec.scale(rotAxis, 1.2)] : null;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        cursor: drag ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        display: 'block',
      }}
    >
      <defs>
        <radialGradient id="sphereFill" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={T.sphereGlow} stopOpacity={T.sphereGlowOp} />
          <stop offset="100%" stopColor={T.sphereGlow} stopOpacity="0" />
        </radialGradient>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={T.vector} />
        </marker>
      </defs>

      {/* Faint sphere disc background for presence */}
      <circle cx={cx} cy={cy} r={R} fill="url(#sphereFill)" />

      {/* Back wireframes (dimmed) */}
      <g stroke={T.wireBack} strokeWidth="0.6" fill="none" opacity="0.55">
        {backWires.map((run, i) => (
          <path key={`b${i}`} d={toPathD(run)} strokeDasharray="2 3" />
        ))}
      </g>

      {/* Back half of rotation axis */}
      {rotAxisEnds && depth(rotAxisEnds[0]) > depth(rotAxisEnds[1]) && (
        <line
          x1={P(rotAxisEnds[0])[0]} y1={P(rotAxisEnds[0])[1]}
          x2={P([0,0,0])[0]} y2={P([0,0,0])[1]}
          stroke={T.rotAxis} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.35"
        />
      )}

      {/* Back axes (dashed) */}
      {axisEnds.map((ax) => {
        const d = depth(ax.v);
        if (d <= 0) return null;
        const [x, y] = P(ax.v);
        return (
          <line key={`ax-b-${ax.pos}`}
            x1={cx} y1={cy} x2={x} y2={y}
            stroke={T.axis} strokeWidth="1" strokeDasharray="3 3" opacity="0.45"
          />
        );
      })}

      {/* Silhouette */}
      <path
        d={silhouettePts.map((p, i) => {
          const [x, y] = P(p);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ') + ' Z'}
        fill="none"
        stroke={T.silhouette}
        strokeWidth="1.2"
      />

      {/* Front wireframes */}
      <g stroke={T.wireFront} strokeWidth="0.7" fill="none">
        {frontWires.map((run, i) => (
          <path key={`f${i}`} d={toPathD(run)} />
        ))}
      </g>

      {/* Front axes */}
      {axisEnds.map((ax) => {
        const d = depth(ax.v);
        if (d > 0) return null;
        const [x, y] = P(ax.v);
        return (
          <line key={`ax-f-${ax.pos}`}
            x1={cx} y1={cy} x2={x} y2={y}
            stroke={T.axis} strokeWidth="1.2" opacity="0.8"
          />
        );
      })}

      {/* Origin dot */}
      <circle cx={cx} cy={cy} r="2" fill={T.axis} />

      {/* Rotation axis (front half) */}
      {rotAxisEnds && (
        <line
          x1={P([0,0,0])[0]} y1={P([0,0,0])[1]}
          x2={P(depth(rotAxisEnds[0]) <= depth(rotAxisEnds[1]) ? rotAxisEnds[0] : rotAxisEnds[1])[0]}
          y2={P(depth(rotAxisEnds[0]) <= depth(rotAxisEnds[1]) ? rotAxisEnds[0] : rotAxisEnds[1])[1]}
          stroke={T.rotAxis} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.9"
        />
      )}

      {/* Trail */}
      {trailPath && (
        <polyline
          points={trailPath}
          fill="none"
          stroke={T.trail}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      )}

      {/* State vector */}
      {blochLen > 0.001 && (
        <g>
          <line
            x1={origin2D[0]} y1={origin2D[1]}
            x2={tip2D[0]} y2={tip2D[1]}
            stroke={T.vector}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
          />
          <circle cx={tip2D[0]} cy={tip2D[1]} r="3.5" fill={T.vector} />
        </g>
      )}

      {/* Axis labels */}
      {showLabels && axisEnds.map((ax) => {
        const d = depth(ax.v);
        // Label always on top; nudge outward
        const outward = vec.scale(ax.v, 1.18);
        const [x, y] = P(outward);
        return (
          <g key={`lbl-${ax.pos}`} opacity={d > 0 ? 0.55 : 1}>
            <text
              x={x} y={y}
              fill={T.label}
              fontSize="13"
              fontFamily="'JetBrains Mono', ui-monospace, monospace"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {ax.label}
            </text>
          </g>
        );
      })}

      {/* Axis tick letters (x/y/z) */}
      {showLabels && [
        { v: [1.02,0,0], t: 'x' },
        { v: [0,1.02,0], t: 'y' },
        { v: [0,0,1.02], t: 'z' },
      ].map((m, i) => {
        const [x, y] = P(vec.scale(m.v, 1.05));
        return (
          <text key={i} x={x+10} y={y+4}
            fill={T.labelDim}
            fontSize="10"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            fontStyle="italic"
          >{m.t}</text>
        );
      })}
    </svg>
  );
}

const THEMES = {
  paper: {
    bg: 'oklch(0.985 0.004 85)',
    bgPanel: 'oklch(0.975 0.005 85)',
    text: 'oklch(0.22 0.01 250)',
    textDim: 'oklch(0.5 0.01 250)',
    border: 'oklch(0.88 0.006 85)',
    wireFront: 'oklch(0.55 0.01 250 / 0.55)',
    wireBack: 'oklch(0.7 0.008 250 / 0.5)',
    silhouette: 'oklch(0.3 0.01 250)',
    axis: 'oklch(0.3 0.01 250)',
    label: 'oklch(0.25 0.01 250)',
    labelDim: 'oklch(0.55 0.01 250)',
    vector: 'oklch(0.52 0.2 255)',
    trail: 'oklch(0.7 0.15 255)',
    rotAxis: 'oklch(0.6 0.18 30)',
    sphereGlow: 'oklch(0.9 0.02 250)',
    sphereGlowOp: 0.4,
    accent: 'oklch(0.52 0.2 255)',
    btnBg: 'oklch(1 0 0)',
    btnBgHover: 'oklch(0.96 0.01 250)',
    btnBorder: 'oklch(0.82 0.008 250)',
  },
  ink: {
    bg: 'oklch(0.16 0.008 250)',
    bgPanel: 'oklch(0.2 0.008 250)',
    text: 'oklch(0.93 0.005 85)',
    textDim: 'oklch(0.65 0.008 250)',
    border: 'oklch(0.28 0.008 250)',
    wireFront: 'oklch(0.55 0.015 250 / 0.7)',
    wireBack: 'oklch(0.4 0.015 250 / 0.5)',
    silhouette: 'oklch(0.85 0.005 85)',
    axis: 'oklch(0.85 0.005 85)',
    label: 'oklch(0.95 0.005 85)',
    labelDim: 'oklch(0.65 0.008 250)',
    vector: 'oklch(0.72 0.2 170)',
    trail: 'oklch(0.78 0.18 170)',
    rotAxis: 'oklch(0.75 0.2 30)',
    sphereGlow: 'oklch(0.5 0.1 220)',
    sphereGlowOp: 0.18,
    accent: 'oklch(0.72 0.2 170)',
    btnBg: 'oklch(0.22 0.008 250)',
    btnBgHover: 'oklch(0.28 0.008 250)',
    btnBorder: 'oklch(0.35 0.008 250)',
  },
  blueprint: {
    bg: 'oklch(0.26 0.08 250)',
    bgPanel: 'oklch(0.3 0.08 250)',
    text: 'oklch(0.95 0.03 220)',
    textDim: 'oklch(0.75 0.05 220)',
    border: 'oklch(0.4 0.1 250)',
    wireFront: 'oklch(0.85 0.1 220 / 0.7)',
    wireBack: 'oklch(0.7 0.08 220 / 0.45)',
    silhouette: 'oklch(0.95 0.05 220)',
    axis: 'oklch(0.95 0.05 220)',
    label: 'oklch(0.97 0.04 220)',
    labelDim: 'oklch(0.8 0.06 220)',
    vector: 'oklch(0.9 0.15 90)',
    trail: 'oklch(0.9 0.15 90 / 0.9)',
    rotAxis: 'oklch(0.85 0.2 30)',
    sphereGlow: 'oklch(0.5 0.15 220)',
    sphereGlowOp: 0.3,
    accent: 'oklch(0.9 0.15 90)',
    btnBg: 'oklch(0.32 0.08 250)',
    btnBgHover: 'oklch(0.38 0.1 250)',
    btnBorder: 'oklch(0.5 0.1 240)',
  },
};

Object.assign(window, { BlochSphere, THEMES, vec });
