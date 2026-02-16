export const getTutorialStatus = () => {
  return !!localStorage.getItem("mjc_tutorial_done");
};

export const setTutorialDone = () => {
  localStorage.setItem("mjc_tutorial_done", "true");
};

export const updateStats = (type: "win" | "loss" | "capture" | "evo") => {
  const stats = JSON.parse(localStorage.getItem("mjc_stats") || '{"wins":0,"total":0,"captures":0,"evos":0}');
  if (type === "win") { stats.wins++; stats.total++; }
  if (type === "loss") stats.total++;
  if (type === "capture") stats.captures++;
  if (type === "evo") stats.evos++;
  localStorage.setItem("mjc_stats", JSON.stringify(stats));
};

export const getStats = () => {
  return JSON.parse(localStorage.getItem("mjc_stats") || '{"wins":0,"total":0,"captures":0,"evos":0}');
};
