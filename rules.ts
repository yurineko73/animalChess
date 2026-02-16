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

export const isValidAttack = (attacker: Piece, targetCell: Cell): boolean => {
  if (!targetCell.revealed) return false;
  // Move to empty is valid if distance check passes (handled in getValidTargets)
  if (!targetCell.piece) return true; 
  
  if (targetCell.piece.player === attacker.player) return false; // Cannot eat own pieces
  if (targetCell.piece.isImmune) return false; // Wolf immunity

  const attType = attacker.type;
  const defType = targetCell.piece.type;
  const attRank = ANIMAL_RANKS[attType];
  const defRank = ANIMAL_RANKS[defType];

  // --- Special Interactions ---
  
  // 1. Rat vs Elephant (Rat eats Elephant)
  if (attType === "rat" && defType === "elephant") return true;
  
  // 2. Elephant vs Rat (Elephant CANNOT eat Rat)
  if (attType === "elephant" && defType === "rat") return false;

  // 3. Elephant vs Big Tiger (Elephant eats Big Tiger)
  if (attType === "elephant" && defType === "bigTiger") return true;

  // 4. Big Tiger vs Elephant (Big Tiger CANNOT eat Elephant)
  if (attType === "bigTiger" && defType === "elephant") return false;

  // --- Standard Hierarchy ---
  // Greater or Equal rank can attack/trade.
  return attRank >= defRank;
};

export const getValidTargets = (
  from: Position, 
  piece: Piece, 
  currentBoard: Cell[][], 
  frozenUnits: {player: string, types: AnimalType[]} | null
): Position[] => {
  const targets: Position[] = [];
  const isFrozen = frozenUnits?.player === piece.player && frozenUnits.types.includes(piece.type);
  if (isFrozen) return [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === from.x && y === from.y) {
         // Self-target for Wolf (Wait)
         if (piece.type === "wolf") targets.push({x, y});
         continue;
      }

      const cell = currentBoard[y][x];
      const dx = Math.abs(from.x - x);
      const dy = Math.abs(from.y - y);
      const dist = dx + dy;
      
      // Basic Rule: Target must be revealed (or empty if previously revealed logic implies empty is revealed)
      // In this game, empty squares are "revealed" if they have no card.
      // If cell is HIDDEN, it's not a valid target for MOVE.
      if (!cell.revealed) continue;

      // --- Special Movement Rules ---

      // 1. Big Tiger (Evolved)
      if (piece.type === "bigTiger") {
         // Diagonal 1
         if (dx === 1 && dy === 1) {
            if (isValidAttack(piece, cell)) targets.push({x, y});
            continue;
         }
         // Orthogonal 2 (Jump check)
         if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) {
             const mx = from.x + (x - from.x)/2;
             const my = from.y + (y - from.y)/2;
             const midCell = currentBoard[my][mx];
             
             // Jump logic: Can cross enemy or empty
             const midIsEnemy = midCell.piece && midCell.piece.player !== piece.player;
             const midIsEmpty = midCell.revealed && !midCell.piece;
             
             if (midIsEnemy || midIsEmpty) {
                if (isValidAttack(piece, cell)) targets.push({x, y});
             }
             continue;
         }
         // Standard 1
         if (dist === 1) {
             if (isValidAttack(piece, cell)) targets.push({x, y});
             continue;
         }
      }

      // 2. Leopard Jump (Orth 2 over EMPTY)
      if (piece.type === "leopard" && ((dx === 2 && dy === 0) || (dx === 0 && dy === 2))) {
         const mx = from.x + (x - from.x)/2;
         const my = from.y + (y - from.y)/2;
         const midCell = currentBoard[my][mx];
         // Must cross empty space
         if (midCell.revealed && !midCell.piece) {
           if (isValidAttack(piece, cell)) targets.push({x, y});
         }
         continue;
      }

      // 3. Standard Orthogonal 1 (Rat, Cat, Dog, Wolf, Lion, Tiger, Elephant)
      // Note: Rat is now Standard.
      if (dist === 1) {
        if (isValidAttack(piece, cell)) targets.push({x, y});
      }
    }
  }
  return targets;
};
