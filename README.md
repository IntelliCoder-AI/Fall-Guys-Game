# Bean Dash

**[Play free in your browser →](https://bean-dash-online.onrender.com/)**

An obstacle racer with live multiplayer, solo races, and no account required.

- **World Tour:** 50 levels across five worlds, from 1 to 4.675 km. New mechanics, narrow crossings, and obstacle combinations increase the challenge.
- **Endurance:** a separate long-distance mode reaching **60 km**.
- **24 mechanics:** roaming wheels, fireball volleys, sea bridges, moving platforms, vanishing islands, crushers, and more.
- **Your runner:** choose four characters and independently change clothes, hair, headwear, accessories, and colors.
- **Online:** up to 16 runners, with labeled bots filling empty slots. Top 12 qualify; world finales take 8. Endurance allows all 16 to finish. Your result appears immediately.

**Controls:** WASD / arrows to move · Space to jump · Shift to dive or slide · Esc for the menu. Phones have touch controls. WebGL is required.

Progress stays in your browser profile. Solo checkpoint saves let you resume later; online races cannot pause or resume. Clearing browser data removes your save. Earned unlocks survive updates; redesigned courses reset personal-best times.

## Run locally

With Node.js 22 or later:

```sh
npm ci
npm start
```

Open `http://localhost:3000`. Run `npm test` for physics, balance, saves, customization, and WebSocket checks. See [BALANCE.md](BALANCE.md) for the course design and reference runs.

Hosted on Render's free tier: waking after inactivity can take about a minute, and server restarts end active races. Original assets inspired by Fall Guys, Subway Surfers, and Trackmania; no affiliation. Licenses are in `dist/vendor/`.
