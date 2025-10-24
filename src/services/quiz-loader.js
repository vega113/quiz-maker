const QUIZ_BASE_PATH = './public/assets/quizzes/';
const MANIFEST_PATH = `${QUIZ_BASE_PATH}quizzes.json`;
const DEFAULT_QUIZ_ID = 'art-of-speech-9-public-speaking';

const DEFAULT_SUBJECT_ID = 'general';
const DEFAULT_SUBJECT_TITLE = 'Общие викторины';

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

export function sanitizeIdentifier(identifier = '') {
  if (identifier == null) {
    return '';
  }

  const value = String(identifier);

  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-{2,}/g, '-');
}

export function resolveQuizId(search = window.location.search) {
  const params = new URLSearchParams(search);
  const rawId = params.get('quiz') || DEFAULT_QUIZ_ID;
  const sanitized = sanitizeIdentifier(rawId);

  return sanitized || DEFAULT_QUIZ_ID;
}

function fallbackTitleFromId(id = '') {
  if (!id) return '';
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeSubject(subject = {}) {
  const rawId = subject.id || subject.path || subject.title || '';
  const id = sanitizeIdentifier(rawId);

  if (!id) {
    return null;
  }

  const title = subject.title || fallbackTitleFromId(id);
  const description = typeof subject.description === 'string' ? subject.description : '';
  const summary = typeof subject.summary === 'string' ? subject.summary : '';
  const order = typeof subject.order === 'number' && Number.isFinite(subject.order) ? subject.order : null;
  const path = typeof subject.path === 'string' ? subject.path : '';

  const quizzes = Array.isArray(subject.quizzes) ? subject.quizzes : [];

  return {
    id,
    title,
    description,
    summary,
    order,
    path,
    quizzes,
  };
}

function normalizeQuiz(quiz = {}, subjectContext = {}) {
  const rawId = quiz.id || '';
  const id = sanitizeIdentifier(rawId);

  if (!id) {
    return null;
  }

  const legacyId = sanitizeIdentifier(quiz.legacyId || rawId);
  const title = quiz.title || fallbackTitleFromId(legacyId || id);
  const description = typeof quiz.description === 'string' ? quiz.description : '';
  const sourceUrl = typeof quiz.sourceUrl === 'string' ? quiz.sourceUrl : '';
  const author = typeof quiz.author === 'string' ? quiz.author : '';
  const summary = typeof quiz.summary === 'string' ? quiz.summary : '';
  const pathFromManifest = typeof quiz.path === 'string' ? quiz.path : '';
  const pathValue = pathFromManifest.replace(/^\//, '');
  const subjectId = subjectContext.id || DEFAULT_SUBJECT_ID;
  const subjectTitle = subjectContext.title || fallbackTitleFromId(subjectId);
  const subjectOrder = subjectContext.order ?? Number.POSITIVE_INFINITY;

  const path = pathValue || `${legacyId || id}.json`;

  return {
    id,
    legacyId,
    title,
    description,
    sourceUrl,
    author,
    summary,
    path,
    subjectId,
    subjectTitle,
    subjectOrder,
  };
}

function normalizeManifest(data) {
  const manifest = {
    subjects: [],
    quizzes: [],
    mapById: Object.create(null),
    mapByLegacyId: Object.create(null),
  };

  const rawSubjects = Array.isArray(data.subjects) ? data.subjects : null;
  const rawQuizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

  if (rawSubjects) {
    rawSubjects.forEach((subject) => {
      const normalizedSubject = normalizeSubject(subject);
      if (!normalizedSubject) {
        return;
      }

      const subjectQuizzes = (normalizedSubject.quizzes || [])
        .map((quiz) => normalizeQuiz(quiz, normalizedSubject))
        .filter(Boolean)
        .sort(compareQuizzes);

      const subjectEntry = {
        id: normalizedSubject.id,
        title: normalizedSubject.title,
        description: normalizedSubject.description,
        summary: normalizedSubject.summary,
        order: normalizedSubject.order,
        path: normalizedSubject.path,
        quizzes: subjectQuizzes,
      };

      manifest.subjects.push(subjectEntry);

      subjectQuizzes.forEach((quiz) => {
        manifest.quizzes.push(quiz);
        manifest.mapById[quiz.id] = quiz;
        if (quiz.legacyId) {
          manifest.mapByLegacyId[quiz.legacyId] = quiz;
        }
      });
    });
  } else {
    // Legacy manifest without subjects
    const subjectContext = {
      id: DEFAULT_SUBJECT_ID,
      title: fallbackTitleFromId(DEFAULT_SUBJECT_ID),
      description: '',
      summary: '',
      order: -Infinity,
      path: '',
    };

    const subjectQuizzes = rawQuizzes
      .map((quiz) => {
        const normalized = normalizeQuiz(quiz, subjectContext);
        if (normalized) {
          normalized.path = normalized.path || `${normalized.id}.json`;
        }
        return normalized;
      })
      .filter(Boolean)
      .sort(compareQuizzes);

    manifest.subjects.push({
      id: subjectContext.id,
      title: DEFAULT_SUBJECT_TITLE,
      description: '',
      summary: '',
      order: -Infinity,
      path: '',
      quizzes: subjectQuizzes,
    });

    subjectQuizzes.forEach((quiz) => {
      manifest.quizzes.push(quiz);
      manifest.mapById[quiz.id] = quiz;
      if (quiz.legacyId) {
        manifest.mapByLegacyId[quiz.legacyId] = quiz;
      }
    });
  }

  manifest.subjects.sort((a, b) => {
    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;

    if (orderA !== orderB) return orderA - orderB;
    return (a.title || '').localeCompare(b.title || '', 'ru');
  });

  manifest.quizzes.sort((a, b) => {
    const orderA = a.subjectOrder ?? Number.POSITIVE_INFINITY;
    const orderB = b.subjectOrder ?? Number.POSITIVE_INFINITY;

    if (orderA !== orderB) return orderA - orderB;
    if (a.subjectId !== b.subjectId) {
      return a.subjectTitle.localeCompare(b.subjectTitle, 'ru');
    }
    return compareQuizzes(a, b);
  });

  return manifest;
}

function findQuiz(manifest, rawId) {
  if (!manifest) return null;
  const id = sanitizeIdentifier(rawId);

  if (id && manifest.mapById[id]) {
    return manifest.mapById[id];
  }

  if (id && manifest.mapByLegacyId[id]) {
    console.warn(`Переход по устаревшему идентификатору викторины: ${id}. Используйте новый id ${manifest.mapByLegacyId[id].id}.`);
    return manifest.mapByLegacyId[id];
  }

  return null;
}

export async function loadQuizManifest() {
  const response = await fetch(MANIFEST_PATH, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Не удалось загрузить список викторин.');
  }

  const data = await response.json();
  return normalizeManifest(data);
}

export function getMenuQuizzes(manifest) {
  if (!manifest) return [];
  return manifest.quizzes.map(({ subjectOrder, subjectTitle, ...quiz }) => ({
    ...quiz,
    subjectTitle,
  }));
}

export async function loadQuizConfig(quizId, { manifest } = {}) {
  const sanitizedQuizId = sanitizeIdentifier(quizId) || DEFAULT_QUIZ_ID;
  const effectiveManifest = manifest || (await loadQuizManifest());
  const quizEntry = findQuiz(effectiveManifest, sanitizedQuizId);

  const resolvedPath = quizEntry ? quizEntry.path : `${sanitizedQuizId}.json`;

  const response = await fetch(`${QUIZ_BASE_PATH}${resolvedPath}`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл викторины: ${resolvedPath}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Файл викторины не содержит вопросов.');
  }

  return {
    id: quizEntry ? quizEntry.id : sanitizedQuizId,
    legacyId: quizEntry ? quizEntry.legacyId : sanitizedQuizId,
    title: data.title || 'Без названия',
    description: data.description || '',
    sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : '',
    author: typeof data.author === 'string' ? data.author : '',
    subjectId: quizEntry ? quizEntry.subjectId : DEFAULT_SUBJECT_ID,
    subjectTitle: quizEntry ? quizEntry.subjectTitle : fallbackTitleFromId(DEFAULT_SUBJECT_ID),
    settings: {
      tipPenalty: typeof data.tipPenalty === 'number' ? data.tipPenalty : 0.5,
    },
    questions: data.questions.map((question, index) => {
      if (!question.prompt || !Array.isArray(question.answers) || question.answers.length === 0) {
        throw new Error(`Вопрос №${index + 1} имеет неверный формат.`);
      }

      if (typeof question.correctIndex !== 'number') {
        throw new Error(`Вопрос №${index + 1} должен содержать поле correctIndex.`);
      }

      return {
        prompt: question.prompt,
        answers: question.answers,
        correctIndex: question.correctIndex,
        tip: question.tip || '',
      };
    }),
  };
}

export { DEFAULT_QUIZ_ID };
