#!/usr/bin/env node
/*
 * Regenerates public/assets/quizzes/quizzes.json by scanning quiz JSON files.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const QUIZ_DIR = path.join(ROOT_DIR, 'public', 'assets', 'quizzes');
const MANIFEST_FILENAME = 'quizzes.json';
const MANIFEST_PATH = path.join(QUIZ_DIR, MANIFEST_FILENAME);
const SUBJECT_META_FILENAME = 'subject.json';

const DEFAULT_SUBJECT_ID = 'general';
const DEFAULT_SUBJECT_TITLE = 'Общие викторины';

function sanitizeIdentifier(identifier = '') {
  return identifier
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-{2,}/g, '-');
}

function parseLeadingNumberFromId(id = '') {
  const match = /^([0-9]+)/.exec(id);
  return match ? parseInt(match[1], 10) : null;
}

function compareQuizzes(a, b) {
  const aSourceId = a.legacyId || a.id;
  const bSourceId = b.legacyId || b.id;

  const aNum = parseLeadingNumberFromId(aSourceId);
  const bNum = parseLeadingNumberFromId(bSourceId);

  if (aNum != null && bNum != null) {
    if (aNum !== bNum) return aNum - bNum;
    return (a.title || '').localeCompare(b.title || '', 'ru');
  }

  if (aNum != null) return -1;
  if (bNum != null) return 1;

  return (a.title || '').localeCompare(b.title || '', 'ru');
}

function splitOrderingPrefix(name = '') {
  const match = /^([0-9]+)[-_](.+)$/.exec(name);
  if (!match) {
    return { order: null, slug: name };
  }

  return { order: parseInt(match[1], 10), slug: match[2] };
}

function formatTitleFromSlug(slug = '') {
  if (!slug) return '';
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Не удалось разобрать JSON в файле ${path.basename(filePath)}: ${error.message}`);
  }
}

function readSubjectMeta(subjectPath) {
  const metaPath = path.join(subjectPath, SUBJECT_META_FILENAME);
  if (!fs.existsSync(metaPath)) {
    return {};
  }

  const data = readJsonFile(metaPath);

  const title = typeof data.title === 'string' ? data.title : undefined;
  const description = typeof data.description === 'string' ? data.description : undefined;
  const summary = typeof data.summary === 'string' ? data.summary : undefined;
  const order = typeof data.order === 'number' && Number.isFinite(data.order) ? data.order : undefined;

  return { title, description, summary, order };
}

function collectQuizzesInDirectory({ subjectId, subjectPath, relativeSubjectPath }) {
  const entries = fs.readdirSync(subjectPath, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        entry.name !== MANIFEST_FILENAME &&
        entry.name !== SUBJECT_META_FILENAME,
    )
    .map((entry) => {
      const filePath = path.join(subjectPath, entry.name);
      const data = readJsonFile(filePath);

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(`Файл ${entry.name} в разделе ${subjectId} не содержит вопросов.`);
      }

      const basename = path.basename(entry.name, '.json');
      const rawQuizId = sanitizeIdentifier(data.id || basename);

      if (!rawQuizId) {
        throw new Error(`Файл ${entry.name} должен содержать валидный id или имя файла.`);
      }

      const quizId = subjectId === DEFAULT_SUBJECT_ID ? rawQuizId : sanitizeIdentifier(`${subjectId}-${rawQuizId}`);
      const legacyId = rawQuizId;
      const relativePath = relativeSubjectPath ? `${relativeSubjectPath}/${entry.name}` : entry.name;

      return {
        id: quizId,
        legacyId,
        title: data.title || quizId,
        description: data.description || '',
        sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : undefined,
        author: typeof data.author === 'string' ? data.author : undefined,
        summary: typeof data.summary === 'string' ? data.summary : undefined,
        path: relativePath,
      };
    })
    .sort(compareQuizzes);
}

function buildManifest() {
  if (!fs.existsSync(QUIZ_DIR)) {
    throw new Error(`Quiz directory not found: ${QUIZ_DIR}`);
  }

  const dirEntries = fs.readdirSync(QUIZ_DIR, { withFileTypes: true });

  const subjects = [];

  const registerSubject = ({ id, title, description, summary, order, path: relativePath, quizzes }) => {
    if (!quizzes.length) {
      return;
    }

    subjects.push({
      id,
      title,
      description,
      summary,
      order,
      path: relativePath,
      quizzes,
    });
  };

  // Root-level quizzes as implicit subject
  const rootQuizzes = collectQuizzesInDirectory({
    subjectId: DEFAULT_SUBJECT_ID,
    subjectPath: QUIZ_DIR,
    relativeSubjectPath: '',
  });

  if (rootQuizzes.length) {
    registerSubject({
      id: DEFAULT_SUBJECT_ID,
      title: DEFAULT_SUBJECT_TITLE,
      description: '',
      summary: undefined,
      order: -Infinity,
      path: '',
      quizzes: rootQuizzes,
    });
  }

  dirEntries
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      const { order: prefixOrder, slug } = splitOrderingPrefix(entry.name);
      const subjectId = sanitizeIdentifier(slug || entry.name);

      if (!subjectId) {
        throw new Error(`Папка с предметом ${entry.name} должна иметь валидное имя.`);
      }

      const subjectPath = path.join(QUIZ_DIR, entry.name);
      const meta = readSubjectMeta(subjectPath);
      const title = meta.title || formatTitleFromSlug(subjectId);
      const description = meta.description || '';
      const summary = meta.summary;
      const order = meta.order ?? prefixOrder ?? null;

      const quizzes = collectQuizzesInDirectory({
        subjectId,
        subjectPath,
        relativeSubjectPath: entry.name,
      });

      registerSubject({
        id: subjectId,
        title,
        description,
        summary,
        order,
        path: entry.name,
        quizzes,
      });
    });

  const sortedSubjects = subjects.sort((a, b) => {
    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;

    if (orderA !== orderB) return orderA - orderB;
    return (a.title || '').localeCompare(b.title || '', 'ru');
  });

  return {
    generatedAt: new Date().toISOString(),
    subjects: sortedSubjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      description: subject.description,
      summary: subject.summary,
      order: subject.order,
      path: subject.path,
      quizzes: subject.quizzes,
    })),
  };
}

function writeManifest(manifest) {
  const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(MANIFEST_PATH, manifestContent, 'utf8');
  console.log(`Manifest updated: ${MANIFEST_PATH}`);
}

function main() {
  try {
    const manifest = buildManifest();
    writeManifest(manifest);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
