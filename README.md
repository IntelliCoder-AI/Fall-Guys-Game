# Bean Dash — World Tour

**[Play the game →](https://bean-dash-online.onrender.com)**

A free browser obstacle racer. No download or account needed.

- Explore **50 levels across five worlds**, from **1,000 m to 60,000 m**.
- Learn **19 obstacle mechanics**: new types unlock through level 46, with more obstacles and faster cycles as you progress.
- Race real players, invite friends, or play solo. Empty online slots fill with labeled bots.
- Finish to see your results immediately and unlock the next level.
- Collect coins, beat medal times, and unlock four streetwear runners.

**Controls:** WASD / arrows to move · Space to jump · Shift to dive / slide · Esc for the menu. Touch controls appear on phones.

Long solo runs save at checkpoint flags; resume from the level briefing after reopening the game. Late levels are endurance races. Online races run continuously and cannot resume after disconnecting.

Your progress saves in your browser. Different browser profiles have separate saves; clearing browser data removes progress.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm start
```

Open `http://localhost:3000`. Run tests with `npm test`.

Hosted on Render. The free server may need about a minute to wake after inactivity. Live rooms are temporary; server restarts end active races.

Original characters and course art, inspired by Fall Guys, Subway Surfers, and Trackmania. Not affiliated with their creators. Third-party licenses are in `dist/vendor/`.
