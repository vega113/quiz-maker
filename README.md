# Quiz Maker

A lightweight web-based quiz interface scaffolding. Use this project to experiment with quiz flows, add questions, and iterate on UI components.

## Project Structure

- `index.html`: Static entry point that wires styles and the module loader.
- `src/main.js`: Bootstraps the quiz, resolves the quiz ID, and mounts UI components.
- `src/components/`: UI-specific modules (e.g., `quiz.js` renders the interface).
- `src/services/`: Data helpers such as `quiz-loader.js` for fetching quiz JSON.
- `styles/`: Shared stylesheet files (`styles/main.css` contains the base theme).
- `public/assets/quizzes/`: Каталоги предметов с викторинами и метаданными (`<subject>/subject.json`).
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

1. Выберите или создайте папку предмета под `public/assets/quizzes/`. Именуйте её с порядковым префиксом, чтобы управлять сортировкой: `01-art-of-speech/`, `02-meditation/` и т. д.
2. (Опционально) Добавьте `subject.json` с метаданными предмета — см. раздел ниже.
3. Создайте файл викторины внутри папки предмета (например, `public/assets/quizzes/02-meditation/meditation-basics.json`) по схеме ниже. Допустимы метаданные: `author`, `sourceUrl`, markdown-`summary` (показывается в меню и на странице квиза, свёрнуто по умолчанию).
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
   - `id` и `legacyId` генерируются автоматически из имени файла, поэтому поле `id` необязательно.
   - `summary` — markdown-строка. Внутри JSON экранируйте переводы строк `\n` и кавычки.
   - См. «Markdown support for summaries» ниже для списка поддерживаемых элементов.
4. Перегенерируйте manifest, чтобы меню увидело новые данные (включая предметы, сводки и ссылки):
   ```sh
   npm run generate:manifest
   ```
   Скрипт обходит каталоги предметов, собирает метаданные и формирует `public/assets/quizzes/quizzes.json` (манфест v2 с разделами и плоским списком для обратной совместимости).
5. Откройте `/menu`, чтобы увидеть карточки предметов. Там же можно раскрыть список викторин кнопкой «Показать викторины (N)». Ссылки вида `?quiz=<id>` продолжают работать даже без SPA-роутинга.
6. Прямой запуск викторины по ссылке `index.html?quiz=<legacyId>` остаётся рабочим (через поле `legacyId` в манифесте).

### Generate a quiz via AI prompt (recommended)

- Use the curated prompt in `quizz-prompt.md` to generate a production‑ready quiz JSON from a YouTube lecture (course: “Art of Speech”).
- The prompt enforces our formatting rules for `summary` (H3/H4 + bullets only, no nested lists) and teaches the model to produce comprehensive, learning‑oriented tips.
- It scales for long videos: summaries may exceed 600–1200+ words if needed. Focus is on completeness and readability.
- Workflow:
  1) Open `quizz-prompt.md` and paste it into your LLM. Provide the lecture’s YouTube URL and any context (speaker, series, target audience).
  2) Ask for the final JSON output only. Validate it with a JSON linter if needed.
  3) Save to `public/assets/quizzes/<subject>/<slug>.json` and run `npm run generate:manifest`.
  4) Open `/menu` and the quiz page (`?quiz=<id>`) to review rendering.

## Subjects & folder structure

```
public/assets/quizzes/
├── 01-art-of-speech/
│   ├── subject.json          # метаданные предмета (опционально)
│   ├── 6-make-a-memorable-speech.json
│   └── ...
├── 02-meditation/
│   ├── subject.json
│   └── ...
└── quizzes.json              # автогенерируемый manifest (не редактируем вручную)
```

- **Порядок**: добавляйте числовой префикс (`01-`, `02-`), чтобы управлять сортировкой предметов. Скрипт также принимает `order` из `subject.json`.
- **subject.json (опционально)** — расширяет карточку предмета в меню:
  ```json
  {
    "title": "Искусство речи",
    "description": "Ораторское мастерство, голос, аргументация.",
    "summary": "### О разделе\n\n#### 1. Что внутри\n- ...\n\nСовет: ...",
    "order": 1
  }
  ```
  - `summary` использует тот же markdown-набор, что и `summary` квиза (H3/H4 + буллеты, без вложенных списков).
  - `order` (число) переопределяет сортировку, если нужно отличиться от числового префикса каталога.
- **quiz.json** — храните внутри папки предмета. При генерации манифеста каждый квиз получает:
  - `id`: `<subjectId>-<quizSlug>` — используется в новых ссылках (`?quiz=<id>`).
  - `legacyId`: старый slug (по имени файла). Ссылки `?quiz=<legacyId>` остаются рабочими, но в консоль выводится предупреждение.
  - `path`: относительный путь до файла (например, `01-art-of-speech/6-make-a-memorable-speech.json`).
- **manifest (quizzes.json)**: содержит только `subjects` со вложенными `quizzes`. Не редактируйте его вручную — всегда запускайте `npm run generate:manifest`.

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
- Length: адаптируйте под хронометраж. Для коротких роликов — 250–450 слов; для длинных (40–90+ мин) — смело расширяйтесь до 600–1200+ слов, если это нужно для полноты.
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
- [ ] 5–9 разделов с 2–5 буллетами каждый; для длинных лекций допускается 10–15+ разделов по необходимости.
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
- Посмотрите готовые `summary` в: `public/assets/quizzes/01-art-of-speech/6-make-a-memorable-speech.json`, `public/assets/quizzes/01-art-of-speech/9-public-speaking.json`, `public/assets/quizzes/01-art-of-speech/5-three-whales-of-public-speaking.json` — они следуют рекомендованной структуре.

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
