
import { Cell, Piece, Position, Player, AnimalType, GRID_SIZE } from "./types";
import { ANIMAL_RANKS } from "./constants";
import { getValidTargets } from "./rules";

type AiAction = 
  | { type: 'flip', x: number, y: number }
  | { type: 'move', from: Position, to: Position }
  | { type: 'wait', pos: Position }
  | { type: 'surrender' };

// Helper: Get effective rank (handling Rat vs Elephant)
const getEffectiveRank = (attackerType: AnimalType, defenderType?: AnimalType): number => {
  if (attackerType === 'rat' && defenderType === 'elephant') return 100; // Rat kills Elephant
  if (attackerType === 'elephant' && defenderType === 'rat') return -1; // Elephant dies to Rat
  return ANIMAL_RANKS[attackerType];
};

export const computeAiMove = (
  board: Cell[][],
  aiHand: Piece[],
  enemyHand: Piece[],
  frozenUnits: {player: Player, types: AnimalType[]} | null,
  tigerStreak: number,
  evoAvailable: boolean,
  isFirstTurn: boolean,
  specialAbilitiesEnabled: boolean = true
): AiAction => {
  const aiPlayer: Player = 'blue';
  const enemyPlayer: Player = 'red';

  // --- 0. FIRST TURN MANDATORY FLIP ---
  const hiddenCells: Position[] = [];
  const myPieces: {pos: Position, piece: Piece}[] = [];
  const enemyPieces: {pos: Position, piece: Piece}[] = [];
  const emptyCells: Position[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = board[y][x];
      if (!cell.revealed) {
        hiddenCells.push({x, y});
      } else if (cell.piece) {
        if (cell.piece.player === aiPlayer) myPieces.push({pos: {x, y}, piece: cell.piece});
        else enemyPieces.push({pos: {x, y}, piece: cell.piece});
      } else {
        emptyCells.push({x, y});
      }
    }
  }

  if (isFirstTurn || (myPieces.length === 0 && aiHand.length === 0)) {
    // Must flip if possible
    if (hiddenCells.length > 0) {
      // Prioritize center flips or random
      const center = hiddenCells.find(p => (p.x === 1 || p.x === 2) && (p.y === 1 || p.y === 2));
      const target = center || hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
      return { type: 'flip', x: target.x, y: target.y };
    }
  }

  // --- Gather Valid Moves ---
  const possibleMoves: {from: Position, to: Position, score: number, type: 'move'}[] = [];
  
  myPieces.forEach(({pos, piece}) => {
    const targets = getValidTargets(pos, piece, board, frozenUnits, specialAbilitiesEnabled);
    targets.forEach(to => {
      let score = 0;
      const targetCell = board[to.y][to.x];
      
      // Heuristic 1: Capturing (High Priority)
      if (targetCell.piece) {
        // Skip own pieces!
        if (targetCell.piece.player === aiPlayer) {
          score -= 1000; // Heavy penalty for moving to own piece
        } else {
          const enemyRank = ANIMAL_RANKS[targetCell.piece.type];
          const myRank = ANIMAL_RANKS[piece.type];
          
          // Instant Win: Kill Big Tiger
          if (targetCell.piece.type === 'bigTiger') score += 10000;
          
          // High Value Kills
          else if (targetCell.piece.type === 'elephant') score += 50;
          else if (targetCell.piece.type === 'lion') score += 40;
          else if (targetCell.piece.type === 'tiger') score += 35;
          else score += (enemyRank * 10);

          // Trade Logic: Don't trade high value units for low value (unless necessary)
          // If ranks equal, it's a trade.
          if (myRank === enemyRank) {
             score -= (myRank * 5); // Slight penalty for trading, prefer clean kills
             if (piece.type === 'tiger' && evoAvailable) score -= 100; // Don't trade potential Evo Tiger
          }
        }
      } 
      // Heuristic 2: Moving to Empty
      else {
        score += 1; // Base move value
        
        // Safety Check: Is destination adjacent to strong enemy?
        let isSafe = true;
        const neighbors = [[0,1], [0,-1], [1,0], [-1,0]];
        for (const [dx, dy] of neighbors) {
           const nx = to.x + dx, ny = to.y + dy;
           if (nx >=0 && nx < GRID_SIZE && ny >=0 && ny < GRID_SIZE) {
              const nCell = board[ny][nx];
              if (nCell.revealed && nCell.piece && nCell.piece.player === enemyPlayer) {
                 const nRank = getEffectiveRank(nCell.piece.type, piece.type);
                 const myRank = getEffectiveRank(piece.type, nCell.piece.type);
                 if (nRank >= myRank) isSafe = false;
              }
           }
        }
        if (!isSafe) score -= 20;

        // Tiger Evo Encouragement
        if (piece.type === 'tiger' && evoAvailable && isSafe) {
           score += 15 + tigerStreak * 2; // Increasing incentive as streak grows
        }
      }

      possibleMoves.push({from: pos, to, score, type: 'move'});
    });
  });

  // --- Combine and Sort ---
  const allActions = possibleMoves.sort((a, b) => b.score - a.score);

  // --- Decision Tree ---

  // 1. Victory Check (Kill Big Tiger or Last Piece)
  // Note: CheckWin logic in main game handles "all captured", here we approximate by board presence
  if (allActions.length > 0 && allActions[0].score > 500) {
     const best = allActions[0];
     if (best.type === 'move') return { type: 'move', from: best.from, to: best.to };
  }

  // 2. Flip Logic (If early game or bad moves)
  // If many hidden cards, flipping is often better than a passive move.
  const hiddenCount = hiddenCells.length;
  const bestActionScore = allActions.length > 0 ? allActions[0].score : -999;
  
  // Dynamic Flip Threshold
  let flipThreshold = 5; 
  if (hiddenCount > 10) flipThreshold = 20; // Early game, want to flip
  if (hiddenCount <= 2) flipThreshold = -50; // Late game, risky to flip

  if (hiddenCount > 0 && (bestActionScore < flipThreshold || Math.random() < 0.1)) {
     // Smart Flip: Try to flip away from known strong enemies? 
     // For now, random available is fair.
     const randIdx = Math.floor(Math.random() * hiddenCells.length);
     return { type: 'flip', x: hiddenCells[randIdx].x, y: hiddenCells[randIdx].y };
  }

  // 3. Execute Best Action
  if (allActions.length > 0) {
      const best = allActions[0];
      if (best.type === 'move') return { type: 'move', from: best.from, to: best.to };
  }

  // 4. Last Resort: Flip anything
  if (hiddenCells.length > 0) {
      return { type: 'flip', x: hiddenCells[0].x, y: hiddenCells[0].y };
  }

  // 5. Check if we should surrender
  const shouldSurrender = () => {
    if (myPieces.length === 0 && hiddenCells.length === 0) {
      return true;
    }
    if (myPieces.length === 0 && aiHand.length >= 8) {
      return true;
    }
    if (myPieces.length === 0 && enemyPieces.length > 0 && aiHand.length === 0) {
      return true;
    }
    if (allActions.length === 0 && hiddenCells.length === 0) {
      return true;
    }
    return false;
  };

  if (shouldSurrender()) {
    return { type: 'surrender' };
  }

  // 6. Pass (Should count as stalemate/loss eventually)
  return { type: 'wait', pos: {x:0, y:0} }; // Should not happen if game logic handles stalemate
};
