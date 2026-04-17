# Script: "The Bloch sphere: every qubit state, visualized"

**Release order:** 3 of 15
**Concept video number:** 15
**Target duration:** ~60 seconds
**Primary visual:** Bloch sphere simulator — full interactive tour

---

## Metadata

| Field | Value |
|-------|-------|
| Hook | "Every possible state of a single qubit lives on the surface of this sphere." |
| Takeaway | The Bloch sphere is the map — every qubit state is a point on it |
| Tease | Quantum measurement and collapse (video 4) |
| Simulator scenes | North pole → south pole → equator drag → latitude sweep → longitude sweep |

---

## Script

```
[0:00–0:03] HOOK
[VISUAL: Bloch sphere spinning slowly]
[VO] "Every possible state of a single qubit
     lives on the surface of this sphere."

[0:03–0:18] THE POLES
[VISUAL: Zoom to north pole → label |0⟩]
[VO] "The north pole is |0⟩ — a definite 0.
     Measure it, you always get 0."
[VISUAL: Animate to south pole → label |1⟩]
[VO] "The south pole is |1⟩ — always gives you 1."

[0:18–0:35] LATITUDE = PROBABILITY
[VISUAL: Drag vector to various latitudes, show probability
 readout changing in the UI]
[VO] "The latitude tells you the probabilities.
     Near the north pole — mostly 0, a little chance of 1.
     On the equator — exactly 50/50."

[0:35–0:50] LONGITUDE = PHASE
[VISUAL: Keep vector on equator, rotate longitude,
 show state label cycling: |+⟩, |i⟩, |−⟩, |−i⟩]
[VO] "The longitude is phase — a hidden degree of freedom
     you can't see by measuring alone. But it matters
     enormously when qubits interact with each other."

[0:50–1:00] TAKEAWAY + TEASE
[VISUAL: Full sphere, vector tracing a path across the surface]
[VO] "The Bloch sphere is the map. Every quantum gate
     is a rotation on this sphere. Next: the gate that
     creates superposition — the Hadamard."
```

---

## Production Notes

- This video is intentionally released 3rd (concept video #15) because it provides the visual vocabulary for all gate videos — viewers who see this early will understand gates immediately
- Slow down for the latitude section — probability is the concept most viewers need time to absorb
- The longitude/phase section can move faster; phase will get its own dedicated video (Z gate, video 8)
- The closing line "every quantum gate is a rotation" is the bridge to the entire gates sub-series
- Record the full sphere spin for the hook with the paper/light theme — it's visually distinctive
