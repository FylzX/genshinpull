import type { ComponentType } from "react"
import themeSettings from "../themes.json"
import { CitlaliInterface } from "./citlali-interface"
import { OdetteInterface } from "./odette-interface"
import type { SimulatorTheme, SimulatorThemeProps } from "./theme-types"

// Register each new theme here alongside its switch in themes.json.
export const themeInterfaces = {
  citlali: CitlaliInterface,
  odette: OdetteInterface,
} satisfies Record<SimulatorTheme, ComponentType<SimulatorThemeProps>>

export const themeIds = Object.keys(themeInterfaces) as SimulatorTheme[]

if (Object.values(themeSettings).some(enabled => typeof enabled !== "boolean")) {
  throw new Error("app/themes.json: 主题开关必须为 true 或 false。")
}

export const enabledThemes = themeIds.filter(id => themeSettings[id])

if (enabledThemes.length === 0) {
  throw new Error("app/themes.json: 至少启用一个主题，不能将所有主题设为 false。")
}

export const defaultTheme = enabledThemes[0]
