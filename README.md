# PrimePacks – Redesign-Vorschlag 2026

A 3-page HTML proposal for [prime-packs.at](https://prime-packs.at): a dark, minimal "crypto/fintech" look, built on accessible e-commerce patterns.
All products, prices, photos and texts come from the current shop (Shopify export from 8 Nov 2026).

| Page | File | What it shows |
|---|---|---|
| Startseite | `index.html` | Hero with drop of the week, stats, price ticker, drops grid, category bento, service dashboard, pre-orders, FAQ |
| Produktliste | `products.html` | Category pills, search, filters (stock, language, product type, price), sorting, "Mehr laden" |
| Produktseite | `product.html?p=<handle>` | Gallery, price, quantity, add to cart, service info, description/details, "Andere kauften auch" (same category first, filled up to 6) |

## Open it

- **Locally:** double-click `index.html`, or run `node serve.mjs` and open http://127.0.0.1:8780/
- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root. Paths are relative, so it works as a project page.

## Proposal switcher

The round **Vorschlag** button at the bottom left switches the design variant and the accent colour.

**Variante**

- **Dunkel (Variante 1):** dark crypto look on every page (default)
- **Hell (Variante 2):** light page with white cards, mixed with dark blocks: top bar, hero product stage, price ticker, category band, two service panels, contact card, product photo stage and footer

**Akzentfarbe**

- **Blau:** PrimePacks brand (default)
- **Rot:** PayHot moodboard
- **Mint:** Vare moodboard

You can also link straight to a version:

- `index.html?variant=light` opens the light variant.
- `index.html?accent=red` or `?accent=mint` sets the accent.
- Both can be combined, for example `index.html?variant=light&accent=mint`.

The choice is remembered while you click through the pages.

## Accessibility

- Semantic landmarks, one `h1` per page, and a skip link
- A visible focus ring on every control, with 44 px minimum tap targets
- Text contrast meets WCAG AA in both variants and all three accents. The light variant uses darker accent shades for text.
- Native `<dialog>` for the cart, search and menu, so focus is trapped, `Esc` closes them, and focus returns to the button that opened them
- The mobile filter drawer has its own focus trap
- Live regions announce result counts and "added to cart"
- `prefers-reduced-motion` turns off the ticker, float and reveal animations

## Notes

- The cart is a demo stored in `localStorage`. "Zur Kasse" does not start a checkout.
- The logo (`assets/img/logo.png`) is the original PrimePacks logo from prime-packs.at. It keeps its colours in every accent.
- Product data lives in `data/products.js`. Images load from the Shopify CDN.
- Legal links point to the live pages on prime-packs.at.
- Stock badges only appear where Shopify tracks a quantity ("20 auf Lager"). Pre-orders are marked "Vorbestellung".
