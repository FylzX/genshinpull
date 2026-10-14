"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { defaultTheme, enabledThemes } from "./components/theme-registry"
import { getThemeStyle } from "./components/theme-config"
import type { SimulatorTheme } from "./components/theme-types"
import { SimulatorStateProvider } from "./components/simulator-state"
import { SimulatorThemeToggle } from "./components/simulator-floating-controls"
import { CitlaliInterface } from "./components/citlali-interface"

type ThemeBackground = { images: [string, string]; active: 0 | 1 }

export default function GenshinSimulatorPage() {
  const [theme, setTheme] = useState<SimulatorTheme>(defaultTheme)
  const [highlightCycle, setHighlightCycle] = useState(false)
  const themeRef = useRef<SimulatorTheme>(defaultTheme)
  const switchSequence = useRef(0)
  const switchFrames = useRef<number[]>([])
  const [backgrounds, setBackgrounds] = useState<Partial<Record<SimulatorTheme, ThemeBackground>>>({})

  // Select menus render in a body portal, so they need the same variables on <html>.
  useLayoutEffect(() => {
    const root = document.documentElement
    const variables = Object.entries(getThemeStyle(theme))
    variables.forEach(([name, value]) => root.style.setProperty(name, String(value)))
    root.dataset.simulatorTheme = theme
    root.dataset.themeHighlightCycle = highlightCycle ? "b" : "a"
    return () => {
      variables.forEach(([name]) => root.style.removeProperty(name))
      delete root.dataset.simulatorTheme
      delete root.dataset.themeHighlightCycle
    }
  }, [theme, highlightCycle])

  useEffect(() => () => {
    switchFrames.current.forEach(window.cancelAnimationFrame)
    document.documentElement.classList.remove("theme-highlight-suppressed")
    document.documentElement.classList.remove("theme-switching")
  }, [])

  const toggleTheme = useCallback((origin: { x: number; y: number }) => {
    if (enabledThemes.length < 2) return
    const root = document.documentElement
    const otherThemes = enabledThemes.filter(candidate => candidate !== themeRef.current)
    let recentThemes: SimulatorTheme[] = []
    try {
      const stored = JSON.parse(localStorage.getItem("recentSimulatorThemes") || "[]")
      recentThemes = Array.isArray(stored)
        ? stored.filter((id): id is SimulatorTheme => typeof id === "string" && enabledThemes.includes(id as SimulatorTheme))
        : []
    } catch {}
    const freshThemes = otherThemes.filter(candidate => !recentThemes.includes(candidate))
    const candidates = freshThemes.length > 0 ? freshThemes : otherThemes
    const nextTheme = candidates[Math.floor(Math.random() * candidates.length)]
    try {
      localStorage.setItem(
        "recentSimulatorThemes",
        JSON.stringify([nextTheme, ...recentThemes.filter(candidate => candidate !== nextTheme)].slice(0, 3)),
      )
    } catch {}
    const sequence = ++switchSequence.current
    themeRef.current = nextTheme

    // Suppress inside commit so the old view-transition snapshot keeps the featured highlight.
    const commit = () => {
      root.classList.add("theme-highlight-suppressed")
      setTheme(nextTheme)
      setHighlightCycle(current => !current)
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

  const updateBackground = useCallback((backgroundTheme: SimulatorTheme, background: string) => {
    setBackgrounds(current => {
      const currentTheme = current[backgroundTheme]
      if (currentTheme?.images[currentTheme.active] === background) return current
      if (!currentTheme) {
        return { ...current, [backgroundTheme]: { images: [background, ""], active: 0 } }
      }
      const nextLayer: 0 | 1 = currentTheme.active === 0 ? 1 : 0
      const nextImages: [string, string] = [...currentTheme.images]
      nextImages[nextLayer] = background
      return { ...current, [backgroundTheme]: { images: nextImages, active: nextLayer } }
    })
  }, [])

  const handleBackgroundChange = useCallback((background: string) => {
    updateBackground(theme, background)
  }, [theme, updateBackground])
  const activeBackground = backgrounds[theme]

  return (
    <SimulatorStateProvider>
      <div
        className="simulator-theme-root"
        style={getThemeStyle(theme)}
      >
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
      <CitlaliInterface
        theme={theme}
        currentBackground={activeBackground ? activeBackground.images[activeBackground.active] : ""}
        onBackgroundChange={handleBackgroundChange}
      />
      <SimulatorThemeToggle onToggleTheme={toggleTheme} disabled={enabledThemes.length < 2} />
      </div>
    </SimulatorStateProvider>
  )
}
