# Production Workflow

## Toolchain

| Role | Tool |
|------|------|
| Script | Written here in `content/scripts/` |
| Voiceover | Descript AI voice (no self-recording) |
| Screen recording | Descript built-in recorder |
| Video editing | Descript timeline |
| Captions | Descript auto-captions |
| Export | Descript → 9:16 MP4 for YouTube Shorts |

## Per-Video Steps

### 1. Prep the script
- Open the script file (e.g. `scripts/01-bit-vs-qubit.md`)
- Extract only the `[VO]` lines into a clean text file — no stage directions
- This is what gets pasted into Descript

### 2. Generate voiceover in Descript
- Create a new project in Descript
- Paste the VO text
- Select an AI voice from Speakers library
- Generate audio — listen through for pacing issues
- Adjust: add pauses with ellipses `...` or line breaks; slow down with commas

### 3. Record Bloch sphere simulator scenes
- Open the simulator at the correct state before hitting record
- Use Descript's screen recorder, capture at full resolution
- Record one scene per `[VISUAL]` cue — short clips are easier to work with
- Scenes to record per video are listed in each script's Metadata table

### 4. Assemble in Descript
- Lay the VO audio on the timeline
- Place screen recording clips to match each `[VISUAL]` cue timestamp
- Use text-based editing to trim dead air from the VO
- Keep total duration ≤60s

### 5. Captions
- Run Descript auto-captions
- Style: large, centered, high contrast (white text, black outline)
- Keep to 3-5 words per caption line for Shorts readability

### 6. Outro (every video)
- Last 3 seconds: static card with simulator URL
- Consistent across all 15 videos

### 7. Export
- Format: MP4, 1080x1920 (9:16)
- Upload to YouTube as a Short

## Simulator Recording Guide

### Setup before recording
- Open the simulator in a browser, full screen or large window
- Use the paper/light theme for visual consistency across the series
- Hide the browser chrome if possible (use a presentation mode or full-screen)
- Set the initial state *before* starting the recorder

### Scene list by video

| Video | Scene | Simulator start state | Action |
|-------|-------|-----------------------|--------|
| 1 | Qubit intro | |0⟩ (north pole) | Drag vector slowly to equator |
| 2 | Superposition | Equator (|+⟩) | Click Measure — let it collapse |
| 3 | Poles | |0⟩ | Animate to |1⟩, then drag to equator |
| 3 | Latitude | Equator | Drag through latitudes, show probability readout |
| 3 | Longitude/phase | Equator | Rotate longitude: |+⟩ → |i⟩ → |−⟩ → |−i⟩ |

## Voice Tuning Tips

- Add `...` in the VO text to insert a natural pause
- Break long sentences into separate lines for better breath pacing
- For emphasis, Descript lets you adjust speed per word — slow down key terms
- Pick one voice and use it for the entire series for brand consistency
