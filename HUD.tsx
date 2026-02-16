import React from "react";
import { Player, Piece } from "./types";
import { ANIMAL_EMOJIS, ANIMAL_CHARS } from "./constants";
import { ProgressBar } from "./components";

export const TopBar = ({ 
  turn, 
  gameLog, 
  redHand, 
  blueHand, 
  tigerStreak,
  onSurrender
}: { 
  turn: Player | null, 
  gameLog: string, 
  redHand: Piece[], 
  blueHand: Piece[], 
  tigerStreak: {red: number, blue: number},
  onSurrender: () => void
}) => (
  <div className="flex justify-between items-start bg-gradient-to-b from-slate-50 to-white p-3 shadow-md border-b border-slate-200 z-20">
    <div className="w-1/3 flex flex-col items-start">
       <div className="flex items-center gap-2 mb-2">
         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-base shadow-sm">🤖</div>
         <div className="flex flex-col">
           <span className="text-sm font-bold text-blue-800">蓝方</span>
           <span className="text-[10px] text-blue-500">收牌: {blueHand.filter(p => (p.originalPlayer || p.player) === 'red').length}/8</span>
         </div>
       </div>
       <ProgressBar value={tigerStreak.blue} max={10} color="bg-blue-500" label="虎进化" />
       <div className="flex gap-1 mt-2 flex-wrap min-h-[28px] content-start">
          {blueHand.filter(p => (p.originalPlayer || p.player) === 'red').slice(0, 8).map((p, i) => (
            <div key={i} className="text-lg bg-red-50 border border-red-300 rounded-md px-1.5 py-0.5 shadow-sm" title={`红方${ANIMAL_CHARS[p.type]}`}>
              {ANIMAL_EMOJIS[p.type]}
            </div>
          ))}
          {blueHand.filter(p => (p.originalPlayer || p.player) === 'red').length > 8 && (
            <div className="text-xs bg-slate-100 rounded px-1 flex items-center">+{blueHand.filter(p => (p.originalPlayer || p.player) === 'red').length - 8}</div>
          )}
       </div>
    </div>
    
    <div className="w-1/3 flex flex-col items-center">
       <div className={`px-4 py-1.5 rounded-full text-xs font-bold mb-2 shadow-sm ${
         turn === 'blue' 
           ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-pulse' 
           : turn === 'red' 
             ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
             : 'bg-slate-200 text-slate-500'
       }`}>
          {turn === 'blue' ? '🔵 蓝方行动' : turn === 'red' ? '🔴 红方行动' : '准备开始'}
       </div>
       <div className="text-xs text-center text-slate-600 leading-tight h-10 overflow-hidden flex items-center">
         {gameLog}
       </div>
       {turn && (
         <button 
           onClick={onSurrender}
           className="mt-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
         >
           认输
         </button>
       )}
    </div>

    <div className="w-1/3 flex flex-col items-end">
       <div className="flex items-center gap-2 mb-2">
         <div className="flex flex-col items-end">
           <span className="text-sm font-bold text-red-800">红方</span>
           <span className="text-[10px] text-red-500">收牌: {redHand.filter(p => (p.originalPlayer || p.player) === 'blue').length}/8</span>
         </div>
         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-base shadow-sm">👤</div>
       </div>
       <ProgressBar value={tigerStreak.red} max={10} color="bg-red-500" label="虎进化" />
       <div className="flex gap-1 mt-2 flex-wrap min-h-[28px] content-start justify-end">
          {redHand.filter(p => (p.originalPlayer || p.player) === 'blue').slice(0, 8).map((p, i) => (
            <div key={i} className="text-lg bg-blue-50 border border-blue-300 rounded-md px-1.5 py-0.5 shadow-sm" title={`蓝方${ANIMAL_CHARS[p.type]}`}>
              {ANIMAL_EMOJIS[p.type]}
            </div>
          ))}
          {redHand.filter(p => (p.originalPlayer || p.player) === 'blue').length > 8 && (
            <div className="text-xs bg-slate-100 rounded px-1 flex items-center">+{redHand.filter(p => (p.originalPlayer || p.player) === 'blue').length - 8}</div>
          )}
       </div>
    </div>
  </div>
);

export const BottomBar = ({ 
  turn, 
  undoCount, 
  selectedPiece,
  onToggleRules, 
  onToggleDex, 
  onUndo,
  onToggleLog
}: {
  turn: Player | null;
  undoCount: number;
  selectedPiece: Piece | null;
  onToggleRules: () => void;
  onToggleDex: () => void;
  onUndo: () => void;
  onToggleLog: () => void;
}) => (
  <div className="bg-gradient-to-t from-slate-50 to-white p-3 border-t border-slate-200 flex flex-col gap-2 shadow-lg z-20">
    {selectedPiece && (
      <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`text-3xl ${selectedPiece.player === 'red' ? 'bg-red-100' : 'bg-blue-100'} rounded-lg p-2`}>
            {ANIMAL_EMOJIS[selectedPiece.type]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-slate-800">
              {selectedPiece.player === 'red' ? '红方' : '蓝方'} · {ANIMAL_CHARS[selectedPiece.type]}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {selectedPiece.type === 'elephant' && '巨兽威慑：不可被豹跨格吃子，仅可被相邻的鼠吃或同类兑掉'}
              {selectedPiece.type === 'lion' && '百兽统领：吃子后，本回合敌方所有猫、鼠不可移动'}
              {selectedPiece.type === 'tiger' && '进化潜能：连续合法走牌满10步，进化为大虎'}
              {selectedPiece.type === 'bigTiger' && '猛虎突进：1. 可跨1枚敌方棋子移动，跨棋后可吃子；2. 无视豹的跨格吃子限制'}
              {selectedPiece.type === 'leopard' && '飞跨吃子：可沿横竖直线跨1个空格移动，跨格后可吃子/兑子（不可跨象）'}
              {selectedPiece.type === 'wolf' && '疾行：走牌时可选择原地停留，本回合免疫被吃/兑掉'}
              {selectedPiece.type === 'dog' && '警戒：翻牌翻开己方狗时，可额外翻开1张相邻暗牌'}
              {selectedPiece.type === 'cat' && '灵巧：被吃子时，有1次机会瞬移至棋盘任意空格，免疫本次吃子'}
              {selectedPiece.type === 'rat' && '钻隙：1. 可移动至任意1个棋盘空格（无距离限制）；2. 暗牌被翻开时，可直接吃掉翻牌方1枚任意明牌（本局仅1次）'}
            </div>
          </div>
        </div>
      </div>
    )}
    
    <div className="flex justify-between items-center">
      <button onClick={onToggleRules} className="text-[11px] text-slate-600 flex flex-col items-center gap-1 w-14 hover:text-slate-800 transition-colors">
          <span className="text-xl">📜</span> 规则
      </button>
      <button onClick={onToggleDex} className="text-[11px] text-slate-600 flex flex-col items-center gap-1 w-14 hover:text-slate-800 transition-colors">
          <span className="text-xl">📖</span> 图鉴
      </button>
      <button onClick={onToggleLog} className="text-[11px] text-slate-600 flex flex-col items-center gap-1 w-14 hover:text-slate-800 transition-colors">
          <span className="text-xl">📝</span> 日志
      </button>

      <div className="flex gap-2">
          <button 
              onClick={onUndo} 
              disabled={turn !== 'red' || undoCount <= 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm
              ${turn === 'red' && undoCount > 0 
                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <span>↩️</span> 悔棋 ({undoCount})
          </button>
      </div>
    </div>
  </div>
);
