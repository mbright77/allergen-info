import { useEffect, useRef, useState } from 'react'

type ScannerStatus = 'idle' | 'requesting' | 'active' | 'unsupported' | 'denied' | 'error'

type UseBarcodeScannerOptions = {
  enabled: boolean
  onDetected: (value: string) => void
}

type ScannerControls = {
  stop: () => void
  toggleTorch?: (on?: boolean) => Promise<boolean>
  setZoom?: (value: number) => Promise<boolean>
  getCapabilities?: () => MediaTrackCapabilities | null
}

export function useBarcodeScanner({ enabled, onDetected }: UseBarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastDetectedRef = useRef<{ value: string; timestamp: number } | null>(null)
  const scannerRef = useRef<ScannerControls | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setStatus('idle')
      setErrorMessage(null)
      scannerRef.current?.stop()
      scannerRef.current = null
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
        videoRef.current.srcObject = null
      }
      return
    }

    const testBarcode = (window as Window & { __SAFE_SCAN_TEST_BARCODE__?: string }).__SAFE_SCAN_TEST_BARCODE__

    if (testBarcode) {
      setStatus('active')
      setErrorMessage(null)

      const timeoutId = window.setTimeout(() => {
        onDetected(testBarcode)
      }, 150)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      setErrorMessage('Live barcode scanning is not available in this browser right now.')
      return
    }

    let isCancelled = false

    async function startScanner() {
      setStatus('requesting')
      setErrorMessage(null)

      try {
        const [{ BrowserMultiFormatReader }, library] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])

        if (isCancelled || !videoRef.current) {
          return
        }

        // Prepare hints to improve detection speed/accuracy
        const { DecodeHintType, BarcodeFormat } = library
        const hints = new Map()
        hints.set(DecodeHintType.TRY_HARDER, true)
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.QR_CODE,
        ])

        const reader = new BrowserMultiFormatReader(hints)

        // Acquire camera ourselves so we can query track capabilities
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        mediaStreamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const track = stream.getVideoTracks()[0]
        trackRef.current = track

        let caps: MediaTrackCapabilities | null = null
        try {
          caps = track.getCapabilities ? track.getCapabilities() : null
        } catch (e) {
          caps = null
        }

        const controls = await reader.decodeFromVideoElement(videoRef.current, (result: any, error: any) => {
          if (result) {
            const nextValue = String(result.getText()).trim()
            const now = Date.now()
            const lastDetected = lastDetectedRef.current

            if (
              !nextValue ||
              (lastDetected && lastDetected.value === nextValue && now - lastDetected.timestamp < 2500)
            ) {
              return
            }

            lastDetectedRef.current = { value: nextValue, timestamp: now }
            onDetected(nextValue)
          }

          // Ignore common NotFoundException as non-fatal (library provides name)
          if (error && error.name && error.name !== 'NotFoundException') {
            // Non-fatal: log for diagnostics but don't flip to fatal error state
            // console.warn('Scanner error', error)
          }
        })

        if (isCancelled) {
          controls.stop()
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        // Create a small wrapper controls object that exposes applyConstraints helpers
        const wrapper: ScannerControls = {
          stop: () => {
            try {
              controls.stop()
            } catch (e) {
              // ignore
            }
            try {
              stream.getTracks().forEach((t) => t.stop())
            } catch (e) {
              // ignore
            }
          },
          getCapabilities: () => caps,
          toggleTorch: async (on?: boolean) => {
            if (!track) return false
            try {
              const hasTorch = !!(caps && (caps as any).torch)
              if (!hasTorch) return false
              await track.applyConstraints({ advanced: [{ torch: !!on }] })
              return true
            } catch (e) {
              return false
            }
          },
          setZoom: async (value: number) => {
            if (!track) return false
            try {
              const zoomCap = caps && (caps as any).zoom
              if (!zoomCap) return false
              const min = (zoomCap as any).min ?? 1
              const max = (zoomCap as any).max ?? 1
              const clamped = Math.max(min, Math.min(max, value))
              await track.applyConstraints({ advanced: [{ zoom: clamped }] })
              return true
            } catch (e) {
              return false
            }
          },
        }

        scannerRef.current = wrapper
        setStatus('active')
      } catch (error: any) {
        if (isCancelled) {
          return
        }

        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setStatus('denied')
          setErrorMessage('Camera access was denied. You can still use text search above.')
          return
        }

        setStatus('unsupported')
        setErrorMessage('Live barcode scanning is not available in this browser right now.')
      }
    }

    startScanner()

    return () => {
      isCancelled = true
      try {
        scannerRef.current?.stop()
      } catch (e) {
        // ignore
      }
      scannerRef.current = null

      try {
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
          tracks.forEach((track) => track.stop())
          videoRef.current.srcObject = null
        }
      } catch (e) {
        // ignore
      }
    }
  }, [enabled, onDetected])

  return {
    videoRef,
    status,
    errorMessage,
    controls: scannerRef.current,
  }
}
