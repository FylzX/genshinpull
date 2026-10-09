"use client"

import { useState } from "react"
import { CircleHelp } from "lucide-react"
import { Popover } from "radix-ui"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CapturingRadianceInputProps = {
  id: string
  value: number
  onValueChange: (value: number) => void
}

export function CapturingRadianceInput({ id, value, onValueChange }: CapturingRadianceInputProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="font-semibold text-zinc-700 dark:text-zinc-300">
        初始捕获明光计数:
      </Label>
      <Select value={String(value)} onValueChange={next => onValueChange(Number(next))}>
        <SelectTrigger id={id} className="w-16 bg-white/70 dark:bg-black/70">
          <SelectValue>{String(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="min-w-0 w-(--radix-select-trigger-width)">
          {[0, 1, 2, 3].map(counter => (
            <SelectItem key={counter} value={String(counter)}>{String(counter)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label="初始捕获明光计数说明"
            aria-describedby={helpOpen ? `${id}-help` : undefined}
            onPointerEnter={event => {
              if (event.pointerType === "mouse") setHelpOpen(true)
            }}
            onPointerLeave={event => {
              if (event.pointerType === "mouse") setHelpOpen(false)
            }}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#FFB7C5] hover:bg-[#FFB7C5]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            <CircleHelp size={20} aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            id={`${id}-help`}
            side="top"
            sideOffset={8}
            collisionPadding={12}
            onOpenAutoFocus={event => event.preventDefault()}
            onCloseAutoFocus={event => event.preventDefault()}
            className="z-50 max-w-[calc(100vw-24px)] rounded-xl border border-[#FFB7C5]/30 bg-white/95 px-4 py-3 text-sm text-zinc-700 shadow-lg backdrop-blur-md dark:bg-zinc-900/95 dark:text-zinc-200"
          >
            如果你不知道这是什么, 默认1就行
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
