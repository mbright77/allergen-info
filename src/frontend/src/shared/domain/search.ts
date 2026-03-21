import type { AnalysisOverallStatus, SearchResult } from './contracts'

export function formatPreviewStatus(status: AnalysisOverallStatus | null | undefined) {
  switch (status) {
    case 'Safe':
      return 'Safe'
    case 'MayContain':
      return 'Caution'
    case 'Contains':
      return 'Warning'
    default:
      return 'Info'
  }
}

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
  return result.previewBadge ?? result.category ?? result.packageSize ?? 'Product overview'
}
