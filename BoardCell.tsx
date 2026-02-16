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
      <div className={`w-full h-full relative transform-style-3d card-inner ${cell.revealed ? 'flipped' : ''} ${isSelected ? 'scale-95' : ''}`}>
         {/* Back of card */}
         <div className="card-face card-back backface-hidden"></div>
         
         {/* Front of card */}
         <div className={`card-face card-front backface-hidden ${highlightClass}
            ${cell.piece?.player === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}
            ${cell.piece?.isImmune ? 'opacity-50 grayscale' : ''}
         `}>
            {cell.piece && (
               <>
                 <div className="text-[10px] font-black opacity-30 absolute top-1 left-1">{cell.piece.player === 'red' ? 'R' : 'B'}</div>
                 <div className="text-3xl animate-pop">{ANIMAL_EMOJIS[cell.piece.type]}</div>
                 <div className="text-xs font-bold mt-1">{ANIMAL_CHARS[cell.piece.type]}</div>
                 {cell.piece.type === "tiger" && cell.piece.player === turn && tigerStreak !== undefined && (
                    <div className="absolute top-1 right-1 text-[8px] bg-yellow-100 px-1 rounded-full border border-yellow-300">
                       {tigerStreak}
                    </div>
                 )}
               </>
            )}
         </div>
      </div>
    </div>
  );
};
