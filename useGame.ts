import { useState, useEffect } from "react";
import { Cell, Player, Piece, Position, GameHistory, GRID_SIZE, AnimalType } from "./types";
import { createBoard, getValidTargets } from "./rules";
import { ANIMAL_CHARS, ANIMAL_RANKS } from "./constants";
import { updateStats } from "./storage";
import { computeAiMove } from "./aiLogic";

export const useGame = () => {
  const [board, setBoard] = useState<Cell[][]>(createBoard());
  const [turn, setTurn] = useState<Player | null>(null);
  const [redHand, setRedHand] = useState<Piece[]>([]);
  const [blueHand, setBlueHand] = useState<Piece[]>([]);
  const [tigerStreak, setTigerStreak] = useState<{red: number, blue: number}>({red: 0, blue: 0});
  const [evoAvailable, setEvoAvailable] = useState<{red: boolean, blue: boolean}>({red: true, blue: true});
  const [frozenUnits, setFrozenUnits] = useState<{player: Player, types: AnimalType[]} | null>(null);
  const [noMoveCounts, setNoMoveCounts] = useState<{red: number, blue: number}>({red: 0, blue: 0});
  
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [undoCounts, setUndoCounts] = useState<{red: number, blue: number}>({red: 3, blue: 3});
  
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameLog, setGameLog] = useState<string>("Welcome! Flip a card to start.");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFirstTurn, setIsFirstTurn] = useState(true);

  const saveHistory = () => {
    const snapshot: GameHistory = {
      board: JSON.parse(JSON.stringify(board)),
      turn,
      redHand: JSON.parse(JSON.stringify(redHand)),
      blueHand: JSON.parse(JSON.stringify(blueHand)),
      tigerStreak: {...tigerStreak},
      evoAvailable: {...evoAvailable},
      frozenUnits: frozenUnits ? {...frozenUnits} : null,
      noMoveCounts: {...noMoveCounts}
    };
    setHistory(prev => [...prev.slice(-10), snapshot]);
  };

  const handleUndo = () => {
    if (history.length === 0 || !turn) return;
    if (undoCounts[turn] <= 0 && turn !== 'blue') {
       setGameLog("No undo charges left!");
       return;
    }
    const prev = history[history.length - 1];
    if (prev) {
       setBoard(prev.board);
       setTurn(prev.turn);
       setRedHand(prev.redHand);
       setBlueHand(prev.blueHand);
       setTigerStreak(prev.tigerStreak);
       setEvoAvailable(prev.evoAvailable);
       setFrozenUnits(prev.frozenUnits);
       setNoMoveCounts(prev.noMoveCounts);
       setHistory(prev => prev.slice(0, -1));
       setUndoCounts(c => ({...c, [turn]: c[turn] - 1}));
       setGameLog(`Undo successful! (${undoCounts[turn] - 1} left)`);
       setWinner(null);
    }
  };

  const handleStartGame = () => {
    setTurn(Math.random() > 0.5 ? "red" : "blue");
    setIsFirstTurn(true);
    setGameLog("First Turn: You MUST flip a card.");
    setBoard(createBoard());
    setRedHand([]); setBlueHand([]);
    setTigerStreak({red:0, blue:0});
    setEvoAvailable({red: true, blue: true});
    setNoMoveCounts({red: 0, blue: 0});
    setHistory([]);
    setUndoCounts({red:3, blue:3});
    setWinner(null);
  };

  const checkWin = (rHand: Piece[], bHand: Piece[]) => {
    // Condition 1: Collect ALL 8 enemy pieces
    const redHasAllBlue = rHand.filter(p => p.player === 'blue').length === 8;
    const blueHasAllRed = bHand.filter(p => p.player === 'red').length === 8;

    if (redHasAllBlue) { setWinner("red"); updateStats("win"); return true; }
    if (blueHasAllRed) { setWinner("blue"); updateStats("loss"); return true; }
    return false;
  };

  const capturePiece = (piece: Piece, capturerPlayer: Player, tempBoard: Cell[][]) => {
    const captured = { 
      ...piece, 
      player: capturerPlayer, 
      hasUsedAbility: false, 
      isImmune: false,
      type: piece.type === "bigTiger" ? "tiger" : piece.type 
    }; 
    
    // Tiger Evo Logic: Lost ability if captured
    if (piece.type === "tiger") {
       setEvoAvailable(prev => ({...prev, [piece.player]: false}));
    }

    // Condition 2: Evo Speed Win (Kill Enemy Big Tiger)
    if (piece.type === "bigTiger") {
        const winner = piece.player === 'red' ? 'blue' : 'red';
        setWinner(winner);
        updateStats(winner === 'red' ? 'win' : 'loss');
        return; 
    }

    if (capturerPlayer === "red") {
        setRedHand(prev => {
            const newHand = [...prev, captured];
            return newHand;
        });
    } else {
        setBlueHand(prev => [...prev, captured]);
    }
    updateStats("capture");
  };

  const endTurn = (currentBoard: Cell[][]) => {
    if (frozenUnits?.player === turn) setFrozenUnits(null);
    if (!winner) setTurn(turn === "red" ? "blue" : "red");
  };
  
  useEffect(() => {
     if (!winner) checkWin(redHand, blueHand);
  }, [redHand, blueHand]);

  // Turn Validator (No Moves Check)
  useEffect(() => {
    if (turn && !winner) {
        const checkAvailableMoves = () => {
            const currentHand = turn === 'red' ? redHand : blueHand;
            const hasHidden = board.some(r => r.some(c => !c.revealed));
            if (hasHidden) return true;
            const hasHand = currentHand.length > 0;
            const hasEmptyRevealed = board.some(r => r.some(c => c.revealed && !c.piece));
            if (hasHand && hasEmptyRevealed) return true;

            for (let y=0; y<GRID_SIZE; y++) {
                for (let x=0; x<GRID_SIZE; x++) {
                    const cell = board[y][x];
                    if (cell.revealed && cell.piece?.player === turn) {
                        const targets = getValidTargets({x,y}, cell.piece, board, frozenUnits);
                        if (targets.length > 0) return true;
                    }
                }
            }
            return false;
        };

        if (!checkAvailableMoves()) {
            const newCount = noMoveCounts[turn] + 1;
            if (newCount >= 3) {
                const win = turn === 'red' ? 'blue' : 'red';
                setWinner(win);
                updateStats(win === 'red' ? 'win' : 'loss');
                setGameLog(`${turn.toUpperCase()} stalled 3 turns! GAME OVER.`);
            } else {
                setNoMoveCounts(prev => ({...prev, [turn]: newCount}));
                setGameLog(`${turn.toUpperCase()} No Moves! Skipped (${newCount}/3)`);
                setTimeout(() => setTurn(turn === 'red' ? 'blue' : 'red'), 1000);
            }
        }
    }
  }, [turn, board, redHand, blueHand, frozenUnits]);


  const actionWrapper = (fn: () => void) => {
      setNoMoveCounts(prev => ({...prev, [turn!]: 0}));
      fn();
  };

  const executeFlip = (x: number, y: number) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        const cell = newBoard[y][x];
        cell.revealed = true;
        let logMsg = `Flipped ${cell.piece ? ANIMAL_CHARS[cell.piece.type] : "Empty"}`;
        
        if (cell.piece?.type === "dog") {
          logMsg += " (Dog Alert!)";
          const neighbors = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dx, dy] of neighbors) {
            const nx = x+dx, ny = y+dy;
            if (nx>=0 && nx<GRID_SIZE && ny>=0 && ny<GRID_SIZE && !newBoard[ny][nx].revealed) {
              newBoard[ny][nx].revealed = true;
              break;
            }
          }
        }
        if (cell.piece?.type === "rat" && !cell.piece.hasUsedAbility) {
          cell.piece.hasUsedAbility = true;
          let target: {pos: Position, rank: number} | null = null;
          newBoard.forEach((row, ry) => row.forEach((c, rx) => {
            if (c.revealed && c.piece && c.piece.player !== cell.piece!.player) {
               const r = ANIMAL_RANKS[c.piece.type];
               if (!target || r > target.rank) target = { pos: {x: rx, y: ry}, rank: r };
            }
          }));
          if (target) {
            const victim = newBoard[target.pos.y][target.pos.x].piece!;
            logMsg += ` Ambushed ${ANIMAL_CHARS[victim.type]}!`;
            capturePiece(victim, cell.piece.player, newBoard);
            newBoard[target.pos.y][target.pos.x].piece = null;
          }
        }

        setTigerStreak(prev => ({...prev, [turn!]: 0})); 
        setIsFirstTurn(false);
        setBoard(newBoard);
        setGameLog(logMsg);
        endTurn(newBoard);
    });
  };

  const executeMove = (from: Position, to: Position) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        const attacker = newBoard[from.y][from.x].piece!;
        const defender = newBoard[to.y][to.x].piece;
        const attRank = ANIMAL_RANKS[attacker.type];
        const defRank = defender ? ANIMAL_RANKS[defender.type] : 0;

        if (attacker.isImmune) attacker.isImmune = false;
        
        let streak = tigerStreak[attacker.player];
        const isTiger = attacker.type === "tiger";
        
        if (isTiger && evoAvailable[attacker.player]) {
            streak += 1;
        } else {
            streak = 0;
        }

        if (defender) {
          const isTrade = (attRank === defRank) && !(attacker.type === "bigTiger" || defender.type === "bigTiger");
          let isWin = false;
          let isMutual = false;

          if (defender.type === "cat" && !defender.hasUsedAbility) {
              const empties: Position[] = [];
              newBoard.forEach((r, ry) => r.forEach((c, rx) => { if (c.revealed && !c.piece) empties.push({x: rx, y: ry}) }));
              if (empties.length > 0) {
                const esc = empties[Math.floor(Math.random() * empties.length)];
                defender.hasUsedAbility = true;
                newBoard[esc.y][esc.x].piece = defender;
                setGameLog("Cat used 9 Lives!");
                newBoard[to.y][to.x].piece = attacker;
                newBoard[from.y][from.x].piece = null;
              } else {
                 isWin = true;
              }
          } else if (attacker.type === "rat" && defender.type === "elephant") {
              isWin = true;
          } else if (attacker.type === "elephant" && defender.type === "bigTiger") {
              isWin = true;
          } else if (attRank === defRank) {
              isMutual = true;
          } else if (attRank > defRank) {
              isWin = true;
          }

          if (isMutual) {
              setGameLog(`Trade! ${ANIMAL_CHARS[attacker.type]} x ${ANIMAL_CHARS[defender.type]}`);
              
              if (attacker.type === "tiger") setEvoAvailable(prev => ({...prev, [attacker.player]: false}));
              if (defender.type === "tiger") setEvoAvailable(prev => ({...prev, [defender.player]: false}));

              capturePiece(defender, attacker.player, newBoard); 
              capturePiece(attacker, attacker.player, newBoard);
              
              newBoard[to.y][to.x].piece = null;
              newBoard[from.y][from.x].piece = null;
              if (isTiger) streak = 0;

          } else if (isWin) {
              capturePiece(defender, attacker.player, newBoard);
              if (attacker.type === "lion") setFrozenUnits({ player: defender.player, types: ["cat", "rat"] });
              newBoard[to.y][to.x].piece = attacker;
              newBoard[from.y][from.x].piece = null;
          }
        } else {
           newBoard[to.y][to.x].piece = attacker;
           newBoard[from.y][from.x].piece = null;
        }

        const pieceOnTarget = newBoard[to.y][to.x].piece;
        if (isTiger && streak >= 10 && pieceOnTarget && pieceOnTarget.id === attacker.id) {
          if (evoAvailable[attacker.player]) {
              pieceOnTarget.type = "bigTiger";
              setGameLog("TIGER EVOLUTION! 👑");
              updateStats("evo");
              streak = 0;
              setEvoAvailable(prev => ({...prev, [attacker.player]: false}));
          }
        }
        
        setTigerStreak(prev => ({...prev, [attacker.player]: streak}));
        setBoard(newBoard);
        endTurn(newBoard);
    });
  };

  const executeDrop = (player: Player, handIdx: number, to: Position) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        const hand = player === "red" ? redHand : blueHand;
        const piece = hand[handIdx];
        
        if (player === "red") {
          const nh = [...redHand]; nh.splice(handIdx, 1);
          setRedHand(nh);
        } else {
          const nh = [...blueHand]; nh.splice(handIdx, 1);
          setBlueHand(nh);
        }

        newBoard[to.y][to.x].piece = piece;
        setTigerStreak(prev => ({...prev, [player]: 0}));
        setBoard(newBoard);
        setGameLog(`Dropped ${ANIMAL_CHARS[piece.type]}`);
        endTurn(newBoard);
    });
  };

  const executeWolfWait = (pos: Position) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        newBoard[pos.y][pos.x].piece!.isImmune = true;
        setGameLog("Wolf Stealth (Immune 1 turn)");
        setTigerStreak(prev => ({...prev, [turn!]: 0}));
        setBoard(newBoard);
        endTurn(newBoard);
    });
  };

  // AI Trigger
  useEffect(() => {
    if (turn === "blue" && !winner) {
      // Small delay for UX
      const timer = setTimeout(() => {
        setIsAiThinking(true);
        // Execute Logic
        try {
            const action = computeAiMove(
                board, 
                blueHand, 
                redHand, 
                frozenUnits, 
                tigerStreak.blue, 
                evoAvailable.blue, 
                isFirstTurn
            );

            // Save history only for actual actions
            if (action.type !== 'wait') saveHistory();

            if (action.type === 'flip') executeFlip(action.x, action.y);
            else if (action.type === 'move') executeMove(action.from, action.to);
            else if (action.type === 'drop') executeDrop('blue', action.handIndex, action.to);
            else {
                // Wait/Pass logic if needed, or fallback
                setTurn("red");
            }
        } finally {
            setIsAiThinking(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, winner]); // Dependencies ensure this runs when turn switches to Blue

  return {
    board, turn, redHand, blueHand, tigerStreak, frozenUnits,
    history, undoCounts, winner, gameLog, isAiThinking, isFirstTurn,
    actions: { saveHistory, handleUndo, handleStartGame, executeFlip, executeMove, executeDrop, executeWolfWait }
  };
};
