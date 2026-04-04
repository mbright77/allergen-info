import { useQuery } from '@tanstack/react-query'

import { getAllergens } from '../../shared/api/products'
import { formatAllergenCode, getAllergenIcon } from '../../shared/allergens/metadata'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function ProfilePage() {
  const { selectedAllergens, toggleAllergen } = useProfile()
  const allergensQuery = useQuery({
    queryKey: ['reference', 'allergens'],
    queryFn: getAllergens,
  })

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">Profile</p>
        <h1 className="display-title">Adjust your safety profile.</h1>
        <p className="supporting-text">Your selections are stored locally and reused across search, scan, and result analysis.</p>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Monitored allergens</p>
        {allergensQuery.isLoading ? <p className="supporting-text">Loading your available allergen options...</p> : null}
        {allergensQuery.data ? (
          <div className="allergen-grid">
            {allergensQuery.data.map((allergen) => {
              const isSelected = selectedAllergens.includes(allergen.code)

              return (
                <button
                  key={allergen.code}
                  type="button"
                  className={isSelected ? 'allergen-tile allergen-tile--selected' : 'allergen-tile'}
                  aria-pressed={isSelected}
                  onClick={() => toggleAllergen(allergen.code)}
                >
                  <span className="allergen-tile__icon material-symbols-outlined" aria-hidden="true">
                    {getAllergenIcon(allergen.code)}
                  </span>
                  <span className="allergen-tile__label">{formatAllergenCode(allergen.code)}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="content-card content-card--soft-highlight stack-sm">
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
