# Deployment

The game has two public entry points: a static Vercel frontend and the existing full Render game. Both use the same Node.js race server. The Vercel frontend can load and play solo while the Render service is asleep; online racing can still wait for it to wake.

## Vercel frontend

- Build: `npm run build:vercel`; output: `vercel-dist/`; install: `npm ci`.
- `vercel.json` sets static routing/security headers; no Vercel Function hosts race state.
- The build copies only browser assets, adds the public race-server origin to HTML, and produces static `/health` metadata with role=frontend.
- `hosting.json` declares the shared server and the exact owned frontend origins allowed by Render. Verify domain ownership before adding an origin. Arbitrary Vercel previews are not allowed to create rooms.
- A page visit makes one anonymous, nonblocking request to wake the backend. There is no periodic keep-alive. Online joining retries readiness with cancellation; solo never waits for backend health.
- Vercel and Render browser saves remain separate by origin. They share room codes, not wallets or solo records.

## Existing service settings

- Node.js 22 or later; one instance.
- Build: `npm ci && npm test` (the pretest hook also verifies production assets).
- Start: `npm start`.
- Runtime: platform-supplied `PORT`; optional `RENDER_GIT_COMMIT` identifies the release in `/health`.
- No application API keys, authentication service or database setup is required.

Verify `/health`, its version/commit, application assets, logs and a two-player private room after deployment. The free service can sleep; a first request may need about a minute. Deployments and restarts end in-memory rooms. Browser saves remain on the client.

## Hosting elsewhere

Do not upload only `dist/` and assume a separate host's multiplayer will work. The normal Render entrypoint connects to its own `/ws`; the Vercel build selects the configured backend. A new frontend host needs an explicitly owned origin in the allowlist and matching connection/security configuration.

Netlify is suitable for a static frontend, but the continuously running room server is not a drop-in Netlify Function. Vercel’s WebSocket Functions model has connection-duration and instance-placement constraints. In-memory rooms and long Endurance sessions need additional coordination/reconnection work before using that model; this deployment deliberately retains Render for races.

Keep the service on one instance until shared room coordination and multi-instance routing are deliberately implemented and tested. The automated suite does not establish a production concurrency limit.
