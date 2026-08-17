"use client"

import { RefObject } from "react"

type SimulatorBackgroundProps = {
  img1: string
  img2: string
  activeLayer: 1 | 2
  showVideo: boolean
  bgVideo: string
  isVideoSupported: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  onVideoError: () => void
}

export function SimulatorBackground({
  img1,
  img2,
  activeLayer,
  showVideo,
  bgVideo,
  isVideoSupported,
  videoRef,
  onVideoError,
}: SimulatorBackgroundProps) {
  return (
    <div data-theme-background className="fixed inset-0 -z-10 bg-zinc-900 overflow-hidden">
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
          (!showVideo && activeLayer === 1) ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: img1 ? `url(${img1})` : 'none' }}
      />
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
          (!showVideo && activeLayer === 2) ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: img2 ? `url(${img2})` : 'none' }}
      />

      {bgVideo && isVideoSupported && (
        <video
          ref={videoRef}
          src={bgVideo}
          autoPlay loop muted playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
          onError={onVideoError}
        />
      )}
    </div>
  )
}
