/**
 * Simple markdown to HTML converter for basic formatting
 * Supports: **bold**, *italic*, `code`, [links](url), -/* lists, numbered lists, headings (##–######), paragraphs, line breaks
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const inline = (s) =>
    s
      // Bold: **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code: `code`
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links: [text](url)
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = escapeHtml(markdown).split('\n');

  let htmlParts = [];
  let inUl = false;
  let inOl = false;
  let paraBuffer = [];

  const closeUl = () => {
    if (inUl) {
      htmlParts.push('</ul>');
      inUl = false;
    }
  };

  const closeOl = () => {
    if (inOl) {
      htmlParts.push('</ol>');
      inOl = false;
    }
  };

  const flushLists = () => {
    closeUl();
    closeOl();
  };

  const flushParagraph = () => {
    if (paraBuffer.length) {
      const text = paraBuffer.join('<br>');
      htmlParts.push(`<p>${inline(text)}</p>`);
      paraBuffer = [];
    }
  };

  for (let raw of lines) {
    const line = raw.trim();

    // Blank line — paragraph/list separator
    if (line === '') {
      flushLists();
      flushParagraph();
      continue;
    }

    // Horizontal rule --- *** ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushLists();
      flushParagraph();
      htmlParts.push('<hr>');
      continue;
    }

    // Headings ## … ######
    const h = /^(#{2,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(h[1].length, 6);
      flushLists();
      flushParagraph();
      htmlParts.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) {
        flushParagraph();
        closeOl();
        htmlParts.push('<ul>');
        inUl = true;
      }
      const item = line.replace(/^[-*]\s+/, '');
      htmlParts.push(`<li>${inline(item)}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        flushParagraph();
        closeUl();
        htmlParts.push('<ol>');
        inOl = true;
      }
      const item = line.replace(/^\d+\.\s+/, '');
      htmlParts.push(`<li>${inline(item)}</li>`);
      continue;
    }

    // Regular text line — part of paragraph
    flushLists();
    paraBuffer.push(line);
  }

  // Close any open structures
  flushLists();
  flushParagraph();

  return htmlParts.join('');
}

export function renderMenu({ manifest, container }) {
  container.innerHTML = '';

  const subjects = manifest?.subjects ?? [];
  const totalQuizzes = manifest?.quizzes ?? [];

  if (!subjects.length || !totalQuizzes.length) {
    const emptyState = document.createElement('li');
    emptyState.classList.add('quiz-menu__item');
    emptyState.textContent = 'Викторины не найдены. Добавьте JSON-файлы в public/assets/quizzes и обновите manifest.';
    container.appendChild(emptyState);
    return;
  }

  subjects.forEach((subject) => {
    const subjectItem = document.createElement('li');
    subjectItem.classList.add('quiz-subject');

    const title = document.createElement('h2');
    title.classList.add('quiz-subject__title');
    title.textContent = subject.title;
    subjectItem.appendChild(title);

    if (subject.description) {
      const description = document.createElement('p');
      description.classList.add('quiz-subject__description');
      description.textContent = subject.description;
      subjectItem.appendChild(description);
    }

    if (subject.summary) {
      const summaryContainer = document.createElement('div');
      summaryContainer.classList.add('quiz-menu__summary-container', 'quiz-subject__summary-container');

      const summaryToggle = document.createElement('button');
      summaryToggle.classList.add('quiz-menu__summary-toggle', 'quiz-subject__summary-toggle');
      summaryToggle.type = 'button';
      summaryToggle.setAttribute('aria-expanded', 'false');
      const contentId = `subject-summary-${subject.id}`;
      summaryToggle.setAttribute('aria-controls', contentId);
      summaryToggle.innerHTML = '<span class="quiz-menu__summary-icon">▶</span> Обзор раздела';

      const summaryContent = document.createElement('div');
      summaryContent.classList.add('quiz-menu__summary-content', 'quiz-subject__summary-content');
      summaryContent.id = contentId;
      summaryContent.innerHTML = markdownToHtml(subject.summary);
      summaryContent.hidden = true;

      summaryToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = summaryContent.hidden;
        summaryContent.hidden = !isHidden;
        const icon = summaryToggle.querySelector('.quiz-menu__summary-icon');
        icon.textContent = isHidden ? '▼' : '▶';
        summaryToggle.setAttribute('aria-expanded', String(isHidden));
      });

      summaryContainer.appendChild(summaryToggle);
      summaryContainer.appendChild(summaryContent);
      subjectItem.appendChild(summaryContainer);
    }

    const quizList = document.createElement('ul');
    quizList.classList.add('quiz-subject__list');
    const quizListId = `subject-quizzes-${subject.id}`;
    quizList.id = quizListId;
    quizList.hidden = true;

    let listToggle = null;

    if (!subject.quizzes.length) {
      const emptyQuizItem = document.createElement('li');
      emptyQuizItem.classList.add('quiz-menu__item');
      emptyQuizItem.textContent = 'Викторины не найдены в этом разделе.';
      quizList.appendChild(emptyQuizItem);
      quizList.hidden = false;
    } else {
      listToggle = document.createElement('button');
      listToggle.classList.add('quiz-menu__summary-toggle', 'quiz-subject__quizzes-toggle');
      listToggle.type = 'button';
      listToggle.setAttribute('aria-controls', quizListId);
      listToggle.setAttribute('aria-expanded', 'false');

      const toggleIcon = document.createElement('span');
      toggleIcon.classList.add('quiz-menu__summary-icon');
      toggleIcon.textContent = '▶';
      listToggle.appendChild(toggleIcon);
      listToggle.appendChild(document.createTextNode(` Показать викторины (${subject.quizzes.length})`));

      listToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = quizList.hidden;
        quizList.hidden = !isHidden;
        toggleIcon.textContent = isHidden ? '▼' : '▶';
        listToggle.setAttribute('aria-expanded', String(isHidden));
        listToggle.lastChild.textContent = isHidden
          ? ` Скрыть викторины (${subject.quizzes.length})`
          : ` Показать викторины (${subject.quizzes.length})`;
      });

      subject.quizzes.forEach((quiz) => {
        const quizItem = document.createElement('li');
        quizItem.classList.add('quiz-menu__item');

        const link = document.createElement('a');
        link.classList.add('quiz-menu__link');
        link.href = `?quiz=${quiz.id}`;
        link.textContent = quiz.title;

        const description = document.createElement('p');
        description.classList.add('quiz-menu__description');
        description.textContent = quiz.description;

        quizItem.appendChild(link);

        if (quiz.description) {
          quizItem.appendChild(description);
        }

        if (quiz.summary) {
          const summaryContainer = document.createElement('div');
          summaryContainer.classList.add('quiz-menu__summary-container');

          const summaryToggle = document.createElement('button');
          summaryToggle.classList.add('quiz-menu__summary-toggle');
          summaryToggle.type = 'button';
          summaryToggle.setAttribute('aria-expanded', 'false');
          const contentId = `menu-summary-${quiz.id}`;
          summaryToggle.setAttribute('aria-controls', contentId);
          summaryToggle.innerHTML = '<span class="quiz-menu__summary-icon">▶</span> Краткое содержание';

          const summaryContent = document.createElement('div');
          summaryContent.classList.add('quiz-menu__summary-content');
          summaryContent.id = contentId;
          summaryContent.innerHTML = markdownToHtml(quiz.summary);
          summaryContent.hidden = true;

          summaryToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = summaryContent.hidden;
            summaryContent.hidden = !isHidden;
            const icon = summaryToggle.querySelector('.quiz-menu__summary-icon');
            icon.textContent = isHidden ? '▼' : '▶';
            summaryToggle.setAttribute('aria-expanded', String(isHidden));
          });

          summaryContainer.appendChild(summaryToggle);
          summaryContainer.appendChild(summaryContent);
          quizItem.appendChild(summaryContainer);
        }

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

          quizItem.appendChild(meta);
        }

        quizList.appendChild(quizItem);
      });
    }

    if (listToggle) {
      subjectItem.appendChild(listToggle);
    }

    subjectItem.appendChild(quizList);
    container.appendChild(subjectItem);
  });
}
