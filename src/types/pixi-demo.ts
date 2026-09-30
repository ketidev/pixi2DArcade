import { Container, Graphics } from "pixi.js";

export interface TelemetryData {
  fps: number;
  deltaMS: number;
  childrenCount: number;
  pointerX: number;
  pointerY: number;
  rendererType: string;
}

export interface PixiGameProps {
  onTelemetryUpdate: (data: TelemetryData) => void;
}

export type GameState = "TITLE_MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

export interface GemItem {
  container: Container;
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  type: "gem" | "orb" | "hazard";
  radius: number;
  points: number;
}

export interface FloatingTextItem {
  textObj: Text;
  vy: number;
  alpha: number;
  life: number;
}

export interface SparkItem {
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
}

export interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}
