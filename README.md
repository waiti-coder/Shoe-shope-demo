# Viatu Vibes 👟

A fast, mobile-first shoe store for Kenya. It's 100% static (HTML, CSS and vanilla JS), so there's no backend and no build step, and it's ready for free hosting on **GitHub Pages**.

## Features

- Product catalogue with **search, filters** (category, type, size, price, brand, on sale) and **sorting**
- Product quick view with **size picker**, sold-out sizes, quantity, related products and share links (`#product/<slug>`)
- **Cart and wishlist** saved in the browser (localStorage), including undo on remove
- **Promo codes** (`KARIBU10`, `VIBES500`), free-delivery progress bar
- **Checkout covering all 47 counties**: delivery fee by county, shop pickup, M-Pesa or cash on delivery
- The order is sent to the shop's **WhatsApp** with full details, and the customer gets step-by-step **Lipa na M-Pesa** instructions
- **"Unaenda wapi leo?" occasion picker** (Kazi, Sunday best, Mtaa, Run, Pwani, Safari, Shule). Tag products with `vibes: [...]`, edit the list in `config.js`
- **Delivery estimator** on every shoe ("Uko wapi?": pick a county and see "Arrives Kesho · KES 250")
- **"Ask about this shoe on WhatsApp"** with the shoe, chosen size and link pre-filled
- **Remembers the customer's size** (adult and kids separately) and pre-selects it
- **Copy buttons** for the Till/Paybill number and amount after checkout
- Swahili greetings by time of day, Maasai-bead stripe, **mobile bottom tab bar** (Home · Shop · Saved · Cart · WhatsApp)
- Size guide, FAQ, newsletter, floating WhatsApp chat button
- Accessible (keyboard, screen readers, reduced motion) and responsive from 320px up

## Before you launch: edit `js/config.js`

| Setting | What to put |
|---|---|
| `whatsappNumber` | Your WhatsApp number in international format, digits only, e.g. `254712345678` |
| `phoneDisplay`, `email`, `address`, `hours` | Your contact details |
| `mpesa.type` / `mpesa.number` | `"Buy Goods"` + Till number, or `"Paybill"` + business number |
| `deliveryTiers`, `countyTiers` | Delivery fees per county |
| `promoCodes` | Add or remove discount codes |
| `testimonials` | **Replace the placeholders with real customer reviews**, or set to `[]` to hide |
| `orderEndpoint` *(optional)* | A free [Formspree](https://formspree.io) URL to also get every order by email |

## Adding or editing products: `js/products.js`

Each product is one block. Copy an existing one, give it a new `id` and `slug`, and edit the fields.

**Using real photos:** save each photo in `images/` named after the product's slug, e.g. `images/nairobi-runner.jpg` (`.png` and `.webp` also work). It appears automatically in the home showcase, shop, product view, cart and wishlist, with no code changes. See `images/README.txt` for photo tips. Products without a photo show a built-in illustration.

**Home page showcase:** choose which shoes rotate at the top by editing `heroShoes` in `js/config.js`.

## Run locally

Open `index.html` in a browser, or for a closer match to GitHub Pages:

```bash
npx serve .        # or: python -m http.server 8000
```

## Deploy to GitHub Pages (free)

1. Create a new public repository on GitHub, e.g. `viatu-vibes`.
2. Upload all files in this folder (drag-and-drop on github.com works), or:
   ```bash
   git init && git add . && git commit -m "Viatu Vibes store"
   git branch -M main
   git remote add origin https://github.com/<your-username>/viatu-vibes.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then choose `main` / `(root)` and save.
4. After a minute your store is live at `https://<your-username>.github.io/viatu-vibes/`.

**Custom domain** (e.g. `viatuvibes.co.ke`): add it under Settings → Pages → Custom domain, and point your DNS `CNAME` to `<your-username>.github.io`.

## How orders work

Because the site has no server, checkout opens WhatsApp with a ready-to-send message containing the order number, items, sizes, total and delivery details. The customer taps **Send**, pays via M-Pesa using the instructions shown, and forwards the M-Pesa confirmation SMS. You then confirm and dispatch.

## File structure

```
index.html        page structure
css/styles.css    all styling (colour tokens at the top)
js/config.js      store settings  ← edit me
js/products.js    product catalogue  ← edit me
js/app.js         storefront logic
assets/           favicon
```
