"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

type NumberInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number
  onValueChange: (value: number) => void
}

// Keep the draft while editing so an empty input can represent zero.
export function NumberInput({ value, onValueChange, onBlur, ...props }: NumberInputProps) {
  const [draft, setDraft] = React.useState(Number.isNaN(value) ? "" : String(value))
  const parsed = Number(draft)
  const shown = parsed === value || Number.isNaN(value) ? draft : String(value)

  return (
    <Input
      {...props}
      type="number"
      value={shown}
      onChange={e => {
        const next = e.target.value.replace(/^(-?)0+(?=\d)/, "$1")
        setDraft(next)
        onValueChange(e.target.validity.badInput ? Number.NaN : Number(next))
      }}
      onBlur={e => {
        if (!Number.isNaN(value)) setDraft(String(value))
        onBlur?.(e)
      }}
    />
  )
}
