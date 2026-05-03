// simulator.ts (完整代码)

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
  
  // 调整 1: 假设常驻五星角色已拥有，确保第一次歪也能获得星辉
  const charOwned: Record<string, number> = { "Std": 1 };

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
        
        // 调整 2: 优化四星产出的星辉期望值 (保留你原有的触发逻辑)
        if (totalPulls % 9 === 0) {
            // 简单模型：假设产出的四星里，一半是给5星辉的满命角色，一半是给2星辉的武器/未满命角色
            stardust += (Math.random() < 0.5) ? 5 : 2;
        }
        
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
          if (isUp) {
            inv[key]++;
          } else {
            inv['Std']++; // 修正: 歪了也要计入库存
          }
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
      
      // 调整 2 (同步修改): 武器池的四星也使用同样的期望模型
      if (totalPulls % 9 === 0) {
        stardust += (Math.random() < 0.5) ? 5 : 2;
      }
      
      const prob = 0.007 + Math.max(0, pGold - 62) * 0.07;
      if (Math.random() < prob) {
        // 修复 3: 任何5星武器出金，都无条件给10个星辉
        stardust += 10;
        
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