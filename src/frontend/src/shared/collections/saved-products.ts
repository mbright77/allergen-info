import type { AnalysisOverallStatus, AnalysisResponse } from '../domain/contracts'

import type { SavedProductItem } from './storage'

export function toSavedProductItem(response: AnalysisResponse): SavedProductItem {
  return {
    gtin: response.product.gtin,
    name: response.product.name,
    brand: response.product.brand,
    category: response.product.category,
    subtitle: response.product.subtitle,
    imageUrl: response.product.imageUrl,
    overallStatus: response.analysis.overallStatus as AnalysisOverallStatus,
    updatedAt: new Date().toISOString(),
  }
}
