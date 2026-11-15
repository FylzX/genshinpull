import avatarData from "../avatar.json"
import type { SimulationTargets } from "@/lib/simulator"
import { themeConfig, type SimulatorTheme } from "./theme-config"

export type ShareSnapshot = {
  targets: SimulationTargets
  names: { cA: string; cB: string; wA: string; wB: string }
  budget: number
  useStarglitter: boolean
}

export type ShareCardInput = {
  theme: SimulatorTheme
  background: string
  prob: number
  pulls: number[]
  avgPulls: number
  snapshot: ShareSnapshot
}

const W = 1080
const PAD = 64
const PANEL_Y = 360
const CHIP_H = 96
const CHART_H = 210
const INK = "#27272a"
const MUTED = "#71717a"
const FALLBACK_HOST = "genshinpull.pages.dev"
// The page's own font stack resolves to the browser default serif, so the card names a sans stack itself.
const font = `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", system-ui, sans-serif`

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>(resolve => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1)
  return `${out}…`
}

function shareHost() {
  const host = window.location.host
  return !host || /^(localhost|127\.|\d+\.\d+\.\d+\.\d+)/.test(host) ? FALLBACK_HOST : host
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const { theme, prob, pulls, avgPulls, snapshot } = input
  const colors = themeConfig[theme].colors
  await document.fonts?.ready

  const items = ([
    { key: "cA", count: snapshot.targets.charA, isChar: true },
    { key: "cB", count: snapshot.targets.charB, isChar: true },
    { key: "wA", count: snapshot.targets.weapA, isChar: false },
    { key: "wB", count: snapshot.targets.weapB, isChar: false },
  ] as const)
    .filter(item => item.count > 0)
    .map(item => {
      const name = snapshot.names[item.key]
      return { ...item, name, icon: item.isChar ? avatarData.find(a => a.zh === name)?.icon ?? "" : "" }
    })

  const [background, ...icons] = await Promise.all([
    loadImage(input.background),
    ...items.map(item => loadImage(item.icon)),
  ])

  // The panel grows with the number of target rows; the art above it keeps a fixed height.
  const rows = Math.ceil(items.length / 2)
  const H = PANEL_Y + 92 + rows * (CHIP_H + 20) + 24 + 230 + 44 + CHART_H + 70 + 112 + 96 + PAD / 2
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not supported")

  // Backdrop: theme wallpaper, or the chart gradient when no wallpaper loaded.
  if (background) {
    drawCover(ctx, background, 0, 0, W, H)
  } else {
    const fill = ctx.createLinearGradient(W, 0, 0, H)
    fill.addColorStop(0, colors.chartStart)
    fill.addColorStop(0.4, colors.chartMiddle)
    fill.addColorStop(1, colors.chartEnd)
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, W, H)
  }

  // Frosted panel over the lower part, so the art stays visible on top.
  const panelY = PANEL_Y
  const panelH = H - panelY - PAD / 2
  ctx.save()
  roundRect(ctx, PAD / 2, panelY, W - PAD, panelH, 40)
  ctx.clip()
  if (background) {
    ctx.filter = "blur(28px)"
    drawCover(ctx, background, -40, -40, W + 80, H + 80)
    ctx.filter = "none"
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)"
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
  ctx.save()
  roundRect(ctx, PAD / 2, panelY, W - PAD, panelH, 40)
  ctx.lineWidth = 3
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"
  ctx.stroke()
  ctx.restore()

  // Title chip at the top-left.
  ctx.font = `700 34px ${font}`
  const title = "原神抽卡概率计算器"
  const titleW = ctx.measureText(title).width + 48
  roundRect(ctx, PAD / 2, PAD / 2, titleW, 68, 34)
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)"
  ctx.fill()
  ctx.fillStyle = INK
  ctx.textBaseline = "middle"
  ctx.fillText(title, PAD / 2 + 24, PAD / 2 + 35)

  const left = PAD
  const right = W - PAD
  const inner = right - left
  let y = panelY + 56

  // Targets, two per row.
  ctx.textBaseline = "middle"
  ctx.font = `600 26px ${font}`
  ctx.fillStyle = MUTED
  ctx.fillText("目标", left, y)
  y += 36
  const chipW = (inner - 24) / 2
  const chipH = CHIP_H
  items.forEach((item, index) => {
    const x = left + (index % 2) * (chipW + 24)
    const cy = y + Math.floor(index / 2) * (chipH + 20)
    roundRect(ctx, x, cy, chipW, chipH, 22)
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = colors.accent
    ctx.stroke()

    const iconSize = 72
    const ix = x + 12
    const iy = cy + 12
    ctx.save()
    roundRect(ctx, ix, iy, iconSize, iconSize, 16)
    ctx.clip()
    const icon = icons[index]
    if (icon) {
      ctx.fillStyle = "#f4f4f5"
      ctx.fillRect(ix, iy, iconSize, iconSize)
      ctx.drawImage(icon, ix, iy, iconSize, iconSize)
    } else {
      ctx.fillStyle = colors.accent
      ctx.fillRect(ix, iy, iconSize, iconSize)
      ctx.fillStyle = "#ffffff"
      ctx.font = `800 36px ${font}`
      ctx.textAlign = "center"
      ctx.fillText(item.isChar ? item.name.slice(0, 1) : "武", ix + iconSize / 2, iy + iconSize / 2 + 2)
      ctx.textAlign = "left"
    }
    ctx.restore()

    const countText = `×${item.count}`
    ctx.font = `800 36px ${font}`
    const countW = ctx.measureText(countText).width
    ctx.fillStyle = colors.accent
    ctx.fillText(countText, x + chipW - 20 - countW, cy + chipH / 2 + 2)
    ctx.font = `700 32px ${font}`
    ctx.fillStyle = INK
    ctx.fillText(fitText(ctx, item.name, chipW - iconSize - countW - 64), ix + iconSize + 18, cy + chipH / 2 + 2)
  })
  y += rows * (chipH + 20) + 24

  // Headline probability.
  ctx.textAlign = "center"
  ctx.fillStyle = prob > 0.5 ? "#22c55e" : "#f97316"
  ctx.font = `900 150px ${font}`
  ctx.fillText(`${(prob * 100).toFixed(2)}%`, W / 2, y + 80)
  y += 182
  ctx.fillStyle = "#52525b"
  ctx.font = `700 32px ${font}`
  ctx.fillText("预计成功率", W / 2, y)
  y += 48

  const { targets } = snapshot
  const state = [
    `${snapshot.budget} 抽${snapshot.useStarglitter ? " (含星辉返还)" : ""}`,
    `角色池垫 ${targets.charPity ?? 0}`,
    `武器池垫 ${targets.weapPity ?? 0}`,
    targets.isCharGuaranteed ? "大保底" : "小保底",
  ].join("  ·  ")
  ctx.font = `500 26px ${font}`
  ctx.fillStyle = MUTED
  ctx.fillText(fitText(ctx, state, inner), W / 2, y)
  ctx.textAlign = "left"
  y += 44

  // Distribution: bars at or under the budget are in theme colors, the rest grey.
  const chartTop = y
  const chartH = CHART_H
  const lo = pulls[0]
  const hi = Math.max(lo + 1, pulls[Math.min(pulls.length - 1, Math.floor(pulls.length * 0.995))])
  const bins = 48
  const binSize = (hi - lo + 1) / bins
  const counts = new Array<number>(bins).fill(0)
  for (const pull of pulls) counts[Math.min(bins - 1, Math.floor((pull - lo) / binSize))]++
  const peak = Math.max(...counts)
  const barGap = 4
  const barW = (inner - barGap * (bins - 1)) / bins
  const barFill = ctx.createLinearGradient(right, chartTop, left, chartTop + chartH)
  barFill.addColorStop(0, colors.chartStart)
  barFill.addColorStop(0.4, colors.chartMiddle)
  barFill.addColorStop(1, colors.chartEnd)
  counts.forEach((count, index) => {
    if (count === 0) return
    const h = Math.max(4, (count / peak) * chartH)
    const x = left + index * (barW + barGap)
    roundRect(ctx, x, chartTop + chartH - h, barW, h, [4, 4, 0, 0])
    ctx.fillStyle = lo + index * binSize <= snapshot.budget ? barFill : "rgba(161, 161, 170, 0.45)"
    ctx.fill()
  })
  ctx.fillStyle = "rgba(113, 113, 122, 0.4)"
  ctx.fillRect(left, chartTop + chartH, inner, 2)

  if (snapshot.budget >= lo && snapshot.budget <= hi) {
    const mx = left + ((snapshot.budget - lo) / (hi - lo + 1)) * inner
    ctx.strokeStyle = INK
    ctx.lineWidth = 3
    ctx.setLineDash([10, 8])
    ctx.beginPath()
    ctx.moveTo(mx, chartTop - 6)
    ctx.lineTo(mx, chartTop + chartH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = `700 24px ${font}`
    const label = `你的 ${snapshot.budget} 抽`
    const lw = ctx.measureText(label).width
    const lx = Math.min(right - lw, Math.max(left, mx + 10))
    ctx.fillStyle = INK
    ctx.fillText(label, lx, chartTop + 8)
  }
  ctx.font = `500 22px ${font}`
  ctx.fillStyle = MUTED
  ctx.fillText(`${lo} 抽`, left, chartTop + chartH + 26)
  ctx.textAlign = "right"
  ctx.fillText(`${hi} 抽`, right, chartTop + chartH + 26)
  ctx.textAlign = "left"
  y = chartTop + chartH + 70

  // Key numbers.
  const quantile = (p: number) => pulls[Math.max(0, Math.floor(pulls.length * p) - 1)]
  const stats = [
    { label: "50% 玩家", value: `${quantile(0.5)} 抽` },
    { label: "90% 玩家", value: `${quantile(0.9)} 抽` },
    { label: "平均消耗", value: `${avgPulls.toFixed(1)} 抽` },
  ]
  const statW = (inner - 32) / 3
  stats.forEach((stat, index) => {
    const x = left + index * (statW + 16)
    roundRect(ctx, x, y, statW, 112, 20)
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.fill()
    ctx.textAlign = "center"
    ctx.font = `600 24px ${font}`
    ctx.fillStyle = MUTED
    ctx.fillText(stat.label, x + statW / 2, y + 34)
    ctx.font = `800 40px ${font}`
    ctx.fillStyle = INK
    ctx.fillText(stat.value, x + statW / 2, y + 78)
  })

  // Footer.
  ctx.font = `500 24px ${font}`
  ctx.fillStyle = MUTED
  ctx.fillText(`${shareHost()}  ·  蒙特卡洛模拟 ${pulls.length.toLocaleString()} 次`, W / 2, y + 112 + 52)
  ctx.textAlign = "left"

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error("Could not encode image"))), "image/png")
  })
}
