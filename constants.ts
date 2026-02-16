import { AnimalType } from "./types";

export const ANIMAL_RANKS: Record<AnimalType, number> = {
  rat: 1, cat: 2, dog: 3, wolf: 4, leopard: 5, tiger: 6, lion: 7, elephant: 8, bigTiger: 9
};

export const ANIMAL_CHARS: Record<AnimalType, string> = {
  rat: "鼠", cat: "猫", dog: "狗", wolf: "狼", leopard: "豹", tiger: "虎", lion: "狮", elephant: "象", bigTiger: "王"
};

export const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  rat: "🐭", cat: "🐱", dog: "🐕", wolf: "🐺", leopard: "🐆", tiger: "🐯", lion: "🦁", elephant: "🐘", bigTiger: "👑"
};

export const ANIMAL_DESC: Record<AnimalType, string> = {
  elephant: "Tank: High HP. Vulnerable to Rat.",
  lion: "Leader: Freezes enemy Cat/Rat on kill.",
  tiger: "Hero: Evolves after 10 moves.",
  leopard: "Assassin: Jumps over 1 empty space.",
  wolf: "Scout: Can wait (Skip turn + Immune).",
  dog: "Sentry: Flips adjacent card on reveal.",
  cat: "Agile: 1 Extra Life (Teleport on death).",
  rat: "Spy: Moves anywhere. Ambushes on reveal.",
  bigTiger: "BOSS: Diagonal Move + Jump Enemy.",
};
