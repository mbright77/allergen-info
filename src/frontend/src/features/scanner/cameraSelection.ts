type CameraSelection = string | { facingMode: { ideal: 'environment' } }

type VideoInputLike = Pick<MediaDeviceInfo, 'deviceId' | 'kind' | 'label'>

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

  if (/(front|user|selfie|facetime|truedepth)/.test(normalized)) {
    score -= 120
  }

  if (/(ultra\s*-?wide|wide\s*-?angle|fisheye|0\.5x)/.test(normalized)) {
    score -= 35
  }

  if (/macro/.test(normalized)) {
    score -= 25
  }

  if (/(tele|telephoto|zoom)/.test(normalized)) {
    score -= 20
  }

  return score
}

export function pickPreferredRearCameraDeviceId(
  devices: readonly VideoInputLike[],
  activeDeviceId?: string | null,
) {
  const rankedDevices = devices
    .filter((device) => device.kind === 'videoinput')
    .map((device) => ({
      deviceId: device.deviceId,
      score: scoreCameraLabel(device.label),
    }))
    .sort((left, right) => right.score - left.score)

  if (rankedDevices[0] && rankedDevices[0].score > 0) {
    return rankedDevices[0].deviceId
  }

  return activeDeviceId ?? null
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
