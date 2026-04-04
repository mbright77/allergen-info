const ALLERGEN_LABELS: Record<string, string> = {
  cereals_containing_gluten: 'Gluten',
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  peanuts: 'Peanuts',
  soybeans: 'Soybeans',
  milk: 'Milk',
  tree_nuts: 'Tree nuts',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame_seeds: 'Sesame seeds',
  sulphur_dioxide_sulphites: 'Sulphur dioxide / sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
}

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
  return ALLERGEN_LABELS[code] ?? code
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function getAllergenIcon(code: string) {
  return ALLERGEN_ICONS[code] ?? 'shield'
}
