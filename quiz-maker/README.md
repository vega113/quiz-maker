# Quiz Maker

A lightweight web-based quiz interface scaffolding. Use this project to experiment with quiz flows, add questions, and iterate on UI components.

## Project Structure

- `index.html`: Static entry point that wires styles and the module loader.
- `src/main.js`: Bootstraps the quiz, resolves the quiz ID, and mounts UI components.
- `src/components/`: UI-specific modules (e.g., `quiz.js` renders the interface).
- `src/services/`: Data helpers such as `quiz-loader.js` for fetching quiz JSON.
- `styles/`: Shared stylesheet files (`styles/main.css` contains the base theme).
- `public/assets/quizzes/`: Quiz JSON definitions that can be added/dropped independently.
- `package.json`: Node tooling placeholder.
- `dist/`: Bundler output (ignored by git).
- `tests/`: Vitest suites mirroring modules under `src/`.

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Run a local dev server to preview `index.html`:
   ```sh
   npx http-server . --port 4173
   ```
3. When the project grows, add a bundler (Vite or Parcel) configured to emit into `dist/` and document it under an `npm run build` script.

### Routing & Static Hosting

The app reads the pathname to decide which view to render. Serve it with a static server that supports single-page app fallbacks (e.g., `npx http-server . --port 4173 --push-state`). Without a fallback, deep links such as `/history-basics` may 404; in that case use `index.html?quiz=history-basics` instead.

## Development Guidelines

- Use two-space indentation and semantic HTML.
- Keep CSS classes in BEM form (e.g., `quiz-card__title`).
- Name files in kebab-case and export primary functions/components as named exports.
- Place fetch or API logic inside `src/services/` with centralized error handling.
- Store secrets in `.env.local` and reference them in `README.md` without committing sensitive values.

## Adding a New Quiz

1. Create a JSON file under `public/assets/quizzes/` (e.g., `history-basics.json`) using the shape below:
   ```json
   {
     "title": "History Basics",
     "description": "Quick check on history milestones.",
     "tipPenalty": 0.5,
     "questions": [
       {
         "prompt": "Кто открыл Америку?",
         "answers": ["Марко Поло", "Христофор Колумб", "Фернан Магеллан"],
         "correctIndex": 1,
         "tip": "Это путешественник, который приплыл в 1492 году."
       }
     ]
   }
   ```
2. Regenerate the manifest so the menu picks it up:
   ```sh
   npm run generate:manifest
   ```
   The script scans quiz files, extracts titles/descriptions, and writes `public/assets/quizzes/quizzes.json`.
3. Launch the app at `/menu` to see the menu or go directly to `/<quiz-id>` (e.g., `http://localhost:4173/history-basics`). When static hosting does not support clean URLs, fall back to `index.html?quiz=history-basics`.
4. The loader sanitizes IDs (`a-z0-9-_`), so match the filename and desired URL slug.

## Formatting & Testing

- Run Prettier before commits:
  ```sh
  npx prettier --check .
  ```
- Set up Vitest with Testing Library and add smoke tests covering render, question selection, and scoring flows:
  ```sh
  npm test
  ```

## Security & Maintenance

- Audit dependencies before releases:
  ```sh
  npm audit
  ```
- Keep quiz answer datasets out of version control. Document required env vars in `README.md`.
- Fix high-severity audit findings immediately.

## Commit & PR Workflow

- Use Conventional Commits (e.g., `feat: add question bank service`).
- Keep PRs focused, include verification commands, and attach screenshots for UI updates.
- Note any follow-up tasks or known gaps in the PR description.

## License

This project is currently unlicensed. Add licensing details here if the project is published.
