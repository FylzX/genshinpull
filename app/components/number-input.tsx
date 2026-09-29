"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

type NumberInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number
  onValueChange: (value: number) => void
}

// The input shows the user's own text while it still parses to `value`, so it can
// be emptied or hold "-". A string value prop also makes React rewrite "05" to "5",
// which it skips when given the number 5.
export function NumberInput({ value, onValueChange, onBlur, ...props }: NumberInputProps) {
  const [draft, setDraft] = React.useState(String(value))
  const parsed = Number(draft)
  const shown = parsed === value || Number.isNaN(parsed) ? draft : String(value)

  return (
    <Input
      {...props}
      type="number"
      value={shown}
      onChange={e => {
        const next = e.target.value.replace(/^(-?)0+(?=\d)/, "$1")
        setDraft(next)
        const n = Number(next)
        if (Number.isFinite(n)) onValueChange(n)
      }}
      onBlur={e => {
        setDraft(String(value))
        onBlur?.(e)
      }}
    />
  )
}
