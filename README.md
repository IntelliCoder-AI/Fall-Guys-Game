# Bean Dash: Room Remix

[![Game checks](https://github.com/IntelliCoder-AI/bean-dash-online/actions/workflows/test.yml/badge.svg)](https://github.com/IntelliCoder-AI/bean-dash-online/actions/workflows/test.yml)

[Play on Vercel](https://bean-dash-online.vercel.app/) · [Play on Render](https://bean-dash-online.onrender.com/) · [Player guide](docs/GAME_GUIDE.md) · [Submission kit](docs/SUBMISSION.md)

A 3D party racer where your friends vote to remix the course. Choose Calm for steadier hazards or Wild for a faster, tougher race. Mistakes return you to the last flag for free, so everyone stays in the game. Built with ChatGPT Work; no player account or installation required.

![Room Remix party race, captured from a staged local session](docs/images/bean-dash.jpg)

- **Room Remix:** 2–8 friends, six short courses, a quick race or three-round tour, crowd votes, checkpoint respawns, spectator voting and same-code rematches.
- **World Tour:** 50 courses, checkpoints, medals and separate Hardcore records.
- **Endurance:** longer courses reaching 60 km, with solo checkpoint revivals.
- **Your runner:** four characters, modular clothing, cosmetics and a coin shop.
- **Competitive online:** the original 16-runner Tour/Endurance races remain available. Labeled bots fill empty places in both modes. Paid powers stay solo only.

## Play with friends

1. Choose **Play with friends**, pick a course and session, then **Generate room code**.
2. Friends use **Join by code**, or open your invite link. The host starts once at least two people join.
3. Race, vote Calm or Wild, and score 8 to 1 points by place. Each race ends within three minutes; unfinished places use course progress. Most total points wins; ties share victory.

Finishers watch and vote while the race continues. Late arrivals watch, vote and enter the next round or rematch. A three-round tour has 10-second breaks; the host can rematch without changing the code. Party points do not alter solo medals or coins. Choose **Competitive Tour & Endurance** for the original one-life, 16-runner rules.

**Controls:** WASD/arrow keys · Space to jump · Shift to dive/slide · Esc to pause solo or open the online menu · R to restart solo. Drag to look around, scroll to zoom, C to reset the camera. Touch controls appear on supported phones and tablets.

On mobile, the timer sits at the upper-right edge. Open the race menu for course/checkpoint details, controls, settings and solo power-ups; activating a power resumes the race. Ability buttons stay off the playfield on every device.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run build
npm start
```

Open http://localhost:3000. Run `npm test` for the automated suite.

| Folder | Purpose |
| --- | --- |
| `dist/` | Browser game, UI and bundled 3D assets |
| `server/` | Authoritative WebSocket races and private rooms |
| `tests/` | Physics, economy, persistence, multiplayer and UI regressions |
| `scripts/` | Production verification and balance tooling |

Vercel serves the homepage and solo game independently of the shared Render race server. Online connections can still wait for that free server to wake after inactivity. A temporary ten-minute health check runs through November 6; scheduled checks are best effort, not an uptime guarantee. Both addresses join the same multiplayer rooms, but each address has its own browser save and wallet; Render saves are preserved. Clearing browser data removes that site's progress. Rooms end when the server restarts. WebGL is required; real-device compatibility and capacity are not guaranteed by automated tests.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Deployment](docs/DEPLOYMENT.md) · [Third-party notices](THIRD_PARTY_NOTICES.md) · [Changelog](CHANGELOG.md) · [Balance](BALANCE.md) · [Roadmap](ROADMAP.md)
