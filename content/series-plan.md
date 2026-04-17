# Series Plan: Quantum Computing 101

## Format

- Platform: YouTube Shorts
- Duration: ≤60 seconds per video
- Aspect ratio: 9:16 vertical
- Hook: verbal + visual within first 3 seconds
- Structure: Hook → Content → Takeaway → Tease for next video
- Target audience: curious non-experts; no prior physics or math required

## Visual Style

- Primary visual: screen-recorded Bloch sphere simulator
- Consistent intro bumper: ≤2 seconds
- Consistent outro: simulator URL + subscribe CTA
- End of each video: tease the next topic to drive series watch-through

## All 15 Video Concepts

### 1. "A bit vs. a qubit — what's actually different?"
**Hook:** "Your laptop bit is either 0 or 1. A qubit can be… neither."
**Content:** Classical bit flips between two states. Qubit lives on the surface of the Bloch sphere — show the sphere, point to |0⟩ and |1⟩ at the poles, then move the vector to show superposition.
**Visual:** Bloch sphere simulator, drag state from pole toward equator.
**Takeaway:** Superposition isn't "both at once" — it's a probability distribution until measured.
**Script:** [scripts/01-bit-vs-qubit.md](scripts/01-bit-vs-qubit.md)

---

### 2. "What is superposition — actually?"
**Hook:** "Schrödinger's cat is a terrible explanation. Here's the real one."
**Content:** Superposition as a weighted combination of |0⟩ and |1⟩. Use the Bloch sphere to show the state vector sitting between the poles. Measuring collapses it to one pole.
**Visual:** Bloch sphere — drag state to equator, click Measure, it snaps to a pole.
**Takeaway:** Superposition is a real physical state, not a metaphor.
**Script:** [scripts/02-superposition.md](scripts/02-superposition.md)

---

### 3. "The Hadamard gate in 30 seconds"
**Hook:** "This one gate is the reason quantum computers can search faster."
**Content:** Start at |0⟩ (north pole). Apply H. State jumps to the equator — equal superposition of 0 and 1.
**Visual:** Bloch sphere animating the H rotation.
**Takeaway:** H creates equal superposition from a definite state.
**Script:** Pending

---

### 4. "Why does measuring a qubit destroy it?"
**Hook:** "Every time you look at a qubit, you ruin it."
**Content:** State on the equator → measure → collapses to north or south pole randomly.
**Visual:** Bloch sphere state on equator → click Measure → snap to pole.
**Takeaway:** Quantum measurement isn't passive — it changes the system.
**Script:** Pending

---

### 5. "What is quantum entanglement — in plain English?"
**Hook:** "Einstein called it 'spooky action at a distance.' He was wrong about why it's weird."
**Content:** Two qubits correlated no matter how far apart. Measuring one instantly determines the other — but can't send information faster than light.
**Visual:** Diagram of two qubits with correlated measurement outcomes.
**Takeaway:** Entanglement is real correlation, not communication.
**Script:** Pending

---

### 6. "The X gate: the quantum NOT"
**Hook:** "Quantum computers have a NOT gate too — but it spins."
**Content:** Classical NOT flips 0→1, 1→0. Quantum X gate rotates Bloch vector 180° around x-axis.
**Visual:** Bloch sphere X gate animation from |0⟩ to |1⟩.
**Takeaway:** Quantum gates are rotations, not just switches.
**Script:** Pending

---

### 7. "Why quantum computers aren't just faster classical computers"
**Hook:** "A quantum computer won't make your browser load faster. Here's what it actually does."
**Content:** QCs excel at specific problems: factoring (Shor's), search (Grover's). Not general-purpose speedups.
**Visual:** Side-by-side problem list — good vs. not good for QC.
**Takeaway:** Quantum advantage is problem-specific, not universal.
**Script:** Pending

---

### 8. "Quantum interference: how quantum computers actually compute"
**Hook:** "Quantum computers don't try every answer simultaneously. They do something weirder."
**Content:** Interference amplifies correct answers and cancels wrong ones — noise-canceling for bad solutions.
**Visual:** Wave interference diagram, then Bloch sphere showing phase manipulation.
**Takeaway:** Interference, not parallelism, is the real source of quantum speedup.
**Script:** Pending

---

### 9. "What is a quantum gate?"
**Hook:** "Classical computers use AND, OR, NOT. Quantum computers use… rotations."
**Content:** Every quantum gate is a rotation on the Bloch sphere. X, Y, Z, H each as a distinct rotation. Gates are reversible.
**Visual:** Bloch sphere cycling through X, Y, Z, H animations.
**Takeaway:** Quantum gates are always reversible rotations.
**Script:** Pending

---

### 10. "The Z gate and quantum phase"
**Hook:** "This gate looks like it does nothing. It changes everything."
**Content:** Z gate on |0⟩ or |1⟩ → no visible change. On equator → phase flips. Phase invisible until interference.
**Visual:** Bloch sphere, state on equator, Z gate rotates around z-axis.
**Takeaway:** Phase is a hidden degree of freedom — real, but only measurable indirectly.
**Script:** Pending

---

### 11. "What does a real quantum computer look like?"
**Hook:** "It looks nothing like a normal computer — and for a weird reason."
**Content:** Dilution refrigerators, near absolute zero, decoherence forces extreme isolation.
**Visual:** IBM/Google hardware photos + explanation of why cold = coherent.
**Takeaway:** Qubits are fragile — the entire engineering challenge is isolation.
**Script:** Pending

---

### 12. "What is decoherence — and why it's quantum computing's biggest enemy"
**Hook:** "The reason we don't have quantum laptops yet."
**Content:** Qubits interact with their environment and lose quantum state. Error correction is the field trying to solve it.
**Visual:** Bloch sphere vector drifting off its intended position over time.
**Takeaway:** Decoherence is why quantum computing is hard — not the physics, the engineering.
**Script:** Pending

---

### 13. "Shor's algorithm: why quantum computers threaten encryption"
**Hook:** "A powerful enough quantum computer could break your bank's security. Here's why."
**Content:** RSA relies on factoring being hard. Shor's does it exponentially faster. Post-quantum cryptography is already being standardized.
**Visual:** Factoring difficulty curve, classical vs. quantum.
**Takeaway:** This is real — NIST has already standardized post-quantum encryption.
**Script:** Pending

---

### 14. "Grover's algorithm: quantum search in a haystack"
**Hook:** "Finding a needle in a haystack of a billion items: classical = 500M tries, quantum = ~31,000."
**Content:** Quadratic speedup for searching unsorted data. Not exponential — but significant at scale.
**Visual:** Grid search animation, classical vs. quantum step counts.
**Takeaway:** Quadratic speedup matters at scale — databases, optimization, logistics.
**Script:** Pending

---

### 15. "The Bloch sphere: every qubit state, visualized"
**Hook:** "Every possible state of a single qubit lives on the surface of this sphere."
**Content:** Tour the sphere: poles = definite states, equator = equal superposition, latitude = probability, longitude = phase.
**Visual:** Bloch sphere simulator, touring each landmark.
**Takeaway:** The Bloch sphere is the map — every qubit state is a point on it.
**Script:** [scripts/03-bloch-sphere-tour.md](scripts/03-bloch-sphere-tour.md)

---

## Suggested Release Order

| Release # | Concept Video # | Title |
|-----------|----------------|-------|
| 1 | 1 | Bit vs. qubit |
| 2 | 2 | Superposition |
| 3 | 15 | Bloch sphere tour |
| 4 | 4 | Measurement |
| 5 | 9 | Quantum gates intro |
| 6 | 3 | H gate |
| 7 | 6 | X gate |
| 8 | 10 | Z gate and phase |
| 9 | 8 | Interference |
| 10 | 5 | Entanglement |
| 11 | 12 | Decoherence |
| 12 | 11 | Real hardware |
| 13 | 7 | QCs aren't just faster |
| 14 | 14 | Grover's algorithm |
| 15 | 13 | Shor's algorithm |

## Production Notes

- Videos 1, 2, 3, 6, 9, 10, 15 use the simulator as primary visual — record these first as a batch
- Consistent intro bumper (≤2s) and outro with simulator URL for brand continuity
- End each video with a tease for the next to drive series watch-through
- Bloch sphere tour (video #15 in concept order, released 3rd) acts as visual vocabulary for all gate videos — release it early
