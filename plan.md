# Multi-Subject Menu Upgrade Plan

Status legend
- 📝 Planned — not started
- 🔧 In progress
- ✅ Done

Goal
- Add a “subject” level to the static app so the Menu groups quizzes under subjects (e.g., “Meditation”, “Art of Speech”). Authors should be able to create a new subject by adding a folder under `public/assets/quizzes/`, dropping quiz JSONs inside, and running the manifest script. No server, fully static.

Non-goals
- Do not add a backend or dynamic runtime queries.
- Do not change the core quiz JSON schema inside individual quiz files.

Constraints
- Fully static hosting.
- Backwards compatible for a short transition window (old flat files and links should continue to work).

High-level design
- New folder structure: one subject per folder.
  - `public/assets/quizzes/<subject-slug>/` contains quiz JSON files.
  - Optional `public/assets/quizzes/<subject-slug>/subject.json` for subject metadata (title/description/order/summary). If missing, derive from folder name.
- Manifest будет содержать только иерархию предметов (`subjects`) с вложенными викторинами.
- Loader will resolve quiz loads by looking up `id -> path` in the manifest; links continue to use `?quiz=<id>`.

Key files today (for reference)
- `scripts/generate-quizzes-manifest.js` — строит `public/assets/quizzes/quizzes.json` (иерархия предметов и викторин).
- `src/services/quiz-loader.js` — loads manifest (returns array), loads quiz by fetching `${QUIZ_BASE_PATH}${id}.json` (flat lookup).
- `src/components/menu.js` — renders a flat list; supports per-quiz collapsible summaries.
- `styles/main.css` — Menu styles.

--

Task 1 — Define subject-aware folder + manifest schema ✅
Context
- We need a one-level subject folder structure and a manifest that captures subjects and quizzes while preserving a flat view for older code.
Deliverables
- Subject folder convention and naming rules documented.
- Manifest v2 schema drafted.
Details
- Folder structure:
  - `public/assets/quizzes/<subject-folder>/subject.json` (optional)
  - `public/assets/quizzes/<subject-folder>/*.json` (quizzes)
  - Root `public/assets/quizzes/*.json` still supported (grouped under an implicit subject like `general`).
- Subject folder naming:
  - Allow numeric ordering prefix: `01-art-of-speech`, `02-meditation`.
  - `subjectId = sanitize(folderNameWithoutNumericPrefix)`; `orderHint = parsedLeadingNumber || null`.
- Subject metadata (optional `subject.json`):
  ```json
  { "title": "Art of Speech", "description": "…", "summary": "…", "order": 1 }
  ```
- Quiz id and path rules:
  - `quizId = sanitize("<subjectId>-<fileBasename>")` (globally unique across all subjects).
  - Include `legacyId = sanitize(<fileBasename>)` to support old links.
  - Include `path = "<subject-folder>/<file>.json"` (relative to `public/assets/quizzes/`).
- Manifest v2 shape:
  ```json
  {
    "generatedAt": "…",
    "subjects": [
      {
        "id": "art-of-speech",
        "title": "Art of Speech",
        "description": "…",
        "summary": "…",        // optional markdown (same subset as quiz summaries)
        "path": "art-of-speech",  // subject folder path
        "order": 1,               // from prefix or subject.json
        "quizzes": [
          {
            "id": "art-of-speech-6-make-a-memorable-speech",
            "legacyId": "6-make-a-memorable-speech",
            "title": "…",
            "description": "…",
            "author": "…",
            "sourceUrl": "…",
            "summary": "…",
            "path": "art-of-speech/6-make-a-memorable-speech.json"
          }
        ]
      }
    ]
  }
  ```
Definition of Done (DoD)
- Schema documented in README and referenced by the generator and loader tasks below.
- Decision recorded for: numeric prefixes for ordering; implicit `general` subject.

Task 2 — Update generator script (recursive scan + v2 manifest) ✅
Context
- `scripts/generate-quizzes-manifest.js` currently scans only the flat directory.
Deliverables
- New recursive scan supporting one-level subject folders.
- Output manifest with `subjects` only (each contains its quizzes).
Details
- Walk `public/assets/quizzes/`:
  - For each immediate subdirectory (ignore deeper levels):
    - Read optional `subject.json`.
    - Collect `*.json` quizzes (excluding `subject.json` and `quizzes.json`).
  - Also collect quizzes at the root as the implicit `general` subject.
- Sorting:
  - Subjects: by `order` (from prefix or subject.json) then by `title`.
  - Quizzes within a subject: by leading number (if any) then by `title`.
- Output `quizzes.json` with the v2 schema (subjects only).
Back-compat
- Provide `legacyId` fields inside quizzes for old links instead of a flat list.
DoD
- Script runs without errors on current repo.
- Produces subject hierarchy matching the filesystem; legacy links resolvable via `legacyId`.

Task 3 — Update loader to resolve by manifest path ✅
Context
- `src/services/quiz-loader.js` fetches quiz JSON by `${id}.json` from root — will break for nested paths.
Deliverables
- Loader functions that:
  - Load full manifest (v2) and return a structured object.
  - Resolve `quizId` to file path using manifest mapping (prefer `id`, fallback to `legacyId`).
  - Flatten `subjects` to a list for menus where needed.
Details
- API changes:
  - `loadManifest()` returns `{ subjects, quizzes }` (not just array).
  - `getMenuQuizzes(manifest)` returns a flattened array compatible with current `renderMenu` shape for an interim release; later replaced by subject-aware renderer.
  - `loadQuizConfig(quizId, manifest?)` resolves path using manifest; if `manifest` not provided, fetch it internally.
- Back-compat:
  - If manifest lacks `subjects` (older file), fall back to current flat logic.
DoD
- Existing routes still work for current quizzes.
- Deep-linked `?quiz=<legacyId>` continues to work via `legacyId` mapping.

Task 4 — Subject-aware Menu UI ✅
Context
- `src/components/menu.js` renders a flat list.
Deliverables
- New renderer that groups by subject, with accessible headings and optional subject-level summaries.
Details
- Add `renderSubjectsMenu({ manifest, container })`:
  - For each subject: render a header (h2), optional description and collapsible subject summary (uses existing markdown renderer).
  - Render a nested list of its quizzes (reuse existing per-quiz UI, including collapsible quiz summary and meta line).
- Keyboard/accessibility: subject summary toggle mirrors quiz summary ARIA behavior.
- Empty state: per subject (if needed) and a global state if no subjects/quizzes.
DoD
- `/menu` shows grouped sections.
- Collapsible toggles work for both subject sections and quiz summaries.
- No regressions in quiz card controls/links.

Task 5 — Styles for subjects ✅
Context
- Need a small set of CSS classes for subject sections.
Deliverables
- Add styles in `styles/main.css`:
  - `.quiz-subject`, `.quiz-subject__title`, `.quiz-subject__description`, `.quiz-subject__list`.
  - Optional: `.quiz-subject__summary-toggle`, `.quiz-subject__summary-content` (reuse menu summary styles).
DoD
- Subject blocks visually separated; responsive remains intact.
- Toggle icons consistent with quiz summary toggle.

Task 6 — README updates ✅
Context
- Document author workflow and folder layout.
Deliverables
- New section “Subjects & Folder Structure”.
- Update “Adding a New Quiz” to recommend: create folder for subject → drop quiz JSONs → run generator.
- Document optional `subject.json` format, ordering prefixes, manifest v2 shape (brief), and back-compat notes.
DoD
- Clear, step-by-step instructions; examples for `01-art-of-speech/` and `02-meditation/`.

Task 7 — Migrate existing quizzes into subjects (repo change) ✅
Context
- Today’s quizzes live flat under `public/assets/quizzes/`.
Deliverables
- Create `public/assets/quizzes/art-of-speech/` and move all current speaking-related JSONs inside.
- Optional: create `subject.json` with title/description.
- Leave `quizzes.json` regenerated by the new script.
Back-compat
- Provide `legacyId` mapping so old links resolve.
DoD
- Menu shows “Art of Speech” with all current items nested.
- No broken links for previous `?quiz=<id>`.

Task 8 — Transitional back-compat window ✅
Context
- Some external links may exist to old flat IDs.
Deliverables
- Maintain `legacyId` resolution in loader for at least one release cycle.
- Log a console warning when loading by `legacyId` (optional).
DoD
- Confirm legacy query params work; add note in README.

Task 9 — QA + Validation ✅
Context
- Ensure stability after structural changes.
Checklist
- Regenerate manifest (`npm run generate:manifest`) and launch `/menu`.
- Verify:
  - Subject grouping and ordering.
  - Quiz sorting within subjects by numeric prefix → title.
  - Quiz and subject summaries render correctly (headings, bullets).
  - Deep links `?quiz=<newId>` and `?quiz=<legacyId>` load the same quiz.
  - Accessibility: `aria-expanded` and `aria-controls` on all toggles.
- Run `npx prettier --check .`.
- If tests exist, run them; otherwise smoke test flows.
DoD
- All checks pass; no console errors.

Task 10 — Optional enhancements (post-MVP) 📝
- Subject cover icon/color in `subject.json` (surface in menu).
- Subject filters or collapse/expand all.
- Manifest cache-busting via hash in file name.
- CLI flag in generator to output a summary report (counts per subject).

--

Rollout strategy
1) Implement Tasks 1–3 and keep the old flat menu by using `getMenuQuizzes(manifest)` to minimize initial UI diff.
2) Switch to Task 4–5 to introduce grouped UI; keep back-compat in loader.
3) Complete Task 6–8 and migrate existing content (Task 7).
4) QA (Task 9). If stable, consider removing `legacyId` tooling in a later release.

Notes
- Keep the app static; all subject logic is in build-time manifest.
- Honor README markdown subset for any `subject.summary` we introduce.
