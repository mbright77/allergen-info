import { describe, expect, it } from 'vitest'

import { pickPreferredRearCameraDeviceId, pickPreferredScanCameraId } from './cameraSelection'

function createVideoInput(deviceId: string, label: string): MediaDeviceInfo {
  return {
    deviceId,
    groupId: '',
    kind: 'videoinput',
    label,
    toJSON: () => ({}),
  } as MediaDeviceInfo
}

function createScanCamera(id: string, label: string) {
  return { id, label }
}

describe('pickPreferredRearCameraDeviceId', () => {
  it('prefers the rear main camera over the front camera', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('front', 'Front Camera'),
      createVideoInput('rear', 'Back Main Camera'),
    ])

    expect(selectedDeviceId).toBe('rear')
  })

  it('avoids ultrawide and macro lenses when a standard rear camera exists', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('ultrawide', 'Back Ultra-Wide Camera'),
      createVideoInput('macro', 'Back Macro Camera'),
      createVideoInput('main', 'Back Main Camera 1x'),
    ])

    expect(selectedDeviceId).toBe('main')
  })

  it('prefers the samsung-style 1.0x rear camera over ultrawide and telephoto lenses', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('ultrawide', 'Back Camera 0.5x'),
      createVideoInput('main', 'Back Camera 1.0x'),
      createVideoInput('telephoto', 'Back Camera 3.0x'),
    ])

    expect(selectedDeviceId).toBe('main')
  })

  it('falls back to the active device when labels are unavailable', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('device-1', ''),
      createVideoInput('device-2', ''),
    ], 'device-2')

    expect(selectedDeviceId).toBe('device-2')
  })

  it('keeps the active rear device when multiple rear cameras tie on a generic label', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('rear-top', 'Back Camera'),
      createVideoInput('rear-middle', 'Back Camera'),
      createVideoInput('front', 'Front Camera'),
    ], 'rear-middle')

    expect(selectedDeviceId).toBe('rear-middle')
  })

  it('prefers the lowest generic rear camera index for samsung chrome labels', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('camera-2', 'camera 2, facing back'),
      createVideoInput('camera-0', 'camera 0, facing back'),
      createVideoInput('camera-front', 'camera 1, facing front'),
    ], 'camera-2')

    expect(selectedDeviceId).toBe('camera-0')
  })

  it('switches away from an active ultrawide lens when a better labeled main lens exists', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('ultrawide', 'Back Camera 0.5x'),
      createVideoInput('main', 'Back Camera 1.0x'),
      createVideoInput('telephoto', 'Back Camera 3.0x'),
    ], 'ultrawide')

    expect(selectedDeviceId).toBe('main')
  })
})

describe('pickPreferredScanCameraId', () => {
  it('prefers the samsung-style 1.0x rear camera for scanning', () => {
    const selectedCameraId = pickPreferredScanCameraId([
      createScanCamera('ultrawide', 'Back Camera 0.5x'),
      createScanCamera('main', 'Back Camera 1.0x'),
      createScanCamera('telephoto', 'Back Camera 3.0x'),
    ])

    expect(selectedCameraId).toBe('main')
  })

  it('falls back to the active camera when scan camera labels are unavailable', () => {
    const selectedCameraId = pickPreferredScanCameraId(
      [createScanCamera('device-1', ''), createScanCamera('device-2', '')],
      'device-2',
    )

    expect(selectedCameraId).toBe('device-2')
  })

  it('keeps the active scan camera when generic rear labels tie', () => {
    const selectedCameraId = pickPreferredScanCameraId(
      [
        createScanCamera('rear-top', 'Back Camera'),
        createScanCamera('rear-middle', 'Back Camera'),
      ],
      'rear-middle',
    )

    expect(selectedCameraId).toBe('rear-middle')
  })

  it('prefers the lowest generic rear camera index when scan labels follow samsung chrome numbering', () => {
    const selectedCameraId = pickPreferredScanCameraId(
      [
        createScanCamera('camera-2', 'camera 2, facing back'),
        createScanCamera('camera-0', 'camera 0, facing back'),
      ],
      'camera-2',
    )

    expect(selectedCameraId).toBe('camera-0')
  })
})
