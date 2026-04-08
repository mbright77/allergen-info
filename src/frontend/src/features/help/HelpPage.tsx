export function HelpPage() {
  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">Help</p>
        <h1 className="display-title">How SafeScan uses your profile.</h1>
        <p className="supporting-text">
          SafeScan compares product data against the allergens selected in the currently active profile.
        </p>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">How allergen selection works</p>
        <p className="supporting-text">
          Each profile stores its own allergen selection. You can switch profiles from the top-right menu when different family members need different checks.
        </p>
        <p className="supporting-text">
          Profiles can be saved without any allergens selected. In that case, the app stays usable, but result warnings are not personalized until allergens are added.
        </p>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">What the responses mean</p>
        <div className="stack-sm">
          <p className="supporting-text"><strong>Safe</strong>: no selected allergens were found in the available product data.</p>
          <p className="supporting-text"><strong>May contain</strong>: a trace warning or precautionary statement was found for one of the selected allergens.</p>
          <p className="supporting-text"><strong>Contains</strong>: a selected allergen was found in the available product data.</p>
          <p className="supporting-text"><strong>Unknown</strong>: the product data was incomplete, conflicting, or not detailed enough for a confident answer.</p>
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Before you buy</p>
        <p className="supporting-text">
          SafeScan is designed to speed up checking, but the package label remains the final source of truth if product data is missing or unclear.
        </p>
      </section>
    </section>
  )
}
