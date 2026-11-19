# QA report — Shadow Kingdom v0.9.0

## Confirmed
- `node --check js/game.js` — passed.
- `node --check js/config.js` — passed.
- `node qa/run-tests.js` — 13/13 passed. Tests cover legacy save migration, destructible walls opening paths and line of sight, cover damage reduction before/after destruction, flanker target selection, ranged firing-position search, status configuration, hero skill metadata, battle terrain reset, freeze/stun/knockback application, boss epic drop, and the daily siege contract reward.
- Static HTML/CSS/resource validation passed: 64 unique HTML IDs, 332 CSS top-level rules with no parse errors, 3 local HTML references and 6 CSS asset URLs all resolved, 9/9 unit-art references and 4/4 prop-art references present.
- Local HTTP server returned HTTP 200 for `index.html`, both JS files, the new Wraith sprite, a prop asset, and the asset showcase image.
- New `assets/units/wraith.webp` is a transparent 384×512 WebP portrait; asset showcase was generated from real project image assets.
- ZIP integrity checked after packaging with `unzip -t`.

## Not confirmed
- Chromium headless was attempted against a local HTTP server, but the browser process hung and exceeded the execution timeout. No real browser playthrough, mobile-device test, or runtime screenshot is claimed.
- `screenshots/asset-showcase-v09.jpg` is an asset catalogue, not a runtime screenshot.
- AdsGram production display remains disabled until a publisher Block ID and Telegram Mini App approval/configuration are available.

## Known limits
- The arena remains a logical 10×6 four-direction grid rendered isometrically; it is not free navmesh movement.
- Destructible durability resets at the start of each battle; terrain damage is not a persistent world-building system.
- Terrain line-of-sight is grid-ray based, without height layers or projectile physics.
- Enemy behavior uses deterministic archetype scoring and BFS routes, not a learned or behavior-tree AI.
- Combat effects are CSS-driven; no frame-by-frame skeletal animation has been added.
- Progress remains local to the current browser/device. No backend or database is used.
