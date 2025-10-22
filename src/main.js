import {
  loadQuizConfig,
  loadQuizManifest,
  resolveQuizId,
  sanitizeIdentifier,
} from './services/quiz-loader.js';
import { mountQuiz } from './components/quiz.js';
import { renderMenu } from './components/menu.js';

const quizContainer = document.getElementById('quiz');
const resultContainer = document.getElementById('result');
const checkButton = document.getElementById('check-answers');
const quizTitle = document.getElementById('quiz-title');
const quizDescription = document.getElementById('quiz-description');
const messageBox = document.getElementById('message');
const menuView = document.getElementById('menu-view');
const quizView = document.getElementById('quiz-view');
const quizList = document.getElementById('quiz-list');
const quizMetaExtra = document.getElementById('quiz-meta-extra');
const backNav = document.getElementById('back-nav');

let cleanupQuiz = null;

function showMessage(text, tone = 'info') {
  messageBox.textContent = text;
  messageBox.hidden = false;
  messageBox.dataset.tone = tone;
}

function clearMessage() {
  messageBox.textContent = '';
  messageBox.hidden = true;
  delete messageBox.dataset.tone;
}

function getPathSegments() {
  const { pathname } = window.location;
  return pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());
}

function resolveRoute() {
  const params = new URLSearchParams(window.location.search);
  const queryQuiz = sanitizeIdentifier(params.get('quiz'));
  if (queryQuiz) {
    return { type: 'quiz', id: queryQuiz };
  }

  const segments = getPathSegments();

  if (segments.length === 0) {
    return { type: 'menu' };
  }

  const lastSegment = segments[segments.length - 1];

  // Treat project base path on GitHub Pages (e.g., /quiz-maker) as menu, not a quiz id
  const baseSegment = segments[0];
  if (segments.length === 1 || lastSegment === baseSegment) {
    return { type: 'menu' };
  }

  if (lastSegment === 'menu' || lastSegment === 'index.html') {
    return { type: 'menu' };
  }

  const quizId = sanitizeIdentifier(lastSegment);
  if (quizId) {
    return { type: 'quiz', id: quizId };
  }

  return { type: 'menu' };
}

function showMenu(manifest) {
  if (cleanupQuiz) {
    cleanupQuiz();
    cleanupQuiz = null;
  }

  quizTitle.textContent = 'Выберите викторину';
  quizDescription.textContent = '';
  if (quizMetaExtra) {
    quizMetaExtra.textContent = '';
    quizMetaExtra.hidden = true;
  }
  document.title = 'Quiz Maker — Меню';

  quizView.hidden = true;
  checkButton.hidden = true;
  resultContainer.hidden = true;
  if (backNav) {
    backNav.hidden = true;
  }

  renderMenu({ quizzes: manifest, container: quizList });
  menuView.hidden = false;
}

function showQuiz(quiz) {
  menuView.hidden = true;
  quizView.hidden = false;
  checkButton.hidden = false;
  resultContainer.hidden = true;
  if (backNav) {
    backNav.hidden = false;
  }

  quizTitle.textContent = quiz.title;
  quizDescription.textContent = quiz.description;
  // Render optional author and source link
  if (quizMetaExtra) {
    quizMetaExtra.innerHTML = '';
    const parts = [];

    if (quiz.author) {
      const authorSpan = document.createElement('span');
      authorSpan.textContent = `Автор: ${quiz.author}`;
      parts.push(authorSpan);
    }

    if (quiz.sourceUrl) {
      const sourceSpan = document.createElement('span');
      const link = document.createElement('a');
      link.href = quiz.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Источник';
      sourceSpan.append(' ', link);
      parts.push(sourceSpan);
    }

    if (parts.length > 0) {
      // separate by middle dot
      parts.forEach((node, idx) => {
        quizMetaExtra.appendChild(node);
        if (idx < parts.length - 1) {
          quizMetaExtra.appendChild(document.createTextNode(' • '));
        }
      });
      quizMetaExtra.hidden = false;
    } else {
      quizMetaExtra.hidden = true;
    }
  }

  document.title = `${quiz.title} — Quiz Maker`;

  if (cleanupQuiz) {
    cleanupQuiz();
  }

  cleanupQuiz = mountQuiz({ quiz, quizContainer, resultContainer, checkButton });
}

async function bootstrap() {
  checkButton.disabled = true;
  clearMessage();

  try {
    const route = resolveRoute();

    if (route.type === 'menu') {
      const manifest = await loadQuizManifest();
      showMenu(manifest);
      checkButton.disabled = false;
      return;
    }

    const quizId = route.id || resolveQuizId();
    const quiz = await loadQuizConfig(quizId);
    showQuiz(quiz);
    checkButton.disabled = false;
  } catch (error) {
    quizTitle.textContent = 'Не удалось загрузить данные';
    quizDescription.textContent = '';
    if (quizMetaExtra) {
      quizMetaExtra.textContent = '';
      quizMetaExtra.hidden = true;
    }
    showMessage(error.message || 'Произошла ошибка при загрузке.', 'error');
    menuView.hidden = true;
    quizView.hidden = true;
    checkButton.hidden = true;
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);