export interface SimulationTargets {
  charA: number; charB: number;
  weapA: number; weapB: number;
}

export interface SimResult {
  totalPulls: number; stardust: number;
  inv: { cA: number; cB: number; wA: number; wB: number; Std: number };
}

export function runOneSimLogic(targets: SimulationTargets): SimResult {
  let charCounter = 1, charGuaranteed = false, weaponGuaranteed = false, fatePoint = 0;
  let totalPulls = 0, stardust = 0;
  const inv = { cA: 0, cB: 0, wA: 0, wB: 0, Std: 0 };
  const charOwned: Record<string, number> = {};

  const getStardust = (name: string) => {
    const num = charOwned[name] || 0;
    charOwned[name] = num + 1;
    if (num === 0) return 0;
    return num <= 6 ? 10 : 25;
  };

  const charKeys = ['cA', 'cB'] as const;
  for (const key of charKeys) {
    const goal = key === 'cA' ? targets.charA : targets.charB;
    while (inv[key] < goal) {
      let pGold = 0;
      while (true) {
        totalPulls++; pGold++;
        if (totalPulls % 9 === 0) stardust += 2;
        const prob = 0.006 + Math.max(0, pGold - 73) * 0.06;
        if (Math.random() < prob) {
          let isUp = false;
          if (charGuaranteed) { isUp = true; charGuaranteed = false; }
          else {
            if (charCounter === 3) { isUp = true; charCounter = 1; }
            else {
              if (Math.random() < 0.5) { isUp = true; charCounter = Math.max(0, charCounter - 1); }
              else {
                if (Math.random() < 0.1) { isUp = true; charCounter = 1; } // 捕获明光
                else { isUp = false; charGuaranteed = true; charCounter += 1; }
              }
            }
          }
          stardust += getStardust(isUp ? key : "Std");
          if (isUp) inv[key]++;
          break;
        }
      }
    }
  }

  let currentFocus: 'wA' | 'wB' = 'wA';
  while (inv['wA'] < targets.weapA || inv['wB'] < targets.weapB) {
    if (inv['wA'] >= targets.weapA && currentFocus === "wA") { currentFocus = "wB"; fatePoint = 0; }
    let pGold = 0;
    while (true) {
      totalPulls++; pGold++;
      if (totalPulls % 9 === 0) stardust += 2;
      const prob = 0.007 + Math.max(0, pGold - 62) * 0.07;
      if (Math.random() < prob) {
        let res = "";
        if (fatePoint === 1) { res = currentFocus; fatePoint = 0; }
        else {
          const upProb = weaponGuaranteed ? 1.0 : 0.75;
          if (Math.random() < upProb) {
            weaponGuaranteed = false;
            if (Math.random() < 0.5) { res = currentFocus; fatePoint = 0; }
            else { res = currentFocus === "wA" ? "wB" : "wA"; fatePoint = 1; }
          } else { res = "Std"; weaponGuaranteed = true; fatePoint = 1; }
        }
        if (res in inv) inv[res as keyof typeof inv]++;
        break;
      }
    }
    if (inv['wA'] >= targets.weapA && inv['wB'] >= targets.weapB) break;
  }
  return { totalPulls, stardust, inv };
}

export async function runSimulation(targets: SimulationTargets, count: number): Promise<SimResult[]> {
  return new Promise((resolve) => {
    const results: SimResult[] =[];
    let completed = 0;
    const batchSize = 5000; 

    function computeBatch() {
      const end = Math.min(completed + batchSize, count);
      for (let i = completed; i < end; i++) results.push(runOneSimLogic(targets));
      completed = end;
      if (completed < count) setTimeout(computeBatch, 0); 
      else resolve(results);
    }
    computeBatch();
  });
}