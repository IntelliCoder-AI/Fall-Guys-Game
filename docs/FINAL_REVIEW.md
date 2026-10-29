# Final submission review · v9.6.0

## Reviewed scope

Native browser modules, authoritative WebSocket rooms, Relay physics/rendering/UI, all 50 Tour routes, representative late bot survival, Room Remix, competitive rooms, Endurance rules, guest persistence, economy/shop, wardrobe, camera recovery, hosting configuration, dependency licenses, documentation and release/health workflows.

## Changes verified

- Relay storm: 120 seconds after interactive practice. Bridge/gate/wind cycles last 8/7/9 seconds after opening. First activation costs energy; subsequent cycles are free and duplicate-safe. The bridge flashes before closing.
- Three route orders share one geometry/physics layout: Bridge–Gate–Wind; Gate–Wind–Bridge; Wind–Bridge–Gate. Gate contact comparisons tolerate coordinate rounding across stage offsets.
- Clear starting-role choice and role controls, free recovery, team checkpoints, disconnection transfer, late-join watching and same-code lobby recovery remain included.
- Wardrobe/settings/shop wording, explicit affordability, singular obstacle labels, medal-time label and actionable graphics-help entry replace the reported copy.
- README and submission kit describe the shipped modes and use an actual staged-gameplay cover. License notices remain included.
- Tagged releases require matching package versions, automated tests and the production build before publication. Judging monitoring is bounded and requires no credentials or paid infrastructure.

## Actual validation

| Check | Result |
| --- | --- |
| Full automated suite | 79 passed; zero failed/cancelled/skipped |
| Final focused Relay tests | 13 passed, including timed expiry/free reopening, distinct layouts, collision, authority, real 2/3/8-player physics traversals and WebSockets |
| Core responsive screens | 104 checks, zero findings; 821×462, 907×510, 1280×720, 800×450, each mouse/touch |
| Relay browser flow | Three independent Chromium contexts; role changes, mechanisms, touch controls, checkpoints, recovery, spectators, disconnects, rematch and preserved wallet passed; 18 role/layout checks; zero page errors |
| Compact solo HUD/menu | Passed at 320×568, 390×700, 412×844, 568×320, 844×390 and 1024×768 |
| Economy browser flow | Purchases, previews/orbit, duplicate clicks, powers, paid revival, pending reload, insufficient funds, mobile layout and online restriction passed |
| Production / Vercel builds | Passed; 32 assets, 64 local references; runtime syntax checked |
| Dependencies | npm runtime audit: zero known vulnerabilities; no runtime dependency added |
| Hygiene | No suspected secret patterns in 29 source/workflow files; no tracked secret/log files; local documentation links resolve; workflows parse; diff whitespace checks pass |
| Judging health workflow | Existing GitHub run 40931027640 completed successfully; bounded ten-minute schedule retained |

A multi-browser attempt timed out when concurrent software-rendered suites shared CPU; the independent rerun passed. A newly added stage collision test initially failed and exposed the coordinate-rounding bug; the implementation was fixed and the test passed. Failures were not bypassed.

## Practical limits

- Browser testing used Chromium with software WebGL and emulated sizes/touch. Physical phones/tablets, Safari, real GPUs and production capacity are not certified.
- Production deployment health/version checks are separate from interactive gameplay. This workspace's direct production browser/WebSocket access is restricted; multiplayer gameplay was exercised locally with real sockets and independent browser contexts.
- Complete one final expedition on two actual devices before submitting, including a phone if available. Human timing/balance can differ from automated reference inputs.
- Free Render can cold-start or restart. Scheduled health checks are best effort; rooms are memory-only and end on restart. Waiting-room reconnection cannot restore a server-deleted room.
- Coins/progression are browser-local guest saves, not account-backed or tamper-proof; the two public domains have separate saves. Paid gameplay powers remain solo.
- WebGL is required; a playable 2D fallback, gamepad support, remappable controls and some roadmap features remain planned. No prize, judging score or universal device support is promised.
- The public repository preserves upstream notices. Project materials do not declare an additional license for the original game code.

## Submission package

[Public game](https://bean-dash-online.vercel.app/) · [Backup](https://bean-dash-online.onrender.com/) · [Submission text and walkthrough](SUBMISSION.md) · [Relay guide](WORLD_RELAY.md) · [Release notes](RELEASE.md)

Eligibility and ChatGPT Work usage were self-confirmed by the creator. No Handshake entry has been submitted automatically. Use the earlier published deadline in the submission kit until the organizer resolves the mission/rules discrepancy.
