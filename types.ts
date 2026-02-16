export const GRID_SIZE = 4;
export type Player = "red" | "blue";
export type AnimalType = "rat" | "cat" | "dog" | "wolf" | "leopard" | "tiger" | "lion" | "elephant" | "bigTiger";

export interface Piece {
  id: string;
  type: AnimalType;
  player: Player;
  originalPlayer?: Player;
  hasUsedAbility?: boolean; 
  isImmune?: boolean;
}

export interface Cell {
  piece: Piece | null;
  revealed: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameHistory {
  board: Cell[][];
  turn: Player | null;
  redHand: Piece[];
  blueHand: Piece[];
  tigerStreak: {red: number, blue: number};
  evoAvailable: {red: boolean, blue: boolean};
  frozenUnits: {player: Player, types: AnimalType[]} | null;
  noMoveCounts: {red: number, blue: number};
  aiHasActed: boolean;
}

export interface GameStats {
  flipCount: {red: number, blue: number};
  captureCount: {red: number, blue: number};
  tradeCount: {red: number, blue: number};
  maxTigerStreak: {red: number, blue: number};
}

export interface GameLogEntry {
  id: number;
  turn: number;
  player: Player;
  action: string;
  details?: string;
  timestamp: number;
}
