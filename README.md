# 🔴 Perseverance Challenge: Hold the Fort

A modular single-page narrative and resource management game designed for the NASA Space Apps Challenge. Follows an astronaut kid managing the Mars outpost in Jezero Crater while their parents are on an expedition.

---

## 🚀 Running the Game

1. Open this project in VS Code or your terminal.
2. Start the local server:
   ```bash
   node server.js
   ```
3. Visit **[http://localhost:3000/](http://localhost:3000/)** in your browser.

---

## 📂 Project Architecture

```
NASA-App-Design/
├── index.html                  # Single-page application shell
├── main.js                     # Main game controller (sequences Sol 0 → Sol 1 → Sol 2)
├── server.js                   # Node static web server
│
├── shared/
│   ├── theme.css               # Shared Mars sci-fi palette and card UI
│   ├── dadphone.js             # Reusable dialogue system (narrator + dad + mom + hab)
│   └── game-state.js           # In-memory shared state (power, water, O₂, path)
│
├── sols/
│   ├── sol-0.js                # Act 1: Morning Prep & Solar Alignment
│   ├── sol-1.js                # Act 2 & 3: Neretva Vallis Detour & Night Dust Storm
│   └── sol-2.js                # Act 4: Day 2 Recovery & Satellite Uplink (8 Endings)
│
├── minigames/
│   └── solar-alignment.js      # Mountable solar panel alignment minigame
│
├── assets/                     # Images, icons, and API cache files
└── archive/                    # Archived legacy prototype files
```

---

## 🗺️ Narrative & Decision Flow

### **Sol 0 (Act 1: Morning Prep)**
- **Choice 1A**: Solar Alignment minigame.
  - Score = 100%: **+25% Base Power** (Perfect Alignment).
  - Score 30–99%: **+5% Base Power**.
  - Score < 30%: **-15% Power Penalty** (Actuator motor strain, no retry).
- **Choice 1B**: Quick Start (Auto-mode panels, power stays at 50%, +30 min daylight).

### **Sol 1 (Act 2 & 3: Crater Detour & Night Storm)**
- **Stage 1 (Neretva Vallis)**:
  - **A (Detour)**: Extra 1.86 kg water & 0.915 kg O₂. Subsurface ice acquired. Water at 3.72 kg, O₂ at 0.865 kg.
  - **B (Direct)**: Water stays at 5.58 kg. Preserves life support consumables.
- **Stage 2 (Nocturnal Dust Storm)**:
  - **A (Shelter)**: Conserves energy, outpost clean, comms online; depot rocks displaced 30 min by wind.
  - **B (Storm Run)**: Retrieves depot rocks in midnight gale; uses 2.3 kg water & 1.0 kg O₂; interior dusty; **comms offline**.

### **Sol 2 (Act 4: Day 2 Recovery & Satellite Uplink)**
Evaluates the full 3-letter decision code (**AAA**, **ABA**, **AAB**, **ABB**, **BAA**, **BAB**, **BBA**, **BBB**):
- Terminal diagnostic & telemetry packet generation.
- Simulated flyover uplink progress bar to MRO/ISS relay.
- 8 unique branch endings detailing research return, life support margins, equipment integrity, and rescue arrival.
