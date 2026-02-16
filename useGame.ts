import { useState, useEffect } from "react";
import { Cell, Player, Piece, Position, GameHistory, GRID_SIZE, AnimalType, GameStats, GameLogEntry } from "./types";
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
  const [gameStats, setGameStats] = useState<GameStats>({
    flipCount: {red: 0, blue: 0},
    captureCount: {red: 0, blue: 0},
    tradeCount: {red: 0, blue: 0},
    maxTigerStreak: {red: 0, blue: 0}
  });
  
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [undoCounts, setUndoCounts] = useState<{red: number, blue: number}>({red: 3, blue: 3});
  
  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameLog, setGameLog] = useState<string>("欢迎！翻牌开始游戏。");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [aiHasActed, setAiHasActed] = useState(false);
  const [specialAbilitiesEnabled, setSpecialAbilitiesEnabled] = useState<boolean | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLogEntry[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const [consecutiveNoCaptureTurns, setConsecutiveNoCaptureTurns] = useState(0);

  const addLogEntry = (player: Player, action: string, details?: string) => {
    const newEntry: GameLogEntry = {
      id: logIdCounter,
      turn: turnCount,
      player,
      action,
      details,
      timestamp: Date.now()
    };
    setGameLogs(prev => [...prev, newEntry]);
    setLogIdCounter(prev => prev + 1);
  };

  const saveHistory = () => {
    const snapshot: GameHistory = {
      board: JSON.parse(JSON.stringify(board)),
      turn,
      redHand: JSON.parse(JSON.stringify(redHand)),
      blueHand: JSON.parse(JSON.stringify(blueHand)),
      tigerStreak: {...tigerStreak},
      evoAvailable: {...evoAvailable},
      frozenUnits: frozenUnits ? {...frozenUnits} : null,
      noMoveCounts: {...noMoveCounts},
      aiHasActed
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
       if (prev.aiHasActed !== undefined) {
         setAiHasActed(prev.aiHasActed);
       }
       setHistory(prev => prev.slice(0, -1));
       setUndoCounts(c => ({...c, [turn]: c[turn] - 1}));
       setGameLog(`Undo successful! (${undoCounts[turn] - 1} left)`);
       setWinner(null);
    }
  };

  const handleStartGame = (enableSpecialAbilities: boolean = true) => {
    setSpecialAbilitiesEnabled(enableSpecialAbilities);
    setTurn(Math.random() > 0.5 ? "red" : "blue");
    setIsFirstTurn(true);
    setAiHasActed(false);
    setGameLog("首回合：必须翻牌。");
    setBoard(createBoard());
    setRedHand([]); setBlueHand([]);
    setTigerStreak({red:0, blue:0});
    setEvoAvailable({red: true, blue: true});
    setNoMoveCounts({red: 0, blue: 0});
    setConsecutiveNoCaptureTurns(0);
    setGameStats({
      flipCount: {red: 0, blue: 0},
      captureCount: {red: 0, blue: 0},
      tradeCount: {red: 0, blue: 0},
      maxTigerStreak: {red: 0, blue: 0}
    });
    setHistory([]);
    setUndoCounts({red:3, blue:3});
    setWinner(null);
    setIsDraw(false);
    setGameLogs([]);
    setTurnCount(0);
    setLogIdCounter(0);
  };

  const endTurnWrapper = (newBoard: Cell[][]) => {
    if (turn) {
      setTurnCount(prev => prev + 1);
    }
    
    if (!winner) {
      setConsecutiveNoCaptureTurns(prev => prev + 1);
    }
    
    endTurn(newBoard);
  };

  const checkWin = (rHand: Piece[], bHand: Piece[]) => {
    const redHasAllBlue = rHand.filter(p => (p.originalPlayer || p.player) === 'blue').length === 8;
    const blueHasAllRed = bHand.filter(p => (p.originalPlayer || p.player) === 'red').length === 8;

    if (redHasAllBlue) { 
      setWinner("red"); 
      updateStats("win"); 
      return true; 
    }
    if (blueHasAllRed) { 
      setWinner("blue"); 
      updateStats("loss"); 
      return true; 
    }
    return false;
  };

  const checkFinalShowdown = () => {
    const redPieces: Piece[] = [];
    const bluePieces: Piece[] = [];
    
    board.forEach(row => row.forEach(cell => {
      if (cell.revealed && cell.piece) {
        if (cell.piece.player === 'red') redPieces.push(cell.piece);
        else bluePieces.push(cell.piece);
      }
    }));

    if (redPieces.length === 1 && bluePieces.length === 1) {
      return { red: redPieces[0], blue: bluePieces[0] };
    }
    return null;
  };

  const settleFinalShowdown = (redPiece: Piece, bluePiece: Piece) => {
    const redRank = ANIMAL_RANKS[redPiece.type];
    const blueRank = ANIMAL_RANKS[bluePiece.type];
    
    let result: 'red' | 'blue' | 'draw' = 'draw';
    
    if (redPiece.type === 'rat' && bluePiece.type === 'elephant') {
      result = 'red';
    } else if (bluePiece.type === 'rat' && redPiece.type === 'elephant') {
      result = 'blue';
    } else if (redRank > blueRank) {
      result = 'red';
    } else if (blueRank > redRank) {
      result = 'blue';
    }
    
    if (result === 'red') {
      setWinner('red');
      updateStats('win');
      const logMsg = `双方各剩一张牌，连续3回合无行动，最终结算：红方${ANIMAL_CHARS[redPiece.type]}克制蓝方${ANIMAL_CHARS[bluePiece.type]}，红方获胜！`;
      addLogEntry('red', logMsg);
      setGameLog(logMsg);
    } else if (result === 'blue') {
      setWinner('blue');
      updateStats('loss');
      const logMsg = `双方各剩一张牌，连续3回合无行动，最终结算：蓝方${ANIMAL_CHARS[bluePiece.type]}克制红方${ANIMAL_CHARS[redPiece.type]}，蓝方获胜！`;
      addLogEntry('blue', logMsg);
      setGameLog(logMsg);
    } else {
      setIsDraw(true);
      const logMsg = `双方各剩一张牌，连续3回合无行动，最终结算：${ANIMAL_CHARS[redPiece.type]}与${ANIMAL_CHARS[bluePiece.type]}平局！`;
      addLogEntry('red', logMsg);
      setGameLog(logMsg);
    }
  };

  const capturePiece = (piece: Piece, capturerPlayer: Player, tempBoard: Cell[][]) => {
    const captured = { 
      ...piece, 
      originalPlayer: piece.player, 
      hasUsedAbility: false, 
      isImmune: false,
      type: piece.type === "bigTiger" ? "tiger" : piece.type 
    }; 
    
    if (piece.type === "tiger") {
       setEvoAvailable(prev => ({...prev, [piece.player]: false}));
    }

    if (specialAbilitiesEnabled && piece.type === "bigTiger") {
        const winner = piece.player === 'red' ? 'blue' : 'red';
        setWinner(winner);
        updateStats(winner === 'red' ? 'win' : 'loss');
        return; 
    }

    setGameStats(prev => ({
      ...prev,
      captureCount: {
        ...prev.captureCount,
        [capturerPlayer]: prev.captureCount[capturerPlayer] + 1
      }
    }));

    if (capturerPlayer === "red") {
        setRedHand(prev => {
            const newHand = [...prev, captured];
            setTimeout(() => checkWin(newHand, blueHand), 0);
            return newHand;
        });
    } else {
        setBlueHand(prev => {
            const newHand = [...prev, captured];
            setTimeout(() => checkWin(redHand, newHand), 0);
            return newHand;
        });
    }
    updateStats("capture");
  };

  const endTurn = (currentBoard: Cell[][]) => {
    if (frozenUnits?.player === turn) setFrozenUnits(null);
    if (!winner) {
      setTimeout(() => {
        setTurn(turn === "red" ? "blue" : "red");
      }, 500);
    }
  };
  
  useEffect(() => {
     if (!winner) checkWin(redHand, blueHand);
  }, [redHand, blueHand]);

  useEffect(() => {
    if (!winner && !isDraw && consecutiveNoCaptureTurns >= 3) {
      const showdown = checkFinalShowdown();
      if (showdown) {
        settleFinalShowdown(showdown.red, showdown.blue);
      }
    }
  }, [consecutiveNoCaptureTurns, winner, isDraw, board]);

  // Turn Validator (No Moves Check)
  useEffect(() => {
    if (turn && !winner) {
        const checkAvailableMoves = () => {
            const hasHidden = board.some(r => r.some(c => !c.revealed));
            if (hasHidden) return true;

            for (let y=0; y<GRID_SIZE; y++) {
                for (let x=0; x<GRID_SIZE; x++) {
                    const cell = board[y][x];
                    if (cell.revealed && cell.piece?.player === turn) {
                        const targets = getValidTargets({x,y}, cell.piece, board, frozenUnits, specialAbilitiesEnabled);
                        if (targets.length > 0) return true;
                    }
                }
            }
            return false;
        };

        if (!checkAvailableMoves()) {
            const currentHand = turn === 'red' ? redHand : blueHand;
            const enemyHand = turn === 'red' ? blueHand : redHand;
            const hasHidden = board.some(r => r.some(c => !c.revealed));
            const myBoardPieces = board.flat().filter(c => c.revealed && c.piece?.player === turn).length;
            
            if (!hasHidden && myBoardPieces === 0 && enemyHand.filter(p => (p.originalPlayer || p.player) === turn).length >= 8) {
                const win = turn === 'red' ? 'blue' : 'red';
                setWinner(win);
                updateStats(win === 'red' ? 'win' : 'loss');
                const logMsg = `${turn === 'red' ? '红方' : '蓝方'}认输`;
                addLogEntry(turn, logMsg);
                setGameLog(logMsg);
            } else {
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
    }
  }, [turn, board, redHand, blueHand, frozenUnits, specialAbilitiesEnabled]);


  const actionWrapper = (fn: () => void) => {
      setNoMoveCounts(prev => ({...prev, [turn!]: 0}));
      fn();
  };

  const executeFlip = (x: number, y: number) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        const cell = newBoard[y][x];
        
        // 验证：只能翻未翻开的牌
        if (cell.revealed) {
            return;
        }
        
        setConsecutiveNoCaptureTurns(0);
        
        cell.revealed = true;
        let logMsg = `翻开了 ${cell.piece ? ANIMAL_CHARS[cell.piece.type] : "空格"}`;
        let logDetails: string | undefined = undefined;
        
        // Record flip count
        setGameStats(prev => ({
          ...prev,
          flipCount: {
            ...prev.flipCount,
            [turn!]: prev.flipCount[turn!] + 1
          }
        }));
        
        if (specialAbilitiesEnabled && cell.piece?.type === "dog" && cell.piece.player === turn) {
          logDetails = "触发【警戒】特殊能力";
          const neighbors = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dx, dy] of neighbors) {
            const nx = x+dx, ny = y+dy;
            if (nx>=0 && nx<GRID_SIZE && ny>=0 && ny<GRID_SIZE && !newBoard[ny][nx].revealed) {
              newBoard[ny][nx].revealed = true;
              logDetails += `，额外翻开了 ${ANIMAL_CHARS[newBoard[ny][nx].piece!.type]}`;
              break;
            }
          }
        }
        if (specialAbilitiesEnabled && cell.piece?.type === "rat" && !cell.piece.hasUsedAbility) {
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
            logDetails = `触发【钻隙】特殊能力，伏击了 ${ANIMAL_CHARS[victim.type]}`;
            capturePiece(victim, cell.piece.player, newBoard);
            newBoard[target.pos.y][target.pos.x].piece = null;
          }
        }

        addLogEntry(turn!, logMsg, logDetails);
        setTigerStreak(prev => ({...prev, [turn!]: 0})); 
        setIsFirstTurn(false);
        setBoard(newBoard);
        setGameLog(logMsg);
        endTurnWrapper(newBoard);
    });
  };

  const executeMove = (from: Position, to: Position) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        const attacker = newBoard[from.y][from.x].piece!;
        const defender = newBoard[to.y][to.x].piece;
        
        // 验证：不能攻击自己的棋子
        if (defender && defender.player === attacker.player) {
            return;
        }
        
        const attRank = ANIMAL_RANKS[attacker.type];
        const defRank = defender ? ANIMAL_RANKS[defender.type] : 0;

        if (attacker.isImmune) attacker.isImmune = false;
        
        let streak = tigerStreak[attacker.player];
        const isTiger = attacker.type === "tiger";
        
        if (isTiger && evoAvailable[attacker.player]) {
            streak += 1;
            // Update max tiger streak
            setGameStats(prev => ({
              ...prev,
              maxTigerStreak: {
                ...prev.maxTigerStreak,
                [attacker.player]: Math.max(prev.maxTigerStreak[attacker.player], streak)
              }
            }));
        } else {
            streak = 0;
        }

        let logMsg: string;
        let logDetails: string | undefined = undefined;

        let hadCaptureOrTrade = false;
        
        if (defender) {
          const isTrade = (attRank === defRank) && !(attacker.type === "bigTiger" || defender.type === "bigTiger");
          let isWin = false;
          let isMutual = false;

          if (specialAbilitiesEnabled && defender.type === "cat" && !defender.hasUsedAbility) {
              const empties: Position[] = [];
              newBoard.forEach((r, ry) => r.forEach((c, rx) => { if (c.revealed && !c.piece) empties.push({x: rx, y: ry}) }));
              if (empties.length > 0) {
                const esc = empties[Math.floor(Math.random() * empties.length)];
                defender.hasUsedAbility = true;
                newBoard[esc.y][esc.x].piece = defender;
                logMsg = `${ANIMAL_CHARS[attacker.type]} 攻击了 ${ANIMAL_CHARS[defender.type]}`;
                logDetails = "触发【灵巧】特殊能力，猫瞬移逃脱了";
                newBoard[to.y][to.x].piece = attacker;
                newBoard[from.y][from.x].piece = null;
              } else {
                 isWin = true;
                 hadCaptureOrTrade = true;
              }
          } else if (attacker.type === "rat" && defender.type === "elephant") {
              isWin = true;
              hadCaptureOrTrade = true;
          } else if (attacker.type === "elephant" && defender.type === "bigTiger") {
              isWin = true;
              hadCaptureOrTrade = true;
          } else if (attRank === defRank) {
              isMutual = true;
              hadCaptureOrTrade = true;
          } else if (attRank > defRank) {
              isWin = true;
              hadCaptureOrTrade = true;
          }

          if (isMutual) {
              logMsg = `兑子！${ANIMAL_CHARS[attacker.type]} x ${ANIMAL_CHARS[defender.type]}`;
              
              setGameStats(prev => ({
                ...prev,
                tradeCount: {
                  ...prev.tradeCount,
                  [attacker.player]: prev.tradeCount[attacker.player] + 1
                }
              }));
              
              if (attacker.type === "tiger") setEvoAvailable(prev => ({...prev, [attacker.player]: false}));
              if (defender.type === "tiger") setEvoAvailable(prev => ({...prev, [defender.player]: false}));

              capturePiece(defender, attacker.player, newBoard); 
              capturePiece(attacker, attacker.player, newBoard);
              
              newBoard[to.y][to.x].piece = null;
              newBoard[from.y][from.x].piece = null;
              if (isTiger) streak = 0;

          } else if (isWin) {
              logMsg = `${ANIMAL_CHARS[attacker.type]} 吃掉了 ${ANIMAL_CHARS[defender.type]}`;
              capturePiece(defender, attacker.player, newBoard);
              if (specialAbilitiesEnabled && attacker.type === "lion") {
                setFrozenUnits({ player: defender.player, types: ["cat", "rat"] });
                logDetails = "触发【百兽统领】特殊能力，敌方猫、鼠被冻结";
              }
              newBoard[to.y][to.x].piece = attacker;
              newBoard[from.y][from.x].piece = null;
          }
        } else {
           logMsg = `移动了 ${ANIMAL_CHARS[attacker.type]}`;
           newBoard[to.y][to.x].piece = attacker;
           newBoard[from.y][from.x].piece = null;
        }
        
        if (hadCaptureOrTrade) {
          setConsecutiveNoCaptureTurns(0);
        }

        const pieceOnTarget = newBoard[to.y][to.x].piece;
        if (isTiger && streak >= 10 && pieceOnTarget && pieceOnTarget.id === attacker.id) {
          if (specialAbilitiesEnabled && evoAvailable[attacker.player]) {
              pieceOnTarget.type = "bigTiger";
              logDetails = (logDetails ? logDetails + "，" : "") + "触发【进化潜能】，虎进化为大虎";
              setGameLog(logMsg + "（虎进化！👑）");
              updateStats("evo");
              streak = 0;
              setEvoAvailable(prev => ({...prev, [attacker.player]: false}));
          }
        } else {
          setGameLog(logMsg);
        }
        
        addLogEntry(attacker.player, logMsg, logDetails);
        setTigerStreak(prev => ({...prev, [attacker.player]: streak}));
        setBoard(newBoard);
        endTurnWrapper(newBoard);
    });
  };

  const executeWolfWait = (pos: Position) => {
    actionWrapper(() => {
        let newBoard = board.map(row => row.map(c => ({...c})));
        const wolf = newBoard[pos.y][pos.x].piece!;
        if (specialAbilitiesEnabled) {
            wolf.isImmune = true;
            const logMsg = "使用【疾行】原地停留";
            const logDetails = "触发【疾行】特殊能力，本回合免疫被吃/兑掉";
            addLogEntry(turn!, logMsg, logDetails);
            setGameLog(logMsg);
        } else {
            const logMsg = "原地停留";
            addLogEntry(turn!, logMsg);
            setGameLog(logMsg);
        }
        setTigerStreak(prev => ({...prev, [turn!]: 0}));
        setBoard(newBoard);
        endTurnWrapper(newBoard);
    });
  };

  // AI Trigger
  useEffect(() => {
    // 当回合切换到红色时，重置 AI 已行动状态
    if (turn === "red") {
      setAiHasActed(false);
    }
    
    if (turn === "blue" && !winner && !aiHasActed) {
      const timer = setTimeout(() => {
        setIsAiThinking(true);
        try {
            const action = computeAiMove(
                board, 
                blueHand, 
                redHand, 
                frozenUnits, 
                tigerStreak.blue, 
                evoAvailable.blue, 
                isFirstTurn,
                specialAbilitiesEnabled
            );

            if (action.type === 'surrender') {
                setAiHasActed(true);
                const logMsg = "蓝方认输";
                addLogEntry("blue", logMsg);
                setWinner("red");
                updateStats("win");
                setGameLog(logMsg);
                setIsAiThinking(false);
                return;
            }
            
            if (action.type !== 'wait') {
                setAiHasActed(true);
                saveHistory();
                let newBoard = board.map(row => row.map(c => ({...c})));
                let logMsg: string;
                let logDetails: string | undefined = undefined;

                if (action.type === 'flip') {
                    const cell = newBoard[action.y][action.x];
                    
                    // 验证：只能翻未翻开的牌
                    if (cell.revealed) {
                        logMsg = "跳过无效翻牌";
                        addLogEntry("blue", logMsg);
                        if (frozenUnits?.player === "blue") setFrozenUnits(null);
                        if (!winner) {
                          setTimeout(() => {
                            setTurnCount(prev => prev + 1);
                            setTurn("red");
                          }, 500);
                        }
                    } else {
                        setConsecutiveNoCaptureTurns(0);
                        cell.revealed = true;
                        logMsg = `翻开了 ${cell.piece ? ANIMAL_CHARS[cell.piece.type] : "空格"}`;
                    
                        // Record flip count
                        setGameStats(prev => ({
                          ...prev,
                          flipCount: { ...prev.flipCount, blue: prev.flipCount.blue + 1 }
                        }));
                        
                        if (specialAbilitiesEnabled && cell.piece?.type === "dog" && cell.piece.player === "blue") {
                          logDetails = "触发【警戒】特殊能力";
                          const neighbors = [[0,1], [0,-1], [1,0], [-1,0]];
                          for (const [dx, dy] of neighbors) {
                            const nx = action.x+dx, ny = action.y+dy;
                            if (nx>=0 && nx<GRID_SIZE && ny>=0 && ny<GRID_SIZE && !newBoard[ny][nx].revealed) {
                              newBoard[ny][nx].revealed = true;
                              logDetails += `，额外翻开了 ${ANIMAL_CHARS[newBoard[ny][nx].piece!.type]}`;
                              break;
                            }
                          }
                        }
                        if (specialAbilitiesEnabled && cell.piece?.type === "rat" && !cell.piece.hasUsedAbility) {
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
                            logDetails = `触发【钻隙】特殊能力，伏击了 ${ANIMAL_CHARS[victim.type]}`;
                            capturePiece(victim, cell.piece.player, newBoard);
                            newBoard[target.pos.y][target.pos.x].piece = null;
                          }
                        }

                        addLogEntry("blue", logMsg, logDetails);
                        setTigerStreak(prev => ({...prev, blue: 0})); 
                        setIsFirstTurn(false);
                        setBoard(newBoard);
                        setGameLog(`AI ${logMsg}`);
                        if (frozenUnits?.player === "blue") setFrozenUnits(null);
                        if (!winner) {
                          setTimeout(() => {
                            setTurnCount(prev => prev + 1);
                            setTurn("red");
                          }, 500);
                        }
                    }
                }
                else if (action.type === 'move') {
                    const from = action.from, to = action.to;
                    const attacker = newBoard[from.y][from.x].piece!;
                    const defender = newBoard[to.y][to.x].piece;
                    
                    // Safety check: Don't attack own pieces
                    if (defender && defender.player === attacker.player) {
                        logMsg = "跳过无效移动";
                        addLogEntry("blue", logMsg);
                        if (frozenUnits?.player === "blue") setFrozenUnits(null);
                        if (!winner) {
                          setTimeout(() => {
                            setTurnCount(prev => prev + 1);
                            setTurn("red");
                          }, 500);
                        }
                    } else {
                        const attRank = ANIMAL_RANKS[attacker.type];
                        const defRank = defender ? ANIMAL_RANKS[defender.type] : 0;

                        if (attacker.isImmune) attacker.isImmune = false;
                        
                        let streak = tigerStreak.blue;
                        const isTiger = attacker.type === "tiger";
                        
                        if (isTiger && evoAvailable.blue) {
                            streak += 1;
                            setGameStats(prev => ({
                              ...prev,
                              maxTigerStreak: {
                                ...prev.maxTigerStreak,
                                blue: Math.max(prev.maxTigerStreak.blue, streak)
                              }
                            }));
                        } else {
                            streak = 0;
                        }

                        let hadCaptureOrTrade = false;

                        if (defender) {
                          const isTrade = (attRank === defRank) && !(attacker.type === "bigTiger" || defender.type === "bigTiger");
                          let isWin = false;
                          let isMutual = false;

                          if (specialAbilitiesEnabled && defender.type === "cat" && !defender.hasUsedAbility) {
                              const empties: Position[] = [];
                              newBoard.forEach((r, ry) => r.forEach((c, rx) => { if (c.revealed && !c.piece) empties.push({x: rx, y: ry}) }));
                              if (empties.length > 0) {
                                const esc = empties[Math.floor(Math.random() * empties.length)];
                                defender.hasUsedAbility = true;
                                newBoard[esc.y][esc.x].piece = defender;
                                logMsg = `${ANIMAL_CHARS[attacker.type]} 攻击了 ${ANIMAL_CHARS[defender.type]}`;
                                logDetails = "触发【灵巧】特殊能力，猫瞬移逃脱了";
                                newBoard[to.y][to.x].piece = attacker;
                                newBoard[from.y][from.x].piece = null;
                              } else {
                                 isWin = true;
                                 hadCaptureOrTrade = true;
                              }
                          } else if (attacker.type === "rat" && defender.type === "elephant") {
                              isWin = true;
                              hadCaptureOrTrade = true;
                          } else if (attacker.type === "elephant" && defender.type === "bigTiger") {
                              isWin = true;
                              hadCaptureOrTrade = true;
                          } else if (attRank === defRank) {
                              isMutual = true;
                              hadCaptureOrTrade = true;
                          } else if (attRank > defRank) {
                              isWin = true;
                              hadCaptureOrTrade = true;
                          }

                          if (isMutual) {
                              logMsg = `兑子！${ANIMAL_CHARS[attacker.type]} x ${ANIMAL_CHARS[defender.type]}`;
                              
                              // Record trade count
                              setGameStats(prev => ({
                                ...prev,
                                tradeCount: { ...prev.tradeCount, blue: prev.tradeCount.blue + 1 }
                              }));
                              
                              if (attacker.type === "tiger") setEvoAvailable(prev => ({...prev, blue: false}));
                              if (defender.type === "tiger") setEvoAvailable(prev => ({...prev, red: false}));

                              capturePiece(defender, "blue", newBoard); 
                              capturePiece(attacker, "blue", newBoard);
                              
                              newBoard[to.y][to.x].piece = null;
                              newBoard[from.y][from.x].piece = null;
                              if (isTiger) streak = 0;

                          } else if (isWin) {
                              logMsg = `${ANIMAL_CHARS[attacker.type]} 吃掉了 ${ANIMAL_CHARS[defender.type]}`;
                              capturePiece(defender, "blue", newBoard);
                              if (specialAbilitiesEnabled && attacker.type === "lion") {
                                setFrozenUnits({ player: "red", types: ["cat", "rat"] });
                                logDetails = "触发【百兽统领】特殊能力，敌方猫、鼠被冻结";
                              }
                              newBoard[to.y][to.x].piece = attacker;
                              newBoard[from.y][from.x].piece = null;
                          }
                        } else {
                           logMsg = `移动了 ${ANIMAL_CHARS[attacker.type]}`;
                           newBoard[to.y][to.x].piece = attacker;
                           newBoard[from.y][from.x].piece = null;
                        }

                        if (hadCaptureOrTrade) {
                          setConsecutiveNoCaptureTurns(0);
                        }

                        const pieceOnTarget = newBoard[to.y][to.x].piece;
                        if (isTiger && streak >= 10 && pieceOnTarget && pieceOnTarget.id === attacker.id) {
                          if (specialAbilitiesEnabled && evoAvailable.blue) {
                              pieceOnTarget.type = "bigTiger";
                              logDetails = (logDetails ? logDetails + "，" : "") + "触发【进化潜能】，虎进化为大虎";
                              setGameLog(`AI ${logMsg}（虎进化！👑）`);
                              updateStats("evo");
                              streak = 0;
                              setEvoAvailable(prev => ({...prev, blue: false}));
                          }
                        } else {
                          setGameLog(`AI ${logMsg}`);
                        }
                        
                        addLogEntry("blue", logMsg, logDetails);
                        setTigerStreak(prev => ({...prev, blue: streak}));
                        setBoard(newBoard);
                        if (frozenUnits?.player === "blue") setFrozenUnits(null);
                        if (!winner) {
                          setTimeout(() => {
                            setTurnCount(prev => prev + 1);
                            setTurn("red");
                          }, 500);
                        }
                    }
                }
            }
        } finally {
            setIsAiThinking(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, winner, board, blueHand, redHand, frozenUnits, tigerStreak, evoAvailable, isFirstTurn, aiHasActed, specialAbilitiesEnabled]);

  return {
    board, turn, redHand, blueHand, tigerStreak, frozenUnits,
    history, undoCounts, winner, isDraw, gameLog, isAiThinking, isFirstTurn, gameStats,
    specialAbilitiesEnabled, gameLogs,
    actions: { saveHistory, handleUndo, handleStartGame, executeFlip, executeMove, executeWolfWait, addLogEntry }
  };
};
