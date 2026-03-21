import {
  allergensSchema,
  analysisRequestSchema,
  analysisResponseSchema,
  productLookupResponseSchema,
  productSearchResponseSchema,
  type AnalysisRequest,
} from '../domain/contracts'
import { fetchJson } from './http'

export function getAllergens() {
  return fetchJson('/api/reference/allergens', allergensSchema)
}

export function getProductByGtin(gtin: string) {
  return fetchJson(`/api/products/gtin/${encodeURIComponent(gtin)}`, productLookupResponseSchema)
}

export function searchProducts(query: string, selectedAllergens: readonly string[] = []) {
  const searchParams = new URLSearchParams({ q: query })

  for (const allergen of selectedAllergens) {
    searchParams.append('selectedAllergens', allergen)
  }

  return fetchJson(`/api/products/search?${searchParams.toString()}`, productSearchResponseSchema)
}

export function analyzeProduct(request: AnalysisRequest) {
  const payload = analysisRequestSchema.parse(request)

  return fetchJson('/api/analysis', analysisResponseSchema, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
