"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { defaultTheme, enabledThemes, themeIds, themeInterfaces } from "./components/theme-registry"
import type { SimulatorTheme } from "./components/theme-types"
import { SimulatorStateProvider } from "./components/simulator-state"
import { SimulatorThemeToggle } from "./components/simulator-floating-controls"

type ThemeBackground = { images: [string, string]; active: 0 | 1 }

export default function GenshinSimulatorPage() {
  const [theme, setTheme] = useState<SimulatorTheme>(defaultTheme)
  const [colorTheme, setColorTheme] = useState<SimulatorTheme>(defaultTheme)
  const themeRef = useRef<SimulatorTheme>(defaultTheme)
  const switchSequence = useRef(0)
  const switchFrames = useRef<number[]>([])
  const [backgrounds, setBackgrounds] = useState<Partial<Record<SimulatorTheme, ThemeBackground>>>({})

  useEffect(() => {
    themeIds.forEach(id => {
      document.documentElement.classList.toggle(`theme-${id}`, colorTheme === id)
    })

    return () => {
      document.documentElement.classList.remove(...themeIds.map(id => `theme-${id}`))
    }
  }, [colorTheme])

  useEffect(() => () => {
    switchFrames.current.forEach(window.cancelAnimationFrame)
    document.documentElement.classList.remove("theme-highlight-suppressed")
  }, [])

  const toggleTheme = useCallback((origin: { x: number; y: number }) => {
    if (enabledThemes.length < 2) return
    const root = document.documentElement
    const nextTheme = enabledThemes[(enabledThemes.indexOf(themeRef.current) + 1) % enabledThemes.length]
    const sequence = ++switchSequence.current
    themeRef.current = nextTheme

    // Suppress inside commit so the old view-transition snapshot keeps the featured highlight.
    const commit = () => {
      root.classList.add("theme-highlight-suppressed")
      setTheme(nextTheme)
      setColorTheme(nextTheme)
    }
    const releaseHighlight = () => {
      const firstFrame = window.requestAnimationFrame(() => {
        const secondFrame = window.requestAnimationFrame(() => {
          if (switchSequence.current === sequence) {
            root.classList.remove("theme-highlight-suppressed")
          }
        })
        switchFrames.current.push(secondFrame)
      })
      switchFrames.current.push(firstFrame)
    }

    if (typeof document.startViewTransition !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit()
      releaseHighlight()
      return
    }

    // Percentages, not px: Chromium on 2x displays places px clip-paths on view-transition snapshots at half the coordinates.
    const { innerWidth: w, innerHeight: h } = window
    const radius = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y))
    root.style.setProperty("--reveal-x", `${(origin.x / w) * 100}%`)
    root.style.setProperty("--reveal-y", `${(origin.y / h) * 100}%`)
    root.style.setProperty("--reveal-r", `${(radius / (Math.hypot(w, h) / Math.SQRT2)) * 100}%`)
    root.classList.add("theme-switching")
    const transition = document.startViewTransition(() => {
      flushSync(commit)
      releaseHighlight()
    })
    // A newer toggle skips this transition; only the latest one may clear the flag.
    transition.finished.finally(() => {
      if (switchSequence.current === sequence) root.classList.remove("theme-switching")
    })
  }, [])

  const updateBackground = (backgroundTheme: SimulatorTheme, background: string) => {
    setBackgrounds(current => {
      const currentTheme = current[backgroundTheme] ?? { images: ["", ""], active: 0 }
      if (currentTheme.images[currentTheme.active] === background) return current
      const nextLayer: 0 | 1 = currentTheme.active === 0 ? 1 : 0
      const nextImages: [string, string] = [...currentTheme.images]
      nextImages[nextLayer] = background
      return { ...current, [backgroundTheme]: { images: nextImages, active: nextLayer } }
    })
  }

  return (
    <SimulatorStateProvider>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-zinc-900">
        {enabledThemes.map(backgroundTheme => (
          <div
            key={backgroundTheme}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${theme === backgroundTheme ? "opacity-100" : "opacity-0"}`}
          >
            {backgrounds[backgroundTheme]?.images.map((background, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${backgrounds[backgroundTheme]?.active === index ? "opacity-100" : "opacity-0"}`}
                style={{ backgroundImage: background ? `url(${background})` : "none" }}
              />
            ))}
          </div>
        ))}
      </div>
      {enabledThemes.map(id => {
        const ThemeInterface = themeInterfaces[id]
        return (
          <div key={id} hidden={theme !== id} aria-hidden={theme !== id}>
            <ThemeInterface theme={id} onBackgroundChange={background => updateBackground(id, background)} />
          </div>
        )
      })}
      <SimulatorThemeToggle onToggleTheme={toggleTheme} disabled={enabledThemes.length < 2} />
    </SimulatorStateProvider>
  )
}
