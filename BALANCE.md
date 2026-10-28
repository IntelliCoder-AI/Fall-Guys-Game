# Course balance and bot navigation

[Play](https://bean-dash-online.onrender.com/) · [Balance assertions](tests/balance.test.mjs) · [Bot survival assertions](tests/bot-survival.test.mjs)

Tour returns players to flags with a four-second penalty. Hardcore and online races have one life. Endurance offers paid recovery. Bots use the same movement and collision physics as players, with no shields, immunity or checkpoint recovery.

All 50 courses retain their platforms, obstacles, collision rules and existing human medal targets. Exposed bridges begin at level 3, rails end at level 6, and later worlds narrow the decks, widen gaps and combine hazards. These physical challenge parameters and actual edge/floor behavior are tested independently of AI skill.

## What the checks establish

- The deterministic training route completes all 50 levels at 30 Hz and 60 Hz. Only this offline harness retries from checkpoints; its results are feasibility evidence, not guaranteed human completion.
- Training times match the current navigation fixture. World finales remain longer than their preceding training routes, hits/km increase, and late track widths/gaps remain harder than the tutorial.
- Full bot rooms on levels 1, 10, 25, 40 and 50 must finish with at least eight runners on L1 and four on every other sampled course. At most twelve bots may die. These are minimum competition gates, not promises for every starting phase or skill level.
- Bot tests also assert no immunity, shields or recoveries. Qualification still ends a round at the established limit.
- Bot water deaths are diagnostic data, not a required increasing difficulty metric: better AI should be allowed to avoid falls. Exposed-edge fall behavior is still tested directly.

The controller refreshes decisions on stable 30 Hz tick boundaries, predicts at the server step size, times jumps against expanding pulse rings, commits through vanishing-platform chains, and predicts braking toward lateral targets rather than holding a sideways input off the deck.

## Fixtures and medals

`npm run calibrate` updates `tests/balance-reference.json` for navigation regression. It does **not** change medal targets. Use `npm run calibrate -- --medals` only for an intentional medal rebalance after human playtesting. Gold/silver targets continue using the existing baseline in `dist/balance.js`.

```sh
npm test
npm run test:balance
node tests/endurance.mjs
node tests/review-fixes-browser.cjs
```

Local Chromium checks cover landscape/portrait/tablet geometry, checkpoint camera recovery, all graphics quality modes, shops, wardrobe and private-room UI. Software rendering does not establish physical GPU performance, real phone usability or production multiplayer capacity.

Original character and obstacle models remain procedural assets. The course references include Fall Guys Creative and Trackmania's replayable timed courses; no third-party game models are used.
