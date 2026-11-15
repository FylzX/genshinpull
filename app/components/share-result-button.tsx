"use client"

import { useEffect, useState } from "react"
import { Dialog } from "radix-ui"
import { Copy, Download, ImageIcon, Loader2, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { renderShareCard, type ShareCardInput } from "./share-card"

type ShareImage = { blob: Blob; url: string; file: File }

const ACTION_BUTTON = "h-10 gap-2 rounded-xl px-4 font-bold"

function fileName() {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  return `抽卡计算-${stamp}.png`
}

export function ShareResultButton(props: ShareCardInput) {
  const [image, setImage] = useState<ShareImage | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [canCopy, setCanCopy] = useState(false)

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url)
  }, [image])

  const open = async () => {
    setBusy(true)
    try {
      const blob = await renderShareCard(props)
      const file = new File([blob], fileName(), { type: "image/png" })
      setCanShare(typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }))
      setCanCopy(typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function")
      setCopied(false)
      setImage({ blob, url: URL.createObjectURL(blob), file })
    } catch (error) {
      console.error(error)
      alert("生成分享图失败, 请重试")
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!image) return
    const link = document.createElement("a")
    link.href = image.url
    link.download = image.file.name
    link.click()
  }

  const share = async () => {
    if (!image) return
    try {
      await navigator.share({ files: [image.file], title: "原神抽卡概率计算器" })
    } catch {}
  }

  const copy = async () => {
    if (!image) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image.blob })])
      setCopied(true)
    } catch {
      alert("复制失败, 请使用保存图片")
    }
  }

  return (
    <>
      <Button
        onClick={open}
        disabled={busy}
        variant="outline"
        className="mt-4 h-10 gap-2 rounded-xl border-theme-accent/50 bg-white/70 px-4 font-bold text-theme-accent hover:bg-white dark:bg-black/40"
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImageIcon aria-hidden="true" />}
        {busy ? "生成中" : "生成分享图"}
      </Button>

      <Dialog.Root open={image !== null} onOpenChange={next => { if (!next) setImage(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 dark:bg-zinc-900/90">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold">分享图</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800" aria-label="关闭">
                <X size={20} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">预览并保存本次计算结果的分享图</Dialog.Description>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="计算结果分享图" className="min-h-0 w-full flex-1 rounded-xl object-contain shadow-md" />
            )}
            <p className="text-center text-xs text-zinc-500 sm:hidden">手机上也可以长按图片保存</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={save} className={`${ACTION_BUTTON} bg-theme-accent text-zinc-900 hover:bg-[var(--theme-accent-hover)]`}>
                <Download aria-hidden="true" />保存图片
              </Button>
              {canShare && (
                <Button onClick={share} variant="outline" className={ACTION_BUTTON}>
                  <Share2 aria-hidden="true" />分享
                </Button>
              )}
              {canCopy && (
                <Button onClick={copy} variant="outline" className={ACTION_BUTTON}>
                  <Copy aria-hidden="true" />{copied ? "已复制" : "复制图片"}
                </Button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
