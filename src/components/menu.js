/**
 * Simple markdown to HTML converter for basic formatting
 * Supports: **bold**, *italic*, `code`, [links](url), - lists, line breaks
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // Escape HTML tags first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code: `code`
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links: [text](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks: convert double newlines to paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Single line breaks
    .replace(/\n/g, '<br>');

  // Handle list items: lines starting with - or *
  const lines = html.split('<br>');
  let inList = false;
  let result = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push('<li>' + trimmed.substring(2) + '</li>');
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  html = result.join('');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<p>') && !html.startsWith('<ul>')) {
    html = '<p>' + html + '</p>';
  } else if (html.includes('</p><p>')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
}

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

    // Optional summary (collapsible)
    if (quiz.summary) {
      const summaryContainer = document.createElement('div');
      summaryContainer.classList.add('quiz-menu__summary-container');
      
      const summaryToggle = document.createElement('button');
      summaryToggle.classList.add('quiz-menu__summary-toggle');
      summaryToggle.type = 'button';
      summaryToggle.innerHTML = '<span class="quiz-menu__summary-icon">▶</span> Краткое содержание';
      
      const summaryContent = document.createElement('div');
      summaryContent.classList.add('quiz-menu__summary-content');
      summaryContent.innerHTML = markdownToHtml(quiz.summary);
      summaryContent.hidden = true;
      
      summaryToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = summaryContent.hidden;
        summaryContent.hidden = !isHidden;
        const icon = summaryToggle.querySelector('.quiz-menu__summary-icon');
        icon.textContent = isHidden ? '▼' : '▶';
      });
      
      summaryContainer.appendChild(summaryToggle);
      summaryContainer.appendChild(summaryContent);
      item.appendChild(summaryContainer);
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