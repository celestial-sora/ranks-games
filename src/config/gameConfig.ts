export interface LaneInfo {
  index: number;
  label: string;
  name: string;
  iconKey: 'earbuds' | 'charger' | 'pocket';
  color: string;
  glowColor: number;
}

export const LANES: LaneInfo[] = [
  { index: 0, label: 'Earbuds', name: 'Lane 1', iconKey: 'earbuds', color: '#d97757', glowColor: 0xd97757 }, // Claude Terracotta
  { index: 1, label: 'charger', name: 'Lane 2', iconKey: 'charger', color: '#8fae8b', glowColor: 0x8fae8b }, // Elegant Sage
  { index: 2, label: 'Earphone pocket', name: 'Lane 3', iconKey: 'pocket', color: '#e5a86a', glowColor: 0xe5a86a }, // Warm Amber
];

export const GAME_CONFIG = {
  // Model Settings
  LOCAL_MODEL_URL: '/model/',
  REMOTE_MODEL_URL: 'https://teachablemachine.withgoogle.com/models/vgBNmCqUf/',
  CONFIDENCE_THRESHOLD: 0.70,
  SMOOTHING_WINDOW_SIZE: 5,
  LANE_CHANGE_COOLDOWN_MS: 200,

  // Gameplay Settings
  GAME_DURATION_SEC: 180, // 3 Minutes to win
  MAX_HP: 3,
  INVULNERABILITY_MS: 1200,
  SCORE_PER_SECOND: 10,
  SCORE_DODGE_BONUS: 25,

  // Arena Dimensions
  CANVAS_WIDTH: 520,
  CANVAS_HEIGHT: 720,
  LANE_COUNT: 3,

  // Movement
  PLAYER_SPEED_LERP: 0.25,

  // Difficulty Curves
  DIFFICULTY_TIERS: [
    { upToSec: 30, spawnIntervalMs: 1000, speed: 280, multiObstacleProb: 0.25 },
    { upToSec: 60, spawnIntervalMs: 850, speed: 340, multiObstacleProb: 0.45 },
    { upToSec: 120, spawnIntervalMs: 700, speed: 400, multiObstacleProb: 0.65 },
    { upToSec: 150, spawnIntervalMs: 580, speed: 460, multiObstacleProb: 0.75 },
    { upToSec: 180, spawnIntervalMs: 480, speed: 520, multiObstacleProb: 0.85 },
  ]
};

// Object to Lane normalization map
export function mapLabelToLane(label: string): number | null {
  const clean = label.trim().toLowerCase();
  for (const lane of LANES) {
    if (lane.label.toLowerCase() === clean) {
      return lane.index;
    }
  }
  return null;
}
