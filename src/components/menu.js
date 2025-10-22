export function renderMenu({ quizzes, container }) {
  container.innerHTML = '';

  if (!quizzes.length) {
    const emptyState = document.createElement('li');
    emptyState.classList.add('quiz-menu__item');
    emptyState.textContent = 'Викторины не найдены. Добавьте JSON-файлы в public/assets/quizzes и обновите manifest.';
    container.appendChild(emptyState);
    return;
  }

  quizzes.forEach((quiz) => {
    const item = document.createElement('li');
    item.classList.add('quiz-menu__item');

    const link = document.createElement('a');
    link.classList.add('quiz-menu__link');
    link.href = `?quiz=${quiz.id}`;
    link.textContent = quiz.title;

    const description = document.createElement('p');
    description.classList.add('quiz-menu__description');
    description.textContent = quiz.description;

    item.appendChild(link);

    if (quiz.description) {
      item.appendChild(description);
    }

    // Optional metadata: author and source link
    if (quiz.author || quiz.sourceUrl) {
      const meta = document.createElement('p');
      meta.classList.add('quiz-menu__meta');

      const parts = [];
      if (quiz.author) {
        const authorSpan = document.createElement('span');
        authorSpan.textContent = `Автор: ${quiz.author}`;
        parts.push(authorSpan);
      }

      if (quiz.sourceUrl) {
        const sourceSpan = document.createElement('span');
        const a = document.createElement('a');
        a.href = quiz.sourceUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Источник';
        sourceSpan.appendChild(a);
        parts.push(sourceSpan);
      }

      parts.forEach((node, idx) => {
        meta.appendChild(node);
        if (idx < parts.length - 1) {
          meta.appendChild(document.createTextNode(' • '));
        }
      });

      item.appendChild(meta);
    }

    container.appendChild(item);
  });
}