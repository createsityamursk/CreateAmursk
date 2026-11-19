## v0.9.0
- Added destructible obstacle and cover durability; destroying a prop opens the movement path and line of sight.
- Ability targeting now highlights destructible props in range, allowing direct attacks on terrain.
- Added enemy AI archetypes: flankers prioritize exposed backline heroes, bruisers pressure nearby targets, and ranged units seek firing lanes.
- Added a new transparent Wraith Knight sprite and a Wraith Knight enemy type; the Bone Archer archetype currently reuses the Fallen Knight art.
- Added crowd-control effects: stun + knockback, freeze, slow, and mark (increased incoming damage).
- Added status chips, terrain durability bars, impact and break feedback.
- Added daily contract “Siege Works”: destroy 3 props for 30 stone.
- Fixed boss epic-drop condition to use the current battle's boss flag.
- Balance for terrain durability, damage, status durations and AI bias is configurable in `js/config.js`.
- Preserved `shadowKingdomSaveV2`; no save reset or backend is required.

## v0.8.0
- Added four separate isometric prop assets (ruined wall, rune pillar, moss boulder, wooden barricade) and placed them on tactical obstacle/cover cells.
- Reprojected the 10×6 tactical board to an isometric diamond layout; units and tiles share the same coordinate mapping.
- Added line-of-sight checks for ranged auto-attacks and targeted/AoE abilities; wall cells block shots.
- Added four cover tiles; ranged hits against units in cover are reduced by 35% (configurable).
- Added a boss telegraph attack with a visible danger area and a dodge window; cover mitigates the hit.
- Fixed unit positioning so both teams are anchored to the full battlefield and depth sorting follows isometric rows.
- Restored pinch zoom and added safe-area padding for notched mobile screens.

## v0.7.0
- Added a 10×6 tactical battle grid with reachable-cell highlights and three-cell hero movement.
- Added BFS pathfinding; blocked cover cells and occupied units prevent movement.
- Enemies advance toward the nearest living hero and route around blocked cells.
- Hero auto-attacks and manual abilities now respect per-unit range.
- Added a new battle-arena background and CSS movement dash animation.
- Fixed a nullable optional AdsGram button reference; AdsGram controller is cached once per Block ID.
- Tactical balance values live in `js/config.js`; local save key and existing progress remain intact.

## v0.6.0
- Collectible equipment with weapon, armor and relic slots.
- Common, rare and epic item tiers with attack, defense and HP bonuses.
- Configurable equipment drop chance; boss victory guarantees epic loot.
- Equip, replace and unequip items; loadouts persist in localStorage.

# Changelog

## v0.5.0
- Daily contracts with per-contract reward claims and UTC reset.
- Forge recipes with permanent hero stat upgrades and save compatibility.
- New illustrated forge location.
- Optional AdsGram rewarded placement with safe no-Block-ID behavior; reward only after successful completion.
- Telegram Mini App bootstrap and publisher setup notes.

## v0.4.0
- Individual hero/enemy art, CSS combat animation and click-to-reposition tactics.
