import { GAME_CONFIG, mapLabelToLane, LANES } from '../config/gameConfig';

export interface PredictionItem {
  className: string;
  probability: number;
}

export type AIServiceStatus = 'idle' | 'loading' | 'ready' | 'error';

// Type definitions for global tmImage from teachablemachine script
interface TMImageModel {
  getTotalClasses(): number;
  getClassLabels(): string[];
  predict(image: HTMLCanvasElement | HTMLVideoElement | ImageData): Promise<PredictionItem[]>;
}

interface TMWebcam {
  canvas: HTMLCanvasElement;
  webcam?: HTMLVideoElement;
  setup(options?: { facingMode?: string; width?: number; height?: number }): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  update(): void;
}

interface TMImageLib {
  load(modelURL: string, metadataURL: string): Promise<TMImageModel>;
  Webcam: new (width: number, height: number, flip: boolean) => TMWebcam;
}

declare global {
  interface Window {
    tmImage?: TMImageLib;
  }
}

export class TeachableMachineService {
  private static instance: TeachableMachineService;
  private model: TMImageModel | null = null;
  private webcam: TMWebcam | null = null;
  private animationFrameId: number | null = null;
  private containerElement: HTMLElement | null = null;

  private status: AIServiceStatus = 'idle';
  private errorMessage: string = '';

  // Smoothing & Cooldown state
  private predictionBuffer: string[] = [];
  private lastLaneChangeTime: number = 0;
  private currentLane: number = 1; // Default to middle lane
  private isRunning: boolean = false;
  private isGameplayActive: boolean = false;

  // Listeners
  public onLaneDetected?: (laneIndex: number, label: string, confidence: number) => void;
  public onPredictionUpdate?: (
    predictions: PredictionItem[],
    topLabel: string,
    topProb: number,
    targetLane: number | null
  ) => void;
  public onStatusChange?: (status: AIServiceStatus, error?: string) => void;

  private constructor() {}

  public static getInstance(): TeachableMachineService {
    if (!TeachableMachineService.instance) {
      TeachableMachineService.instance = new TeachableMachineService();
    }
    return TeachableMachineService.instance;
  }

  public getStatus(): AIServiceStatus {
    return this.status;
  }

  public getErrorMessage(): string {
    return this.errorMessage;
  }

  public getWebcamCanvas(): HTMLCanvasElement | null {
    return this.webcam ? this.webcam.canvas : null;
  }

  public getIsGameplayActive(): boolean {
    return this.isGameplayActive;
  }

  public setGameplayActive(active: boolean) {
    this.isGameplayActive = active;
  }

  private setStatus(status: AIServiceStatus, error: string = '') {
    this.status = status;
    this.errorMessage = error;
    if (this.onStatusChange) {
      this.onStatusChange(status, error);
    }
  }

  /**
   * Initialize Model & Webcam
   */
  public async initialize(webcamContainer?: HTMLElement): Promise<boolean> {
    if (webcamContainer) {
      this.containerElement = webcamContainer;
    }

    if (this.status === 'ready' && this.webcam) {
      this.attachCanvasToContainer();
      this.start();
      return true;
    }

    this.setStatus('loading');

    // Wait for tmImage to load if scripts are still initializing
    let retries = 0;
    while (!window.tmImage && retries < 30) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    if (!window.tmImage) {
      this.setStatus('error', 'Teachable Machine library failed to load.');
      return false;
    }

    // 1. Try loading local model first, then remote model
    try {
      const localModelUrl = `${window.location.origin}${GAME_CONFIG.LOCAL_MODEL_URL}model.json`;
      const localMetadataUrl = `${window.location.origin}${GAME_CONFIG.LOCAL_MODEL_URL}metadata.json`;

      console.log('Loading AI model:', localModelUrl);
      this.model = await window.tmImage.load(localModelUrl, localMetadataUrl);
      console.log('Model loaded successfully! Classes:', this.model.getClassLabels());
    } catch (localErr) {
      console.warn('Local model failed, falling back to remote URL:', localErr);
      try {
        const remoteUrl = GAME_CONFIG.REMOTE_MODEL_URL;
        this.model = await window.tmImage.load(
          `${remoteUrl}model.json`,
          `${remoteUrl}metadata.json`
        );
        console.log('Remote model loaded successfully!');
      } catch (remoteErr) {
        console.error('All model load attempts failed:', remoteErr);
        this.setStatus('error', 'Failed to load AI model. Please check network connection.');
        return false;
      }
    }

    // 2. Setup Webcam
    try {
      const width = 320;
      const height = 240;
      const flip = true; // Mirror mode for natural preview

      this.webcam = new window.tmImage.Webcam(width, height, flip);
      await this.webcam.setup({ width, height });
      await this.webcam.play();

      this.attachCanvasToContainer();

      this.setStatus('ready');
      // IMMEDIATELY start the camera preview & classification loop so preview works before game starts!
      this.start();
      return true;
    } catch (camErr: unknown) {
      console.error('Webcam initialization error:', camErr);
      const msg = camErr instanceof Error ? camErr.message : 'Webcam access denied or unavailable.';
      this.setStatus('error', `Camera Error: ${msg}. Please allow camera access.`);
      return false;
    }
  }

  private attachCanvasToContainer() {
    if (this.containerElement && this.webcam && this.webcam.canvas) {
      this.containerElement.innerHTML = '';
      const canvas = this.webcam.canvas;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'cover';
      canvas.style.display = 'block';
      canvas.className = 'w-full h-full object-cover rounded-xl';
      this.containerElement.appendChild(canvas);
    }
  }

  /**
   * Start prediction & video render loop
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.predictionBuffer = [];
    this.loop();
  }

  /**
   * Pause prediction loop
   */
  public pause() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Stop and cleanup
   */
  public stop() {
    this.pause();
    if (this.webcam) {
      try {
        this.webcam.stop();
      } catch (e) {
        console.warn('Error stopping webcam', e);
      }
    }
    this.setStatus('idle');
  }

  /**
   * Continuous webcam update and prediction loop
   */
  private loop = async () => {
    if (!this.isRunning) return;

    if (this.webcam) {
      // Keep webcam frame continuously updating so preview is live and smooth
      this.webcam.update();

      if (this.model && this.webcam.canvas) {
        await this.predict();
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private async predict() {
    if (!this.model || !this.webcam || !this.webcam.canvas) return;

    try {
      const predictions = await this.model.predict(this.webcam.canvas);

      // Find highest confidence prediction
      let topItem: PredictionItem = { className: '', probability: 0 };
      for (const p of predictions) {
        if (p.probability > topItem.probability) {
          topItem = p;
        }
      }

      const targetLane = mapLabelToLane(topItem.className);

      // Always update UI Telemetry so user sees live camera classification
      if (this.onPredictionUpdate) {
        this.onPredictionUpdate(predictions, topItem.className, topItem.probability, targetLane);
      }

      // Check Confidence Threshold
      if (topItem.probability >= GAME_CONFIG.CONFIDENCE_THRESHOLD && targetLane !== null) {
        this.predictionBuffer.push(topItem.className);
        if (this.predictionBuffer.length > GAME_CONFIG.SMOOTHING_WINDOW_SIZE) {
          this.predictionBuffer.shift();
        }

        this.evaluateSmoothedPrediction();
      } else {
        if (this.predictionBuffer.length > 0) {
          this.predictionBuffer.shift();
        }
      }
    } catch (err) {
      console.error('Prediction loop error:', err);
    }
  }

  /**
   * Majority Voting over the rolling buffer + cooldown filter
   */
  private evaluateSmoothedPrediction() {
    if (this.predictionBuffer.length < 3) return;

    const counts: Record<string, number> = {};
    for (const label of this.predictionBuffer) {
      counts[label] = (counts[label] || 0) + 1;
    }

    let dominantLabel = '';
    let maxCount = 0;
    for (const [label, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantLabel = label;
      }
    }

    if (maxCount >= 3) {
      const detectedLane = mapLabelToLane(dominantLabel);
      const now = performance.now();

      if (
        detectedLane !== null &&
        detectedLane !== this.currentLane &&
        now - this.lastLaneChangeTime >= GAME_CONFIG.LANE_CHANGE_COOLDOWN_MS
      ) {
        this.currentLane = detectedLane;
        this.lastLaneChangeTime = now;

        if (this.onLaneDetected) {
          this.onLaneDetected(detectedLane, dominantLabel, maxCount / this.predictionBuffer.length);
        }
      }
    }
  }

  /**
   * Manual override for testing / keyboard debug
   */
  public triggerManualLane(laneIndex: number) {
    if (laneIndex >= 0 && laneIndex < LANES.length) {
      this.currentLane = laneIndex;
      const lane = LANES[laneIndex];
      if (this.onLaneDetected) {
        this.onLaneDetected(laneIndex, lane.label, 1.0);
      }
    }
  }
}
