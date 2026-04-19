import '@testing-library/jest-dom/vitest'

import { beforeAll } from 'vitest'

import { initTestI18n } from '../shared/i18n/test-init'

beforeAll(async () => {
  await initTestI18n()
})
