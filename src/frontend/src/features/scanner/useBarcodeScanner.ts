import { useEffect, useRef, useState } from 'react'

import {
  DEFAULT_CAMERA_SELECTION,
  pickPreferredRearCameraDeviceId,
  type CameraSelection,
} from './cameraSelection'

type ScannerStatus = 'idle' | 'requesting' | 'active' | 'unsupported' | 'denied' | 'error'

type UseBarcodeScannerOptions = {
  enabled: boolean
  onDetected: (value: string) => void
}

type ScannerControls = {
  stop: () => void
  toggleTorch?: (on?: boolean) => Promise<boolean>
  setZoom?: (value: number) => Promise<boolean>
}

type ScannerZoomCapabilities = {
  min?: number
  max?: number
}

type ScannerViewState = {
  status: ScannerStatus
  errorMessage: string | null
  controls: ScannerControls | null
  zoomCapabilities: ScannerZoomCapabilities | null
}

type Html5QrcodeModule = typeof import('html5-qrcode')
type Html5QrcodeInstance = InstanceType<Html5QrcodeModule['Html5Qrcode']>
type ExtendedMediaTrackConstraints = MediaTrackConstraints & {
  resizeMode?: 'crop-and-scale' | 'none'
}
type FocusMode = 'continuous' | 'single-shot'

const SCANNER_ELEMENT_ID = 'barcode-scanner-region'
const DETECTION_COOLDOWN_MS = 2500
const DETECTION_CONFIRMATION_WINDOW_MS = 900
const REQUIRED_MATCHING_READS = 2

function getBarcodeScanBox(viewfinderWidth: number, viewfinderHeight: number) {
  const width = Math.max(240, Math.min(Math.floor(viewfinderWidth * 0.86), 420))
  const height = Math.max(90, Math.min(Math.floor(viewfinderHeight * 0.24), 150))

  return {
    width: Math.min(width, viewfinderWidth),
    height: Math.min(height, viewfinderHeight),
  }
}

async function stopAndClearScanner(instance: Html5QrcodeInstance | null) {
  if (!instance) {
    return
  }

  try {
    const state = instance.getState()
    if (state === 2 || state === 3) {
      await instance.stop()
    }
  } catch {
    // ignore stop errors during teardown
  }

  try {
    instance.clear()
  } catch {
    // ignore clear errors when the region was never rendered
  }
}

async function tryApplyAutofocusEnhancements(instance: Html5QrcodeInstance) {
  try {
    const caps = instance.getRunningTrackCapabilities()
    const focusModes = (caps as MediaTrackCapabilities & { focusMode?: FocusMode[] }).focusMode

    if (focusModes?.includes('continuous')) {
      await instance.applyVideoConstraints({
        advanced: [{ focusMode: 'continuous' } as MediaTrackConstraints],
      })
      return
    }

    if (focusModes?.includes('single-shot')) {
      await instance.applyVideoConstraints({
        advanced: [{ focusMode: 'single-shot' } as MediaTrackConstraints],
      })
    }
  } catch {
    // best effort only
  }
}

type ScannerStartConfig = {
  fps: number
  qrbox: typeof getBarcodeScanBox
  videoConstraints: ExtendedMediaTrackConstraints
}

async function maybeSwitchToPreferredRearCamera(
  instance: Html5QrcodeInstance,
  startConfig: ScannerStartConfig,
  onDecode: (decodedText: string) => void,
  onDecodeError: (errorMessage: string) => void,
) {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return false
  }

  try {
    const activeDeviceId = instance.getRunningTrackSettings().deviceId ?? null
    const devices = await navigator.mediaDevices.enumerateDevices()
    const preferredDeviceId = pickPreferredRearCameraDeviceId(devices, activeDeviceId)

    if (!preferredDeviceId || preferredDeviceId === activeDeviceId) {
      return false
    }

    await instance.stop()
    await instance.start(
      preferredDeviceId,
      startConfig,
      onDecode,
      onDecodeError,
    )

    return true
  } catch {
    return false
  }
}

export function useBarcodeScanner({ enabled, onDetected }: UseBarcodeScannerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scannerInstanceRef = useRef<Html5QrcodeInstance | null>(null)
  const controlsRef = useRef<ScannerControls | null>(null)
  const candidateDetectionRef = useRef<{ value: string; count: number; timestamp: number } | null>(null)
  const lastDetectedRef = useRef<{ value: string; timestamp: number } | null>(null)
  const [viewState, setViewState] = useState<ScannerViewState>({
    status: 'idle',
    errorMessage: null,
    controls: null,
    zoomCapabilities: null,
  })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setViewState({
        status: 'idle',
        errorMessage: null,
        controls: null,
        zoomCapabilities: null,
      })
      void stopAndClearScanner(scannerInstanceRef.current)
      scannerInstanceRef.current = null
      controlsRef.current = null
      candidateDetectionRef.current = null
      return
    }

    const testBarcode = (window as Window & { __SAFE_SCAN_TEST_BARCODE__?: string }).__SAFE_SCAN_TEST_BARCODE__

    if (testBarcode) {
      setViewState({
        status: 'active',
        errorMessage: null,
        controls: null,
        zoomCapabilities: null,
      })

      const timeoutId = window.setTimeout(() => {
        onDetected(testBarcode)
      }, 150)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || !containerRef.current) {
      setViewState({
        status: 'unsupported',
        errorMessage: 'Live barcode scanning is not available in this browser right now.',
        controls: null,
        zoomCapabilities: null,
      })
      return
    }

    let isCancelled = false

    async function startScanner() {
      setViewState({
        status: 'requesting',
        errorMessage: null,
        controls: null,
        zoomCapabilities: null,
      })

      try {
        const html5QrcodeModule = await import('html5-qrcode')

        if (isCancelled || !containerRef.current) {
          return
        }

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = html5QrcodeModule
        const instance = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
          ],
          verbose: false,
        })

        const handleDetectedText = (decodedText: string) => {
          const nextValue = String(decodedText).trim()
          const now = Date.now()
          const candidateDetection = candidateDetectionRef.current
          const lastDetected = lastDetectedRef.current

          if (!nextValue || (lastDetected && lastDetected.value === nextValue && now - lastDetected.timestamp < DETECTION_COOLDOWN_MS)) {
            return
          }

          if (
            candidateDetection &&
            candidateDetection.value === nextValue &&
            now - candidateDetection.timestamp < DETECTION_CONFIRMATION_WINDOW_MS
          ) {
            candidateDetectionRef.current = {
              value: nextValue,
              count: candidateDetection.count + 1,
              timestamp: now,
            }
          } else {
            candidateDetectionRef.current = {
              value: nextValue,
              count: 1,
              timestamp: now,
            }
          }

          if ((candidateDetectionRef.current?.count ?? 0) < REQUIRED_MATCHING_READS) {
            return
          }

          lastDetectedRef.current = { value: nextValue, timestamp: now }
          candidateDetectionRef.current = null
          onDetected(nextValue)
        }

        const startConfig: ScannerStartConfig = {
          fps: 8,
          qrbox: getBarcodeScanBox,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 24, max: 30 },
            resizeMode: 'crop-and-scale',
          } as ExtendedMediaTrackConstraints,
        }

        scannerInstanceRef.current = instance

        const cameraSelection: CameraSelection = DEFAULT_CAMERA_SELECTION

        await instance.start(
          cameraSelection,
          startConfig,
          handleDetectedText,
          () => {
            // not found callback is expected during normal scanning
          },
        )

        if (isCancelled) {
          await stopAndClearScanner(instance)
          return
        }

        const switchedCamera = await maybeSwitchToPreferredRearCamera(
          instance,
          startConfig,
          handleDetectedText,
          () => {
            // not found callback is expected during normal scanning
          },
        )

        if (switchedCamera && isCancelled) {
          await stopAndClearScanner(instance)
          return
        }

        await tryApplyAutofocusEnhancements(instance)

        const capabilities = (() => {
          try {
            return instance.getRunningTrackCapabilities() as MediaTrackCapabilities & {
              zoom?: ScannerZoomCapabilities
            }
          } catch {
            return null
          }
        })()

        const controls = {
          stop: () => {
            void stopAndClearScanner(instance)
          },
          toggleTorch: async (on?: boolean) => {
            try {
              const caps = instance.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean }
              if (!caps?.torch) {
                return false
              }

              await instance.applyVideoConstraints({
                advanced: [{ torch: !!on } as MediaTrackConstraints],
              })
              return true
            } catch {
              return false
            }
          },
          setZoom: async (value: number) => {
            try {
              const caps = instance.getRunningTrackCapabilities() as MediaTrackCapabilities & {
                zoom?: { min?: number; max?: number }
              }
              const zoomCap = caps?.zoom
              if (!zoomCap) {
                return false
              }

              const min = zoomCap.min ?? 1
              const max = zoomCap.max ?? 1
              const clamped = Math.max(min, Math.min(max, value))

              await instance.applyVideoConstraints({
                advanced: [{ zoom: clamped } as MediaTrackConstraints],
              })
              return true
            } catch {
              return false
            }
          },
        }
        controlsRef.current = controls

        setViewState({
          status: 'active',
          errorMessage: null,
          controls,
          zoomCapabilities: capabilities?.zoom ?? null,
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setViewState({
            status: 'denied',
            errorMessage: 'Camera access was denied. You can still use text search above.',
            controls: null,
            zoomCapabilities: null,
          })
          return
        }

        setViewState({
          status: 'unsupported',
          errorMessage: 'Live barcode scanning is not available in this browser right now.',
          controls: null,
          zoomCapabilities: null,
        })
      }
    }

    void startScanner()

    return () => {
      isCancelled = true
      void stopAndClearScanner(scannerInstanceRef.current)
      scannerInstanceRef.current = null
      controlsRef.current = null
      setViewState({
        status: 'idle',
        errorMessage: null,
        controls: null,
        zoomCapabilities: null,
      })
    }
  }, [enabled, onDetected])

  return {
    containerRef,
    status: viewState.status,
    errorMessage: viewState.errorMessage,
    controls: viewState.controls,
    zoomCapabilities: viewState.zoomCapabilities,
  }
}
