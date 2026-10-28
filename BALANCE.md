# Course balance — V6

[Play](https://bean-dash-online.onrender.com/) · [CI results](https://github.com/IntelliCoder-AI/Fall-Guys-Game/actions/workflows/test.yml) · [Pass/fail balance test](tests/balance.test.mjs)

World Tour ranges from 1 to 5.125 km. Finales include an extra 150–450 m of obstacle sections. The 1–60 km progression remains in Endurance with separate best times.

## What changed

- Challenge starts at 0.15. Normal-track rails end at level 6; bridges already have open edges. Level 1 stays hurdles-only.
- Hazard density rises from **2.9 to 9.15 per 100 m**, excluding bridge/platform label markers. Crossings now include approach and exit hazards, and bridge spans have hurdles, lasers, fireballs, wind, or magnet fields.
- Authored combos retain their reserved middle section, with hazards in the unused approaches and exits. Generic rows do not overlap the intended route through a combo.
- Vanishing islands use an eight-second cycle with a longer visible window and staggered phases. Stable approaches are longer, and wind is confined to fixed bridges. Moving-platform AI stays on the deck until the exit. Trapdoor jumps and paired-bumper avoidance no longer cause repeated failure loops.
- Every finale is the longest measured run in its world, and level 50 is the overall peak. Gold targets cannot fall within a world; the next world's opening deliberately eases off.
- The last ten metres are clear of hazards. Finishes remain immediate.
- Locked or invalid levels cannot grant rewards, best times, or unlocks. Later courses joined through a friend show a practice result.

## Measured results

Six player-speed reference runners finish each Tour level using normal shared physics. Aggregate results from the live regression test:

| World | Pace (m/s) | Hits / km | Falls across 60 runs | Finale reference |
|---|---:|---:|---:|---:|
| Sunshore | 10.385 | 1.68 | 0 | 182.60 s |
| Sundown City | 10.273 | 1.45 | 0 | 262.33 s |
| Neon Heights | 10.009 | 1.86 | 36 | 354.13 s |
| Frostline | 9.857 | 3.00 | 60 | 439.10 s |
| Skyline Summit | 9.649 | 4.92 | 64 | 556.57 s |

The controller can still clear early worlds without falling. Open edges are separately tested to permit real falls; clean play is not artificially penalized. These controller measurements are regression evidence, not a substitute for human playtesting.

| Previously flagged level | V5 reference | V6 reference |
|---|---:|---:|
| 24 | 302.67 s | 268.37 s |
| 32 | 375.97 s | 321.67 s |
| 36 | 550.93 s | 368.40 s |
| 39 | 481.37 s | 393.93 s |
| 45 | 535.57 s | 439.60 s |
| 50 | 507.97 s | 556.57 s |

## Reproduce the checks

```sh
npm ci
npm run test:balance
npm test
node tests/endurance.mjs
```

`test:balance` actually simulates six runners through all 50 levels. It fails if a runner misses the timer, any successive world's aggregate pace gets faster, a level takes longer than its finale, level 50 loses its overall peak, density misses its bounds, or the reference data is stale. It also checks open edges, dynamic floors, and medal-target order.

`npm test` adds 60 Hz browser-physics completion, safe finish areas, hazard phases, progress validation, customization, immediate results, qualification caps, and live WebSocket checks. GitHub Actions runs this suite plus full 16-runner Tour rooms and Endurance levels 1, 25, and 50.

To intentionally recalibrate after a design change, run `npm run calibrate`. Three starting positions produce the raw median times in `dist/balance.js` and the detailed attempts in `tests/balance-reference.json`. Gold is 1.10× the highest reference so far within that world, rounded up; silver is 1.30× gold. The test limits smoothing to 10% so padding cannot conceal a large spike. Endurance targets scale by its distance relative to the corresponding Tour course.

Browser scripts exercise the rendered editor and courses, practice results, checkpoint resume, mobile layouts, and bounded streaming when Playwright and Chromium are available.

## References

- [Fall Guys Creative](https://www.fallguys.com/creative): readable obstacle spaces and varied routes.
- [Fall Guys Power Party](https://www.fallguys.com/news/fall-guys-power-party-update): moving platforms and dynamic crossings.
- [Trackmania short-course guidance](https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/): readable, replayable courses.

All character and obstacle models are original procedural assets.
