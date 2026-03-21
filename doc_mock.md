Build a mockup for a modern Progressive Web App (PWA) for scanning grocery products and detecting allergens.

Core features:

* Use the device camera to scan barcodes (GTIN)
* Fetch product data from the Dabas API (Swedish food database)
* Display product name, ingredients, and allergen information
* Let users select their allergies (e.g. milk, egg, gluten, nuts)
* Clearly highlight if a product:

  * Contains allergens (red warning)
  * May contain traces (yellow warning)
  * Is safe (green)

UI/UX:

* Clean, mobile-first design
* Large scan button and simple navigation
* Clear color-coded allergen alerts
* Product result screen with easy-to-read ingredients list

Technical:

* Frontend: React (with PWA support)
* Use a barcode scanning library (e.g. ZXing)

The app should have local dummy data for now. We will later implement a C# .net backend REST Api but it's out of scope for now.
The most important for now is that the app is visually compelling and follows accessibility guidelines.
