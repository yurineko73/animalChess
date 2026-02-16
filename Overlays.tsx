import React from "react";
import { Modal } from "./components";
import { ANIMAL_CHARS, ANIMAL_EMOJIS, ANIMAL_RANKS, ANIMAL_DESC } from "./constants";
import { getStats } from "./storage";
import { AnimalType, GameStats } from "./types";

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
            {step === 1 && "翻牌与移动"}
            {step === 2 && "等级与吃子"}
            {step === 3 && "豹与虎"}
            {step === 4 && "收牌与放置"}
            {step === 5 && "准备好了吗？"}
        </h2>
        <p className="text-sm opacity-90 leading-relaxed">
            {step === 1 && "点击暗牌翻开。点击己方棋子移动。首回合必须翻牌！"}
            {step === 2 && "大吃小。象＞狮＞虎＞豹＞狼＞狗＞猫＞鼠。但鼠可以吃象！"}
            {step === 3 && "豹可以沿横竖直线跳过1个空格。虎连续合法走牌满10步，进化为大虎！"}
            {step === 4 && "吃掉的棋子进入收牌区。花费一回合可将它们放回棋盘任意空格！"}
            {step === 5 && "消灭所有敌人或吃掉敌方大虎即可获胜！点击开始。"}
        </p>
        <div className="mt-8 text-xs opacity-50">点击继续 ({step}/5)</div>
      </div>
  </div>
);

export const RulesModal = ({ onClose }: { onClose: () => void }) => (
  <Modal title="快速规则" onClose={onClose}>
    <ul className="text-sm space-y-3 list-disc pl-4 text-slate-600">
        <li><strong>胜利条件：</strong>吃掉敌方所有8枚棋子，或吃掉敌方已进化的大虎。</li>
        <li><strong>首回合：</strong>必须翻牌，不可移动。</li>
        <li><strong>核心克制链：</strong>象＞狮＞虎＞豹＞狼＞狗＞猫＞鼠，鼠可吃象，同类可兑。</li>
        <li><strong>虎进化：</strong>连续合法走牌满10步进化为大虎，移动其他棋子步数清零。</li>
        <li><strong>象：</strong>【巨兽威慑】不可被豹跨格吃子，仅可被相邻的鼠吃或同类兑掉。</li>
        <li><strong>狮：</strong>【百兽统领】吃子后，本回合敌方所有猫、鼠不可移动。</li>
        <li><strong>豹：</strong>【飞跨吃子】可沿横竖直线跨1个空格移动，跨格后可吃子/兑子（不可跨象）。</li>
        <li><strong>狼：</strong>【疾行】走牌时可选择原地停留，本回合免疫被吃/兑掉。</li>
        <li><strong>狗：</strong>【警戒】翻牌翻开己方狗时，可额外翻开1张相邻暗牌。</li>
        <li><strong>猫：</strong>【灵巧】被吃子时，有1次机会瞬移至棋盘任意空格，免疫本次吃子。</li>
        <li><strong>鼠：</strong>【钻隙】可移动至任意空格。暗牌被翻开时，可直接吃掉翻牌方1枚任意明牌（本局仅1次）。</li>
    </ul>
  </Modal>
);

export const DexModal = ({ onClose }: { onClose: () => void }) => (
  <Modal title="棋子图鉴" onClose={onClose}>
    <div className="grid gap-3">
        {Object.keys(ANIMAL_RANKS).sort((a,b) => ANIMAL_RANKS[b as AnimalType] - ANIMAL_RANKS[a as AnimalType]).map((type) => (
            <div key={type} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-3xl">{ANIMAL_EMOJIS[type as AnimalType]}</div>
                <div className="flex-1">
                    <div className="font-bold text-base flex items-center gap-2">
                        {ANIMAL_CHARS[type as AnimalType]} <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-600">等级 {ANIMAL_RANKS[type as AnimalType]}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-relaxed mt-1">{ANIMAL_DESC[type as AnimalType]}</div>
                </div>
            </div>
        ))}
    </div>
  </Modal>
);

export const StatsModal = ({ onClose }: { onClose: () => void }) => {
  const s = getStats();
  return (
    <Modal title="我的战绩" onClose={onClose}>
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-black text-blue-600">{s.total > 0 ? Math.round((s.wins/s.total)*100) : 0}%</div>
                <div className="text-xs text-blue-400">胜率</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
                <div className="text-2xl font-black text-orange-600">{s.evos}</div>
                <div className="text-xs text-orange-400">进化次数</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl col-span-2">
                <div className="text-3xl font-black text-green-600">{s.captures}</div>
                <div className="text-xs text-green-400">总吃子数</div>
            </div>
            <div className="text-xs text-slate-400 col-span-2 mt-2">总对局数：{s.total}</div>
        </div>
    </Modal>
  );
};

export const WinnerScreen = ({ winner, gameStats, redHand, blueHand }: { winner: string | null, gameStats?: GameStats, redHand?: any[], blueHand?: any[] }) => {
  const isDraw = winner === null;
  return (
    <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-fade-in p-4">
        <div className="text-8xl mb-4 animate-bounce">
          {isDraw ? '🤝' : winner === 'red' ? '🏆' : '💀'}
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-2">
          {isDraw ? '平局！' : winner === 'red' ? '胜利！' : '失败'}
        </h1>
        <p className="text-slate-500 mb-6">
            {isDraw ? "双方势均力敌！" : winner === 'red' ? "你征服了丛林！" : "AI 比你更聪明。"}
        </p>
      
      {gameStats && (
        <div className="bg-slate-50 rounded-2xl p-6 mb-6 w-full max-w-sm shadow-lg border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-4 text-center">📊 本局数据</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-600">{gameStats.flipCount.red}</div>
              <div className="text-xs text-red-500">红方翻牌</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-blue-600">{gameStats.flipCount.blue}</div>
              <div className="text-xs text-blue-500">蓝方翻牌</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-600">{gameStats.captureCount.red}</div>
              <div className="text-xs text-red-500">红方吃子</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-blue-600">{gameStats.captureCount.blue}</div>
              <div className="text-xs text-blue-500">蓝方吃子</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-600">{gameStats.maxTigerStreak.red}</div>
              <div className="text-xs text-red-500">红方虎最高步数</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-blue-600">{gameStats.maxTigerStreak.blue}</div>
              <div className="text-xs text-blue-500">蓝方虎最高步数</div>
            </div>
          </div>
        </div>
      )}
      
      <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition transform">
          再来一局
      </button>
  </div>
  );
};
