import { LANES, GAME_CONFIG } from '../config/gameConfig';
import { PredictionItem } from '../ai/TeachableMachineService';
import { SoundManager } from '../audio/SoundManager';
import { ICONS } from './icons';
import { DevCheat, CheatOptions } from '../cheat/DevCheat';

export class UIManager {
  private static instance: UIManager;

  // DOM Elements
  private appContainer!: HTMLElement;
  private startScreen!: HTMLElement;
  private loadingScreen!: HTMLElement;
  private loadingText!: HTMLElement;
  private loadingErrorContainer!: HTMLElement;
  private loadingErrorText!: HTMLElement;
  private retryBtn!: HTMLElement;

  private tutorialScreen!: HTMLElement;
  private countdownOverlay!: HTMLElement;
  private countdownNumber!: HTMLElement;

  private hudContainer!: HTMLElement;
  private heartsContainer!: HTMLElement;
  private timerText!: HTMLElement;
  private scoreText!: HTMLElement;
  private progressBar!: HTMLElement;
  private soundToggleBtn!: HTMLElement;

  private gameOverScreen!: HTMLElement;
  private gameOverScoreText!: HTMLElement;
  private gameOverTimeText!: HTMLElement;
  private gameOverBestText!: HTMLElement;

  private victoryScreen!: HTMLElement;
  private victoryScoreText!: HTMLElement;
  private victoryTimeText!: HTMLElement;
  private victoryBestText!: HTMLElement;

  // Sidebar / AI telemetry
  private webcamContainer!: HTMLElement;
  private aiStatusBadge!: HTMLElement;
  private aiConfidenceBarsContainer!: HTMLElement;
  private activeObjectBadge!: HTMLElement;

  private bestScore: number = 0;

  // Event handlers
  public onStartClicked?: () => void;
  public onTutorialFinished?: () => void;
  public onPlayAgainClicked?: () => void;
  public onMenuClicked?: () => void;
  public onManualLaneSelected?: (lane: number) => void;
  public onCheatInstantWin?: () => void;
  public onCheatAddScore?: (amount: number) => void;

  private cheatPanel!: HTMLElement;
  private cheatStates: Record<string, HTMLElement> = {};

  private constructor() {
    this.bestScore = parseInt(localStorage.getItem('ranks_dodge_best_score') || '0', 10);
  }

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  public init(containerId: string) {
    this.appContainer = document.getElementById(containerId) || document.body;
    this.buildUI();

    DevCheat.getInstance().onChange((opts) => {
      this.syncCheatUI(opts);
    });
  }

  public getWebcamContainer(): HTMLElement {
    return this.webcamContainer;
  }

  private buildUI() {
    this.appContainer.innerHTML = `
      <div class="relative w-screen h-screen flex flex-col lg:flex-row items-center justify-center bg-[#141311] text-[#faf9f5] overflow-hidden font-sans select-none">
        
        <!-- Left: Game Canvas Area -->
        <div class="relative flex flex-col items-center justify-center p-2 sm:p-4 flex-shrink-0">
          <div id="game-canvas-wrapper" class="relative rounded-2xl overflow-hidden claude-card claude-glow-soft shadow-2xl bg-[#1a1917]" style="width: 520px; height: 720px; max-width: 95vw; max-height: 85vh;">
            
            <!-- In-game Phaser Canvas attaches here -->
            <div id="phaser-mount" class="w-full h-full"></div>

            <!-- In-Game HUD Overlay (Claude Style) -->
            <div id="hud-overlay" class="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between hidden">
              <!-- Top HUD Bar -->
              <div class="flex items-center justify-between bg-[#1e1d1a]/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-[#383632] shadow-lg pointer-events-auto">
                <!-- Hearts (SVG) -->
                <div id="hud-hearts" class="flex space-x-1.5 items-center">
                  ${ICONS.heartFull(18)}
                  ${ICONS.heartFull(18)}
                  ${ICONS.heartFull(18)}
                </div>

                <!-- Timer -->
                <div class="flex flex-col items-center">
                  <span class="text-[10px] tracking-wider text-[#b4b0a5] font-medium uppercase">Time</span>
                  <span id="hud-timer" class="text-lg font-mono-claude font-semibold text-[#faf9f5]">00:00</span>
                </div>

                <!-- Score -->
                <div class="flex flex-col items-end">
                  <span class="text-[10px] tracking-wider text-[#b4b0a5] font-medium uppercase">Score</span>
                  <span id="hud-score" class="text-lg font-mono-claude font-semibold text-[#d97757]">0</span>
                </div>
              </div>

              <!-- Top Progress Bar (3 Mins goal) -->
              <div class="w-full bg-[#262522] rounded-full h-1.5 overflow-hidden border border-[#383632] mt-1">
                <div id="hud-progress-bar" class="bg-[#d97757] h-full w-0 transition-all duration-300"></div>
              </div>

              <!-- Bottom Controls & Hints -->
              <div class="flex justify-between items-end mt-auto pointer-events-auto">
                <div class="flex items-center space-x-2 bg-[#1e1d1a]/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#383632] text-xs text-[#b4b0a5]">
                  <span class="text-[#d97757] font-semibold">Test:</span> Keys 1–3 / A–D
                </div>

                <button id="btn-sound-toggle" class="bg-[#1e1d1a]/90 hover:bg-[#2b2a26] backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#383632] text-xs transition text-[#ece9df] flex items-center space-x-1.5">
                  <span id="sound-icon-holder">${ICONS.volumeOn(14)}</span>
                  <span id="sound-text">Sound</span>
                </button>
              </div>
            </div>

            <!-- Countdown Overlay -->
            <div id="countdown-overlay" class="absolute inset-0 flex items-center justify-center bg-[#141311]/80 backdrop-blur-sm z-30 hidden">
              <div id="countdown-num" class="text-8xl font-serif-claude italic font-light text-[#d97757]">3</div>
            </div>

            <!-- Screen: Start Screen (Claude Aesthetic) -->
            <div id="screen-start" class="absolute inset-0 bg-[#1e1d1a]/95 backdrop-blur-md flex flex-col items-center justify-between p-8 z-20">
              <div class="text-center mt-4">
                <div class="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#2b2a26] border border-[#3e3c37] rounded-full text-[#d97757] text-xs font-medium mb-3">
                  ${ICONS.sparkle(13)}
                  <span>Teachable Machine AI</span>
                </div>
                <h1 class="text-4xl sm:text-5xl font-serif-claude italic font-normal tracking-tight text-[#faf9f5]">
                  Claude Dodge
                </h1>
                <p class="text-[#b4b0a5] text-xs sm:text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                  Collect the glowing gems using physical objects in front of your camera.
                </p>
              </div>

              <!-- Object Preview Grid (3 Lanes - SVG Icons) -->
              <div class="w-full grid grid-cols-3 gap-3 my-auto max-w-md">
                ${LANES.map((l) => `
                  <div class="flex flex-col items-center text-center p-3.5 bg-[#262522] rounded-2xl border border-[#383632] shadow-sm hover:border-[#524f48] transition">
                    <div class="mb-2 p-2 rounded-xl bg-[#1e1d1a] border border-[#383632]">
                      ${ICONS.getLaneIcon(l.index, 24)}
                    </div>
                    <div class="text-xs font-semibold text-[#faf9f5] truncate w-full">${l.label}</div>
                    <div class="text-[11px] font-medium mt-0.5" style="color: ${l.color}">${l.name}</div>
                  </div>
                `).join('')}
              </div>

              <div class="w-full max-w-xs mb-2 text-center">
                <button id="btn-start" class="w-full py-3.5 claude-btn-primary font-medium text-base rounded-full shadow-md">
                  Begin Journey
                </button>
                <p class="text-[#827e75] text-[11px] mt-2.5">Webcam required • 3-minute gem collecting</p>
              </div>
            </div>

            <!-- Screen: Camera Permission / Loading AI Screen -->
            <div id="screen-loading" class="absolute inset-0 bg-[#1e1d1a]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-20 hidden text-center">
              <div class="w-12 h-12 border-2 border-[#383632] border-t-[#d97757] rounded-full animate-spin mb-4"></div>
              <h2 class="text-2xl font-serif-claude italic font-normal text-[#faf9f5] mb-1">Connecting to AI Model</h2>
              <p id="loading-text" class="text-[#b4b0a5] text-xs max-w-xs mb-4 leading-relaxed">Preparing neural network and vision classifier...</p>
              
              <div id="loading-error" class="hidden flex flex-col items-center bg-[#2b211e] border border-[#593026] p-4 rounded-2xl max-w-xs mt-2">
                <span class="text-[#e58a70] text-xs mb-3" id="loading-error-text">Camera permission needed</span>
                <button id="btn-retry" class="px-5 py-2 bg-[#d97757] hover:bg-[#c66849] text-white font-medium rounded-full text-xs transition">
                  Try Again
                </button>
              </div>
            </div>

            <!-- Screen: Tutorial Screen (3 Items - SVG Icons) -->
            <div id="screen-tutorial" class="absolute inset-0 bg-[#1e1d1a]/95 backdrop-blur-md flex flex-col items-center justify-between p-8 z-20 hidden">
              <div class="text-center mt-2">
                <h2 class="text-3xl font-serif-claude italic font-normal text-[#faf9f5]">How It Works</h2>
                <p class="text-[#b4b0a5] text-xs mt-1">Present objects to your camera to guide the vessel</p>              </div>

              <div class="w-full grid grid-cols-3 gap-3 max-w-md my-auto">
                <div class="p-3.5 bg-[#262522] rounded-2xl border border-[#383632] flex flex-col items-center text-center">
                  <div class="mb-2 p-2.5 rounded-xl bg-[#1e1d1a] border border-[#383632]">
                    ${ICONS.earbuds(28)}
                  </div>
                  <div class="font-semibold text-xs text-[#faf9f5] truncate">Earbuds</div>
                  <div class="text-[11px] text-[#d97757] font-medium mt-1">Lane 1 (Left)</div>
                </div>

                <div class="p-3.5 bg-[#262522] rounded-2xl border border-[#383632] flex flex-col items-center text-center">
                  <div class="mb-2 p-2.5 rounded-xl bg-[#1e1d1a] border border-[#383632]">
                    ${ICONS.charger(28)}
                  </div>
                  <div class="font-semibold text-xs text-[#faf9f5] truncate">Charger</div>
                  <div class="text-[11px] text-[#8fae8b] font-medium mt-1">Lane 2 (Center)</div>
                </div>

                <div class="p-3.5 bg-[#262522] rounded-2xl border border-[#383632] flex flex-col items-center text-center">
                  <div class="mb-2 p-2.5 rounded-xl bg-[#1e1d1a] border border-[#383632]">
                    ${ICONS.pocket(28)}
                  </div>
                  <div class="font-semibold text-xs text-[#faf9f5] truncate">Pocket</div>
                  <div class="text-[11px] text-[#e5a86a] font-medium mt-1">Lane 3 (Right)</div>
                </div>
              </div>

              <div class="w-full max-w-xs mb-2 text-center">
                <div class="text-xs text-[#b4b0a5] mb-3 font-light">Collect gems for 3 minutes to complete the journey.</div>
                <button id="btn-tutorial-ready" class="w-full py-3.5 claude-btn-primary font-medium text-sm rounded-full shadow-md">
                  I'm Ready
                </button>
              </div>
            </div>

            <!-- Screen: Game Over Screen (SVG Shield) -->
            <div id="screen-game-over" class="absolute inset-0 bg-[#1e1d1a]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-20 hidden text-center">
              <div class="mb-3 flex justify-center">
                ${ICONS.shieldAlert(42)}
              </div>
              <h2 class="text-4xl font-serif-claude italic font-normal text-[#faf9f5] mb-1">Journey Ended</h2>
              <p class="text-[#b4b0a5] text-xs mb-6">Your journey was interrupted</p>

              <div class="w-full max-w-xs bg-[#262522] border border-[#383632] rounded-2xl p-4 mb-6 space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-[#b4b0a5]">Score</span>
                  <span id="go-score" class="text-base font-semibold font-mono-claude text-[#d97757]">0</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-[#b4b0a5]">Time Survived</span>
                  <span id="go-time" class="text-xs font-semibold font-mono-claude text-[#faf9f5]">00:00</span>
                </div>
                <div class="flex justify-between items-center text-xs border-t border-[#383632] pt-2">
                  <span class="text-[#b4b0a5]">Personal Best</span>
                  <span id="go-best" class="text-xs font-semibold font-mono-claude text-[#8fae8b]">0</span>
                </div>
              </div>

              <div class="flex space-x-3 w-full max-w-xs">
                <button id="btn-play-again" class="flex-1 py-3 claude-btn-primary font-medium text-xs rounded-full">
                  Try Again
                </button>
                <button id="btn-go-menu" class="px-5 py-3 claude-btn-secondary font-medium text-xs rounded-full">
                  Menu
                </button>
              </div>
            </div>

            <!-- Screen: Victory Screen (SVG Trophy) -->
            <div id="screen-victory" class="absolute inset-0 bg-[#1e1d1a]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-20 hidden text-center">
              <div class="mb-3 flex justify-center">
                ${ICONS.trophy(48)}
              </div>
              <h2 class="text-4xl font-serif-claude italic font-normal text-[#d97757] mb-1">
                Completed
              </h2>
              <p class="text-[#8fae8b] text-xs font-medium mb-6">You collected for 3 minutes!</p>

              <div class="w-full max-w-xs bg-[#262522] border border-[#d97757]/40 rounded-2xl p-4 mb-6 space-y-3 shadow-lg shadow-[#d97757]/10">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-[#b4b0a5]">Final Score</span>
                  <span id="vic-score" class="text-base font-semibold font-mono-claude text-[#d97757]">0</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-[#b4b0a5]">Total Duration</span>
                  <span id="vic-time" class="text-xs font-semibold font-mono-claude text-[#faf9f5]">03:00</span>
                </div>
                <div class="flex justify-between items-center text-xs border-t border-[#383632] pt-2">
                  <span class="text-[#b4b0a5]">Personal Best</span>
                  <span id="vic-best" class="text-xs font-semibold font-mono-claude text-[#8fae8b]">0</span>
                </div>
              </div>

              <div class="flex space-x-3 w-full max-w-xs">
                <button id="btn-vic-play-again" class="flex-1 py-3 claude-btn-primary font-medium text-xs rounded-full">
                  Play Again
                </button>
                <button id="btn-vic-menu" class="px-5 py-3 claude-btn-secondary font-medium text-xs rounded-full">
                  Menu
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Right: AI Vision & Confidence Telemetry (Claude Style) -->
        <div class="w-full lg:w-80 flex flex-col justify-between p-3 sm:p-4 max-h-[85vh] overflow-y-auto space-y-4">
          
          <!-- Webcam Box -->
          <div class="claude-card rounded-2xl p-4 shadow-lg">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-[#d97757]"></span>
                <span class="text-xs font-medium text-[#ece9df] uppercase tracking-wider">Vision Classifier</span>
              </div>
              <span id="ai-status-badge" class="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#2b2a26] text-[#b4b0a5] border border-[#383632]">
                Offline
              </span>
            </div>

            <div id="webcam-view" class="w-full aspect-[4/3] bg-[#141311] rounded-xl overflow-hidden border border-[#383632] flex items-center justify-center text-[#827e75] text-xs">
              <span>Webcam Preview</span>
            </div>

            <!-- Active Classification Tag (SVG) -->
            <div class="mt-3 p-2.5 bg-[#141311] rounded-xl border border-[#383632] flex items-center justify-between">
              <span class="text-xs text-[#b4b0a5]">Detected:</span>
              <span id="active-object-badge" class="text-xs font-medium text-[#827e75] flex items-center space-x-1">None</span>
            </div>
          </div>

          <!-- AI Confidence Meter (SVG Icons) -->
          <div class="claude-card rounded-2xl p-4 shadow-lg">
            <div class="text-xs font-medium text-[#ece9df] uppercase tracking-wider mb-3">
              Class Probabilities
            </div>
            <div id="ai-confidence-bars" class="space-y-2.5">
              ${LANES.map((l) => `
                <div class="space-y-1" data-label="${l.label.toLowerCase()}">
                  <div class="flex justify-between text-xs">
                    <span class="text-[#ece9df] flex items-center space-x-1.5 font-light">
                      <span>${ICONS.getLaneIcon(l.index, 14)}</span>
                      <span>${l.label}</span>
                    </span>
                    <span class="font-mono-claude text-[#b4b0a5] text-xs prob-text">0%</span>
                  </div>
                  <div class="w-full bg-[#141311] rounded-full h-1.5 overflow-hidden border border-[#383632]">
                    <div class="prob-bar h-full rounded-full transition-all duration-100" style="width: 0%; background-color: ${l.color}"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Manual Lane Test Pills (SVG Icons) -->
          <div class="claude-card rounded-2xl p-3.5 shadow-lg">
            <div class="text-[11px] font-medium text-[#b4b0a5] uppercase tracking-wider mb-2">
              Manual Lane Override
            </div>
            <div class="grid grid-cols-3 gap-2">
              ${LANES.map((l) => `
                <button data-lane="${l.index}" class="btn-manual-lane py-2 px-1 rounded-xl text-xs font-medium border border-[#383632] bg-[#262522] hover:bg-[#302e2a] hover:border-[#524f48] transition flex flex-col items-center">
                  <div class="mb-1">${ICONS.getLaneIcon(l.index, 16)}</div>
                  <span class="text-[10px] text-[#b4b0a5]">${l.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Dev Cheat Panel -->
          <div class="cheat-panel-wrapper claude-card rounded-2xl p-3.5 shadow-lg border-[#593026]/60">
            <div class="flex items-center justify-between mb-2">
              <div class="text-[11px] font-medium text-[#e58a70] uppercase tracking-wider flex items-center space-x-1.5">
                ${ICONS.sparkle(12)}
                <span>Dev Cheats</span>
              </div>
              <span class="text-[10px] text-[#827e75] font-mono-claude">Press "~" to toggle</span>
            </div>
            <div class="space-y-1.5">
              <button data-cheat="godMode" class="cheat-btn w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs border border-[#383632] bg-[#262522] hover:bg-[#302e2a] transition">
                <span>God Mode (no damage)</span>
                <span class="cheat-state font-mono-claude text-[#827e75]">OFF</span>
              </button>
              <button data-cheat="skipCountdown" class="cheat-btn w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs border border-[#383632] bg-[#262522] hover:bg-[#302e2a] transition">
                <span>Skip Countdown</span>
                <span class="cheat-state font-mono-claude text-[#827e75]">OFF</span>
              </button>
              <div class="flex items-center justify-between py-1 px-3 rounded-lg text-xs border border-[#383632] bg-[#262522]">
                <span>Score Multiplier</span>
                <div class="flex space-x-1">
                  <button data-cheat="mult1" class="cheat-mult w-6 h-6 rounded-md bg-[#1e1d1a] border border-[#383632] hover:bg-[#302e2a] text-[#d97757] font-mono-claude text-[11px]">×1</button>
                  <button data-cheat="mult10" class="cheat-mult w-6 h-6 rounded-md bg-[#1e1d1a] border border-[#383632] hover:bg-[#302e2a] text-[#d97757] font-mono-claude text-[11px]">×10</button>
                  <button data-cheat="mult100" class="cheat-mult w-6 h-6 rounded-md bg-[#1e1d1a] border border-[#383632] hover:bg-[#302e2a] text-[#d97757] font-mono-claude text-[11px]">×100</button>
                </div>
              </div>
              <button data-cheat="instantWin" class="cheat-btn w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs border border-[#483326] bg-[#2b211e] hover:bg-[#332722] text-[#e58a70] transition">
                <span>⚡ Instant Win</span>
                <span class="cheat-state font-mono-claude">RUN</span>
              </button>
              <button data-cheat="addScore" class="cheat-btn w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs border border-[#483326] bg-[#2b211e] hover:bg-[#332722] text-[#e58a70] transition">
                <span>+10,000 Score</span>
                <span class="cheat-state font-mono-claude">SPEND</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    `;

    this.bindDOMElements();
    this.bindEvents();
  }

  private bindDOMElements() {
    this.startScreen = document.getElementById('screen-start')!;
    this.loadingScreen = document.getElementById('screen-loading')!;
    this.loadingText = document.getElementById('loading-text')!;
    this.loadingErrorContainer = document.getElementById('loading-error')!;
    this.loadingErrorText = document.getElementById('loading-error-text')!;
    this.retryBtn = document.getElementById('btn-retry')!;

    this.tutorialScreen = document.getElementById('screen-tutorial')!;
    this.countdownOverlay = document.getElementById('countdown-overlay')!;
    this.countdownNumber = document.getElementById('countdown-num')!;

    this.hudContainer = document.getElementById('hud-overlay')!;
    this.heartsContainer = document.getElementById('hud-hearts')!;
    this.timerText = document.getElementById('hud-timer')!;
    this.scoreText = document.getElementById('hud-score')!;
    this.progressBar = document.getElementById('hud-progress-bar')!;
    this.soundToggleBtn = document.getElementById('btn-sound-toggle')!;

    this.gameOverScreen = document.getElementById('screen-game-over')!;
    this.gameOverScoreText = document.getElementById('go-score')!;
    this.gameOverTimeText = document.getElementById('go-time')!;
    this.gameOverBestText = document.getElementById('go-best')!;

    this.victoryScreen = document.getElementById('screen-victory')!;
    this.victoryScoreText = document.getElementById('vic-score')!;
    this.victoryTimeText = document.getElementById('vic-time')!;
    this.victoryBestText = document.getElementById('vic-best')!;

    this.webcamContainer = document.getElementById('webcam-view')!;
    this.aiStatusBadge = document.getElementById('ai-status-badge')!;
    this.aiConfidenceBarsContainer = document.getElementById('ai-confidence-bars')!;
    this.activeObjectBadge = document.getElementById('active-object-badge')!;
  }

  private bindEvents() {
    document.getElementById('btn-start')?.addEventListener('click', () => {
      if (this.onStartClicked) this.onStartClicked();
    });

    this.retryBtn?.addEventListener('click', () => {
      if (this.onStartClicked) this.onStartClicked();
    });

    document.getElementById('btn-tutorial-ready')?.addEventListener('click', () => {
      if (this.onTutorialFinished) this.onTutorialFinished();
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      if (this.onPlayAgainClicked) this.onPlayAgainClicked();
    });

    document.getElementById('btn-go-menu')?.addEventListener('click', () => {
      if (this.onMenuClicked) this.onMenuClicked();
    });

    document.getElementById('btn-vic-play-again')?.addEventListener('click', () => {
      if (this.onPlayAgainClicked) this.onPlayAgainClicked();
    });

    document.getElementById('btn-vic-menu')?.addEventListener('click', () => {
      if (this.onMenuClicked) this.onMenuClicked();
    });

    this.soundToggleBtn?.addEventListener('click', () => {
      const isMuted = SoundManager.getInstance().toggleMute();
      const iconHolder = document.getElementById('sound-icon-holder');
      const textHolder = document.getElementById('sound-text');
      if (iconHolder && textHolder) {
        iconHolder.innerHTML = isMuted ? ICONS.volumeOff(14) : ICONS.volumeOn(14);
        textHolder.innerText = isMuted ? 'Muted' : 'Sound';
      }
    });

    document.querySelectorAll('.btn-manual-lane').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lane = parseInt(btn.getAttribute('data-lane') || '0', 10);
        if (this.onManualLaneSelected) {
          this.onManualLaneSelected(lane);
        }
      });
    });

    // Dev Cheat controls
    this.cheatPanel = this.appContainer.querySelector('.cheat-panel-wrapper') as HTMLElement;
    this.cheatStates = {};

    document.querySelectorAll('.cheat-btn[data-cheat]').forEach((btn) => {
      const key = btn.getAttribute('data-cheat')!;
      const stateEl = btn.querySelector('.cheat-state') as HTMLElement;
      this.cheatStates[key] = stateEl;
      btn.addEventListener('click', () => {
        if (key === 'instantWin') {
          if (this.onCheatInstantWin) this.onCheatInstantWin();
        } else if (key === 'addScore') {
          if (this.onCheatAddScore) this.onCheatAddScore(10000);
        } else {
          DevCheat.getInstance().toggle(key as keyof CheatOptions);
        }
      });
    });

    document.querySelectorAll('.cheat-mult[data-cheat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mult = parseInt(btn.getAttribute('data-cheat')!.replace('mult', ''), 10);
        DevCheat.getInstance().set('scoreMultiplier', mult);
      });
    });

    // Backtick key toggles cheat panel visibility
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggleCheatPanel();
      }
    });
  }

  private toggleCheatPanel() {
    if (!this.cheatPanel) return;
    this.cheatPanel.classList.toggle('hidden');
  }

  private syncCheatUI(opts: CheatOptions) {
    const god = this.cheatStates['godMode'];
    if (god) {
      god.innerText = opts.godMode ? 'ON' : 'OFF';
      god.style.color = opts.godMode ? '#8fae8b' : '#827e75';
    }
    const skip = this.cheatStates['skipCountdown'];
    if (skip) {
      skip.innerText = opts.skipCountdown ? 'ON' : 'OFF';
      skip.style.color = opts.skipCountdown ? '#8fae8b' : '#827e75';
    }
  }

  public showStartScreen() {
    this.startScreen.classList.remove('hidden');
    this.loadingScreen.classList.add('hidden');
    this.tutorialScreen.classList.add('hidden');
    this.hudContainer.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.countdownOverlay.classList.add('hidden');
  }

  public showLoadingScreen(msg: string = 'Connecting to camera & AI model...') {
    this.startScreen.classList.add('hidden');
    this.loadingScreen.classList.remove('hidden');
    this.loadingText.innerText = msg;
    this.loadingErrorContainer.classList.add('hidden');
  }

  public showLoadingError(errorMsg: string) {
    this.loadingErrorContainer.classList.remove('hidden');
    this.loadingErrorText.innerText = errorMsg;
  }

  public showTutorialScreen() {
    this.loadingScreen.classList.add('hidden');
    this.tutorialScreen.classList.remove('hidden');
  }

  public async startCountdown(onComplete: () => void) {
    this.tutorialScreen.classList.add('hidden');
    this.hudContainer.classList.remove('hidden');
    this.countdownOverlay.classList.remove('hidden');

    const steps = ['3', '2', '1', 'Begin'];
    for (let i = 0; i < steps.length; i++) {
      const text = steps[i];
      this.countdownNumber.innerText = text;
      SoundManager.getInstance().playCountdown(i === steps.length - 1);
      await new Promise((r) => setTimeout(r, 800));
    }

    this.countdownOverlay.classList.add('hidden');
    onComplete();
  }

  public updateHUD(hp: number, maxHp: number, score: number, timeSec: number) {
    let heartsHtml = '';
    for (let i = 0; i < maxHp; i++) {
      heartsHtml += i < hp ? ICONS.heartFull(18) : ICONS.heartEmpty(18);
    }
    this.heartsContainer.innerHTML = heartsHtml;

    const mins = Math.floor(timeSec / 60);
    const secs = timeSec % 60;
    this.timerText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.scoreText.innerText = score.toLocaleString();

    const progressPercent = Math.min(100, (timeSec / GAME_CONFIG.GAME_DURATION_SEC) * 100);
    this.progressBar.style.width = `${progressPercent}%`;
  }

  public showGameOver(score: number, timeSec: number) {
    this.gameOverScreen.classList.remove('hidden');
    this.hudContainer.classList.add('hidden');

    if (score > this.bestScore) {
      this.bestScore = score;
      localStorage.setItem('ranks_dodge_best_score', this.bestScore.toString());
    }

    const mins = Math.floor(timeSec / 60);
    const secs = timeSec % 60;

    this.gameOverScoreText.innerText = score.toLocaleString();
    this.gameOverTimeText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.gameOverBestText.innerText = this.bestScore.toLocaleString();
  }

  public showVictory(score: number, timeSec: number) {
    this.victoryScreen.classList.remove('hidden');
    this.hudContainer.classList.add('hidden');

    if (score > this.bestScore) {
      this.bestScore = score;
      localStorage.setItem('ranks_dodge_best_score', this.bestScore.toString());
    }

    const mins = Math.floor(timeSec / 60);
    const secs = timeSec % 60;

    this.victoryScoreText.innerText = score.toLocaleString();
    this.victoryTimeText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.victoryBestText.innerText = this.bestScore.toLocaleString();
  }

  public updateTelemetry(
    predictions: PredictionItem[],
    topLabel: string,
    topProb: number,
    targetLane: number | null
  ) {
    if (topProb >= GAME_CONFIG.CONFIDENCE_THRESHOLD && targetLane !== null) {
      const laneInfo = LANES[targetLane];
      this.activeObjectBadge.innerHTML = `
        <span class="flex items-center space-x-1.5" style="color: ${laneInfo.color}">
          ${ICONS.getLaneIcon(targetLane, 14)}
          <span class="font-medium">${topLabel} (${Math.round(topProb * 100)}%)</span>
        </span>
      `;
    } else {
      this.activeObjectBadge.innerHTML = `<span class="text-[#827e75]">Waiting for input</span>`;
    }

    predictions.forEach((p) => {
      const clean = p.className.toLowerCase();
      const row = this.aiConfidenceBarsContainer.querySelector(`[data-label="${clean}"]`);
      if (row) {
        const percent = Math.round(p.probability * 100);
        const text = row.querySelector('.prob-text') as HTMLElement;
        const bar = row.querySelector('.prob-bar') as HTMLElement;
        if (text) text.innerText = `${percent}%`;
        if (bar) bar.style.width = `${percent}%`;
      }
    });
  }

  public updateAIStatus(status: string) {
    if (status === 'ready') {
      this.aiStatusBadge.innerText = 'Online';
      this.aiStatusBadge.className = 'px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#202920] text-[#8fae8b] border border-[#354934]';
    } else if (status === 'loading') {
      this.aiStatusBadge.innerText = 'Loading';
      this.aiStatusBadge.className = 'px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#2e261e] text-[#e5a86a] border border-[#52412d]';
    } else if (status === 'error') {
      this.aiStatusBadge.innerText = 'Error';
      this.aiStatusBadge.className = 'px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#2e1f1c] text-[#e58a70] border border-[#542d25]';
    } else {
      this.aiStatusBadge.innerText = 'Offline';
      this.aiStatusBadge.className = 'px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#262522] text-[#827e75] border border-[#383632]';
    }
  }
}
