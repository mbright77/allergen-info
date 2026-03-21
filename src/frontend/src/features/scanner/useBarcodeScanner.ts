import { useEffect, useRef, useState } from 'react'

type ScannerStatus = 'idle' | 'requesting' | 'active' | 'unsupported' | 'denied' | 'error'

type UseBarcodeScannerOptions = {
  enabled: boolean
  onDetected: (value: string) => void
}

export function useBarcodeScanner({ enabled, onDetected }: UseBarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastDetectedRef = useRef<{ value: string; timestamp: number } | null>(null)
  const scannerRef = useRef<{ stop: () => void } | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
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
      return
    }

    let isCancelled = false

    async function startScanner() {
      setStatus('requesting')
      setErrorMessage(null)

      try {
        const [{ BrowserMultiFormatReader }, { NotFoundException }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])

        if (isCancelled || !videoRef.current) {
          return
        }

        const reader = new BrowserMultiFormatReader()

        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            const nextValue = result.getText().trim()
            const now = Date.now()
            const lastDetected = lastDetectedRef.current

            if (
              !nextValue ||
              (lastDetected &&
                lastDetected.value === nextValue &&
                now - lastDetected.timestamp < 2500)
            ) {
              return
            }

            lastDetectedRef.current = { value: nextValue, timestamp: now }
            onDetected(nextValue)
          }

          if (error && !(error instanceof NotFoundException)) {
            setStatus('error')
            setErrorMessage('The camera is active, but scanning failed unexpectedly.')
          }
        })

        if (isCancelled) {
          controls.stop()
          return
        }

        scannerRef.current = controls
        setStatus('active')
      } catch (error) {
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
      scannerRef.current?.stop()
      scannerRef.current = null
    }
  }, [enabled, onDetected])

  return {
    videoRef,
    status,
    errorMessage,
  }
}
