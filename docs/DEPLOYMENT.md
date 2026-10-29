# Deployment

The current public game runs as one Node.js service on Render. It serves `dist/` and the `/ws` multiplayer endpoint from the same origin.

## Existing service settings

- Node.js 22 or later; one instance.
- Build: `npm ci && npm test` (the pretest hook also verifies production assets).
- Start: `npm start`.
- Runtime: platform-supplied `PORT`; optional `RENDER_GIT_COMMIT` identifies the release in `/health`.
- No application API keys, authentication service or database setup is required.

Verify `/health`, its version/commit, application assets, logs and a two-player private room after deployment. The free service can sleep; a first request may need about a minute. Deployments and restarts end in-memory rooms. Browser saves remain on the client.

## Hosting elsewhere

Do not upload only `dist/` and assume multiplayer will work. The client currently connects to `/ws` on its own host; the server checks the requesting origin. A separately hosted frontend needs an explicit backend endpoint, a restricted origin allowlist and matching connection/security configuration.

Netlify is suitable for the static frontend, but the current continuously running room server is not a drop-in Netlify Function. Vercel’s current WebSocket Functions beta still has connection-duration and instance-placement constraints. In-memory rooms and long Endurance sessions need additional coordination/reconnection work before using that model. Neither migration is necessary for the current public game.

Keep the service on one instance until shared room coordination and multi-instance routing are deliberately implemented and tested. The automated suite does not establish a production concurrency limit.
