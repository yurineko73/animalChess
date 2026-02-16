import { GRID_SIZE, Cell, Piece, Position, AnimalType } from "./types";
import { ANIMAL_RANKS } from "./constants";

export const createDeck = (): Piece[] => {
  const types: AnimalType[] = ["rat", "cat", "dog", "wolf", "leopard", "tiger", "lion", "elephant"];
  const deck: Piece[] = [];
  types.forEach(type => {
    deck.push({ id: `red-${type}`, type, player: "red" });
    deck.push({ id: `blue-${type}`, type, player: "blue" });
  });
  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const createBoard = (): Cell[][] => {
  const deck = createDeck();
  const board: Cell[][] = [];
  let idx = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ piece: deck[idx++], revealed: false });
    }
    board.push(row);
  }
  return board;
};

export const isValidAttack = (attacker: Piece, targetCell: Cell, specialAbilitiesEnabled: boolean = true): boolean => {
  if (!targetCell.revealed) return false;
  if (!targetCell.piece) return true; 
  
  if (targetCell.piece.player === attacker.player) return false;
  if (targetCell.piece.isImmune) return false;

  const attType = attacker.type;
  const defType = targetCell.piece.type;
  const attRank = ANIMAL_RANKS[attType];
  const defRank = ANIMAL_RANKS[defType];

  if (attType === "rat" && defType === "elephant") return true;
  if (attType === "elephant" && defType === "rat") return false;

  if (attType === "bigTiger") {
    if (defType === "elephant") return false;
    if (defType === "lion" || defRank <= ANIMAL_RANKS["tiger"]) return true;
    return false;
  }

  if (attType === "elephant" && defType === "bigTiger") return true;

  if (defType === "bigTiger") {
    return attType === "elephant";
  }

  return attRank >= defRank;
};

export const getValidTargets = (
  from: Position, 
  piece: Piece, 
  currentBoard: Cell[][], 
  frozenUnits: {player: string, types: AnimalType[]} | null,
  specialAbilitiesEnabled: boolean = true
): Position[] => {
  const targets: Position[] = [];
  const isFrozen = frozenUnits?.player === piece.player && frozenUnits.types.includes(piece.type);
  if (isFrozen) return [];

  for (let ty = 0; ty < GRID_SIZE; ty++) {
    for (let tx = 0; tx < GRID_SIZE; tx++) {
      if (tx === from.x && ty === from.y) {
         if (piece.type === "wolf") targets.push({x: tx, y: ty});
         continue;
      }

      const cell = currentBoard[ty][tx];
      const dx = Math.abs(from.x - tx);
      const dy = Math.abs(from.y - ty);
      const dist = dx + dy;
      
      if (!cell.revealed) continue;
      if (cell.piece && cell.piece.player === piece.player) continue;

      if (piece.type === "bigTiger") {
         if (specialAbilitiesEnabled) {
            if (dx === 1 && dy === 1) {
               if (isValidAttack(piece, cell, specialAbilitiesEnabled)) targets.push({x: tx, y: ty});
               continue;
            }
            if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) {
                const mx = from.x + (tx - from.x)/2;
                const my = from.y + (ty - from.y)/2;
                const midCell = currentBoard[my][mx];
                
                const midIsEnemy = midCell.piece && midCell.piece.player !== piece.player;
                const midIsEmpty = midCell.revealed && !midCell.piece;
                
                if (midIsEnemy || midIsEmpty) {
                   if (isValidAttack(piece, cell, specialAbilitiesEnabled)) targets.push({x: tx, y: ty});
                }
                continue;
            }
         }
         if (dist === 1) {
             if (isValidAttack(piece, cell, specialAbilitiesEnabled)) targets.push({x: tx, y: ty});
             continue;
         }
      }

      if (specialAbilitiesEnabled && piece.type === "leopard" && ((dx === 2 && dy === 0) || (dx === 0 && dy === 2))) {
         const mx = from.x + (tx - from.x)/2;
         const my = from.y + (ty - from.y)/2;
         const midCell = currentBoard[my][mx];
         if (midCell.revealed && !midCell.piece) {
           if (isValidAttack(piece, cell, specialAbilitiesEnabled)) targets.push({x: tx, y: ty});
         }
         continue;
      }

      if (dist === 1) {
        if (isValidAttack(piece, cell, specialAbilitiesEnabled)) targets.push({x: tx, y: ty});
      }
    }
  }
  return targets;
};
