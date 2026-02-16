import { AnimalType } from "./types";

export const ANIMAL_RANKS: Record<AnimalType, number> = {
  rat: 1, cat: 2, dog: 3, wolf: 4, leopard: 5, tiger: 6, lion: 7, elephant: 8, bigTiger: 7
};

export const ANIMAL_CHARS: Record<AnimalType, string> = {
  rat: "鼠", cat: "猫", dog: "狗", wolf: "狼", leopard: "豹", tiger: "虎", lion: "狮", elephant: "象", bigTiger: "王"
};

export const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  rat: "🐭", cat: "🐱", dog: "🐕", wolf: "🐺", leopard: "🐆", tiger: "🐯", lion: "🦁", elephant: "🐘", bigTiger: "👑"
};

export const ANIMAL_DESC: Record<AnimalType, string> = {
  elephant: "【巨兽威慑】不可被豹跨格吃子，仅可被相邻的鼠吃或同类兑掉。阵营核心战力，前排抗伤。",
  lion: "【百兽统领】吃子后，本回合敌方所有猫、鼠不可移动。中高战力输出，克制低阶棋子。",
  tiger: "【进化潜能】连续合法走牌满10步，进化为大虎。阵营养成核心，战局反转关键。",
  leopard: "【飞跨吃子】可沿横竖直线跨1个空格移动，跨格后可吃子/兑子（不可跨象）。高机动刺客，绕后吃子、打断进化。",
  wolf: "【疾行】走牌时可选择原地停留，本回合免疫被吃/兑掉。中阶功能性棋子，控场拉扯。",
  dog: "【警戒】翻牌翻开己方狗时，可额外翻开1张相邻暗牌。低阶探牌棋子，辅助解锁暗牌。",
  cat: "【灵巧】被吃子时，有1次机会瞬移至棋盘任意空格，免疫本次吃子。低阶拉扯棋子，保护核心战力。",
  rat: "【钻隙】可移动至任意1个棋盘空格（无距离限制）；暗牌被翻开时，可直接吃掉翻牌方1枚任意明牌（本局仅1次）。奇兵棋子，唯一克制象的核心。",
  bigTiger: "【猛虎突进】1. 可跨1枚敌方棋子移动，跨棋后可吃子；2. 无视豹的跨格吃子限制。阵营最强战力，突破传统克制链。",
};
