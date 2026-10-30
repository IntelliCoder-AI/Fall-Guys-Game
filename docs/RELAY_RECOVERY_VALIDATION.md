# World Relay recovery and route expansion · 9.7.0

The reported reconnect dialog exposed a verified lifecycle gap: Relay players were removed immediately when their socket closed, and the client only retried waiting-room connections. The error action opened matchmaking again instead of restoring the existing player. Production logs contain abnormal transport closures (`1006`); those logs do not establish the underlying network cause.

## Changes

- A private, random recovery token reserves each Relay identity for 45 seconds after an interrupted connection. Automatic recovery restores the same room, player, role, position, shared energy, collected seals and device state. Team simulation, machinery timers and storm time pause while an active player recovers. The token rotates on successful recovery and is excluded from room snapshots, invite links and logs.
- A valid recovery can replace a stalled socket. Its old binding is removed before closure so a delayed close cannot delete the restored player. Forged, reused and expired tokens are rejected. Explicit departures release their slots immediately; expired reservations release roles and capacity.
- Lightweight application heartbeats supplement WebSocket ping/pong. The recovery screen describes what is preserved and retries without resetting the run or creating another room.
- Crossings grow from 112 to 160 metres. Each has two shared gold seals on side routes, required for its beacon. Moving sentinels can be jumped or dodged. The last island adds a six-second rescue lift, controlled by the Shaper with key 4 or a labelled touch button. Visual geometry and collision share the same layout and timers.
- The 120-second storm, role rotation, interactive practice, free falls/recovery, existing modes and browser progression remain. There are no new runtime dependencies or paid hosting changes.

## Verification

- Targeted Relay tests cover complete physics traversal with 2, 3 and 8 players, all stage orders, authority and costs, seals, impacts, lift support, role rotation, late arrivals, recovery, token replay/expiry, and replacement of a stalled socket.
- The reconnect browser test uses separate desktop and emulated mobile Chromium clients. It forces waiting-room loss, then goes offline mid-expedition and restores connectivity. It asserts the same player, code, role, energy, seal, frozen storm and functioning WASD after recovery, with no page errors.
- The three-client browser test exercises touch controls, mechanisms, recovery, late arrivals, all three beacon transitions, role changes, explicit departure, rematch and wallet isolation. Stage transitions use server fixtures; full traversal uses the actual physics simulation separately. Layout assertions cover the first and final island, including the fourth mechanism button, across nine viewport sizes.

| Check | Actual result |
| --- | --- |
| Full `npm test` suite | **85 passed**, 0 failed/cancelled/skipped; 456.663 seconds |
| Focused Relay suite | **19 passed**, including token rotation/replay protection and stalled-socket replacement |
| Production `npm run build:vercel` | Passed; 32 production assets and 64 local references verified |
| Same-origin reconnect browser | Passed forced lobby and mid-expedition outages; movement worked after recovery; 0 page errors |
| Split-origin reconnect browser | Passed the same flows with separate frontend/backend origins and the configured CSP; 0 page errors |
| Three-client Relay browser | Passed controls, state, recovery, transitions, roles, late arrival, departure, rematch and wallet checks; 0 page errors |
| Responsive first/final island HUD | **36 checks passed**, across 320×568, 390×700, 412×844, 568×320, 821×462, 907×510, 1280×720, 800×450 and 1024×768 |
| Dependency audit | 0 known production vulnerabilities; dependency remains `ws` 8.22.0 |
| Diff / secret-pattern scan | Clean whitespace check; no credential/private-key pattern findings in changed files |

The representative final browser frame used 75 draw calls. This is a scene observation, not an FPS, physical-GPU or production-performance guarantee. Screenshots and test output were retained in the execution workspace, including `/workspace/bean-dash-relay-97/` and `/workspace/relay-97-*.log`.

## Limits

A server restart, page refresh, deleted room or expired reservation can still end the expedition. Recovery tokens live in the open page and server memory. Free Render can sleep and restart; keepalive is not an uptime guarantee. Temporary abnormal network closures remain possible. Physical devices, Safari, real GPUs and production multiplayer capacity are not certified by Chromium/software graphics and local WebSocket tests. Production health checks do not constitute a live multiplayer playthrough.
