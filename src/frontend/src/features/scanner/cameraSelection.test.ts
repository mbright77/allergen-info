import { describe, expect, it } from 'vitest'

import { pickPreferredRearCameraDeviceId } from './cameraSelection'

function createVideoInput(deviceId: string, label: string): MediaDeviceInfo {
  return {
    deviceId,
    groupId: '',
    kind: 'videoinput',
    label,
    toJSON: () => ({}),
  } as MediaDeviceInfo
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

  it('falls back to the active device when labels are unavailable', () => {
    const selectedDeviceId = pickPreferredRearCameraDeviceId([
      createVideoInput('device-1', ''),
      createVideoInput('device-2', ''),
    ], 'device-2')

    expect(selectedDeviceId).toBe('device-2')
  })
})