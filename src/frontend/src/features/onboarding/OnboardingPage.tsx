import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { getAllergens } from '../../shared/api/products'
import { getAllergenIcon } from '../../shared/allergens/metadata'
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
    <section className="stack-xl onboarding-page">
      <div className="onboarding-hero stack-lg">
        <p className="eyebrow">Allergy Setup</p>
        <h1 className="display-title">
          Define your <br />
          <span className="display-accent">Safe Zone</span>
        </h1>
        <p className="supporting-text onboarding-hero__text">
          Select the allergens you need to avoid. You can search first, then launch the camera only when you want a live scan.
        </p>
      </div>

      <section className="stack-md">
        <h2 className="section-title section-title--offset">Select allergens</h2>
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
                  <span className="allergen-tile__label">{allergen.label}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="content-card content-card--soft-highlight stack-sm onboarding-note">
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
          Save &amp; Continue to Scan
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </div>
    </section>
  )
}
