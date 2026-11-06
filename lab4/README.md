# 2048 Puzzle Game

React + Vite 2048 with undo, best score, saved games, swipe/keyboard controls, sound and light/dark themes.

```bash
npm install
npm run dev      # develop
npm test         # game-logic tests
npm run build    # production build to dist/
```

## Deploy to GitHub Pages
1. Create a public repo named `2048-puzzle-game` and push this code to `main`.
2. In **Settings → Pages**, set Source to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push.
4. Open `https://<your-username>.github.io/2048-puzzle-game/`.

If you rename the repo, update `base` in `vite.config.js`.
