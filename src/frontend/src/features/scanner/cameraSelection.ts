export type CameraSelection = string | { facingMode: { ideal: 'environment' } }

type VideoInputLike = Pick<MediaDeviceInfo, 'deviceId' | 'kind' | 'label'>
type ScanCameraLike = { id: string; label: string }

export const DEFAULT_CAMERA_SELECTION = { facingMode: { ideal: 'environment' } } as const

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

function getGenericRearCameraIndex(label: string) {
  const normalized = label.trim().toLowerCase()
  const match = normalized.match(/^camera\s+(\d+),\s*facing\s+back$/)

  if (!match) {
    return null
  }

  return Number(match[1])
}

function rankPreferredCameraId<T extends { label: string }>(
  devices: readonly T[],
  getId: (device: T) => string,
  activeDeviceId?: string | null,
) {
  const rankedDevices = devices
    .map((device) => ({
      id: getId(device),
      genericRearIndex: getGenericRearCameraIndex(device.label),
      score: scoreCameraLabel(device.label),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (left.genericRearIndex != null && right.genericRearIndex != null) {
        return left.genericRearIndex - right.genericRearIndex
      }

      return 0
    })

  const activeDevice = activeDeviceId
    ? rankedDevices.find((device) => device.id === activeDeviceId)
    : null

  if (rankedDevices[0] && rankedDevices[0].score > 0) {
    if (
      activeDevice &&
      activeDevice.score === rankedDevices[0].score &&
      (
        (activeDevice.genericRearIndex == null && rankedDevices[0].genericRearIndex == null) ||
        activeDevice.genericRearIndex === rankedDevices[0].genericRearIndex
      )
    ) {
      return activeDevice.id
    }

    if (
      activeDevice &&
      activeDevice.score >= rankedDevices[0].score &&
      (
        activeDevice.genericRearIndex == null ||
        rankedDevices[0].genericRearIndex == null ||
        activeDevice.genericRearIndex === rankedDevices[0].genericRearIndex
      )
    ) {
      return activeDevice.id
    }

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
