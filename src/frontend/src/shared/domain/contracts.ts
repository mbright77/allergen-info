import { z } from 'zod'

export const allergenOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
})

export const allergensSchema = z.array(allergenOptionSchema)

export const nutritionSummarySchema = z.object({
  energyKcal: z.number().nullable(),
  sugarGrams: z.number().nullable(),
})

export const allergenStatementsSchema = z.object({
  contains: z.array(z.string()),
  mayContain: z.array(z.string()),
})

export const productSchema = z.object({
  gtin: z.string(),
  name: z.string(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  ingredientsText: z.string(),
  allergenStatements: allergenStatementsSchema,
  nutritionSummary: nutritionSummarySchema.nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  source: z.string(),
})

export const productLookupResponseSchema = z.object({
  product: productSchema,
})

export const analysisOverallStatusSchema = z.enum(['Safe', 'MayContain', 'Contains', 'Unknown'])

export const allergenMatchStatusSchema = z.enum(['Contains', 'MayContain', 'NotFound', 'Unknown'])

export const searchResultSchema = z.object({
  gtin: z.string(),
  name: z.string(),
  subtitle: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  packageSize: z.string().nullable().optional(),
  articleNumber: z.string().nullable().optional(),
  articleType: z.string().nullable().optional(),
  previewStatus: analysisOverallStatusSchema.nullable().optional(),
  previewBadge: z.string().nullable().optional(),
  previewNote: z.string().nullable().optional(),
  updatedAt: z.string().datetime(),
  source: z.string(),
})

export const productSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(searchResultSchema),
})

export const checkedAllergenSchema = z.object({
  code: z.string(),
  status: allergenMatchStatusSchema,
})

export const ingredientHighlightSchema = z.object({
  text: z.string(),
  severity: allergenMatchStatusSchema,
  allergenCode: z.string(),
})

export const analysisResultSchema = z.object({
  overallStatus: analysisOverallStatusSchema,
  matchedAllergens: z.array(z.string()),
  traceAllergens: z.array(z.string()),
  checkedAllergens: z.array(checkedAllergenSchema),
  ingredientHighlights: z.array(ingredientHighlightSchema),
  explanations: z.array(z.string()),
})

export const analysisRequestSchema = z.object({
  gtin: z.string(),
  selectedAllergens: z.array(z.string()),
})

export const analysisResponseSchema = z.object({
  product: productSchema,
  analysis: analysisResultSchema,
})

export type AllergenOption = z.infer<typeof allergenOptionSchema>
export type Product = z.infer<typeof productSchema>
export type ProductLookupResponse = z.infer<typeof productLookupResponseSchema>
export type SearchResult = z.infer<typeof searchResultSchema>
export type ProductSearchResponse = z.infer<typeof productSearchResponseSchema>
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>
export type AnalysisOverallStatus = z.infer<typeof analysisOverallStatusSchema>
