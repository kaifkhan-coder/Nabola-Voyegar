
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SECTOR_BREAK = 'SECTOR_BREAK'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2D;
  radius: number;
  velocity: Vector2D;
  color: string;
}

export interface Player extends Entity {
  targetY: number;
}

export interface Asteroid extends Entity {
  rotation: number;
  rotationSpeed: number;
  points: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
}

export interface SectorLore {
  name: string;
  description: string;
  hazardLevel: string;
}
