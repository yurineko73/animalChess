import React from "react";
import { Modal } from "./components";
import { ANIMAL_CHARS, ANIMAL_EMOJIS, ANIMAL_RANKS, ANIMAL_DESC } from "./constants";
import { getStats } from "./storage";
import { AnimalType } from "./types";

export const TutorialOverlay = ({ step, onNext }: { step: number, onNext: () => void }) => (
  <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-6 text-white text-center" onClick={onNext}>
      <div className="max-w-xs animate-float">
        <div className="text-4xl mb-4">
            {step === 1 && "🃏"}
            {step === 2 && "🐯"}
            {step === 3 && "🐆"}
            {step === 4 && "📥"}
            {step === 5 && "👑"}
        </div>
        <h2 className="text-2xl font-bold mb-2">
            {step === 1 && "Flip & Move"}
            {step === 2 && "Rank & Eat"}
            {step === 3 && "Leopard & Tiger"}
            {step === 4 && "Capture & Drop"}
            {step === 5 && "Ready?"}
        </h2>
        <p className="text-sm opacity-90">
            {step === 1 && "Tap hidden cards to Flip. Tap own pieces to Move. First turn MUST flip!"}
            {step === 2 && "Big eats Small. Elephant > Lion ... > Rat. But Rat eats Elephant!"}
            {step === 3 && "Leopard jumps 1 space. Tiger evolves after 10 moves into King Tiger!"}
            {step === 4 && "Captured enemies go to your Hand. Spend a turn to Drop them back on board!"}
            {step === 5 && "Defeat all enemies or kill the King Tiger to win! Tap to start."}
        </p>
        <div className="mt-8 text-xs opacity-50">Tap to continue ({step}/5)</div>
      </div>
  </div>
);

export const RulesModal = ({ onClose }: { onClose: () => void }) => (
  <Modal title="Quick Rules" onClose={onClose}>
    <ul className="text-xs space-y-3 list-disc pl-4 text-slate-600">
        <li><strong>Win:</strong> Capture all pieces OR Kill Big Tiger.</li>
        <li><strong>First Turn:</strong> Must Flip. No moves allowed.</li>
        <li><strong>Tiger Evo:</strong> Move Tiger 10 times to Evolve. Breaks if other pieces move.</li>
        <li><strong>Leopard:</strong> Jumps over 1 empty square.</li>
        <li><strong>Rat:</strong> Moves anywhere. Ambushes on flip.</li>
        <li><strong>Wolf:</strong> Can 'Wait' to skip turn & gain immunity.</li>
        <li><strong>Cat:</strong> Teleports once on death.</li>
        <li><strong>Dog:</strong> Flips neighbor on reveal.</li>
    </ul>
  </Modal>
);

export const DexModal = ({ onClose }: { onClose: () => void }) => (
  <Modal title="Encyclopedia" onClose={onClose}>
    <div className="grid gap-3">
        {Object.keys(ANIMAL_RANKS).sort((a,b) => ANIMAL_RANKS[b as AnimalType] - ANIMAL_RANKS[a as AnimalType]).map((type) => (
            <div key={type} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-2xl">{ANIMAL_EMOJIS[type as AnimalType]}</div>
                <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                        {ANIMAL_CHARS[type as AnimalType]} <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-500">Rank {ANIMAL_RANKS[type as AnimalType]}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">{ANIMAL_DESC[type as AnimalType]}</div>
                </div>
            </div>
        ))}
    </div>
  </Modal>
);

export const StatsModal = ({ onClose }: { onClose: () => void }) => {
  const s = getStats();
  return (
    <Modal title="My Stats" onClose={onClose}>
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-black text-blue-600">{s.total > 0 ? Math.round((s.wins/s.total)*100) : 0}%</div>
                <div className="text-xs text-blue-400">Win Rate</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
                <div className="text-2xl font-black text-orange-600">{s.evos}</div>
                <div className="text-xs text-orange-400">Evolutions</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl col-span-2">
                <div className="text-3xl font-black text-green-600">{s.captures}</div>
                <div className="text-xs text-green-400">Total Captures</div>
            </div>
            <div className="text-xs text-slate-400 col-span-2 mt-2">Total Games Played: {s.total}</div>
        </div>
    </Modal>
  );
};

export const WinnerScreen = ({ winner }: { winner: string }) => (
  <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-fade-in">
      <div className="text-8xl mb-6 animate-bounce">{winner === 'red' ? '🏆' : '💀'}</div>
      <h1 className="text-4xl font-black text-slate-800 mb-2">{winner === 'red' ? 'VICTORY' : 'DEFEAT'}</h1>
      <p className="text-slate-500 mb-8">
          {winner === 'red' ? "You conquered the Jungle!" : "The AI outsmarted you."}
      </p>
      <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition">
          Play Again
      </button>
  </div>
);
