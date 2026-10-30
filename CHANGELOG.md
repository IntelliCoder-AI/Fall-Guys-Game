# Changelog

## 9.7.0 — Relay recovery and expanded crossings

- Automatically resume the same Relay player after temporary WebSocket loss; reserve identity and pause team state for 45 seconds. Explicit departures release slots immediately; expired rooms produce an honest error.
- Keep Relay connections active with lightweight application heartbeats; prevent a stalled socket's late close event from removing its replacement.
- Expand each island to 160 metres with shared side-route energy seals, moving sentinels and a timed final rescue lift. Keep the 120-second storm, role rotation and free recoveries.
- Add server authority, recovery, expiry, full-physics traversal, browser offline/reconnect and responsive HUD regression checks.


## 9.6.0 — 29 October 2026

- Shorten Relay's storm to 120 seconds. Machinery runs timed cycles: bridge 8s, gate 7s, wind 9s, with visible countdowns and a bridge closing warning. First activations cost energy; later cycles are free.
- Give each beacon a distinct device order and matching geometry, labels and collision. Fix gate contact rounding on later stages.
- Clarify wardrobe, settings, shop affordability, medal timing and graphics-help copy; correct singular obstacle labels.
- Refresh the README and submission kit with an actual gameplay cover. Add a validated GitHub release workflow and retain bounded judging-week health checks.

## 9.5.1 — 29 October 2026

- Let Relay hosts choose Runner or Shaper before starting; default the browser flow to Runner and explain the different controls clearly.
- Recover brief waiting-room transport failures with two bounded reconnect attempts to the same code; retain the code in connection error messages.
- Restore the filled Continue the Tour button style. Add real-time lobby/reconnect and desktop keyboard regression coverage.

## 9.5.0 — 29 October 2026

- Add World Relay: a server-authoritative cooperative expedition for 2–8 friends. Runners collect shared energy while a Shaper operates bridges, gates and wind; roles rotate at team beacons.
- Teach movement, jumping, energy collection and shaping through the first crossing, with a stopped practice timer. Add free recovery, late-join spectators, role/host transfer, a missing-teammate pause, shared victory and same-code rematches.
- Render three floating-island crossings with textured cliffs, articulated machinery, lanterns, natural lighting and atmospheric depth. Batch repeated scenery and reuse existing graphics quality, wardrobe, animations and camera controls.
- Add a role-specific responsive HUD, readable controls, an elevated Shaper camera, and Relay physics/protocol/browser regression tests. Keep all existing race modes and persistent economy independent.

## 9.4.0 — 29 October 2026

- Introduce Room Remix: 2–8 friends, host-selected short courses, one race or a three-round tour, shared Calm/Wild hazard votes, free flag recovery, session points and same-code rematches.
- Let late arrivals and finishers spectate and vote; queued players enter the next round. Preserve competitive Tour/Endurance, solo medals, saves, cosmetics and shops.
- Make Play with friends the primary entry action; explain no-WebGL invites while preserving the room code.
- Add party physics, protocol and multi-browser regression coverage, a submission kit and bounded judging-week health checks.
- Give blocked graphics frames and resumed tabs a bounded grace period before stale-connection detection. Use SVG direction icons on touch controls.

## 9.3.1 — 29 October 2026

- Remove ability buttons from the desktop playfield too; owned solo abilities remain available through the race menu on every device.

## 9.3.0 — 29 October 2026

- Clear the mobile playfield: remove the course card and power row, and anchor the clock/pause button to the upper-right edge.
- Keep course details, settings/help and owned solo powers available in the race menu; activation resumes play without duplicate consumption.
- Add a static Vercel frontend that shares the existing Render race server with a strict owned-origin allowlist.
- Wake an idle backend once per page visit; allow cancellable online startup retries without delaying solo play.
- Preserve the Render deployment, all course/physics rules, and each origin's browser saves.

## 9.2.1 — 29 October 2026

- Replace external game references in About with Bean Dash’s own description and technical credits.
- Keep Play, Race Online and Coin Shop fully visible on short landscape entry screens.
- Separate desktop power buttons from the race progress panel.
- Add a four-viewport mouse/touch regression covering 104 UI checks.
- Shorten README and add player, contribution, security, deployment and third-party documentation with reporting templates.

## 9.2.0 — 29 October 2026

- Fix landscape HUD layout, mountain mesh holes and checkpoint camera recovery.
- Improve late-level bot navigation without collision immunity or recovery privileges.
- Unify mode recovery instructions and replace navigation glyphs with SVG arrows.
- Scale Endurance earnings with distance and cap its gently rising revival prices.
- Require zero hits, shield impacts, falls and recoveries for clean-run eligibility.
- Reject malformed anonymous joins that could crash the server; validate production assets before tests.
