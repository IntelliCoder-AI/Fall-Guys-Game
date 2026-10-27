# Course balance — V5

World Tour now takes roughly 2–10 minutes per reference run. The previous 1–60 km progression remains available as Endurance, with separate best times. Length alone should not define difficulty.

## Design

- Level 1 teaches full-width hurdles. Wheels arrive at 2, open sea bridges at 3, and crossing fireball volleys at 4. The catalog grows to 24 mechanics.
- Full-width barriers and moving gate openings prevent a permanent safe edge lane. Bridges have exposed sides from their introduction; normal tracks lose rails in world 2.
- Late tracks narrow from 20 to about 10 m. Gaps grow from 3 to 7.8 m. Moving islands, disappearing platforms, checkerboard trapdoors, and wind introduce real falls.
- Authored sections combine gate + laser, conveyor + crusher, and slalom + shockwave. Finale sections combine wheel + gate + fireballs. Combinations replace generic rows to preserve a usable route.
- Each world's opening eases off. New mechanics get a gentler introduction; finales spike. Therefore every individual level is not monotonically harder.
- Bot speed rises from 8.4 to 10 m/s across worlds. Online Tour races qualify 12 of 16, or 8 in finales. A player's finish still shows results immediately.

## Reference times and checks

`node scripts/calibrate.mjs` runs three ordinary player-speed controllers per level, using the shared movement and collision code. The median sets gold at 1.10× reference time; silver is 1.30× gold. These are reproducible controller references, not measured expert human performances.

The recorded runs in `tests/balance-reference.json` currently give:

| World | Pace (m/s) | Hits / km | Falls across 30 runs |
|---|---:|---:|---:|
| Sunshore | 10.44 | 1.62 | 0 |
| Sundown City | 10.47 | 0.86 | 0 |
| Neon Heights | 10.10 | 1.64 | 32 |
| Frostline | 8.75 | 3.20 | 290 |
| Skyline Summit | 8.78 | 5.59 | 299 |

The late worlds require more corrections and recoveries; the curve is not strictly monotonic. Controller strategies react differently to each mechanic. Human playtesting should inform future tuning, especially disappearing platforms and gold targets.

`npm test` verifies six starting runners can finish all 50 Tour levels, late-world pace drops and impacts rise overall, open edges can cause falls, and fixed edge-running is not a clean bypass. It also checks dynamic floors, hazard phases, guest saves, customization, immediate results, qualification caps, and live WebSocket identities.

`node tests/endurance.mjs` checks full 16-runner Tour rooms and Endurance levels 1, 25, and 50. GitHub Actions runs both checks. Browser scripts in `tests/*browser.cjs` additionally exercise WebGL rendering, mobile layouts, customizer persistence, checkpoint resume, and bounded course streaming when Playwright and Chromium are available.

## References

- [Fall Guys Creative](https://www.fallguys.com/creative): readable obstacle spaces and varied routes.
- [Fall Guys Power Party](https://www.fallguys.com/news/fall-guys-power-party-update): moving platforms and dynamic crossings.
- [Trackmania short-course guidance](https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/): readable, replayable courses.

All character and obstacle models are original procedural assets.
