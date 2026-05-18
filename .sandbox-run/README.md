# Dropship Scout Lite

Small MVP inspired by Helium 10 for product scouting.

## What it does

- Searches Amazon-style listings using a fixture-driven test mode
- Supports a live scraper mode for public search result pages
- Scores products using price, rating, reviews, and Prime presence
- Exposes a lightweight web UI and JSON API

## Why this approach

As of **May 17, 2026**, Amazon's older Product Advertising API was deprecated on **May 15, 2026**. Amazon's official alternatives now require approved affiliate or seller onboarding, so this MVP is designed to work immediately in local fixture mode and optionally switch to scraping for experimentation.

## Run

```powershell
npm start
```

Open `http://localhost:3000`

## Test

```powershell
npm test
```

## API

- `GET /api/health`
- `GET /api/search?q=portable+blender&source=fixture`
- `GET /api/search?q=portable+blender&source=live`
- `GET /api/search?q=portable+blender&source=official`

## Notes

- `source=fixture` is the safest mode and is what the tests cover.
- `source=live` depends on Amazon returning parsable HTML and may break if the site layout changes or blocks requests.
- If you later obtain Amazon Creators API credentials, we can replace the official provider placeholder with a proper signed client.
