"use client"

export const ODETTE_THEME_CLASS = "theme-odette"

export const ODETTE_THEME = {
  className: ODETTE_THEME_CLASS,
  readmeHref: "/readme_odette.html",
  accent: "rgb(46, 218, 255)",
  defaults: {
    cA: "茜特菈莉",
    cB: "奥黛塔",
    wA: "祭星者之望",
    wB: "白湖冬羽",
  },
  featuredCharacter: "奥黛塔",
  featuredWeapon: "白湖冬羽",
} as const

export function OdetteTheme({ children }: { children: React.ReactNode }) {
  return <div className={ODETTE_THEME_CLASS}>{children}</div>
}
