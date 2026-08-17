"use client"

import { createContext, useContext, useMemo, useState } from "react"
import { runSimulation, SimulationTargets } from "@/lib/simulator"

type Names = { cA: string; cB: string; wA: string; wB: string }

type SimulatorStateValue = {
  fates: number
  setFates: React.Dispatch<React.SetStateAction<number>>
  primos: number
  setPrimos: React.Dispatch<React.SetStateAction<number>>
  useStarglitter: boolean
  setUseStarglitter: React.Dispatch<React.SetStateAction<boolean>>
  simCount: number
  setSimCount: React.Dispatch<React.SetStateAction<number>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  targets: SimulationTargets
  setTargets: React.Dispatch<React.SetStateAction<SimulationTargets>>
  names: Names
  setNames: React.Dispatch<React.SetStateAction<Names>>
  report: any
  setReport: React.Dispatch<React.SetStateAction<any>>
  startSim: () => Promise<void>
  effectiveFates: number
  actualReturnPullsDisplay: number | string
  actualTotalPullsDisplay: number | string
}

const SimulatorStateContext = createContext<SimulatorStateValue | null>(null)

export function SimulatorStateProvider({ children }: { children: React.ReactNode }) {
  const [fates, setFates] = useState(0)
  const [primos, setPrimos] = useState(0)
  const [useStarglitter, setUseStarglitter] = useState(false)
  const [simCount, setSimCount] = useState(100000)
  const [loading, setLoading] = useState(false)
  const [targets, setTargets] = useState<SimulationTargets>({
    charA: 0, charB: 0, weapA: 0, weapB: 0,
    charPity: 0, weapPity: 0, isCharGuaranteed: false,
  })
  const [names, setNames] = useState<Names>({
    cA: "茜特菈莉", cB: "奥黛塔", wA: "祭星者之望", wB: "白湖冬羽",
  })
  const [report, setReport] = useState<any>(null)

  const effectiveFates = fates + Math.floor(primos / 160)

  const startSim = async () => {
    if (names.cA === names.cB && targets.charB > 0) {
      alert("校验失败: 角色A与角色B不能重复选择")
      return
    }

    const totalTargets = targets.charA + targets.charB + targets.weapA + targets.weapB
    if (totalTargets === 0) {
      setReport({ empty: true })
      return
    }

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    const results = await runSimulation(targets, simCount)
    const pulls = results.map(result => result.totalPulls).sort((a, b) => a - b)

    const successCount = useStarglitter
      ? results.filter(result => result.totalPulls - Math.floor(result.stardust / 5) <= effectiveFates).length
      : pulls.filter(pull => pull <= effectiveFates).length
    const prob = successCount / Math.max(1, simCount)
    const avgPulls = pulls.reduce((a, b) => a + b, 0) / simCount
    const avgDust = results.reduce((a, b) => a + b.stardust, 0) / simCount
    const avgBallsBack = avgDust >= 5 ? Math.floor(avgDust / 5) : 0
    const theoryAvg = (targets.charA + targets.charB) * 93.46 + (targets.weapA + targets.weapB) * 66.5

    const binsCount = 40
    const minPull = pulls[0]
    const maxPull = pulls[pulls.length - 1]
    const binSize = Math.max(1, Math.ceil((maxPull - minPull + 1) / binsCount))
    const histData = Array.from({ length: binsCount }, (_, index) => {
      const start = minPull + index * binSize
      return { name: `${start}~${start + binSize - 1}抽`, 范围: `${start}抽 - ${start + binSize - 1}抽`, 发生次数: 0 }
    })
    pulls.forEach(pull => {
      const index = Math.min(Math.floor((pull - minPull) / binSize), binsCount - 1)
      histData[index].发生次数++
    })

    const comboMap: Record<string, number> = {}
    results.forEach(result => {
      const parts = []
      if (result.inv.cA > 0) parts.push(`cA:${result.inv.cA}`)
      if (result.inv.cB > 0) parts.push(`cB:${result.inv.cB}`)
      if (result.inv.wA > 0) parts.push(`wA:${result.inv.wA}`)
      if (result.inv.wB > 0) parts.push(`wB:${result.inv.wB}`)
      const key = parts.length > 0 ? parts.join("|") : "none"
      comboMap[key] = (comboMap[key] || 0) + 1
    })

    setReport({
      prob,
      pulls,
      avgPulls,
      avgDust,
      avgBallsBack,
      theoryAvg,
      netCost: avgPulls - avgDust / 5,
      topCombos: Object.entries(comboMap).sort((a, b) => b[1] - a[1]).slice(0, 15),
      trimmedHistData: histData,
    })
    setLoading(false)
  }

  const returnDisplays = useMemo(() => {
    if (!report || report.avgPulls <= 0) {
      return { actualReturnPullsDisplay: "(待计算)", actualTotalPullsDisplay: "(待计算)" }
    }
    const returnRate = report.avgBallsBack / report.avgPulls
    const actualReturn = Math.floor((effectiveFates * returnRate) / (1 - returnRate))
    return { actualReturnPullsDisplay: actualReturn, actualTotalPullsDisplay: effectiveFates + actualReturn }
  }, [effectiveFates, report])

  return (
    <SimulatorStateContext.Provider value={{
      fates, setFates, primos, setPrimos, useStarglitter, setUseStarglitter,
      simCount, setSimCount, loading, setLoading, targets, setTargets, names, setNames,
      report, setReport, startSim, effectiveFates, ...returnDisplays,
    }}>
      {children}
    </SimulatorStateContext.Provider>
  )
}

export function useSimulatorState() {
  const state = useContext(SimulatorStateContext)
  if (!state) throw new Error("useSimulatorState must be used inside SimulatorStateProvider")
  return state
}
