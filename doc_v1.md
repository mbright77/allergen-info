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
* Create a simple backend or API layer to securely call the Dabas API
* Cache scanned products for faster repeat lookups

Extra (if possible):

* Save user allergy preferences locally
* Allow rescanning and history of scanned items

Goal:
A fast, simple, and user-friendly app that helps users quickly determine if a grocery product is safe based on their allergies.
