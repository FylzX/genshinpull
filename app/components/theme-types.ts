import type themeSettings from "../themes.json"

export type SimulatorTheme = keyof typeof themeSettings

export type SimulatorThemeProps = {
  theme: SimulatorTheme
  onBackgroundChange: (background: string) => void
}
