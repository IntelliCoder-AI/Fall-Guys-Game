# Contributing

Keep changes focused and preserve existing saves, collision rules and fair multiplayer behavior. Discuss large mechanics or hosting changes in an issue before implementing them.

## Development

Use Node.js 22 or later. Run `npm ci`, `npm run build` and `npm start`; the game opens at http://localhost:3000. Browser assets in `dist/` are the maintained source, not generated output. No framework bundler is required.

## Verification

- Run `npm test` for physics, persistence, economy, security, all 50 routes and representative bot rooms.
- Run `node tests/endurance.mjs` for full-room termination and qualification checks; it can take substantially longer than the core suite.
- For UI changes, run `node tests/challenge-ui-browser.cjs`. This optional check needs Playwright and Chromium. Install Playwright locally with `npm install --no-save --package-lock=false playwright`; set `CHROMIUM_PATH` to an installed Chromium executable. Evidence goes to the system temporary directory unless `BEAN_DASH_UI_REPORT` is set.
- Inspect affected screenshots and test both independent browser contexts for multiplayer changes. Software WebGL and emulated touch do not replace physical-device testing.
- Run `git diff --check`; include only intentional source, documentation and test changes.

Do not weaken assertions to get a green build. Navigation fixtures and human medal targets are separate; see [BALANCE.md](BALANCE.md). Never commit credentials, browser profiles, logs, generated test screenshots or `node_modules`.

## Pull requests and bug reports

Describe what the player did, expected and observed. Include the course/mode, browser, viewport and reproducible steps. For a fix, state the cause and the actual checks run, including limitations. Keep third-party license notices intact. Avoid adding dependencies or restructuring working systems without a clear need.
