type CameraSelection = string | { facingMode: { ideal: 'environment' } }

type VideoInputLike = Pick<MediaDeviceInfo, 'deviceId' | 'kind' | 'label'>
type ScanCameraLike = { id: string; label: string }

const DEFAULT_CAMERA_SELECTION = { facingMode: { ideal: 'environment' } } as const

function scoreCameraLabel(label: string) {
  const normalized = label.trim().toLowerCase()

  if (!normalized) {
    return 0
  }

  let score = 0

  if (/(back|rear|environment|world)/.test(normalized)) {
    score += 100
  }

  if (/(main|default|standard|1x)/.test(normalized)) {
    score += 30
  }

  if (/\b1(?:[.,]0)?x\b/.test(normalized)) {
    score += 40
  }

  if (/(front|user|selfie|facetime|truedepth)/.test(normalized)) {
    score -= 120
  }

  if (/(ultra\s*-?wide|wide\s*-?angle|fisheye|0(?:[.,]5)?x)/.test(normalized)) {
    score -= 35
  }

  if (/macro/.test(normalized)) {
    score -= 25
  }

  if (/(tele|telephoto|zoom)/.test(normalized)) {
    score -= 20
  }

  if (/\b(?:2|3|4|5|10)(?:[.,]0)?x\b/.test(normalized)) {
    score -= 25
  }

  return score
}

function rankPreferredCameraId<T extends { label: string }>(
  devices: readonly T[],
  getId: (device: T) => string,
  activeDeviceId?: string | null,
) {
  const rankedDevices = devices
    .map((device) => ({
      id: getId(device),
      score: scoreCameraLabel(device.label),
    }))
    .sort((left, right) => right.score - left.score)

  if (rankedDevices[0] && rankedDevices[0].score > 0) {
    return rankedDevices[0].id
  }

  return activeDeviceId ?? null
}

export function pickPreferredRearCameraDeviceId(
  devices: readonly VideoInputLike[],
  activeDeviceId?: string | null,
) {
  return rankPreferredCameraId(
    devices.filter((device) => device.kind === 'videoinput'),
    (device) => device.deviceId,
    activeDeviceId,
  )
}

export function pickPreferredScanCameraId(
  cameras: readonly ScanCameraLike[],
  activeCameraId?: string | null,
) {
  return rankPreferredCameraId(cameras, (camera) => camera.id, activeCameraId)
}

export async function resolvePreferredRearCameraSelection(): Promise<CameraSelection> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia ||
    !navigator.mediaDevices?.enumerateDevices
  ) {
    return DEFAULT_CAMERA_SELECTION
  }

  let tempStream: MediaStream | null = null

  try {
    tempStream = await navigator.mediaDevices.getUserMedia({
      video: DEFAULT_CAMERA_SELECTION,
    })

    const activeTrack = tempStream.getVideoTracks()[0]
    const activeDeviceId = activeTrack?.getSettings().deviceId ?? null
    const devices = await navigator.mediaDevices.enumerateDevices()
    const preferredDeviceId = pickPreferredRearCameraDeviceId(devices, activeDeviceId)

    return preferredDeviceId ?? DEFAULT_CAMERA_SELECTION
  } catch {
    return DEFAULT_CAMERA_SELECTION
  } finally {
    tempStream?.getTracks().forEach((track) => track.stop())
  }
}

export async function resolvePreferredScanCameraSelection(
  getCameras: () => Promise<readonly ScanCameraLike[]>,
): Promise<CameraSelection> {
  try {
    const cameras = await getCameras()
    const preferredCameraId = pickPreferredScanCameraId(cameras)

    if (preferredCameraId) {
      return preferredCameraId
    }
  } catch {
    // fall through to the broader environment-camera fallback
  }

  return resolvePreferredRearCameraSelection()
}
