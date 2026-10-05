"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const DONE_MS = 1200

type Phase = "idle" | "busy" | "done"

type CalculateButtonProps = {
  loading: boolean
  onClick: () => void | Promise<void>
  className?: string
}

export function CalculateButton({ loading, onClick, className }: CalculateButtonProps) {
  const [prevLoading, setPrevLoading] = useState(loading)
  const [done, setDone] = useState(false)
  const [pressCount, setPressCount] = useState(0)

  if (loading !== prevLoading) {
    setPrevLoading(loading)
    setDone(!loading)
  }

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => setDone(false), DONE_MS)
    return () => clearTimeout(timer)
  }, [done])

  const phase: Phase = loading ? "busy" : done ? "done" : "idle"

  return (
    <button
      type="button"
      className={cn("wish-button", className)}
      disabled={loading}
      data-loading={loading}
      data-phase={phase}
      onClick={() => {
        setPressCount((count) => count + 1)
        void onClick()
      }}
    >
      {pressCount > 0 && <span key={pressCount} className="wish-button__streak" aria-hidden="true" />}
      <span className="wish-button__labels">
        <span className="wish-button__label wish-button__label--idle" aria-hidden={phase !== "idle"}>
          开始计算
        </span>
        <span className="wish-button__label wish-button__label--busy" aria-hidden={phase !== "busy"}>
          祈愿中
        </span>
        <span className="wish-button__label wish-button__label--done" aria-hidden={phase !== "done"}>
          结果已出
        </span>
      </span>
    </button>
  )
}
