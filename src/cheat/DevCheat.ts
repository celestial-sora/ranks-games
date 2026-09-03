export interface CheatOptions {
  godMode: boolean;
  scoreMultiplier: number;
  skipCountdown: boolean;
  instantWin: boolean;
  clearObstacles: boolean;
  addScore: boolean;
}

export class DevCheat {
  private static instance: DevCheat;

  private options: CheatOptions = {
    godMode: false,
    scoreMultiplier: 1,
    skipCountdown: false,
    instantWin: false,
    clearObstacles: false,
    addScore: false,
  };

  private listeners: Array<(opts: CheatOptions) => void> = [];

  private constructor() {}

  public static getInstance(): DevCheat {
    if (!DevCheat.instance) {
      DevCheat.instance = new DevCheat();
    }
    return DevCheat.instance;
  }

  public getOptions(): CheatOptions {
    return this.options;
  }

  public getScoreMultiplier(): number {
    return this.options.scoreMultiplier;
  }

  public isGodMode(): boolean {
    return this.options.godMode;
  }

  public onChange(cb: (opts: CheatOptions) => void): void {
    this.listeners.push(cb);
  }

  public toggle(key: keyof CheatOptions): void {
    const current = this.options[key];
    if (typeof current === 'boolean') {
      (this.options[key] as boolean) = !current;
    }
    this.emit();
  }

  public set(key: keyof CheatOptions, value: boolean | number): void {
    (this.options[key] as boolean | number) = value;
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.options));
  }
}