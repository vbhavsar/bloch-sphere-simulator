// Quantum state math for a single qubit.
// Complex numbers as {re, im}. State = {a: α, b: β} where |ψ⟩ = α|0⟩ + β|1⟩.

const C = {
  mk: (re, im = 0) => ({ re, im }),
  add: (x, y) => ({ re: x.re + y.re, im: x.im + y.im }),
  mul: (x, y) => ({ re: x.re * y.re - x.im * y.im, im: x.re * y.im + x.im * y.re }),
  scale: (x, s) => ({ re: x.re * s, im: x.im * s }),
  conj: (x) => ({ re: x.re, im: -x.im }),
  abs2: (x) => x.re * x.re + x.im * x.im,
  abs: (x) => Math.hypot(x.re, x.im),
  arg: (x) => Math.atan2(x.im, x.re),
  eq: (x, y, eps = 1e-9) => Math.abs(x.re - y.re) < eps && Math.abs(x.im - y.im) < eps,
  fromPolar: (r, theta) => ({ re: r * Math.cos(theta), im: r * Math.sin(theta) }),
  str: (x, digits = 3) => {
    const r = +x.re.toFixed(digits);
    const i = +x.im.toFixed(digits);
    if (i === 0) return `${r}`;
    if (r === 0) return `${i}i`;
    return `${r}${i >= 0 ? '+' : ''}${i}i`;
  },
};

// Apply 2x2 complex matrix M = [[a,b],[c,d]] to state {a:α, b:β}
function applyMatrix(M, state) {
  return {
    a: C.add(C.mul(M.a, state.a), C.mul(M.b, state.b)),
    b: C.add(C.mul(M.c, state.a), C.mul(M.d, state.b)),
  };
}

// Standard single-qubit gates
const I2 = { a: C.mk(1), b: C.mk(0), c: C.mk(0), d: C.mk(1) };
const X  = { a: C.mk(0), b: C.mk(1), c: C.mk(1), d: C.mk(0) };
const Y  = { a: C.mk(0, 0), b: C.mk(0, -1), c: C.mk(0, 1), d: C.mk(0, 0) };
const Z  = { a: C.mk(1), b: C.mk(0), c: C.mk(0), d: C.mk(-1) };
const H  = (() => {
  const s = 1 / Math.SQRT2;
  return { a: C.mk(s), b: C.mk(s), c: C.mk(s), d: C.mk(-s) };
})();
const S  = { a: C.mk(1), b: C.mk(0), c: C.mk(0), d: C.mk(0, 1) };
const Sdg = { a: C.mk(1), b: C.mk(0), c: C.mk(0), d: C.mk(0, -1) };
const T  = { a: C.mk(1), b: C.mk(0), c: C.mk(0), d: C.fromPolar(1, Math.PI / 4) };
const Tdg = { a: C.mk(1), b: C.mk(0), c: C.mk(0), d: C.fromPolar(1, -Math.PI / 4) };

// Rotation gates
function Rx(theta) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return { a: C.mk(c), b: C.mk(0, -s), c: C.mk(0, -s), d: C.mk(c) };
}
function Ry(theta) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return { a: C.mk(c), b: C.mk(-s), c: C.mk(s), d: C.mk(c) };
}
function Rz(theta) {
  const ph = theta / 2;
  return { a: C.fromPolar(1, -ph), b: C.mk(0), c: C.mk(0), d: C.fromPolar(1, ph) };
}

const GATES = {
  X: { label: 'X',  matrix: X,  axis: [1, 0, 0], angle: Math.PI, desc: 'Pauli-X · π about x' },
  Y: { label: 'Y',  matrix: Y,  axis: [0, 1, 0], angle: Math.PI, desc: 'Pauli-Y · π about y' },
  Z: { label: 'Z',  matrix: Z,  axis: [0, 0, 1], angle: Math.PI, desc: 'Pauli-Z · π about z' },
  H: { label: 'H',  matrix: H,  axis: [1 / Math.SQRT2, 0, 1 / Math.SQRT2], angle: Math.PI, desc: 'Hadamard · π about (x+z)/√2' },
  S: { label: 'S',  matrix: S,  axis: [0, 0, 1], angle: Math.PI / 2, desc: 'Phase · π/2 about z' },
  Sdg:{ label: 'S†', matrix: Sdg, axis: [0, 0, 1], angle: -Math.PI / 2, desc: 'S-dagger · −π/2 about z' },
  T: { label: 'T',  matrix: T,  axis: [0, 0, 1], angle: Math.PI / 4, desc: 'T · π/4 about z' },
  Tdg:{ label: 'T†', matrix: Tdg, axis: [0, 0, 1], angle: -Math.PI / 4, desc: 'T-dagger · −π/4 about z' },
};

// Presets
const PRESETS = {
  '|0⟩':  { a: C.mk(1), b: C.mk(0) },
  '|1⟩':  { a: C.mk(0), b: C.mk(1) },
  '|+⟩':  { a: C.mk(1/Math.SQRT2), b: C.mk(1/Math.SQRT2) },
  '|−⟩':  { a: C.mk(1/Math.SQRT2), b: C.mk(-1/Math.SQRT2) },
  '|+i⟩': { a: C.mk(1/Math.SQRT2), b: C.mk(0, 1/Math.SQRT2) },
  '|−i⟩': { a: C.mk(1/Math.SQRT2), b: C.mk(0, -1/Math.SQRT2) },
};

// State → Bloch vector (x, y, z). |ψ⟩ = α|0⟩ + β|1⟩.
// x = 2 Re(ᾱβ), y = 2 Im(ᾱβ), z = |α|² − |β|²
function stateToBloch(state) {
  const ab = C.mul(C.conj(state.a), state.b);
  return [2 * ab.re, 2 * ab.im, C.abs2(state.a) - C.abs2(state.b)];
}

// State → Bloch angles (θ, φ)
function stateToAngles(state) {
  const [x, y, z] = stateToBloch(state);
  const theta = Math.acos(Math.max(-1, Math.min(1, z)));
  let phi = Math.atan2(y, x);
  if (phi < 0) phi += 2 * Math.PI;
  return { theta, phi };
}

// Normalize sloppy states (defensive)
function normalize(state) {
  const n = Math.sqrt(C.abs2(state.a) + C.abs2(state.b));
  if (n === 0) return { a: C.mk(1), b: C.mk(0) };
  return { a: C.scale(state.a, 1 / n), b: C.scale(state.b, 1 / n) };
}

// Rodrigues: rotate vector v about unit axis k by angle a
function rotateAxisAngle(v, k, a) {
  const [vx, vy, vz] = v;
  const [kx, ky, kz] = k;
  const cos = Math.cos(a), sin = Math.sin(a);
  const dot = kx * vx + ky * vy + kz * vz;
  return [
    vx * cos + (ky * vz - kz * vy) * sin + kx * dot * (1 - cos),
    vy * cos + (kz * vx - kx * vz) * sin + ky * dot * (1 - cos),
    vz * cos + (kx * vy - ky * vx) * sin + kz * dot * (1 - cos),
  ];
}

// For rotation gates, pretty name
function rotName(axis, theta) {
  const frac = prettyAngle(theta);
  return `R${axis}(${frac})`;
}

function prettyAngle(theta) {
  // Try to express as multiple of π
  const r = theta / Math.PI;
  const fracs = [
    [1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [1, 8],
    [2, 3], [3, 4], [3, 2], [2, 1],
  ];
  for (const [num, den] of fracs) {
    for (const sign of [1, -1]) {
      if (Math.abs(r - sign * num / den) < 1e-3) {
        const s = sign < 0 ? '−' : '';
        if (num === 1 && den === 1) return `${s}π`;
        if (den === 1) return `${s}${num}π`;
        if (num === 1) return `${s}π/${den}`;
        return `${s}${num}π/${den}`;
      }
    }
  }
  return `${theta.toFixed(3)}`;
}

Object.assign(window, {
  C, applyMatrix, GATES, PRESETS, Rx, Ry, Rz,
  stateToBloch, stateToAngles, normalize, rotateAxisAngle,
  rotName, prettyAngle,
});
