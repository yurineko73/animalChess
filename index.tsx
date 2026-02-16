import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useGame } from "./useGame";
import { Position } from "./types";
import { getValidTargets } from "./rules";
import { getTutorialStatus, setTutorialDone } from "./storage";
import { BoardCell } from "./BoardCell";
import { TopBar, BottomBar } from "./HUD";
import { TutorialOverlay, RulesModal, DexModal, StatsModal, WinnerScreen } from "./Overlays";

const App = () => {
  const {
    board, turn, redHand, blueHand, tigerStreak, frozenUnits,
    undoCounts, winner, gameLog, isAiThinking, isFirstTurn,
    actions
  } = useGame();

  // UI Local State
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [dropMode, setDropMode] = useState(false);
  const [selectedDropIdx, setSelectedDropIdx] = useState<number | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  
  // Modal State
  const [showRules, setShowRules] = useState(false);
  const [showDex, setShowDex] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!getTutorialStatus()) {
      setTutorialStep(1);
    }
  }, []);

  const handleCellClick = (x: number, y: number) => {
    if (!turn || winner || isAiThinking) return;
    if (turn === "blue") return;

    const cell = board[y][x];

    if (dropMode && selectedDropIdx !== null) {
      if (cell.revealed && !cell.piece) {
        actions.saveHistory();
        actions.executeDrop("red", selectedDropIdx, {x, y});
        setDropMode(false);
        setSelectedDropIdx(null);
      }
      return;
    }

    if (!cell.revealed) {
      actions.saveHistory();
      actions.executeFlip(x, y);
      return;
    }

    if (isFirstTurn) return;

    if (cell.piece && cell.piece.player === turn) {
      setSelectedPos({x, y});
      setDropMode(false);
      return;
    }

    if (selectedPos) {
      const startCell = board[selectedPos.y][selectedPos.x];
      if (selectedPos.x === x && selectedPos.y === y && startCell.piece?.type === "wolf") {
         actions.saveHistory();
         actions.executeWolfWait(selectedPos);
         setSelectedPos(null);
         return;
      }
      
      const validMoves = getValidTargets(selectedPos, startCell.piece!, board, frozenUnits);
      if (validMoves.some(p => p.x === x && p.y === y)) {
        actions.saveHistory();
        actions.executeMove(selectedPos, {x, y});
        setSelectedPos(null);
      } else {
        setSelectedPos(null);
      }
    }
  };

  const getCellHighlight = (x: number, y: number) => {
    const cell = board[y][x];
    if (dropMode && cell.revealed && !cell.piece) return "highlight-drop cursor-pointer";
    if (!selectedPos) return "";
    
    const start = board[selectedPos.y][selectedPos.x];
    if (!start.piece) return "";
    
    // Check self (Wolf Wait)
    if (start.piece.type === "wolf" && x === selectedPos.x && y === selectedPos.y) return "ring-4 ring-blue-300";

    const valid = getValidTargets(selectedPos, start.piece, board, frozenUnits);
    if (valid.some(v => v.x === x && v.y === y)) {
       return cell.piece ? "highlight-capture" : "highlight-move";
    }
    return "";
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f0f4f8] max-w-md mx-auto relative select-none">
       <TopBar 
         turn={turn} 
         gameLog={gameLog} 
         redHand={redHand} 
         blueHand={blueHand} 
         tigerStreak={tigerStreak} 
       />

       <div className="flex-1 flex flex-col items-center justify-center p-4">
         {!turn && (
            <div className="flex flex-col gap-4">
                <button onClick={actions.handleStartGame} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-xl shadow-lg animate-bounce">
                  Start Game
                </button>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setShowStats(true)} className="text-sm text-slate-600 underline">Stats</button>
                    <button onClick={() => setTutorialStep(1)} className="text-sm text-slate-600 underline">Tutorial</button>
                </div>
            </div>
         )}
         {turn && (
           <div className="grid grid-cols-4 gap-3 w-full aspect-square max-w-[360px]">
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
            dropMode={dropMode}
            redHand={redHand}
            undoCount={undoCounts.red}
            selectedDropIdx={selectedDropIdx}
            onToggleRules={() => setShowRules(true)}
            onToggleDex={() => setShowDex(true)}
            onUndo={actions.handleUndo}
            onToggleDrop={() => { setDropMode(!dropMode); setSelectedDropIdx(null); }}
            onSelectDropPiece={setSelectedDropIdx}
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
       {winner && <WinnerScreen winner={winner} />}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
