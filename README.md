# Bean Dash Online

A public, anonymous browser obstacle-racing game with real-time multiplayer and three numbered levels. No ChatGPT account or other sign-in is required.

## Play

- **Play Online:** join a shared race; invite friends using the room link. After 18 seconds, clearly labeled bots fill empty slots up to 16 runners.
- **Level 1 — Whirly Rush:** eight can qualify.
- **Level 2 — Bumper Boulevard:** four can qualify.
- **Level 3 — Crown Circuit:** the first finisher wins a crown.
- Qualified players automatically advance after a nine-second round introduction. Eliminated players can spectate or return to the lobby.
- **Solo Practice:** qualify to unlock the next level and choose it from the lobby.

WASD/arrows move, Space jumps, Shift dives while airborne, Escape opens the menu. Live races continue while a menu is open. Touch controls are provided.

## Guest data

Browser local storage holds only the guest name, color, unlocked practice levels, crown count, settings, and personal bests. Separate browser profiles have separate saves; people sharing one browser profile share its save. Clearing browser data removes progress. There is no cross-device synchronization. Storage failures fall back to memory for the current visit.

The race server assigns a random connection-specific player ID and accepts controls only for that connection's runner. Clients cannot submit authoritative positions, ranks, or other players' IDs. Other racers see only race information, chosen names, and colors. Personal saved progress is not uploaded. Rooms are temporary and disappear after completion or disconnection.

## Run and verify

Node.js 22 or later:

```sh
npm ci
npm start
```

The server binds `0.0.0.0` and uses `PORT` (default 3000). `/health` returns readiness JSON. The same server serves the vendored frontend and WebSockets at `/ws`.

```sh
npm test
node tests/browser.cjs
node tests/course.cjs
```

The browser scripts require Playwright and Chromium. Tests cover guest storage isolation, level advancement, traversable gaps, actual bot completion, two-client room synchronization, server-authoritative controls, and browser UI.

## Hosting

Deploy the GitHub repository to a Render Node web service with build command `npm ci && npm test` and start command `npm start`. Use a single instance: active rooms live in memory. Horizontal scaling would need shared matchmaking and room routing. Deploys/restarts end active matches; the UI reports disconnection and preserves browser saves. The free Render plan can sleep after inactivity and may take about a minute to wake; this is a hobby-scale deployment, not a production-scale game service.

## References and licenses

- [Official Fall Guys gameplay trailer](https://www.youtube.com/watch?v=YT2G_DHxp_g)
- [Screenshot gallery](https://www.mobygames.com/game/148912/fall-guys-ultimate-knockout/screenshots/)

All characters and courses use original procedural geometry. This fan game is not affiliated with Mediatonic or Epic Games. Three.js is MIT licensed (`dist/vendor/THREE-LICENSE.txt`); Outfit uses the SIL Open Font License (`dist/vendor/OFL.txt`).
