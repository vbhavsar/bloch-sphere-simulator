# [Bloch sphere simulator](https://bits-and-electrons.github.io/bloch-sphere-simulator/)

A web based Bloch sphere simulator, intended to help people understand and visualize single qubit state transitions when applying quantum logic gates.

No installation required — visit https://bits-and-electrons.github.io/bloch-sphere-simulator/

## Features

- Animated gate application with rotation trail
- Quantum gates: X, Y, Z, H, S, S†, T, T†, Rx, Ry, Rz
- State presets: |0⟩, |1⟩, |+⟩, |−⟩, |+i⟩, |−i⟩
- Draggable camera (yaw/pitch)
- Three themes: paper, ink, blueprint
- Gate history log

## Running locally

No build step or dependencies needed. Just serve the repo root as a static site:

```
python3 -m http.server
```

Then open http://localhost:8000 in your browser.

## Tech stack

- [React 18](https://react.dev/) — UI (loaded via CDN)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone) — JSX transpilation in-browser
- SVG — Bloch sphere rendering (orthographic projection, no WebGL required)
