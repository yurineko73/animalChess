import React from "react";
import { Player, Piece } from "./types";
import { ANIMAL_EMOJIS } from "./constants";
import { ProgressBar } from "./components";

export const TopBar = ({ 
  turn, 
  gameLog, 
  redHand, 
  blueHand, 
  tigerStreak 
}: { 
  turn: Player | null, 
  gameLog: string, 
  redHand: Piece[], 
  blueHand: Piece[], 
  tigerStreak: {red: number, blue: number} 
}) => (
  <div className="flex justify-between items-start bg-white p-3 shadow-sm border-b z-20">
    <div className="w-1/3 flex flex-col items-start">
       <div className="flex items-center gap-1 mb-1">
         <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">🤖</div>
         <span className="text-xs font-bold text-blue-700">BLUE</span>
       </div>
       <ProgressBar value={tigerStreak.blue} max={10} color="bg-blue-500" label="Tiger Evo" />
       <div className="flex gap-0.5 mt-1 flex-wrap h-8 content-start">
          {blueHand.map((p, i) => <div key={i} className="text-xs bg-blue-50 border border-blue-200 rounded px-1">{ANIMAL_EMOJIS[p.type]}</div>)}
       </div>
    </div>
    
    <div className="w-1/3 flex flex-col items-center">
       <div className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${turn === 'blue' ? 'bg-blue-600 text-white' : turn === 'red' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {turn === 'blue' ? 'AI TURN' : turn === 'red' ? 'YOUR TURN' : 'READY'}
       </div>
       <div className="text-[10px] text-center text-slate-500 leading-tight h-8 overflow-hidden">{gameLog}</div>
    </div>

    <div className="w-1/3 flex flex-col items-end">
       <div className="flex items-center gap-1 mb-1">
         <span className="text-xs font-bold text-red-700">RED</span>
         <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">👤</div>
       </div>
       <ProgressBar value={tigerStreak.red} max={10} color="bg-red-500" label="Tiger Evo" />
       <div className="flex gap-0.5 mt-1 flex-wrap h-8 content-start justify-end">
          {redHand.map((p, i) => <div key={i} className="text-xs bg-red-50 border border-red-200 rounded px-1">{ANIMAL_EMOJIS[p.type]}</div>)}
       </div>
    </div>
  </div>
);

export const BottomBar = ({ 
  turn, 
  dropMode, 
  redHand, 
  undoCount, 
  selectedDropIdx,
  onToggleRules, 
  onToggleDex, 
  onUndo, 
  onToggleDrop, 
  onSelectDropPiece
}: {
  turn: Player | null;
  dropMode: boolean;
  redHand: Piece[];
  undoCount: number;
  selectedDropIdx: number | null;
  onToggleRules: () => void;
  onToggleDex: () => void;
  onUndo: () => void;
  onToggleDrop: () => void;
  onSelectDropPiece: (idx: number) => void;
}) => (
  <div className="bg-white p-3 border-t flex flex-col gap-2 shadow-lg z-20">
    {dropMode && (
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 mb-2">
          {redHand.length === 0 && <span className="text-xs text-slate-400">Empty Hand</span>}
          {redHand.map((p, i) => (
          <button key={i} onClick={() => onSelectDropPiece(i)} 
              className={`min-w-[40px] h-10 border rounded flex items-center justify-center text-xl bg-white
              ${selectedDropIdx === i ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-300'}`}>
              {ANIMAL_EMOJIS[p.type]}
          </button>
          ))}
      </div>
    )}
    
    <div className="flex justify-between items-center">
      <button onClick={onToggleRules} className="text-[10px] text-slate-500 flex flex-col items-center gap-1 w-12">
          <span className="text-lg">📜</span> Rules
      </button>
      <button onClick={onToggleDex} className="text-[10px] text-slate-500 flex flex-col items-center gap-1 w-12">
          <span className="text-lg">📖</span> Dex
      </button>

      <div className="flex gap-2">
          <button 
              onClick={onUndo} 
              disabled={turn !== 'red' || undoCount <= 0}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1
              ${turn === 'red' && undoCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
              <span>↩️</span> Undo ({undoCount})
          </button>

          <button 
              onClick={onToggleDrop} 
              disabled={turn !== 'red' || redHand.length === 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2
              ${dropMode ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <span>📥</span> Drop
          </button>
      </div>
    </div>
  </div>
);
