import React from "react";
import { Cell } from "./types";
import { ANIMAL_EMOJIS, ANIMAL_CHARS } from "./constants";

interface BoardCellProps {
  cell: Cell;
  x: number;
  y: number;
  isSelected: boolean;
  highlightClass: string;
  tigerStreak?: number;
  turn: string | null;
  onClick: (x: number, y: number) => void;
}

export const BoardCell: React.FC<BoardCellProps> = ({ 
  cell, x, y, isSelected, highlightClass, tigerStreak, turn, onClick 
}) => {
  return (
    <div className="relative w-full aspect-square perspective-800 cursor-pointer" onClick={() => onClick(x, y)}>
      <div className={`w-full h-full relative transform-style-3d card-inner ${cell.revealed ? 'flipped' : ''} ${isSelected ? 'scale-95 z-10' : ''}`}>
         {/* Back of card */}
         <div className="card-face card-back backface-hidden"></div>
         
         {/* Front of card */}
         <div className={`card-face card-front backface-hidden ${highlightClass}
            ${cell.piece?.player === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700'}
            ${cell.piece?.isImmune ? 'opacity-50 grayscale' : ''}
            ${cell.piece?.type === 'bigTiger' ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
         `}>
            {cell.piece && (
               <>
                 <div className="text-[10px] font-black opacity-30 absolute top-1.5 left-1.5">{cell.piece.player === 'red' ? '红' : '蓝'}</div>
                 <div className="text-4xl animate-pop drop-shadow-sm">{ANIMAL_EMOJIS[cell.piece.type]}</div>
                 <div className="text-sm font-bold mt-0.5">{ANIMAL_CHARS[cell.piece.type]}</div>
                 {cell.piece.type === "tiger" && cell.piece.player === turn && tigerStreak !== undefined && (
                    <div className="absolute top-1 right-1 text-[9px] bg-yellow-100 px-1.5 rounded-full border border-yellow-400 font-bold text-yellow-700 shadow-sm">
                       {tigerStreak}/10
                    </div>
                 )}
                 {cell.piece.type === "bigTiger" && (
                    <div className="absolute bottom-1 right-1 text-[10px] bg-yellow-400 px-1.5 rounded-full font-bold text-yellow-900 shadow-sm">
                       👑
                    </div>
                 )}
               </>
            )}
         </div>
      </div>
    </div>
  );
};
