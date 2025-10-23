const QUIZ_BASE_PATH = './public/assets/quizzes/';
const MANIFEST_PATH = `${QUIZ_BASE_PATH}quizzes.json`;
const DEFAULT_QUIZ_ID = 'public-speaking';

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

export async function loadQuizManifest() {
  const response = await fetch(MANIFEST_PATH, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Не удалось загрузить список викторин.');
  }

  const data = await response.json();
  const quizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

  return quizzes
    .map((quiz) => {
      const id = sanitizeIdentifier(quiz.id);
      if (!id) {
        return null;
      }

      return {
        id,
        title: quiz.title || id,
        description: quiz.description || '',
        // optional metadata for rendering in menu
        sourceUrl: typeof quiz.sourceUrl === 'string' ? quiz.sourceUrl : '',
        author: typeof quiz.author === 'string' ? quiz.author : '',
        // pass-through summary for collapsible preview in menu
        summary: typeof quiz.summary === 'string' ? quiz.summary : '',
      };
    })
    .filter(Boolean)
    .sort(compareQuizzes);
}

export async function loadQuizConfig(quizId) {
  const id = sanitizeIdentifier(quizId) || DEFAULT_QUIZ_ID;
  const response = await fetch(`${QUIZ_BASE_PATH}${id}.json`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл викторины: ${id}.json`);
  }

  const data = await response.json();

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Файл викторины не содержит вопросов.');
  }

  return {
    title: data.title || 'Без названия',
    description: data.description || '',
    // New optional metadata
    sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : '',
    author: typeof data.author === 'string' ? data.author : '',
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