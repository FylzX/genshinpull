"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"

type SimulatorFloatingControlsProps = {
  showScrollTop: boolean
  onScrollTop: () => void
  onNextImage: () => void
}

export function SimulatorFloatingControls({ showScrollTop, onScrollTop, onNextImage }: SimulatorFloatingControlsProps) {
  return (
    <div className="fixed bottom-[4.75rem] right-6 z-[9999] flex flex-col items-end gap-3">
      <div className={`absolute bottom-[100%] right-0 mb-3 transition-all duration-500 ease-out origin-bottom ${showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
        <Button onClick={onScrollTop} className="h-10 px-4 rounded-xl bg-white/70 hover:bg-white/90 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 backdrop-blur-md shadow-md border border-[#FFB7C5]/40 flex items-center justify-center gap-1.5 text-[#FFB7C5] font-bold group transition-all">
          <svg className="w-4 h-4 animate-bounce group-hover:animate-none group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          返回顶部
        </Button>
      </div>
      <Button onClick={onNextImage} variant="outline" className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-10 px-3 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-black/60 dark:hover:bg-black/80 backdrop-blur-md border border-white/40 text-[#FFB7C5] shadow-md flex items-center justify-center gap-1.5 font-bold transition-all">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        切换背景
      </Button>
    </div>
  )
}

export const SimulatorThemeToggle = memo(function SimulatorThemeToggle({ onToggleTheme }: { onToggleTheme: () => void }) {
  return (
    <Button
      onClick={onToggleTheme}
      variant="outline"
      className="fixed bottom-6 right-6 z-[9999] h-10 px-3 rounded-xl bg-white/40 hover:bg-white/60 dark:bg-black/40 dark:hover:bg-black/60 backdrop-blur-md border border-white/30 text-zinc-800 dark:text-zinc-200 shadow-md flex items-center justify-center font-bold transition-all"
    >
      切换主题
    </Button>
  )
})
