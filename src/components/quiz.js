function createAnswerOption(name, answerValue, answerText) {
  const label = document.createElement('label');
  const input = document.createElement('input');

  input.type = 'radio';
  input.name = name;
  input.value = answerValue;

  label.appendChild(input);
  label.append(` ${answerText}`);

  return label;
}

function createTipElements(question, index, onTipUsed) {
  if (!question.tip) {
    return { tipToggle: null, tipBody: null };
  }

  const tipToggle = document.createElement('button');
  tipToggle.type = 'button';
  tipToggle.classList.add('tip');
  tipToggle.textContent = '💡 Показать подсказку';

  const tipBody = document.createElement('div');
  tipBody.classList.add('tip-text');
  tipBody.textContent = question.tip;

  tipToggle.addEventListener('click', () => {
    tipBody.style.display = 'block';
    tipToggle.disabled = true;
    onTipUsed(index);
  });

  return { tipToggle, tipBody };
}

export function mountQuiz({ quiz, quizContainer, resultContainer, checkButton }) {
  const state = quiz.questions.map(() => ({ usedTip: false }));
  const tipPenalty = typeof quiz.settings.tipPenalty === 'number' ? quiz.settings.tipPenalty : 0.5;

  quizContainer.innerHTML = '';
  resultContainer.hidden = true;
  resultContainer.innerHTML = '';

  quiz.questions.forEach((question, index) => {
    const wrapper = document.createElement('article');
    wrapper.classList.add('question');

    const heading = document.createElement('h3');
    heading.textContent = `${index + 1}. ${question.prompt}`;

    const answersWrapper = document.createElement('div');
    answersWrapper.classList.add('answers');

    question.answers.forEach((answer, answerIndex) => {
      const option = createAnswerOption(`q${index}`, answerIndex, answer);
      answersWrapper.appendChild(option);
    });

    const { tipToggle, tipBody } = createTipElements(question, index, (tipIndex) => {
      state[tipIndex].usedTip = true;
    });

    wrapper.appendChild(heading);
    wrapper.appendChild(answersWrapper);

    if (tipToggle && tipBody) {
      wrapper.appendChild(tipToggle);
      wrapper.appendChild(tipBody);
    }

    quizContainer.appendChild(wrapper);
  });

  const handleCheck = () => {
    let score = 0;
    let correctCount = 0;
    const incorrectDetails = [];
    const unanswered = [];

    quiz.questions.forEach((question, index) => {
      const selected = quizContainer.querySelector(`input[name="q${index}"]:checked`);

      if (!selected) {
        unanswered.push(index + 1);
        return;
      }

      const chosenIndex = Number(selected.value);

      if (chosenIndex === question.correctIndex) {
        correctCount += 1;
        score += state[index].usedTip ? Math.max(1 - tipPenalty, 0) : 1;
      } else {
        incorrectDetails.push({
          prompt: question.prompt,
          correctAnswer: question.answers[question.correctIndex],
          tip: question.tip,
        });
      }
    });

    resultContainer.hidden = false;
    resultContainer.innerHTML = '';

    if (unanswered.length > 0) {
      const warning = document.createElement('p');
      warning.classList.add('result__summary');
      warning.style.color = '#d9534f';
      warning.textContent = `Пожалуйста, ответьте на все вопросы перед проверкой. Не отвечено: ${unanswered.join(', ')}.`;
      resultContainer.appendChild(warning);
      resultContainer.hidden = false;
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const summary = document.createElement('p');
    summary.classList.add('result__summary');
    summary.textContent = `Вы ответили правильно на ${correctCount} из ${quiz.questions.length} вопросов (итоговый балл с учётом подсказок: ${score.toFixed(1)}).`;
    resultContainer.appendChild(summary);

    if (incorrectDetails.length > 0) {
      const heading = document.createElement('h3');
      heading.classList.add('result__heading');
      heading.textContent = 'Ошибки';
      resultContainer.appendChild(heading);

      const list = document.createElement('ol');
      list.classList.add('incorrect-list');

      incorrectDetails.forEach((item) => {
        const entry = document.createElement('li');
        entry.classList.add('incorrect');

        const question = document.createElement('p');
        question.classList.add('incorrect__question');
        question.textContent = item.prompt;

        const answer = document.createElement('p');
        answer.classList.add('incorrect__answer');
        answer.textContent = `Правильный ответ: ${item.correctAnswer}`;

        entry.appendChild(question);
        entry.appendChild(answer);

        if (item.tip) {
          const tip = document.createElement('p');
          tip.classList.add('incorrect__tip');
          tip.textContent = 'Подсказка: ';

          const tipText = document.createElement('span');
          tipText.textContent = item.tip;
          tip.appendChild(tipText);

          entry.appendChild(tip);
        }

        list.appendChild(entry);
      });

      resultContainer.appendChild(list);
    }

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Ensure the button is interactable when the quiz is mounted
  checkButton.disabled = false;
  // Attach handler using addEventListener for robustness
  checkButton.addEventListener('click', handleCheck);

  return () => {
    // Clean up the listener when unmounting the quiz
    checkButton.removeEventListener('click', handleCheck);
  };
}