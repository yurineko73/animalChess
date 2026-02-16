export const GRID_SIZE = 4;
export type Player = "red" | "blue";
export type AnimalType = "rat" | "cat" | "dog" | "wolf" | "leopard" | "tiger" | "lion" | "elephant" | "bigTiger";

export interface Piece {
  id: string;
  type: AnimalType;
  player: Player;
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
}
