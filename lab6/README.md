# Tic-Tac-Toe

Plain HTML, CSS and JavaScript. No build step or dependencies.

**Play:** open `index.html` in a modern browser.

**Test the game logic:** `node tests/logic.test.js` (checks all wins, draws, Easy/Medium behaviour, and that Hard never loses).

**Host free on GitHub Pages:** push this folder to a repo, then Settings → Pages → deploy from the `main` branch root.

## Features
- Solo (you are X vs Easy / Medium / Hard AI) and Duo (two players, custom names)
- Easy = random, Medium = win → block → centre/corner/edge, Hard = Minimax
- Win highlighting with animated winning line, draw detection
- Separate Solo and Duo scores, win streaks and best streaks saved in LocalStorage
- Reset Scores with confirmation, statistics screen, How to Play
- Dark (arcade) and light themes, sound with mute, responsive layout

## Files
- `index.html` – screens and markup
- `css/style.css` – styling and animations
- `js/logic.js` – rules and AI (also loaded by Node for tests)
- `js/app.js` – UI, storage, sound
- `tests/logic.test.js` – logic tests
