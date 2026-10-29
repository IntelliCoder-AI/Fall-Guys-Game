# Bean Dash


### ***[Play free in your browser →](https://bean-dash-online.onrender.com/)***

## About

Bean Dash is a free browser obstacle racer with 50 World Tour levels, private multiplayer rooms, customizable runners, and an Endurance mode reaching 60 km. Race across hills, ridge trails, circular stepping drums, and bridges above flowing blue water. Overhead hammer frames, warning lines and flashing platform edges make crossings easier to read. No account required.

- **World Tour:** 50 levels across five worlds, from 1 to 5.825 km. Denser crossings and obstacle combinations increase the challenge; each world ends in an extended gauntlet.
- **Endurance:** a separate long-distance mode reaching **60 km**.
- **24 mechanics:** roaming wheels, fireball volleys, sea bridges, moving platforms, vanishing islands, crushers, and more.
- **Your runner:** choose four characters and independently change clothes, hair, headwear, accessories, and colors.
- **Online:** up to 16 runners, with labeled bots filling empty slots. Top 12 qualify; world finales take 8. Endurance allows all 16 to finish. Finish results appear immediately; a loss shows a 2.6-second impact scene before the result. Water and dangerous hazards stop your run; walls block movement until cleared. Locked courses joined through a friend are practice runs without rewards.

**Controls:** WASD / arrows to move · Space to jump · Shift to dive or slide · Esc for the menu. Phones have touch controls. WebGL is required.

Drag the 3D view to orbit horizontally or vertically; scroll to zoom. Press **C** to restore the camera. These controls work in the lobby, wardrobe (drag the area outside its controls), and races. When looking around during a race, movement follows your camera direction. The characters use original stylized geometry with detailed clothing materials; they are not photorealistic human scans.

Progress stays in your browser profile. Solo checkpoint saves let you resume after pausing or closing the browser; Tour deaths automatically return you to the last flag with a 4-second penalty. Enable **Hardcore** in the level briefing for one life with separate medals and best times. Endurance keeps paid checkpoint revivals. Online races cannot pause, revive, or use power-ups. Clearing browser data removes your save. Earned unlocks survive updates; redesigned courses reset personal-best times.

## Coins and the shop

Course coins are credited immediately. Tour earnings cap at 500 per run; Endurance's cap scales at 100 coins per kilometre (minimum 500), including finish bonuses. Its HUD shows the cap. **Endurance revival costs 100 coins, then 125, 150, and 25 more each time**, capped at 250. You return to your checkpoint or the starting line with 3 seconds of protection; your clock, score, and collected coins carry over. A second trip past a collected coin earns nothing.

Open **Coin Shop** for persistent outfits, a helmet, wings, trails, particles and a victory animation (120–180 coins). Tour respawns cost no coins. Press **R**, use **Restart now** in the pause menu, or tap **Try again** after a loss to restart without a countdown. Solo consumables cost 25–35 coins: shield, sprint, double jump and magnet. Activate them using the race buttons. Supply chests cost 25 coins with a clearly stated 25% chance of each consumable. All currency is earned in-game; there are no real-money purchases. Purchases and the wallet stay in this browser, including when reloading a pending revival. Online races show your cosmetics without paid gameplay advantages.

A clean-run bonus requires no obstacle hits (including shield impacts), no water falls and no checkpoint recoveries.

## Play with friends

1. Choose your course, then **Race Online → Generate Room Code**.
2. Friends choose **Race Online**, enter that six-character code, and press **Join by Code**. Invite links also open the join form with the code filled in.
3. When everyone has joined, the host presses **Start Race**. Private rooms wait for you; they do not use the public matchmaking timer. At least two people are required. Empty places fill with labeled bots.

For a race on your own against public players and bots, choose **Quick race**. Rooms last until the race ends or everyone leaves; server restarts invalidate codes.

The [staged improvement roadmap](../ROADMAP.md) tracks the remaining tutorial, ghosts, rewards, social and accessibility work.

## Run locally

With Node.js 22 or later:

```sh
npm ci
npm start
```

Open `http://localhost:3000`. Run `npm test` for all checks, or `npm run test:balance` for the live 50-level simulation and difficulty assertions. See [BALANCE.md](../BALANCE.md) for the course design and reference runs.

Hosted on Render's free tier: waking after inactivity can take about a minute, and server restarts end active races. Bean Dash uses project-specific procedural characters, courses and obstacles. Licenses are in `dist/vendor/`.
