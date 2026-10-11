# Akos Luxe

A responsive e-commerce-style site for ladies' bags, shoes and slippers.
Plain HTML, CSS and JavaScript (ES modules). No build step.

## Run it

Double-click `index.html`. No server or install is needed. (A local server such
as `python3 -m http.server 8000` also works.)

## Structure

    index.html  shop.html  about.html  contact.html
    css/small.css             phone styles (loads everywhere)
    css/large.css             tablet and desktop styles (768px and up)
    data/products.js          Akos Luxe's own products (edit this to add stock)
    images/products/*.svg     placeholder product art, replace with photos
    js/app.js                 everything: products, search, cart, form, API calls
    js/nav.js                 the navbar menu button

## Things to change before you publish

1. **Contact details**: `js/app.js` (`CONTACT` in the form section: WhatsApp number and
   email, and the footer in the ui section: email, phone).
2. **Product photos**: put real images in `images/products/` and update the
   `image` fields in `data/products.js`.
3. **Prices and stock**: edit `data/products.js`
   (`available: false` shows "Sold out", `isNew: true` adds the New badge
   and lists the product in New arrivals).
4. **About page wording** in `about.html`.

## How the data flows

- Akos Luxe products come from `data/products.js`.
- Extra accessories come from the Fake Store API (jewellery items up to
  US$200, set by `MAX_API_PRICE_USD` in `js/app.js`). Their dollar prices are
  converted to cedis with the live rate.
- The exchange rate comes from open.er-api.com and is cached for 6 hours.
  If it fails, the site hides dollar prices and the extra accessories and
  keeps working in cedis.
- The cart, the chosen category are saved in
  localStorage.

## Checking the code (ESLint)

    npm install
    npm run lint

Validate the HTML at https://validator.w3.org and the CSS at
https://jigsaw.w3.org/css-validator/.
