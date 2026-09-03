ได้เลยเธอ 🔥 รอบนี้ผมจัดเป็น **Implementation Plan แบบโยนเข้า Antigravity แล้วให้มันเริ่มสร้างต่อได้เลย** โดยยึดเกมที่เราตกลงกันจริง ๆ: **ใช้สิ่งของ 4 ชิ้นเป็น Controller ผ่าน Teachable Machine**

ผมแนะนำให้ **อย่าเพิ่ม feature นอกแผนก่อน MVP เสร็จ** เพราะโปรเจกต์นี้เป้าหมายคือให้เล่นได้จริงและเดโมได้ลื่น

# `IMPLEMENTATION_PLAN.md`

````md
# Dodge Game - Teachable Machine Control
## Implementation Plan

## 1. Project Goal

Build a browser-based dodge survival game controlled by real-world objects detected through a webcam using Google Teachable Machine Image Model.

The player does NOT control the game using keyboard buttons as the primary input.

Instead:

1. Webcam captures the player's object.
2. Teachable Machine classifies the object.
3. The detected class selects a game lane.
4. The player character moves to that lane.
5. Obstacles fall toward the player.
6. The player must avoid obstacles and survive.
7. Survive for 3 minutes to win.

The four trained Teachable Machine classes are:

- Earbuds
- Charger
- Powerbank
- Earphone pocket


# 2. Core Gameplay

## Game Type

2D 4-lane dodge survival game.

The player character stays near the bottom of the screen.

Objects fall from the top.

The player changes lanes by showing one of the four real-world objects to the webcam.

## Object-to-Lane Mapping

| Teachable Machine Class | Game Lane |
|---|---:|
| Earbuds | Lane 1 |
| Charger | Lane 2 |
| Powerbank | Lane 3 |
| Earphone pocket | Lane 4 |

Example:

Player shows Powerbank to the camera.

Teachable Machine predicts:

Powerbank = 0.92 confidence

The game moves the player to Lane 3.


# 3. Primary Gameplay Loop

```text
START
  ↓
Camera Permission
  ↓
Load Teachable Machine Model
  ↓
Model Ready
  ↓
Tutorial
  ↓
Countdown
3
2
1
GO!
  ↓
Spawn Obstacles
  ↓
Read Object Prediction
  ↓
Move Player to Matching Lane
  ↓
Avoid Obstacles
  ↓
Increase Score
  ↓
Increase Difficulty
  ↓
Player Hit?
  ├── Yes → Lose HP
  └── No
  ↓
HP = 0?
  ├── Yes → Game Over
  └── No
  ↓
Survival Time >= 180 seconds?
  ├── Yes → Victory
  └── No
  ↓
Continue
````

# 4. Recommended Technology

Use the existing project technology if one already exists.

If starting from scratch, use:

* TypeScript
* Phaser 3 for the game
* TensorFlow.js
* Teachable Machine Image Model
* HTML/CSS for UI
* Vite for development/build

Do NOT introduce a backend unless absolutely necessary.

The game should run entirely in the browser.

No database is required for MVP.

No login system is required.

No multiplayer system is required.

# 5. Suggested Project Structure

```text
src/
├── main.ts
├── game/
│   ├── GameScene.ts
│   ├── Player.ts
│   ├── Obstacle.ts
│   ├── ObstacleSpawner.ts
│   ├── GameManager.ts
│   └── LaneManager.ts
│
├── ai/
│   ├── TeachableMachine.ts
│   ├── PredictionSmoother.ts
│   └── ObjectMapping.ts
│
├── ui/
│   ├── StartScreen.ts
│   ├── TutorialScreen.ts
│   ├── HUD.ts
│   ├── GameOverScreen.ts
│   └── VictoryScreen.ts
│
├── config/
│   └── gameConfig.ts
│
└── assets/
    ├── player/
    ├── obstacles/
    ├── ui/
    └── audio/
```

# 6. Game World

Create a simple 4-lane arena.

Example:

```text
┌─────────────────────────────┐
│        OBSTACLES            │
│                             │
│   ■       ■                 │
│                 ■           │
│       ■                     │
│                             │
│                             │
│       PLAYER                │
├──────┬──────┬──────┬───────┤
│ L1   │ L2   │ L3   │ L4    │
└──────┴──────┴──────┴───────┘
```

The lanes should be visually clear.

Use subtle lane separators.

Do not make the background too visually busy.

# 7. Player System

Create a Player object.

Properties:

```ts
lane: number
targetLane: number
speed: number
hp: number
```

The player should move smoothly between lanes.

Do NOT instantly teleport the player unless necessary.

Example:

```text
Current Lane: 1
Detected Object: Powerbank
Target Lane: 3

Player:
Lane 1 → Lane 2 → Lane 3
```

Movement should be visually smooth.

# 8. Teachable Machine Integration

Create a dedicated TeachableMachine service.

Responsibilities:

1. Load the model.
2. Load metadata.
3. Initialize webcam.
4. Capture frames.
5. Run predictions.
6. Return the highest-confidence class.
7. Apply confidence filtering.
8. Smooth predictions before sending input to the game.

Do not put Teachable Machine prediction logic directly inside GameScene.

# 9. Model Configuration

The model URL should NOT be hardcoded throughout the project.

Create one configuration value:

```ts
TEACHABLE_MACHINE_MODEL_URL
```

Example:

```ts
const MODEL_URL = "/model/";
```

The implementation must make it easy to replace the model later.

If the model is hosted remotely, support a configurable URL.

# 10. Prediction Logic

For every webcam frame:

```text
Camera Frame
    ↓
Model Prediction
    ↓
Find Highest Probability
    ↓
Confidence Check
    ↓
Prediction Smoothing
    ↓
Object Mapping
    ↓
Target Lane
```

Example prediction:

```json
{
  "className": "Powerbank",
  "probability": 0.94
}
```

Then:

```text
Powerbank → Lane 3
```

# 11. Confidence Threshold

Do not move the player based on weak predictions.

Initial threshold:

```ts
CONFIDENCE_THRESHOLD = 0.80
```

If confidence is below the threshold:

```text
No valid input
```

The player stays in the current lane.

Make the threshold configurable.

# 12. Prediction Smoothing

Teachable Machine may occasionally flicker between classes.

Example:

```text
Frame 1: Powerbank 0.91
Frame 2: Powerbank 0.89
Frame 3: Charger 0.52
Frame 4: Powerbank 0.93
```

Do NOT immediately move the player based on every frame.

Require a stable prediction.

Recommended initial implementation:

* Keep the last 5 valid predictions.
* Select the majority class.
* Only change lane after the new class appears consistently.

Example:

```text
Powerbank
Powerbank
Powerbank
Powerbank
Powerbank

→ Accept Powerbank
→ Move to Lane 3
```

# 13. Lane Switching Cooldown

Prevent rapid lane switching caused by model noise.

Initial value:

```ts
LANE_CHANGE_COOLDOWN = 250ms
```

After a lane change, ignore another lane change until the cooldown expires.

Keep this configurable.

# 14. Object Mapping

Create a single mapping:

```ts
const OBJECT_TO_LANE = {
  "Earbuds": 0,
  "Charger": 1,
  "Powerbank": 2,
  "Earphone pocket": 3
};
```

Do not duplicate this mapping in multiple files.

# 15. Debug Camera UI

During development, display:

```text
┌─────────────────────┐
│ Webcam              │
│                     │
│      [camera]       │
│                     │
└─────────────────────┘

Detected:
Powerbank

Confidence:
94%

Current Lane:
3
```

This debug UI should be removable or hidden for the final presentation.

Add a developer/debug toggle.

# 16. Obstacle System

Create an Obstacle class.

Each obstacle should have:

```ts
lane: number
speed: number
damage: number
```

Obstacles spawn at the top of the screen.

They move downward.

When an obstacle reaches the player:

```text
Collision?
  ↓
Yes → Player takes damage
```

After collision, destroy/remove the obstacle.

# 17. Obstacle Spawning

Create an ObstacleSpawner.

Do NOT spawn obstacles randomly without limits.

Initial configuration:

```ts
INITIAL_SPAWN_INTERVAL = 1500ms
INITIAL_OBSTACLE_SPEED = 180
```

Spawn one obstacle at a time during the easiest phase.

Gradually increase difficulty.

# 18. Difficulty System

Difficulty should scale automatically with survival time.

Example:

## 0:00 - 0:30

* Slow obstacles
* Large gaps
* One obstacle at a time

## 0:30 - 1:00

* Increase obstacle speed
* Reduce spawn interval

## 1:00 - 2:00

* Multiple obstacles
* More difficult lane patterns

## 2:00 - 2:30

* Faster obstacles
* More frequent patterns

## 2:30 - 3:00

* Final survival phase
* Highest difficulty

Never make the game impossible.

# 19. Obstacle Patterns

Implement simple patterns.

Pattern A:

```text
■
```

Pattern B:

```text
■       ■
```

Pattern C:

```text
    ■
■
```

Pattern D:

```text
■           ■
      ■
```

Patterns should always leave at least one safe lane.

Do NOT generate unavoidable patterns.

# 20. Collision System

Use Phaser Arcade Physics or an equivalent simple collision system.

Collision:

```text
Player
   +
Obstacle
   ↓
Hit
```

On hit:

```ts
hp -= 1
```

Then:

* Remove obstacle.
* Play hit feedback.
* Briefly flash player.
* Add short invulnerability period.

# 21. Player HP

Initial HP:

```ts
MAX_HP = 3
```

HUD:

```text
❤️ ❤️ ❤️
```

When hit:

```text
❤️ ❤️ 💔
```

When HP reaches zero:

```text
GAME OVER
```

# 22. Invulnerability

After being hit:

```ts
INVULNERABILITY_TIME = 1000ms
```

During this period:

* Player cannot receive damage.
* Player can still move.
* Add visual feedback such as blinking.

# 23. Score

Score should reward survival.

Initial system:

```ts
score += 10 every second
```

Optional:

```ts
score += 50 for collecting a bonus
```

Keep scoring simple for MVP.

# 24. Survival Timer

Game duration:

```ts
GAME_DURATION = 180 seconds
```

HUD:

```text
TIME
02:14
```

When timer reaches:

```text
03:00
```

Trigger Victory.

# 25. HUD

Display:

```text
┌─────────────────────────────┐
│ SCORE: 1240      ❤️❤️❤️     │
│                             │
│          02:14              │
│                             │
│                             │
│            GAME             │
│                             │
└─────────────────────────────┘
```

HUD must remain readable during gameplay.

# 26. Tutorial

The tutorial must be extremely short.

Screen:

```text
SHOW AN OBJECT TO CONTROL
```

Then:

```text
🎧 Earbuds
→ Move Left
```

```text
🔌 Charger
→ Move Right
```

```text
🔋 Powerbank
→ Move Center-Right
```

```text
👝 Earphone Pocket
→ Move Right
```

Then:

```text
AVOID THE OBSTACLES

SURVIVE FOR 3 MINUTES
```

The tutorial should take less than 15 seconds.

# 27. Start Flow

```text
Title Screen
    ↓
START
    ↓
Camera Permission
    ↓
Loading Model
    ↓
Model Ready
    ↓
Tutorial
    ↓
3
2
1
GO!
    ↓
Gameplay
```

# 28. Camera Permission Handling

Handle:

* Camera permission granted.
* Camera permission denied.
* Camera unavailable.
* Model loading failure.

If camera permission is denied:

Display:

```text
Camera access is required to play.

Please allow camera access and try again.
```

Provide a retry button.

# 29. Model Loading UI

Do not display a blank screen while loading.

Display:

```text
Loading AI Controller...

██████████░░░░

Please wait...
```

Once ready:

```text
AI READY ✓
```

Then continue.

# 30. Game Over

Screen:

```text
GAME OVER

Score
1840

Survived
01:47

Best Score
1840

[ PLAY AGAIN ]
[ MENU ]
```

Play Again should completely reset:

* Player
* HP
* Score
* Timer
* Obstacles
* Difficulty
* Prediction state

# 31. Victory

At 3 minutes:

```text
YOU SURVIVED!

🏆

Score
3250

Time
03:00

[ PLAY AGAIN ]
[ MENU ]
```

Make the victory state visually different from Game Over.

# 32. Keyboard Debug Controls

During development, support optional keyboard controls.

```text
A / ← → Lane 1
S / ↓       Lane 2
D / →       Lane 3
F           Lane 4
```

Or simply:

```text
1 → Lane 1
2 → Lane 2
3 → Lane 3
4 → Lane 4
```

Keyboard controls are ONLY for development/testing.

The final game should emphasize object-based control.

# 33. Responsive Design

The game must work on:

* Desktop
* Laptop
* Tablet

Prioritize landscape desktop gameplay.

The webcam preview should not cover the main gameplay area.

Recommended layout:

```text
┌─────────────────────────────────────┐
│                 HUD                 │
├────────────────────────┬────────────┤
│                        │   CAMERA   │
│        GAME            │   PREVIEW  │
│                        │            │
│                        │            │
└────────────────────────┴────────────┘
```

On smaller screens, move the camera preview to a smaller floating panel.

# 34. Visual Style

Keep visuals simple.

Recommended:

* Clean 2D arcade style.
* Strong contrast.
* Clear lanes.
* Simple player.
* Simple obstacles.
* Minimal background animation.

Do NOT spend significant time creating complicated art before gameplay works.

# 35. Audio

Optional after MVP.

Add:

* Start sound.
* Hit sound.
* Score sound.
* Victory sound.
* Game over sound.

Audio must never block gameplay implementation.

# 36. Performance Requirements

The prediction loop must not block the game loop.

Game rendering and model prediction should run independently.

Avoid unnecessary DOM updates every frame.

Do not run expensive operations every render frame unless required.

Target:

```text
Game: ~60 FPS
Prediction: reasonable webcam/model rate
```

The game must remain responsive while predictions are running.

# 37. Error Handling

Handle model errors gracefully.

Potential errors:

* Model URL invalid.
* Model failed to load.
* Webcam unavailable.
* Permission denied.
* Prediction failed.
* Browser does not support required APIs.

Never leave the player on an infinite loading screen.

# 38. MVP Definition

The MVP is complete when all of these work:

[ ] Game starts
[ ] Webcam works
[ ] Teachable Machine model loads
[ ] Earbuds is detected
[ ] Charger is detected
[ ] Powerbank is detected
[ ] Earphone pocket is detected
[ ] Each object maps to a different lane
[ ] Player moves between lanes
[ ] Obstacles spawn
[ ] Obstacles move
[ ] Collision works
[ ] HP works
[ ] Game Over works
[ ] Timer works
[ ] 3-minute Victory works
[ ] Restart works
[ ] Basic responsive layout works

# 39. Phase 1: Project Setup

Tasks:

1. Inspect existing repository.
2. Identify current framework.
3. Do NOT replace the framework if an existing working project already exists.
4. Install required dependencies.
5. Create game architecture.
6. Create basic Phaser scene.
7. Create 4-lane arena.
8. Create placeholder player.

Acceptance:

* Project runs locally.
* Game scene renders.
* No TypeScript/build errors.

# 40. Phase 2: Player + Lane System

Tasks:

1. Implement LaneManager.
2. Create four lane positions.
3. Implement Player.
4. Implement smooth lane movement.
5. Add keyboard debug control.
6. Add player boundaries.

Acceptance:

* Player can move between all four lanes.
* Player never leaves the arena.

# 41. Phase 3: Teachable Machine

Tasks:

1. Add TensorFlow.js.
2. Add Teachable Machine model loader.
3. Add webcam.
4. Load model.
5. Display prediction.
6. Implement confidence threshold.
7. Implement prediction smoothing.
8. Implement object-to-lane mapping.
9. Connect prediction to Player.

Acceptance:

Showing each trained object moves the player to the correct lane.

# 42. Phase 4: Dodge Gameplay

Tasks:

1. Create Obstacle.
2. Create ObstacleSpawner.
3. Implement downward movement.
4. Implement collision.
5. Implement HP.
6. Implement invulnerability.
7. Implement Game Over.

Acceptance:

The player can successfully play a complete dodge loop.

# 43. Phase 5: Score + Difficulty

Tasks:

1. Add score.
2. Add survival timer.
3. Add difficulty scaling.
4. Add obstacle patterns.
5. Ensure patterns always have a safe lane.
6. Add Victory state at 3 minutes.

Acceptance:

The game becomes progressively harder but remains playable.

# 44. Phase 6: UI + Tutorial

Tasks:

1. Start screen.
2. Camera permission screen.
3. Model loading screen.
4. Tutorial.
5. HUD.
6. Game Over screen.
7. Victory screen.
8. Restart button.

Acceptance:

A first-time player can understand the game without external instructions.

# 45. Phase 7: Polish

Only after MVP is complete:

1. Player animation.
2. Hit effects.
3. Screen shake.
4. Particles.
5. Sound effects.
6. Better background.
7. Better UI.
8. Prediction debug overlay.
9. Mobile/tablet layout improvements.

# 46. Testing Plan

## Object Recognition Test

Test each object under:

* Bright lighting.
* Normal lighting.
* Darker lighting.
* Different backgrounds.
* Different distances.
* Slightly different angles.

Record:

```text
Object
Accuracy
Response time
False predictions
```

## Gameplay Test

Test:

* Lane switching.
* Rapid object changes.
* Low-confidence prediction.
* Object partially hidden.
* Camera temporarily losing the object.
* Collision.
* HP.
* Restart.
* Victory.
* Game Over.

# 47. Important Anti-Bug Rules

1. Never trust a single prediction frame.
2. Never change lane for a low-confidence prediction.
3. Never duplicate object-to-lane mappings.
4. Never allow an obstacle pattern with zero safe lanes.
5. Never allow camera/model failure to crash the game.
6. Never couple the game loop directly to webcam FPS.
7. Never add major features before MVP works.
8. Keep all gameplay constants configurable.

# 48. Development Priority

Priority order:

P0:

* Game scene
* Player
* Lane system
* Teachable Machine
* Object mapping
* Obstacles
* Collision
* HP
* Timer
* Game Over
* Victory

P1:

* Difficulty scaling
* Patterns
* Score
* Tutorial
* UI

P2:

* Audio
* Particles
* Animation
* Visual polish

# 49. Definition of Done

The project is considered finished when:

1. A user can open the game.
2. The browser asks for camera permission.
3. The AI model loads.
4. The tutorial explains the four objects.
5. The player can control the character by showing real objects.
6. Obstacles spawn and can be avoided.
7. The player can survive.
8. The game ends correctly.
9. The player can restart.
10. The complete game can be demonstrated without developer intervention.

The core selling point must remain:

"Real-world objects control the game using AI image classification."

# 50. Antigravity Agent Instructions

Before writing code:

1. Inspect the entire existing repository.
2. Identify the existing framework and build system.
3. Identify existing assets and reusable code.
4. Do not rewrite working parts unnecessarily.
5. Do not introduce unnecessary dependencies.
6. Create a short implementation summary before modifying files.

Then implement the project in phases.

After each major phase:

1. Run the project.
2. Run type checking.
3. Run build.
4. Fix errors immediately.
5. Continue only after the current phase works.

Do NOT implement all features in one giant change.

Recommended implementation order:

Phase 1
→ Project setup

Phase 2
→ Player + lanes

Phase 3
→ Teachable Machine

Phase 4
→ Obstacles + collision

Phase 5
→ Score + difficulty + victory

Phase 6
→ UI + tutorial

Phase 7
→ Polish

Always prioritize a working playable MVP over visual polish.

````

## 🚀 Prompt แรกที่เอาไปให้ Antigravity

ผมแนะนำว่าอย่าโยนแค่ไฟล์ plan แล้วบอก `build this` เฉย ๆ ให้ใช้ prompt นี้ต่อเลย:

```text
Read IMPLEMENTATION_PLAN.md completely before making any changes.

You are now the lead developer for this project.

First, inspect the existing repository and determine:
1. Current framework
2. Current build system
3. Existing dependencies
4. Existing assets
5. Existing game/code architecture
6. Whether Teachable Machine is already integrated

Do not rewrite or replace working parts unnecessarily.

Then create a short technical implementation summary based on the current repository.

Start ONLY with Phase 1 and Phase 2 from IMPLEMENTATION_PLAN.md:
- Project setup if needed
- Basic game scene
- 4-lane arena
- Player
- LaneManager
- Smooth lane movement
- Keyboard debug controls

Do not implement advanced gameplay yet.

After implementation:
1. Run type checking.
2. Run the development build.
3. Run the production build.
4. Fix any errors.
5. Verify that the player can move between all four lanes.

Then report:
- Files created
- Files modified
- Dependencies added
- Tests/builds performed
- Any remaining issues
- Recommended next phase

Do not move to Phase 3 until Phase 1 and Phase 2 are working.
````

### 🎯 จุดสำคัญของแผนนี้

ผมตั้งใจให้ **Teachable Machine เป็น gameplay จริง ๆ** ไม่ใช่แค่ AI ที่เอามาโชว์ข้างจอ

```text
       🎧        🔌        🔋        👝
        ↓         ↓         ↓         ↓
       AI Classification / Teachable Machine
                    ↓
             ┌─────────────┐
             │  Lane Input │
             └─────────────┘
                    ↓
             🧍 PLAYER
                    ↓
              Dodge Objects
                    ↓
               🏆 3 MIN
```

และมี **prediction smoothing + confidence threshold + cooldown** ตั้งแต่ต้น เพราะสามตัวนี้จะช่วยกันอาการเกมแบบ

> Powerbank → Charger → Powerbank → Charger → Player เต้นเป็นเจ้าเข้า 😂

เอา `IMPLEMENTATION_PLAN.md` เข้า repo แล้วให้ Antigravity ทำ **Phase 1 → Phase 2 → test → ค่อยไป Phase 3** จะปลอดภัยสุดสำหรับเวลาของเธอ.
