# Penhu7days Progress Log

## 2026-02-25

### Scope
- Fix browser tab favicon for `https://penhu.xyz` to the new `H` logo.
- Fix social preview thumbnail (IG/OG/Twitter) to use the same `H` logo.

### Root Cause
- App source favicon had already been updated, but live site served stale/old built asset.
- `og:image` target asset path was not available on production (`/icon-512.png` returned 404 initially).

### Changes Made
- Updated metadata in [app/layout.tsx](./app/layout.tsx):
  - Added `metadataBase` (`https://penhu.xyz`)
  - Added `openGraph` image: `/icon-512.png?v=20260225h1`
  - Added `twitter` image: `/icon-512.png?v=20260225h1`
- On VPS (`root@45.32.10.238`):
  - Rebuilt app under `/var/www/penhu7days` and restarted `pm2` process `penhu7days`.
  - Added Nginx explicit static mapping in `/etc/nginx/sites-available/penhu.xyz`:
    - `location = /favicon.ico` -> `/var/www/penhu7days/app/favicon.ico`
    - `location = /apple-touch-icon.png` -> `/var/www/penhu7days/public/apple-touch-icon.png`
  - Reloaded Nginx after config test.
  - Added missing production asset:
    - `/var/www/penhu7days/public/icon-512.png` (copied from `/var/www/penhu7days/app/icon.png`)

### Verification
- `https://penhu.xyz/favicon.ico` returns new `H` icon (hash matched source icon).
- `https://penhu.xyz/icon-512.png?v=20260225h1` returns HTTP 200.
- Home page meta tags include:
  - `og:image = https://penhu.xyz/icon-512.png?v=20260225h1`
  - `twitter:image = https://penhu.xyz/icon-512.png?v=20260225h1`

### Acceptance URLs
- Storefront: `https://penhu.xyz/`
- Partner: `https://penhu.xyz/%E5%AF%A6%E6%88%B0%E7%8F%AD`
- Admin: `https://penhu.xyz/%E7%B6%B2%E9%A0%81%E7%AE%A1%E7%90%86`
- OG image: `https://penhu.xyz/icon-512.png?v=20260225h1`
- Favicon: `https://penhu.xyz/favicon.ico`

### Notes
- Production machine has tight memory during `next build`; `NODE_OPTIONS=--max-old-space-size=3072` was used for successful build.
