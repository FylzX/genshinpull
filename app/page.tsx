"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

  const toggleTheme = useCallback(() => {
    if (enabledThemes.length < 2) return
    const nextTheme = enabledThemes[(enabledThemes.indexOf(themeRef.current) + 1) % enabledThemes.length]
    const sequence = ++switchSequence.current
    themeRef.current = nextTheme
    document.documentElement.classList.add("theme-highlight-suppressed")
    setTheme(nextTheme)
    setColorTheme(nextTheme)

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        if (switchSequence.current === sequence) {
          document.documentElement.classList.remove("theme-highlight-suppressed")
        }
      })
      switchFrames.current.push(secondFrame)
    })
    switchFrames.current.push(firstFrame)
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
