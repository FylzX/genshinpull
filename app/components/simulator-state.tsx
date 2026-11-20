"use client"

import { createContext, useContext, useRef, useState } from "react"
import { runSimulation, type SimulationTargets } from "@/lib/simulator"

type Names = { cA: string; cB: string; wA: string; wB: string }

type SimulationInput = {
  fates: number
  primos: number
  useStarglitter: boolean
  targets: SimulationTargets
  names: Names
}

type HistogramBin = { name: string; 范围: string; 发生次数: number }
type BudgetMarker = {
  bin: string
  pulls: number
  includesEstimatedReturn: boolean
  labelAnchor: "start" | "end"
}
type SimulationReport = {
  input: SimulationInput
  runId: number
  effectiveFates: number
  estimatedReturn: number | null
  budgetMarker: BudgetMarker | null
  totalTargets: number
  prob: number
  pulls: number[]
  avgPulls: number
  avgDust: number
  avgBallsBack: number
  theoryAvg: number
  netCost: number
  topCombos: [string, number][]
  histData: HistogramBin[]
}

export const PITY_LIMITS = { charPity: 89, weapPity: 79 } as const

type NumericField = "fates" | "primos" | keyof typeof PITY_LIMITS | "charA" | "charB" | "weapA" | "weapB"
type InputErrors = Partial<Record<NumericField | "cB" | "targets", string>>

const targetFields = ["charA", "charB", "weapA", "weapB"] as const
const nameFields = ["cA", "cB", "wA", "wB"] as const

function getTotalTargets(targets: SimulationTargets) {
  return targetFields.reduce((sum, field) => sum + targets[field], 0)
}

function getEffectiveFates({ fates, primos }: Pick<SimulationInput, "fates" | "primos">) {
  return fates + Math.floor(primos / 160)
}

function validateInput(input: SimulationInput): InputErrors {
  const { targets, names } = input
  const errors: InputErrors = {}
  const checkInteger = (field: NumericField, value: number) => {
    if (!Number.isSafeInteger(value) || value < 0) errors[field] = "请输入非负整数"
  }

  checkInteger("fates", input.fates)
  checkInteger("primos", input.primos)
  if (!errors.fates && !errors.primos && !Number.isSafeInteger(getEffectiveFates(input))) {
    errors.fates = "原石折算后的总抽数过大"
  }

  for (const field of ["charPity", "weapPity"] as const) {
    const value = targets[field] ?? 0
    const limit = PITY_LIMITS[field]
    if (!Number.isSafeInteger(value) || value < 0 || value > limit) {
      errors[field] = "请输入 0–" + limit + " 之间的整数"
    }
  }

  for (const field of targetFields) checkInteger(field, targets[field])
  if (targetFields.every(field => targets[field] === 0)) {
    errors.targets = "请至少填写一项抽取目标"
  }
  if (names.cA === names.cB && targets.charB > 0) {
    errors.cB = "角色 A 与角色 B 不能重复选择"
  }
  return errors
}

function matchesInput(saved: SimulationInput, current: SimulationInput) {
  return saved.fates === current.fates &&
    saved.primos === current.primos &&
    saved.useStarglitter === current.useStarglitter &&
    targetFields.every(field => saved.targets[field] === current.targets[field]) &&
    saved.targets.charPity === current.targets.charPity &&
    saved.targets.weapPity === current.targets.weapPity &&
    (saved.targets.sameWeaponBanner ?? true) === (current.targets.sameWeaponBanner ?? true) &&
    saved.targets.isCharGuaranteed === current.targets.isCharGuaranteed &&
    saved.targets.initialCharCounter === current.targets.initialCharCounter &&
    nameFields.every(field => saved.names[field] === current.names[field])
}

type SimulatorStateValue = SimulationInput & {
  setFates: React.Dispatch<React.SetStateAction<number>>
  setPrimos: React.Dispatch<React.SetStateAction<number>>
  setUseStarglitter: React.Dispatch<React.SetStateAction<boolean>>
  simCount: number
  loading: boolean
  setTargets: React.Dispatch<React.SetStateAction<SimulationTargets>>
  setNames: React.Dispatch<React.SetStateAction<Names>>
  report: SimulationReport | null
  reportIsStale: boolean
  inputErrors: InputErrors
  startSim: () => Promise<void>
  effectiveFates: number
  estimatedReturn: number | null
}

const simCount = 100000
const SimulatorStateContext = createContext<SimulatorStateValue | null>(null)

export function SimulatorStateProvider({ children }: { children: React.ReactNode }) {
  const [fates, setFates] = useState(0)
  const [primos, setPrimos] = useState(0)
  const [useStarglitter, setUseStarglitter] = useState(false)
  const [loading, setLoading] = useState(false)
  const calculating = useRef(false)
  const [showInputErrors, setShowInputErrors] = useState(false)
  const [targets, setTargets] = useState<SimulationTargets>({
    charA: 0, charB: 0, weapA: 0, weapB: 0,
    charPity: 0, weapPity: 0, isCharGuaranteed: false,
    initialCharCounter: 1,
    sameWeaponBanner: true,
  })
  const [names, setNames] = useState<Names>({
    cA: "茜特菈莉", cB: "奥黛塔", wA: "祭星者之望", wB: "白湖冬羽",
  })
  const [report, setReport] = useState<SimulationReport | null>(null)
  const input = { fates, primos, useStarglitter, targets, names }
  const effectiveFates = getEffectiveFates(input)
  const reportIsStale = report !== null && !matchesInput(report.input, input)
  const inputErrors = showInputErrors ? validateInput(input) : {}

  const startSim = async () => {
    if (calculating.current) return
    const snapshot = { ...input, targets: { ...input.targets }, names: { ...input.names } }
    if (Object.keys(validateInput(snapshot)).length > 0) {
      setShowInputErrors(true)
      return
    }

    setShowInputErrors(false)
    calculating.current = true
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      const budget = getEffectiveFates(snapshot)
      const results = await runSimulation(snapshot.targets, simCount)
      const pulls = results.map(result => result.totalPulls).sort((a, b) => a - b)
      const successCount = results.filter(result => (
        snapshot.useStarglitter ? result.minimumStartingPulls : result.totalPulls
      ) <= budget).length
      const avgPulls = pulls.reduce((a, b) => a + b, 0) / simCount
      const avgDust = results.reduce((a, b) => a + b.stardust, 0) / simCount
      const avgBallsBack = results.reduce((sum, result) => sum + Math.floor(result.stardust / 5), 0) / simCount
      const { charA, charB, weapA, weapB } = snapshot.targets
      const theoryAvg = (charA + charB) * 93.46 + (weapA + weapB) * 66.5

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

      const returnRate = avgPulls > 0 ? avgBallsBack / avgPulls : 0
      const estimatedReturn = returnRate < 1
        ? Math.floor((budget * returnRate) / (1 - returnRate))
        : null
      // The chart groups gross pulls. Its refund-adjusted marker is a spending estimate.
      const includesEstimatedReturn = snapshot.useStarglitter && estimatedReturn !== null
      const chartBudget = budget + (includesEstimatedReturn ? estimatedReturn : 0)
      const budgetIndex = Math.floor((chartBudget - minPull) / binSize)
      const budgetBin = histData[budgetIndex]
      const budgetMarker: BudgetMarker | null = budgetBin ? {
        bin: budgetBin.name,
        pulls: chartBudget,
        includesEstimatedReturn,
        labelAnchor: budgetIndex < binsCount / 2 ? "start" : "end",
      } : null

      const comboMap: Record<string, number> = {}
      results.forEach(result => {
        const parts = nameFields.filter(field => result.inv[field] > 0)
          .map(field => field + ":" + result.inv[field])
        const key = parts.length > 0 ? parts.join("|") : "none"
        comboMap[key] = (comboMap[key] || 0) + 1
      })

      setReport({
        input: snapshot,
        runId: Date.now(),
        effectiveFates: budget,
        estimatedReturn,
        budgetMarker,
        totalTargets: getTotalTargets(snapshot.targets),
        prob: successCount / simCount,
        pulls,
        avgPulls,
        avgDust,
        avgBallsBack,
        theoryAvg,
        netCost: avgPulls - avgBallsBack,
        topCombos: Object.entries(comboMap).sort((a, b) => b[1] - a[1]).slice(0, 15),
        histData,
      })
    } finally {
      calculating.current = false
      setLoading(false)
    }
  }

  const estimatedReturn = reportIsStale ? null : report?.estimatedReturn ?? null

  return (
    <SimulatorStateContext.Provider value={{
      ...input, setFates, setPrimos, setUseStarglitter, setTargets, setNames,
      simCount, loading, report, reportIsStale, inputErrors, startSim, effectiveFates, estimatedReturn,
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
