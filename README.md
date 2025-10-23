# Quiz Maker

A lightweight web-based quiz interface scaffolding. Use this project to experiment with quiz flows, add questions, and iterate on UI components.

## Project Structure

- `index.html`: Static entry point that wires styles and the module loader.
- `src/main.js`: Bootstraps the quiz, resolves the quiz ID, and mounts UI components.
- `src/components/`: UI-specific modules (e.g., `quiz.js` renders the interface).
- `src/services/`: Data helpers such as `quiz-loader.js` for fetching quiz JSON.
- `styles/`: Shared stylesheet files (`styles/main.css` contains the base theme).
- `public/assets/quizzes/`: Quiz JSON definitions that can be added/dropped independently.
- `scripts/generate-quizzes-manifest.js`: Scans quiz JSON files and generates `public/assets/quizzes/quizzes.json` used by the Menu view.
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
3. If you add or edit quiz files, regenerate the manifest so the Menu sees changes:
   ```sh
   npm run generate:manifest
   ```
4. When the project grows, add a bundler (Vite or Parcel) configured to emit into `dist/` and document it under an `npm run build` script.

### Routing & Static Hosting

The app reads the pathname to decide which view to render. Serve it with a static server that supports single-page app fallbacks (e.g., `npx http-server . --port 4173 --push-state`). Without a fallback, deep links such as `/history-basics` may 404; in that case use `index.html?quiz=history-basics` instead.

## Development Guidelines

- Use two-space indentation and semantic HTML.
- Keep CSS classes in BEM form (e.g., `quiz-card__title`).
- Name files in kebab-case and export primary functions/components as named exports.
- Place fetch or API logic inside `src/services/` with centralized error handling.
- Store secrets in `.env.local` and reference them in `README.md` without committing sensitive values.

## Adding a New Quiz

1. Create a JSON file under `public/assets/quizzes/` (e.g., `history-basics.json`) using the shape below. You can include optional metadata: `author`, `sourceUrl`, and a markdown-formatted `summary` that will be shown as a collapsible section on the Menu and on the Quiz page (collapsed by default).
   ```json
   {
     "title": "History Basics",
     "description": "Quick check on history milestones.",
     "author": "Jane Doe",
     "sourceUrl": "https://example.com/lecture",
     "summary": "**Key points:**\n\n- Columbus sailed in 1492\n- Use rational and emotional arguments\n\n*Tip:* keep it concise.",
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
   Notes:
   - The `summary` is a string with Markdown. Because it lives in JSON, escape newlines as `\n` and quotes as needed.
   - See “Markdown support for summaries” below for exactly what is supported and known limitations.
2. Regenerate the manifest so the Menu picks it up (and so summaries appear in the Menu list):
   ```sh
   npm run generate:manifest
   ```
   The script scans quiz files, extracts titles/descriptions/optional metadata (including `summary`), and writes `public/assets/quizzes/quizzes.json`.
3. Launch the app at `/menu` to see the menu. Menu links use the query-string form (`?quiz=<id>`) so they work even on servers without SPA rewrites. You can also open `index.html?quiz=history-basics` directly.
4. The loader sanitizes IDs (`a-z0-9-_`), so match the filename and desired URL slug.

## Summaries (optional)

- If a quiz JSON contains a `summary` field (markdown string), the UI shows a small toggle labeled "▶ Краткое содержание":
  - On the Menu page: under the quiz card; collapsed by default.
  - On the Quiz page: under the header; collapsed by default.
- Clicking the toggle expands/collapses the rendered markdown summary; the icon switches between `▶` and `▼`.
- Accessibility: toggle buttons expose `aria-expanded` and are linked to the content via `aria-controls` and matching element `id`.

### Markdown support for summaries

Supported elements
- Headings: `##`–`######` at the start of a line (H2–H6). H1 (`#`) is intentionally not used to keep typography balanced in cards and headers.
- Unordered lists: lines beginning with `- ` or `* `.
- Ordered lists: lines beginning with `1. `, `2. `, etc. Use consecutive list items without other blocks in between to keep numbering continuous.
- Horizontal rules: a line containing only `---`, `***`, or `___`.
- Paragraphs and line breaks: blank lines create new paragraphs; single newlines inside a paragraph render as a line break.
- Inline formatting: **bold** (`**text**`), *italic* (`*text*`), inline `code` (`` `code` ``), and [links](https://example.com) (`[text](url)`).

Limitations (not supported)
- Nested lists (e.g., bullets inside numbered items) are not supported.
- Continuing an ordered list across other block elements (like paragraphs or ULs) is not supported; each new list starts at 1.
- Markdown tables, blockquotes, images, strikethrough, task lists, and fenced code blocks are not supported.
- HTML blocks and inline HTML are not rendered.
- Auto-linking plain URLs isn’t supported — wrap them as `[text](url)`.

Authoring tips
- For numbered sections that include bullet points, prefer headings with explicit numbering, for example:
  - `### 1. Подготовка тела — основа голоса`
  - Followed by bullet points with `- ` on the next lines
- Use `---` to visually separate large sections.
- Remember to escape newlines as `\n` inside JSON strings and re-run `npm run generate:manifest` so the Menu gets the updated summary.

## Writing great summaries (guidelines)

This section explains how to craft user-friendly, great-looking summaries that render beautifully in our UI and fit within the supported markdown subset. See also: “Markdown support for summaries”.

Essentials
- Purpose: help readers preview the lecture and recall key ideas quickly. Summaries should be scannable and action-oriented.
- Length: 120–250 words (800–1600 characters) is a good target; aim for 4–7 short sections or 6–10 bullets.
- Voice and tone: concise, positive, practical. Prefer verbs and outcomes over abstract definitions.
- Readability: short lines (max ~90 characters), avoid long paragraphs. One idea per bullet.

Recommended structure
- Start with a compact H3 title line:
  - `### Конспект лекции` or `### Ключевые идеи`
- Organize content into small sections (H4) followed by bullets:
  - `#### 1. Тема/раздел`
  - `- 2–4` коротких пункта, каждый с одним действием/выводом
- Use horizontal rules `---` to separate larger blocks if the summary is long.
- Close with a “mini-вывод” or “Совет” в 1–2 строчках.

Styling dos and don’ts
- Do use:
  - H3/H4 headings for hierarchy (`###`, `####`).
  - Bullets `- ` for lists; numbered lists `1.` only for linear шагов (без вложенности).
  - Bold to highlight ключевые термины: `**главная идея**`.
  - Short links with human-readable text: `[исследование Гарварда](https://example.com)`.
- Don’t use (not supported or hurts readability):
  - Nested lists, tables, blockquotes, images, raw HTML, fenced code blocks.
  - Длинные абзацы >4 строк, “стены текста”.
  - Сырые URL без якорного текста.

Content checklist
- [ ] Есть H3 заголовок (например, "### Конспект лекции").
- [ ] 4–7 разделов или 6–10 пунктов, каждый короткий и самостоятельный.
- [ ] Крупные блоки отделены `---` при необходимости.
- [ ] Нет вложенных списков и слишком длинных абзацев.
- [ ] Ключевые термины выделены `**жирным**` (умеренно).
- [ ] В конце есть мини‑совет или вывод (1–2 строки).
- [ ] Для меню сгенерирован манифест: `npm run generate:manifest`.

Two ready-to-use templates

Template A — sectioned outline
```
### Конспект лекции

#### 1. Контекст / зачем
- Проблема или цель в 1–2 строках
- Ожидаемый результат для слушателя

#### 2. Ключевые принципы
- Принцип 1 — коротко, с глаголом
- Принцип 2 — коротко, с глаголом

#### 3. Практика
- Упражнение 1 — 1 строка
- Упражнение 2 — 1 строка

---

Совет: 1–2 строки, что сделать прямо сегодня.
```

Template B — numbered steps + bullets
```
### Ключевые шаги

1. Подготовка
- 2–3 коротких действия

2. Действие
- 2–3 коротких действия

3. Итог
- Ожидаемый результат / критерий успеха

---

Вывод: 1 строка про пользу и следующий шаг.
```

Examples in this repo
- Посмотрите готовые `summary` в: `public/assets/quizzes/6-make-a-memorable-speech.json`, `9-public-speaking.json`, `5-three-whales-of-public-speaking.json` — они следуют рекомендованной структуре.

Maintenance notes
- После редактирования `summary` перегенерируйте манифест, чтобы обновления появились в Меню:
  ```sh
  npm run generate:manifest
  ```
- Тестируйте отображение на обеих страницах: `/menu` и `?quiz=<id>`.

### Quick verify

- After adding/editing a quiz file, run `npm run generate:manifest`.
- Open `/menu`: quizzes with a summary will show the toggle; expand to see formatted summary.
- Open a quiz via `?quiz=<id>`: the same toggle appears beneath the title/description.

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