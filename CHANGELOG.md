# Changelog

## 9.3.1 — 29 October 2026

- Remove ability buttons from the desktop playfield too; owned solo abilities remain available through the race menu on every device.

## 9.3.0 — 29 October 2026

- Clear the mobile playfield: remove the course card and power row, and anchor the clock/pause button to the upper-right edge.
- Keep course details, settings/help and owned solo powers available in the race menu; activation resumes play without duplicate consumption.
- Add a static Vercel frontend that shares the existing Render race server with a strict owned-origin allowlist.
- Wake an idle backend once per page visit; allow cancellable online startup retries without delaying solo play.
- Preserve the Render deployment, all course/physics rules, and each origin's browser saves.

## 9.2.1 — 29 October 2026

- Replace external game references in About with Bean Dash’s own description and technical credits.
- Keep Play, Race Online and Coin Shop fully visible on short landscape entry screens.
- Separate desktop power buttons from the race progress panel.
- Add a four-viewport mouse/touch regression covering 104 UI checks.
- Shorten README and add player, contribution, security, deployment and third-party documentation with reporting templates.

## 9.2.0 — 29 October 2026

- Fix landscape HUD layout, mountain mesh holes and checkpoint camera recovery.
- Improve late-level bot navigation without collision immunity or recovery privileges.
- Unify mode recovery instructions and replace navigation glyphs with SVG arrows.
- Scale Endurance earnings with distance and cap its gently rising revival prices.
- Require zero hits, shield impacts, falls and recoveries for clean-run eligibility.
- Reject malformed anonymous joins that could crash the server; validate production assets before tests.
