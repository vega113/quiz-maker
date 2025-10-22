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
    link.href = `./${quiz.id}`;
    link.textContent = quiz.title;

    const description = document.createElement('p');
    description.classList.add('quiz-menu__description');
    description.textContent = quiz.description;

    item.appendChild(link);

    if (quiz.description) {
      item.appendChild(description);
    }

    container.appendChild(item);
  });
}
