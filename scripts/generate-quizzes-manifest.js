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
  const aNum = parseLeadingNumberFromId(a.id);
  const bNum = parseLeadingNumberFromId(b.id);

  if (aNum != null && bNum != null) {
    if (aNum !== bNum) return aNum - bNum;
    return (a.title || '').localeCompare(b.title || '', 'ru');
  }

  if (aNum != null) return -1;
  if (bNum != null) return 1;

  return (a.title || '').localeCompare(b.title || '', 'ru');
}

function readQuizFiles() {
  if (!fs.existsSync(QUIZ_DIR)) {
    throw new Error(`Quiz directory not found: ${QUIZ_DIR}`);
  }

  return fs
    .readdirSync(QUIZ_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== MANIFEST_FILENAME)
    .map((entry) => entry.name);
}

function buildManifest() {
  const files = readQuizFiles();
  const quizzes = files.map((filename) => {
    const filePath = path.join(QUIZ_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf8');

    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Не удалось разобрать JSON в файле ${filename}: ${error.message}`);
    }

    const basename = path.basename(filename, '.json');
    const id = sanitizeIdentifier(data.id || basename);

    if (!id) {
      throw new Error(`Файл ${filename} должен содержать валидный id или имя файла.`);
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error(`Файл ${filename} не содержит вопросов.`);
    }

    return {
      id,
      title: data.title || id,
      description: data.description || '',
      // pass-through optional metadata so the menu can show them
      sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : undefined,
      author: typeof data.author === 'string' ? data.author : undefined,
      filename,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    quizzes: quizzes
      .sort(compareQuizzes)
      .map(({ filename, ...rest }) => rest),
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