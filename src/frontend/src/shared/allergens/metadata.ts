import { i18n } from '../i18n/init'

const KNOWN_ALLERGEN_CODES = new Set([
  'cereals_containing_gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'tree_nuts',
  'celery',
  'mustard',
  'sesame_seeds',
  'sulphur_dioxide_sulphites',
  'lupin',
  'molluscs',
])

const ALLERGEN_ICONS: Record<string, string> = {
  cereals_containing_gluten: 'bakery_dining',
  crustaceans: 'restaurant',
  eggs: 'egg',
  fish: 'set_meal',
  peanuts: 'spa',
  soybeans: 'grass',
  milk: 'water_drop',
  tree_nuts: 'eco',
  celery: 'nutrition',
  mustard: 'lunch_dining',
  sesame_seeds: 'grain',
  sulphur_dioxide_sulphites: 'science',
  lupin: 'local_florist',
  molluscs: 'restaurant_menu',
}

export function formatAllergenCode(code: string) {
  if (KNOWN_ALLERGEN_CODES.has(code)) {
    return i18n.t(`Allergens.${code}`, { ns: 'common' })
  }

  return code
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function getAllergenIcon(code: string) {
  return ALLERGEN_ICONS[code] ?? 'shield'
}
