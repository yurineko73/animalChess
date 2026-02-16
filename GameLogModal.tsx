import React from "react";
import { GameLogEntry, Player } from "./types";

interface GameLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: GameLogEntry[];
}

const getPlayerColor = (player: Player) => {
  return player === "red" ? "text-red-600" : "text-blue-600";
};

const getPlayerBg = (player: Player) => {
  return player === "red" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200";
};

export const GameLogModal = ({ isOpen, onClose, logs }: GameLogModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">📜 对局日志</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-3xl transition"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {logs.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              暂无日志记录
            </div>
          ) : (
            logs.slice().reverse().map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border ${getPlayerBg(log.player)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getPlayerColor(log.player)}`}>
                      {log.player === "red" ? "红方" : "蓝方"}
                    </span>
                    <span className="text-xs text-slate-400">
                      回合 {log.turn}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-slate-700">
                  {log.action}
                </div>
                {log.details && (
                  <div className="mt-1 text-sm text-slate-500">
                    {log.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <button 
          onClick={onClose}
          className="mt-4 w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition"
        >
          关闭
        </button>
      </div>
    </div>
  );
};
