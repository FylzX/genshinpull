import type { SimulatorTheme } from "./theme-config"
export type { SimulatorTheme } from "./theme-config"

export type SimulatorThemeProps = {
  theme: SimulatorTheme
  currentBackground: string
  onBackgroundChange: (background: string) => void
}
