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
  // 一开始计数器为1
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
  let charPurplePity = 0; // 👈 新增：角色池的 4 星垫抽水位

  const charKeys = ['cA', 'cB'] as const;
  for (const key of charKeys) {
    const goal = key === 'cA' ? targets.charA : targets.charB;
    while (inv[key] < goal) {
      let pGold = currentCharPity; 
      currentCharPity = 0; 

      while (true) {
        totalPulls++; pGold++; charPurplePity++; // 👈 五星和四星的水位同时+1
        
        // 【1. 先判定是否出 5 星】
        const prob = 0.006 + Math.max(0, pGold - 73) * 0.06;
        if (Math.random() < prob) {
          let isUp = false;
          if (charGuaranteed) { 
            isUp = true; 
            charGuaranteed = false; 
            // 大保底属于必定UP，不参与小保底计数器变更
          }
          else {
            if (charCounter === 3) { 
              // 若计数器为3则下一个小保底必定不歪，同时计数器重置为1
              isUp = true; 
              charCounter = 1; 
            }
            else {
              if (Math.random() < 0.5) { 
                // 小保底没歪则计数器减1 (最低到0)
                isUp = true; 
                charCounter = Math.max(0, charCounter - 1); 
              }
              else { 
                // 小保底歪了则计数器加一，大保底激活
                isUp = false; 
                charGuaranteed = true; 
                charCounter += 1; 
              }
            }
          }
          stardust += getStardust(isUp ? key : "Std");
          if (isUp) {
            inv[key]++;
          } else {
            inv['Std']++; 
          }
          break; // 出了5星，本轮寻找结束
        } 
        // 【2. 如果没出 5 星，再判定是否出 4 星】
        else {
          let prob4 = 0.06; // 1-8 抽的基础概率
          if (charPurplePity === 9) prob4 = 0.66; // 第 9 抽概率飙升
          else if (charPurplePity >= 10) prob4 = 1.0; // 第 10 抽必定出

          if (Math.random() < prob4) {
            charPurplePity = 0; // 👈 抽中 4 星，水位清零
            // 一半概率是满命4星给5个星辉，一半概率是武器/非满命给2个星辉
            stardust += (Math.random() < 0.5) ? 5 : 2; 
          }
        }
      }
    }
  }

  // ---------------- 武器池逻辑 ----------------
  let currentFocus: 'wA' | 'wB' = 'wA';
  let weapPurplePity = 0; // 👈 新增：武器池的 4 星垫抽水位

  while (inv['wA'] < targets.weapA || inv['wB'] < targets.weapB) {
    if (inv['wA'] >= targets.weapA && currentFocus === "wA") { currentFocus = "wB"; fatePoint = 0; }
    
    let pGold = currentWeapPity;
    currentWeapPity = 0; 

    while (true) {
      totalPulls++; pGold++; weapPurplePity++; // 👈 五星和四星的水位同时+1
      
      // 【1. 先判定是否出 5 星】
      const prob = 0.007 + Math.max(0, pGold - 62) * 0.07;
      if (Math.random() < prob) {
        stardust += 10; // 出五星必得10星辉
        
        let res = "";
        
        if (fatePoint === 1) { 
          res = currentFocus; 
          fatePoint = 0; 
          weaponGuaranteed = false; 
        }
        else {
          const upProb = weaponGuaranteed ? 1.0 : 0.75;
          if (Math.random() < upProb) {
            weaponGuaranteed = false; 
            if (Math.random() < 0.5) { 
              res = currentFocus; 
              fatePoint = 0; 
            }
            else { 
              res = currentFocus === "wA" ? "wB" : "wA"; 
              fatePoint = 1; 
            }
          } else { 
            res = "Std"; 
            weaponGuaranteed = true; 
            fatePoint = 1; 
          }
        }
        
        if (res in inv) inv[res as keyof typeof inv]++;
        break; // 当前五星抽取结束，跳出内层while循环
      } 
      // 【2. 如果没出 5 星，再判定是否出 4 星】
      else {
        let prob4 = 0.06; // 1-8 抽的基础概率
        if (weapPurplePity === 9) prob4 = 0.66; // 第 9 抽概率飙升
        else if (weapPurplePity >= 10) prob4 = 1.0; // 第 10 抽必定出

        if (Math.random() < prob4) {
          weapPurplePity = 0; // 👈 抽中 4 星，水位清零
          // 武器池的 4 星返还逻辑，同样算作平均分配
          stardust += (Math.random() < 0.5) ? 5 : 2; 
        }
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