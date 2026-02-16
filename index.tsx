import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useGame } from "./useGame";
import { Position } from "./types";
import { getValidTargets } from "./rules";
import { getTutorialStatus, setTutorialDone } from "./storage";
import { BoardCell } from "./BoardCell";
import { TopBar, BottomBar } from "./HUD";
import { TutorialOverlay, RulesModal, DexModal, StatsModal, WinnerScreen } from "./Overlays";
import { GameLogModal } from "./GameLogModal";

const App = () => {
  const {
    board, turn, redHand, blueHand, tigerStreak, frozenUnits,
    undoCounts, winner, isDraw, gameLog, isAiThinking, isFirstTurn, gameStats,
    specialAbilitiesEnabled, gameLogs,
    actions
  } = useGame();

  // UI Local State
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal State
  const [showRules, setShowRules] = useState(false);
  const [showDex, setShowDex] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showGameLog, setShowGameLog] = useState(false);

  const handleSurrender = () => {
    if (turn) {
      const winningPlayer = turn === 'red' ? 'blue' : 'red';
      // We'll manually set winner since useGame doesn't have surrender action
      window.location.reload();
    }
  };

  const getSelectedPiece = () => {
    if (!selectedPos) return null;
    const cell = board[selectedPos.y][selectedPos.x];
    return cell.piece || null;
  };

  useEffect(() => {
    if (!getTutorialStatus()) {
      setTutorialStep(1);
    }
  }, []);

  const handleCellClick = (x: number, y: number) => {
    if (!turn || winner || isDraw || isAiThinking || isProcessing) return;
    if (turn === "blue") return;

    const cell = board[y][x];

    if (!cell.revealed) {
      setIsProcessing(true);
      actions.saveHistory();
      actions.executeFlip(x, y);
      setTimeout(() => setIsProcessing(false), 600);
      return;
    }

    if (isFirstTurn) return;

    if (cell.piece && cell.piece.player === turn) {
      setSelectedPos({x, y});
      return;
    }

    if (selectedPos) {
      const startCell = board[selectedPos.y][selectedPos.x];
      if (selectedPos.x === x && selectedPos.y === y && startCell.piece?.type === "wolf") {
         setIsProcessing(true);
         actions.saveHistory();
         actions.executeWolfWait(selectedPos);
         setSelectedPos(null);
         setTimeout(() => setIsProcessing(false), 600);
         return;
      }
      
      const validMoves = getValidTargets(selectedPos, startCell.piece!, board, frozenUnits, specialAbilitiesEnabled);
      if (validMoves.some(p => p.x === x && p.y === y)) {
        setIsProcessing(true);
        actions.saveHistory();
        actions.executeMove(selectedPos, {x, y});
        setSelectedPos(null);
        setTimeout(() => setIsProcessing(false), 600);
      } else {
        setSelectedPos(null);
      }
    }
  };

  const getCellHighlight = (x: number, y: number) => {
    const cell = board[y][x];
    if (!selectedPos) return "";
    
    const start = board[selectedPos.y][selectedPos.x];
    if (!start.piece) return "";
    
    // Check self (Wolf Wait)
    if (start.piece.type === "wolf" && x === selectedPos.x && y === selectedPos.y) return "ring-4 ring-blue-300";

    const valid = getValidTargets(selectedPos, start.piece, board, frozenUnits, specialAbilitiesEnabled);
    if (valid.some(v => v.x === x && v.y === y)) {
       return cell.piece ? "highlight-capture" : "highlight-move";
    }
    return "";
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-slate-100 to-slate-200 max-w-md mx-auto relative select-none">
       <TopBar 
         turn={turn} 
         gameLog={gameLog} 
         redHand={redHand} 
         blueHand={blueHand} 
         tigerStreak={tigerStreak}
         onSurrender={handleSurrender}
       />

       <div className="flex-1 flex flex-col items-center justify-center p-4">
         {!turn && (
            <div className="flex flex-col gap-4">
                {specialAbilitiesEnabled === null ? (
                    <>
                        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">选择游戏模式</h2>
                        <button onClick={() => actions.handleStartGame(true)} className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105">
                          ✨ 开启特殊能力
                        </button>
                        <button onClick={() => actions.handleStartGame(false)} className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:from-slate-600 hover:to-slate-700 transition-all transform hover:scale-105">
                          🎲 经典模式（无特殊能力）
                        </button>
                        <div className="flex gap-4 justify-center pt-2">
                            <button onClick={() => setShowStats(true)} className="text-sm text-slate-600 underline hover:text-slate-800">战绩</button>
                            <button onClick={() => setTutorialStep(1)} className="text-sm text-slate-600 underline hover:text-slate-800">教程</button>
                        </div>
                    </>
                ) : (
                    <>
                        <button onClick={actions.handleStartGame} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105">
                          🎮 开始游戏
                        </button>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowStats(true)} className="text-sm text-slate-600 underline hover:text-slate-800">战绩</button>
                            <button onClick={() => setTutorialStep(1)} className="text-sm text-slate-600 underline hover:text-slate-800">教程</button>
                        </div>
                    </>
                )}
            </div>
         )}
         {turn && (
           <div className="grid grid-cols-4 gap-2 w-full aspect-square max-w-[360px] bg-slate-300 p-2 rounded-2xl shadow-xl">
              {board.map((row, y) => row.map((cell, x) => (
                <BoardCell 
                   key={`${x}-${y}`} 
                   cell={cell} x={x} y={y} 
                   isSelected={selectedPos?.x === x && selectedPos?.y === y}
                   highlightClass={getCellHighlight(x, y)}
                   tigerStreak={cell.piece?.type === 'tiger' ? tigerStreak[cell.piece.player] : undefined}
                   turn={turn}
                   onClick={handleCellClick}
                />
              )))}
           </div>
         )}
       </div>

       {turn && (
         <BottomBar 
            turn={turn}
            undoCount={undoCounts.red}
            selectedPiece={getSelectedPiece()}
            onToggleRules={() => setShowRules(true)}
            onToggleDex={() => setShowDex(true)}
            onUndo={actions.handleUndo}
            onToggleLog={() => setShowGameLog(true)}
         />
       )}

       {/* Overlays */}
       {tutorialStep > 0 && <TutorialOverlay step={tutorialStep} onNext={() => {
           if (tutorialStep < 5) setTutorialStep(s => s + 1);
           else { setTutorialStep(0); setTutorialDone(); }
       }} />}
       
       {showRules && <RulesModal onClose={() => setShowRules(false)} />}
       {showDex && <DexModal onClose={() => setShowDex(false)} />}
       {showStats && <StatsModal onClose={() => setShowStats(false)} />}
       {(winner || isDraw) && <WinnerScreen winner={isDraw ? null : winner} gameStats={gameStats} redHand={redHand} blueHand={blueHand} />}
       {showGameLog && <GameLogModal isOpen={showGameLog} onClose={() => setShowGameLog(false)} logs={gameLogs} />}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
