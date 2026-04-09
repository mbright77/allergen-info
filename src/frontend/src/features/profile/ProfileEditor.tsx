import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { getAllergens } from '../../shared/api/products'
import { formatAllergenCode, getAllergenIcon } from '../../shared/allergens/metadata'

type ProfileEditorProps = {
  mode: 'create' | 'edit'
  initialName: string
  initialSelectedAllergens: string[]
  saveLabel: string
  onSave: (input: { name: string; selectedAllergens: string[] }) => void
  introEyebrow: string
  introTitle: string
  introDescription: string
}

export function ProfileEditor({
  mode,
  initialName,
  initialSelectedAllergens,
  saveLabel,
  onSave,
  introEyebrow,
  introTitle,
  introDescription,
}: ProfileEditorProps) {
  const [name, setName] = useState(initialName)
  const [selectedAllergens, setSelectedAllergens] = useState(initialSelectedAllergens)
  const [showNameError, setShowNameError] = useState(false)
  const allergensQuery = useQuery({
    queryKey: ['reference', 'allergens'],
    queryFn: getAllergens,
  })

  useEffect(() => {
    setName(initialName)
  }, [initialName])

  useEffect(() => {
    setSelectedAllergens(initialSelectedAllergens)
  }, [initialSelectedAllergens])

  const trimmedName = name.trim()
  const summaryText = useMemo(() => {
    if (selectedAllergens.length === 0) {
      return mode === 'create'
        ? 'This profile is empty for now. You can save it and add allergens later.'
        : 'This profile has no monitored allergens yet. Add them now or save the empty profile for later.'
    }

    return `This profile is monitoring ${selectedAllergens.length} allergens.`
  }, [mode, selectedAllergens.length])

  function toggleAllergen(code: string) {
    setSelectedAllergens((current) =>
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code],
    )
  }

  function handleSave() {
    if (!trimmedName) {
      setShowNameError(true)
      return
    }

    setShowNameError(false)
    onSave({
      name: trimmedName,
      selectedAllergens,
    })
  }

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">{introEyebrow}</p>
        <h1 className="display-title">{introTitle}</h1>
        <p className="supporting-text">{introDescription}</p>
      </section>

      <section className="content-card stack-md">
        <label className="stack-sm" htmlFor="profile-name-input">
          <span className="eyebrow">Profile name</span>
          <input
            id="profile-name-input"
            className={showNameError ? 'profile-name-input profile-name-input--error' : 'profile-name-input'}
            type="text"
            name="profileName"
            placeholder="For example: Anna or Leo"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={showNameError}
            aria-describedby={showNameError ? 'profile-name-error' : 'profile-name-note'}
          />
        </label>
        <p id="profile-name-note" className="supporting-text">
          Use a clear name so switching between family members stays quick and reliable.
        </p>
        {showNameError ? (
          <p id="profile-name-error" className="profile-form-error" role="alert">
            Enter a profile name before saving.
          </p>
        ) : null}
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Monitored allergens</p>
        {allergensQuery.isLoading ? <p className="supporting-text">Loading allergen options...</p> : null}

        {allergensQuery.isError ? (
          <div className="status-panel status-panel--error" role="alert">
            <p className="eyebrow">Unable to load allergens</p>
            <p className="supporting-text">Please check that the backend is running and try again.</p>
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
                  <span className="allergen-tile__label">{formatAllergenCode(allergen.code)}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="content-card content-card--soft-highlight stack-sm">
        <p className="eyebrow">Profile summary</p>
        <p className="supporting-text">{summaryText}</p>
      </section>

      <div className="profile-editor-actions">
        <button
          type="button"
          className="primary-action"
          onClick={handleSave}
          disabled={allergensQuery.isLoading || allergensQuery.isError}
        >
          {saveLabel}
          <span className="material-symbols-outlined" aria-hidden="true">
            {mode === 'create' ? 'arrow_forward' : 'save'}
          </span>
        </button>
      </div>
    </section>
  )
}
