# World Relay

**Your friends control the world you cross. At the next beacon, it's your turn.**

Choose **Play with friends → Create World Relay**. Share the six-character room code or invite link. Two to eight people can play; there are no bots. The host starts the expedition.

## One team, three beacons

- **Runners** carry a lantern, jump low barriers and collect blue crystals. Each crystal adds **2 shared energy**, once per crossing. Get every Runner to the glowing beacon.
- **The Shaper** watches a Runner and powers three mechanisms in order: lower the bridge (**3 energy**), lift the gate (**3**) and steady the wind (**4**). Use the labelled buttons or **1, 2, 3**. Powered mechanisms stay on; holding or double-tapping cannot spend again.
- **At each beacon**, the team gathers and roles rotate after a four-second celebration. The Shaper becomes a Runner and another teammate takes the controls.
- **Win together:** reach all three beacons before the storm clock reaches zero. Falls return you to the last beacon for free. Room energy does not affect coins, cosmetics or solo medals.

The first crossing is interactive practice. The storm remains stopped until a Runner moves, jumps and collects a crystal, and the Shaper powers the bridge. Then the team has four minutes. Roles and the next action stay visible at the top of the screen.

## Controls

| Action | Desktop | Phone / tablet |
| --- | --- | --- |
| Move | WASD / arrows | Direction buttons |
| Jump | Space | JUMP |
| Air dive | Shift | DIVE |
| Power machinery (Shaper) | 1 / 2 / 3 or click | Tap labelled mechanism |
| Look around | Drag; scroll to zoom; C resets | Drag the 3D view |
| Follow another Runner | Watching… button | Watching… button |
| Rules / menu | How to play / Esc | How to play / pause button |

Menus do not pause a connected team. If fewer than two active teammates remain, simulation and storm time pause until someone joins. A departing Shaper transfers the role to a connected teammate. Late arrivals watch and enter at the next beacon, or immediately if needed to restore a two-person team. Rejoining creates a new guest slot, not a claim to another player's identity.

The host can start another expedition with the same room code after either result. In a group larger than three, only three people shape in a single expedition. Rooms are temporary and disappear on server restart. Persistent browser progress remains unchanged.

## Implementation and checks

- `server/relay-room.js`: authoritative room, resources, roles, checkpoints, recovery and lifecycle.
- `dist/relay-rules.js`: shared geometry and movement; closed gates use swept collision tests, bridge support matches its completed animation.
- `dist/relay-view.js`: the existing Three.js renderer, camera and wardrobe with textured floating cliffs, articulated machinery, lanterns and atmospheric depth. Repeated static objects use instancing; existing Performance graphics disables shadows.
- `dist/relay-ui.js` / `dist/relay.css`: role-specific controls and responsive HUD.
- `node --test tests/relay.test.mjs`: real-physics cooperative traversals, authority, energy, falls, joins and disconnects.
- `node tests/relay-browser.cjs`: independent Chromium clients, touch input, role switching, UI bounds and screenshots. Requires an existing Playwright/Chromium installation; no game runtime dependency is added.
