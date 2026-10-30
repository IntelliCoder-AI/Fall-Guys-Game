# World Relay

**Your friends control the world you cross. At the next beacon, it's your turn.**

Choose **Play with friends → Create World Relay**. Share the six-character room code or invite link. Two to eight people can play; there are no bots. The host chooses a starting role (Runner by default), then starts the expedition. A Shaper operates machinery with 1–4 or the labelled buttons; WASD and Space move only Runners.

## One team, three beacons

- **Runners** carry a lantern, jump low barriers, dodge moving sentinels and collect blue crystals plus both gold seals on the side routes. The two seals are required to light each beacon. Each pickup adds **2 shared energy**, once per crossing. Get every Runner to the glowing beacon.
- **The Shaper** watches a Runner and powers three mechanisms in the order shown for the current island: lower the bridge (**3 energy**), lift the gate (**3**) and steady the wind (**4**). Use the labelled buttons or **1, 2, 3** (and **4** on the final island). Machinery is timed: the bridge stays down for 8 seconds, the gate opens for 7, and wind steadies for 9. First activation costs energy; repeat cycles are free. A countdown and flashing bridge ring warn before closing. Double-tapping cannot start a second cycle.
- **At each beacon**, the team gathers and roles rotate after a four-second celebration. The Shaper becomes a Runner and another teammate takes the controls.
- **Win together:** reach all three beacons before the storm clock reaches zero. Falls return you to the last beacon for free. Room energy does not affect coins, cosmetics or solo medals.

Each island has a different route order: **Bridge → Gate → Wind**, **Gate → Wind → Bridge**, then **Wind → Bridge → Gate → Rescue lift**. Each crossing is 160 metres, with separated machinery and side routes. The final lift costs **2 energy**, takes 1.5 seconds to rise, and stays raised for **6 seconds**; repeat cycles are free. Wait for the deck to reach track height before crossing. Geometry, labels and collision use the same layout.

The first crossing is interactive practice. The storm remains stopped until a Runner moves, jumps and collects a crystal, and the Shaper powers the bridge. Then the team has two minutes. Roles and the next action stay visible at the top of the screen.

## Controls

| Action | Desktop | Phone / tablet |
| --- | --- | --- |
| Move | WASD / arrows | Direction buttons |
| Jump | Space | JUMP |
| Air dive | Shift | DIVE |
| Power machinery (Shaper) | 1 / 2 / 3 / 4 or click | Tap labelled mechanism |
| Look around | Drag; scroll to zoom; C resets | Drag the 3D view |
| Follow another Runner | Watching… button | Watching… button |
| Rules / menu | How to play / Esc | How to play / pause button |

Menus do not pause a connected team. A temporary Relay network loss automatically reconnects **the same player** to the **same expedition** for up to **45 seconds**, without resetting roles, position, seals, energy or machinery. The team simulation and storm pause during this recovery window. A private token sent only to that player's connection reserves the identity; room codes alone cannot claim it. Explicitly leaving releases the slot immediately. After the recovery window expires, the slot is released and a departing Shaper transfers the role to a connected teammate. If fewer than two teammates remain, the expedition pauses until someone joins.

Late arrivals watch and enter at the next beacon, or immediately if needed to restore a two-person team. A browser refresh, server restart, expired window or room deletion can still require a new room; the game explains this instead of silently restarting an expedition. Keep the page open during a brief connection interruption.

The host can start another expedition with the same room code after either result. In a group larger than three, only three people shape in a single expedition. Rooms are temporary and disappear on server restart. Persistent browser progress remains unchanged.

## Implementation and checks

- `server/relay-room.js`: authoritative room, resources, roles, checkpoints, recovery and lifecycle.
- `dist/relay-rules.js`: shared geometry and movement; closed gates use swept collision tests, bridge support matches its completed animation.
- `dist/relay-view.js`: the existing Three.js renderer, camera and wardrobe with textured floating cliffs, articulated machinery, lanterns and atmospheric depth. Repeated static objects use instancing; existing Performance graphics disables shadows.
- `dist/relay-ui.js` / `dist/relay.css`: role-specific controls and responsive HUD.
- `node --test tests/relay.test.mjs`: real-physics cooperative traversals, authority, energy, falls, joins and disconnects.
- `node tests/relay-browser.cjs`: independent Chromium clients, touch input, role switching, UI bounds and screenshots. Requires an existing Playwright/Chromium installation; no game runtime dependency is added.
