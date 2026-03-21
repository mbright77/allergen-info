import { useQuery } from '@tanstack/react-query'

import { getAllergens } from '../../shared/api/products'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function ProfilePage() {
  const { selectedAllergens, toggleAllergen } = useProfile()
  const allergensQuery = useQuery({
    queryKey: ['reference', 'allergens'],
    queryFn: getAllergens,
  })

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg">
        <p className="eyebrow">Profile</p>
        <h1 className="display-title">Adjust your safety profile.</h1>
        <p className="supporting-text">Your selections are stored locally and reused across search, scan, and result analysis.</p>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Monitored allergens</p>
        {allergensQuery.isLoading ? <p className="supporting-text">Loading your available allergen options...</p> : null}
        {allergensQuery.data ? (
          <div className="chip-grid">
            {allergensQuery.data.map((allergen) => {
              const isSelected = selectedAllergens.includes(allergen.code)

              return (
                <button
                  key={allergen.code}
                  type="button"
                  className={isSelected ? 'selection-chip selection-chip--selected' : 'selection-chip'}
                  aria-pressed={isSelected}
                  onClick={() => toggleAllergen(allergen.code)}
                >
                  {allergen.label}
                </button>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="content-card content-card--accent stack-sm">
        <p className="eyebrow">Profile summary</p>
        <p className="supporting-text">
          {selectedAllergens.length > 0
            ? `You are monitoring ${selectedAllergens.length} allergens in your current profile.`
            : 'No allergens selected yet. Add at least one to personalize warnings.'}
        </p>
      </section>
    </section>
  )
}
