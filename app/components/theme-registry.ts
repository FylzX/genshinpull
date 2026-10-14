import { themeConfig } from "./theme-config"
import type { SimulatorTheme } from "./theme-types"

export const themeIds = Object.keys(themeConfig) as SimulatorTheme[]
export const enabledThemes = themeIds.filter(id => id === "citlali" || themeConfig[id].enabled)
export const defaultTheme: SimulatorTheme = "citlali"
