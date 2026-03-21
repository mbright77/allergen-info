import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { getAllergens } from '../../shared/api/products'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { selectedAllergens, toggleAllergen, setSelectedAllergens } = useProfile()
  const allergensQuery = useQuery({
    queryKey: ['reference', 'allergens'],
    queryFn: getAllergens,
  })

  function handleSave() {
    setSelectedAllergens(selectedAllergens)
    navigate('/scan')
  }

  return (
    <section className="stack-xl">
      <div className="content-card stack-lg">
        <p className="eyebrow">Allergy Setup</p>
        <h1 className="display-title">Create your personal safety profile.</h1>
        <p className="supporting-text">
          Choose the allergens to monitor so SafeScan can highlight warnings instantly.
        </p>
      </div>

      <section className="content-card stack-md">
        <h2 className="section-title">Select allergens</h2>
        {allergensQuery.isLoading ? <p className="supporting-text">Loading allergen options...</p> : null}

        {allergensQuery.isError ? (
          <div className="status-panel status-panel--error" role="alert">
            <p className="eyebrow">Unable to load allergens</p>
            <p className="supporting-text">
              Please check that the backend is running and try again.
            </p>
          </div>
        ) : null}

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
        <p className="eyebrow">Privacy</p>
        <p className="supporting-text">
          Your allergy profile is stored locally first and routed through the backend API contract.
        </p>
      </section>

      <div className="sticky-action-bar">
        <button
          type="button"
          className="primary-action"
          onClick={handleSave}
          disabled={selectedAllergens.length === 0 || allergensQuery.isLoading || allergensQuery.isError}
        >
          Save &amp; Start Scanning
        </button>
      </div>
    </section>
  )
}
