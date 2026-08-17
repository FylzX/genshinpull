"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CitlaliInterface } from "./components/citlali-interface"
import { OdetteInterface } from "./components/odette-interface"
import type { SimulatorTheme } from "./components/theme-types"
import { SimulatorStateProvider } from "./components/simulator-state"
import { SimulatorThemeToggle } from "./components/simulator-floating-controls"

export default function GenshinSimulatorPage() {
  const [theme, setTheme] = useState<SimulatorTheme>("citlali")
  const [colorTheme, setColorTheme] = useState<SimulatorTheme>("citlali")
  const themeRef = useRef<SimulatorTheme>("citlali")
  const switchSequence = useRef(0)
  const switchFrames = useRef<number[]>([])
  const [backgrounds, setBackgrounds] = useState<Record<SimulatorTheme, { images: [string, string]; active: 0 | 1 }>>({
    citlali: { images: ["", ""], active: 0 },
    odette: { images: ["", ""], active: 0 },
  })

  useEffect(() => {
    document.documentElement.classList.toggle("theme-odette", colorTheme === "odette")
    document.documentElement.classList.toggle("theme-citlali", colorTheme === "citlali")

    return () => {
      document.documentElement.classList.remove("theme-odette", "theme-citlali")
    }
  }, [colorTheme])

  useEffect(() => () => {
    switchFrames.current.forEach(window.cancelAnimationFrame)
    document.documentElement.classList.remove("theme-highlight-suppressed")
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme = themeRef.current === "citlali" ? "odette" : "citlali"
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
      const currentTheme = current[backgroundTheme]
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
        {(["citlali", "odette"] as const).map(backgroundTheme => (
          <div
            key={backgroundTheme}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${theme === backgroundTheme ? "opacity-100" : "opacity-0"}`}
          >
            {backgrounds[backgroundTheme].images.map((background, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${backgrounds[backgroundTheme].active === index ? "opacity-100" : "opacity-0"}`}
                style={{ backgroundImage: background ? `url(${background})` : "none" }}
              />
            ))}
          </div>
        ))}
      </div>
      <div hidden={theme !== "citlali"} aria-hidden={theme !== "citlali"}>
        <CitlaliInterface theme="citlali" onBackgroundChange={background => updateBackground("citlali", background)} />
      </div>
      <div hidden={theme !== "odette"} aria-hidden={theme !== "odette"}>
        <OdetteInterface theme="odette" onBackgroundChange={background => updateBackground("odette", background)} />
      </div>
      <SimulatorThemeToggle onToggleTheme={toggleTheme} />
    </SimulatorStateProvider>
  )
}
