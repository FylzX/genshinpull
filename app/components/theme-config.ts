import type { CSSProperties } from "react"
import backgrounds from "../background.json"

type ThemeConfig = {
  enabled: boolean
  colors: {
    accent: string
    accentHover: string
    accentHoverSurface: string
    accentHoverForeground: string
    accentSurface: string
    accentSurfaceDark50: string
    chartStart: string
    chartMiddle: string
    chartEnd: string
    chartCursor: string
  }
  featuredCharacter: string
  featuredWeapon: string
  backgroundImages: string[]
  readmeHref: string
  readmeLabel: string
  probabilityHref: string
  messages: {
    negativeResources: { title: string; detail: string }
    emptyTargets: { title: string; detail: string }
    footer: { title: string; detail: string }
  }
}

type ThemeRegistry = Record<string, ThemeConfig> & {
  citlali: Omit<ThemeConfig, "enabled"> & { enabled: true }
}

export const themeConfig = {
  citlali: {
    enabled: true,
    colors: {
      accent: "#FFB7C5",
      accentHover: "#ff9eb2",
      accentHoverSurface: "#FFB7C5",
      accentHoverForeground: "#ffffff",
      accentSurface: "#fff0f5",
      accentSurfaceDark50: "rgba(42, 26, 32, 0.5)",
      chartStart: "#f1aec9",
      chartMiddle: "#fcccee",
      chartEnd: "#92e7ef",
      chartCursor: "#FFB7C5",
    },
    featuredCharacter: "茜特菈莉",
    featuredWeapon: "祭星者之望",
    backgroundImages: backgrounds.citlali.images,
    readmeHref: "/readme_citlali.html",
    readmeLabel: "[点这里]奶奶给你准备的使用说明",
    probabilityHref: "/prob_citlali.html",
    messages: {
      negativeResources: {
        title: "怎么,负债累累还想来抽卡?",
        detail: "奶奶我可没时间陪你在这里浪费, 哼!",
      },
      emptyTargets: {
        title: "怎么, 谁都不想抽?",
        detail: "奶奶我可没时间陪你在这里浪费, 哼!",
      },
      footer: {
        title: "下滑欣赏奶奶我的美貌~",
        detail: "不想看？哼，随便你！我，我才不在乎呢...",
      },
    },
  },
  odette: {
    enabled: true,
    colors: {
      accent: "rgb(46, 218, 255)",
      accentHover: "rgb(24, 185, 224)",
      accentHoverSurface: "rgba(46, 218, 255, 0.12)",
      accentHoverForeground: "rgb(24, 24, 27)",
      accentSurface: "#e0fbff",
      accentSurfaceDark50: "rgba(18, 59, 74, 0.5)",
      chartStart: "#f1aec9",
      chartMiddle: "#fcccee",
      chartEnd: "#92e7ef",
      chartCursor: "#FFB7C5",
    },
    featuredCharacter: "奥黛塔",
    featuredWeapon: "白湖冬羽",
    backgroundImages: backgrounds.odette.images,
    readmeHref: "/readme_odette.html",
    readmeLabel: "[点这里]奥黛塔准备的使用说明",
    probabilityHref: "/prob_odette.html",
    messages: {
      negativeResources: {
        title: "原石或粉球数量存在负数",
        detail: ":(",
      },
      emptyTargets: {
        title: "角色A与角色B目标均为0",
        detail: ":(",
      },
      footer: {
        title: "谢谢你的支持",
        detail: "下面是我的照片",
      },
    },
  },
} satisfies ThemeRegistry

export type SimulatorTheme = keyof typeof themeConfig

export function getThemeStyle(theme: SimulatorTheme): CSSProperties {
  const colors = themeConfig[theme].colors
  return {
    "--theme-accent": colors.accent,
    "--theme-accent-hover": colors.accentHover,
    "--theme-accent-hover-surface": colors.accentHoverSurface,
    "--theme-accent-hover-foreground": colors.accentHoverForeground,
    "--theme-accent-surface": colors.accentSurface,
    "--theme-accent-surface-dark-50": colors.accentSurfaceDark50,
    "--motion-accent": colors.accent,
  } as CSSProperties
}
