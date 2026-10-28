# Course balance — V7

[Play](https://bean-dash-online.onrender.com/) · [CI results](https://github.com/IntelliCoder-AI/Fall-Guys-Game/actions/workflows/test.yml) · [Balance assertions](tests/balance.test.mjs)

Live races now have **one life**. Wheels, fireballs, rotating arms, rollers, hammers, crushers, lasers, shockwaves, boulders, and water eliminate the runner immediately. Solid hurdles, gates, slalom walls, bumpers, and dive tunnels block movement on every physics step. A hit cooldown cannot let a runner phase through them. Death clears the active solo save; Retry starts the course again. Online death affects that runner while other racers continue.

Exposed bridges begin at level 3 and narrow further from level 8. Normal-track rails end at level 6. World 3 onward adds ice to windy bridges. Vanishing islands stay solid for about 65% of an eight-second cycle in world 5, with a visible orange warning before disappearing. World openings ease off; the second and third levels retain active obstacle types instead of generic passive-terrain rows.

Training measurements for this release:

| World | Hits/km | Water deaths/km |
|---|---:|---:|
| 1 | 2.070 | 0.000 |
| 2 | 3.318 | 0.142 |
| 3 | 5.684 | 0.139 |
| 4 | 7.641 | 0.414 |
| 5 | 11.005 | 0.494 |

## What CI proves

`npm test` runs terminal collision tests, wall blocking and jump clearance, unchanged terminal positions, online death isolation, progress validation, hazard phases, finish safety, and course balance assertions. Full-room tests verify that races terminate and eliminated runners never respawn.

The route-feasibility test uses **one deterministic player-speed training controller** for every level at 30 Hz, plus another sweep at 60 Hz. In this offline test only, a dead controller restarts at its previous checkpoint. The harness counts retries, hits, and water deaths; it never runs in the deployed game. Passing this check establishes a traversable sequence of course sections, not a flawless full-course bot run or guaranteed human completion.

CI fails if a course cannot be traversed within the bounded retry budget, reference times are stale, a non-finale training time exceeds its finale, level 50 loses its overall peak, or hits/km fail to increase between worlds, or water deaths/km regress by more than 5% between adjacent worlds. Water deaths must also rise materially from the first to last world. The 5% tolerance avoids treating a tiny sample-rate difference as a design regression. It also checks density, open edges, moving floors, and medal-target ordering. Statistics come from the offline training runs and must not be described as live single-life finish rates.

`npm run calibrate` records those training times and retries in `tests/balance-reference.json` and updates the medal baseline. Gold is 1.10× the highest training reference so far within the world, rounded up; silver is 1.30× gold. These are forgiving training-derived targets, not measured expert clean-run records. Further human playtesting can tune them.

```sh
npm ci
npm test
npm run test:balance
node tests/endurance.mjs
```

The browser checks in `tests/one-life-browser.cjs` verify wheel/water Game Over messages, no unlock on death, clearing the saved run, and restarting from the beginning. Other browser scripts verify friend invites, immediate finishes, customization, touch layouts, and bounded course streaming.

## References

- [Fall Guys Creative](https://www.fallguys.com/creative): readable obstacle spaces and varied routes.
- [Fall Guys Power Party](https://www.fallguys.com/news/fall-guys-power-party-update): moving platforms and dynamic crossings.
- [Trackmania short-course guidance](https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/): readable, replayable courses.

All character and obstacle models are original procedural assets.


## V8 presentation and rooms

Private rooms wait for a host to start after a friend joins. Public queues retain their timer. The new river shader uses directional ripples and foam, informed by [Unity’s water shader reference](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.7/manual/Shader-Graph-Sample-Production-Ready-Water.html). Three trail profiles add rolling hills, ridges and summits from level 3. Heights are terrain-relative: runners and obstacles share the raised trail surface, while horizontal timing and the calibrated challenge remain unchanged. These are running slopes, not a separate hand-climbing mechanic.

Losses remain terminal on the server; the client shows a 2.6-second impact scene before results. `tests/friends-browser.cjs` verifies two separate browsers joining the same code and starting together. `tests/one-life-browser.cjs` checks the visible loss state and retry. `tests/terrain.test.mjs` checks continuous trail heights and flat landings.
