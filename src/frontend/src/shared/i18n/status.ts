import type { AnalysisOverallStatus } from '../domain/contracts'

import { i18n } from './init'

export function formatAnalysisStatus(status: AnalysisOverallStatus) {
  switch (status) {
    case 'Safe':
      return i18n.t('Analysis.Safe', { ns: 'common' })
    case 'MayContain':
      return i18n.t('Analysis.MayContainTraces', { ns: 'common' })
    case 'Contains':
      return i18n.t('Analysis.ContainsAllergen', { ns: 'common' })
    default:
      return i18n.t('Analysis.Unknown', { ns: 'common' })
  }
}

export function formatCheckedStatus(status: 'Contains' | 'MayContain' | 'NotFound' | 'Unknown') {
  switch (status) {
    case 'Contains':
      return i18n.t('Checked.Contains', { ns: 'common' })
    case 'MayContain':
      return i18n.t('Checked.MayContain', { ns: 'common' })
    case 'NotFound':
      return i18n.t('Checked.NotFound', { ns: 'common' })
    default:
      return i18n.t('Checked.Unknown', { ns: 'common' })
  }
}

export function formatPreviewStatus(status: AnalysisOverallStatus | null | undefined) {
  switch (status) {
    case 'Safe':
      return i18n.t('Preview.Safe', { ns: 'common' })
    case 'MayContain':
      return i18n.t('Preview.Caution', { ns: 'common' })
    case 'Contains':
      return i18n.t('Preview.Warning', { ns: 'common' })
    default:
      return i18n.t('Preview.Info', { ns: 'common' })
  }
}

export function formatCollectionStatus(status: AnalysisOverallStatus) {
  switch (status) {
    case 'Safe':
      return i18n.t('Collection.Safe', { ns: 'common' })
    case 'MayContain':
      return i18n.t('Collection.Caution', { ns: 'common' })
    case 'Contains':
      return i18n.t('Collection.Warning', { ns: 'common' })
    default:
      return i18n.t('Collection.Unknown', { ns: 'common' })
  }
}
