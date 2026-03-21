# Design System Strategy: The Editorial Wellness Engine

## 1. Overview & Creative North Star
**Creative North Star: The Living Editorial**
This design system moves beyond the "utilitarian grocery app" by adopting a high-end, editorial aesthetic. It treats health data and grocery inventory as curated content rather than a database. By prioritizing extreme white space, intentional asymmetry, and sophisticated tonal layering, we create an experience that feels as much like a premium wellness magazine as it does a functional PWA. 

The "template" look is rejected in favor of **Organic Precision**. We use a mobile-first, card-based architecture that relies on depth and typography—not lines—to guide the eye. The result is an interface that feels breathable, trustworthy, and authoritative.

---

## 2. Colors & Surface Philosophy
The palette utilizes deep, trustworthy greens and vibrant functional accents. However, the sophistication lies in how these colors are layered.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define a new area or group of content, use a background shift. For example, a card using `surface_container_lowest` should sit atop a `surface_container_low` section. High-contrast boundaries must be achieved through value changes (Light vs. Dark) rather than 1px strokes.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
*   **Base Layer:** `surface` (#fcf9f8)
*   **Secondary Content Areas:** `surface_container_low` (#f6f3f2)
*   **Interactive Cards:** `surface_container_lowest` (#ffffff)
*   **Prominent Callouts:** `surface_container_high` (#eae7e7)

### The Glass & Gradient Rule
To prevent the UI from feeling "flat," use **Glassmorphism** for floating elements like bottom navigation bars or sticky headers. Apply `surface_container_lowest` at 80% opacity with a `backdrop-filter: blur(20px)`. 

For Primary CTAs, use a **Signature Gradient**:
*   *From:* `primary` (#00442d)
*   *To:* `primary_container` (#1d5c42) 
This subtle transition adds "soul" and prevents the deep green from appearing "dead" on digital screens.

---

## 3. Typography
We utilize a pairing of **Manrope** (Display/Headlines) for an architectural, modern feel and **Inter** (Body/Labels) for maximum legibility at small sizes.

*   **Display (Manrope):** Large, bold, and expressive. Use `display-lg` (3.5rem) for hero moments like "Your Weekly Health Score."
*   **Headlines (Manrope):** Used for category titles. `headline-sm` (1.5rem) provides an editorial rhythm.
*   **Body (Inter):** The workhorse. Use `body-lg` (1rem) for product descriptions and `body-md` (0.875rem) for secondary nutritional data.
*   **Labels (Inter):** Used for micro-copy. `label-md` (0.75rem) in `on_surface_variant` (#41493e) ensures clarity without visual clutter.

---

## 4. Elevation & Depth
Depth in this system is a product of **Tonal Layering**, not heavy dropshadows.

*   **The Layering Principle:** A card does not need a shadow if it is white (`surface_container_lowest`) sitting on a grey-tinted base (`surface_container_low`). This creates a "soft lift."
*   **Ambient Shadows:** For "floating" elements like FABs or Modals, use a multi-layered shadow: 
    *   `box-shadow: 0 10px 30px rgba(27, 28, 28, 0.06);` (Using a tint of `on_surface`).
*   **The "Ghost Border":** If a container requires a boundary (e.g., in high-sunlight outdoor usage), use `outline_variant` (#c0c9bb) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Implementation:** Separate items in a grocery list using a vertical spacing of `spacing.3` (1rem). Group related items within a `surface_container_low` rounded box (`rounded.lg`).
*   **Touch Targets:** Every interactive card must have a minimum height of `spacing.12` (4rem) to ensure "fat-finger" accessibility in a mobile environment.

### Buttons
*   **Primary:** Uses the Primary-to-Primary-Container gradient. `rounded.full` for a modern, friendly feel.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **Tertiary:** Text-only, using `primary` (#00442d) and `title-sm` typography.

### Input Fields
*   **Style:** Background-filled using `surface_container_high`. 
*   **Indicator:** Instead of a full border, use a 2px bottom-bar of `primary` when focused.
*   **Error State:** Background shifts to `error_container` (#ffdad6) with text in `error` (#ba1a1a).

### Health Indicators (Chips)
*   **Safe:** `primary_fixed` background with `on_primary_fixed_variant` text.
*   **Caution:** `tertiary_fixed` (#ffdfa0) with `on_tertiary_fixed_variant` (#5c4300).
*   **Warning:** `secondary_fixed` (#ffdad6) with `on_secondary_fixed_variant` (#930010).

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins. For example, a headline might have a `spacing.8` left margin while the body text has `spacing.4` to create an editorial "staggered" look.
*   **Do** use `rounded.xl` (1.5rem) for large product hero cards to emphasize a soft, organic health aesthetic.
*   **Do** prioritize `primary` (#00442d) for high-value actions to establish trust and authority.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#1b1c1c) for a softer, more premium contrast.
*   **Don't** use standard "Material Design" shadows. Keep them diffused and barely visible.
*   **Don't** crowd the screen. If you feel like you need a divider line, you actually need more white space (use `spacing.6` or `spacing.8`).
*   **Don't** use center-aligned text for body copy. Keep it left-aligned for an editorial, readable feel.