// simulator.ts

export interface SimulationTargets {
  charA: number; charB: number;
  weapA: number; weapB: number;
  charPity?: number;        
  weapPity?: number;        
  isCharGuaranteed?: boolean; 
}

export interface SimResult {
  totalPulls: number; stardust: number;
  inv: { cA: number; cB: number; wA: number; wB: number; Std: number };
}

export function runOneSimLogic(targets: SimulationTargets): SimResult {
  let charCounter = 1;
  let charGuaranteed = targets.isCharGuaranteed || false; 
  let weaponGuaranteed = false; 
  let fatePoint = 0;
  
  let totalPulls = 0, stardust = 0;
  const inv = { cA: 0, cB: 0, wA: 0, wB: 0, Std: 0 };
  const charOwned: Record<string, number> = { "Std": 1 };

  let currentCharPity = targets.charPity || 0;
  let currentWeapPity = targets.weapPity || 0;

  const getStardust = (name: string) => {
    const num = charOwned[name] || 0;
    charOwned[name] = num + 1;
    if (num === 0) return 0;
    return num <= 6 ? 10 : 25;
  };

  // ---------------- 角色池逻辑 ----------------
  const charKeys = ['cA', 'cB'] as const;
  for (const key of charKeys) {
    const goal = key === 'cA' ? targets.charA : targets.charB;
    while (inv[key] < goal) {
      let pGold = currentCharPity; 
      currentCharPity = 0; 

      while (true) {
        totalPulls++; pGold++;
        
        if (totalPulls % 9 === 0) {
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
                if (Math.random() < 0.1) { isUp = true; charCounter = 1; } 
                else { isUp = false; charGuaranteed = true; charCounter += 1; }
              }
            }
          }
          stardust += getStardust(isUp ? key : "Std");
          if (isUp) {
            inv[key]++;
          } else {
            inv['Std']++; 
          }
          break;
        }
      }
    }
  }

  // ---------------- 武器池逻辑 ----------------
  let currentFocus: 'wA' | 'wB' = 'wA';
  while (inv['wA'] < targets.weapA || inv['wB'] < targets.weapB) {
    if (inv['wA'] >= targets.weapA && currentFocus === "wA") { currentFocus = "wB"; fatePoint = 0; }
    
    let pGold = currentWeapPity;
    currentWeapPity = 0; 

    while (true) {
      totalPulls++; pGold++;
      
      if (totalPulls % 9 === 0) {
        stardust += (Math.random() < 0.5) ? 5 : 2;
      }
      
      const prob = 0.007 + Math.max(0, pGold - 62) * 0.07;
      if (Math.random() < prob) {
        stardust += 10; // 出五星必得10星辉
        
        let res = "";
        
        // 【核心修复区域】
        if (fatePoint === 1) { 
          res = currentFocus; 
          fatePoint = 0; // 定轨清零
          weaponGuaranteed = false; // 👈 修复：只要吃到了定轨，大保底状态也必须强制清零（回到75% / 25%）
        }
        else {
          const upProb = weaponGuaranteed ? 1.0 : 0.75;
          if (Math.random() < upProb) {
            weaponGuaranteed = false; // 抽中了UP武器，大保底状态清零
            if (Math.random() < 0.5) { 
              res = currentFocus; 
              fatePoint = 0; // 抽中了想要的UP武器，定轨清零
            }
            else { 
              res = currentFocus === "wA" ? "wB" : "wA"; 
              fatePoint = 1; // 抽中了另一把UP武器，定轨+1
            }
          } else { 
            res = "Std"; 
            weaponGuaranteed = true; // 歪了常驻，激活大保底
            fatePoint = 1; // 定轨+1
          }
        }
        
        if (res in inv) inv[res as keyof typeof inv]++;
        break; // 当前五星抽取结束，跳出内层while循环
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