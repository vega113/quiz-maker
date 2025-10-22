# Quiz Maker

A lightweight web-based quiz interface scaffolding. Use this project to experiment with quiz flows, add questions, and iterate on UI components.

## Project Structure

- `index.html`: Shell for the quiz UI.
- `package.json`: Node tooling placeholder.
- `src/`: Add components, services, and helpers here (e.g., `src/components/quiz-card.js`).
- `styles/`: Shared stylesheet files.
- `public/assets/`: Static media assets (images, audio, etc.).
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

## Development Guidelines

- Use two-space indentation and semantic HTML.
- Keep CSS classes in BEM form (e.g., `quiz-card__title`).
- Name files in kebab-case and export primary functions/components as named exports.
- Place fetch or API logic inside `src/services/` with centralized error handling.
- Store secrets in `.env.local` and reference them in `README.md` without committing sensitive values.

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
