import type { AnalysisOverallStatus, SearchResult } from './contracts'
import { i18n } from '../i18n/init'
import { formatPreviewStatus } from '../i18n/status'

export { formatPreviewStatus }

export function toStatusClassName(status: AnalysisOverallStatus | null | undefined) {
  switch (status) {
    case 'Safe':
      return 'safe'
    case 'MayContain':
      return 'caution'
    case 'Contains':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function getSearchCardMeta(result: SearchResult) {
  return result.packageSize ?? result.category ?? i18n.t('Generic.ProductOverview', { ns: 'common' })
}
