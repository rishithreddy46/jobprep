import test from 'node:test';
import assert from 'node:assert/strict';

// Pure scoring engine logic
function scoreQuiz(questions, responses) {
  let attempted = 0;
  let correct = 0;
  let incorrect = 0;
  let totalTime = 0;

  for (const q of questions) {
    const resp = responses[q.id];
    if (resp && resp.chosen_option_id !== undefined && resp.chosen_option_id !== null) {
      attempted++;
      totalTime += (resp.time_spent || 0);
      if (resp.chosen_option_id === q.correct_option_id) {
        correct++;
      } else {
        incorrect++;
      }
    }
  }

  const unanswered = questions.length - attempted;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const avgTimePerQuestion = attempted > 0 ? Math.round(totalTime / attempted) : 0;

  return {
    total: questions.length,
    attempted,
    correct,
    incorrect,
    unanswered,
    accuracy,
    avgTimePerQuestion,
  };
}

// Option shuffling function that preserves the correct answer mapping
function shuffleOptionsSafely(question) {
  const originalOptions = [...question.options];
  const correctOptionText = originalOptions.find((o) => o.id === question.correct_option_id).text;

  // Shuffle array using Fisher-Yates
  const shuffledTexts = originalOptions.map((o) => o.text);
  for (let i = shuffledTexts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTexts[i], shuffledTexts[j]] = [shuffledTexts[j], shuffledTexts[i]];
  }

  const newOptions = ['A', 'B', 'C', 'D'].map((id, index) => ({
    id,
    text: shuffledTexts[index],
  }));

  const newCorrectOption = newOptions.find((o) => o.text === correctOptionText);

  return {
    ...question,
    options: newOptions,
    correct_option_id: newCorrectOption.id,
    correct_answer: correctOptionText,
  };
}

test('Scoring Engine correctly calculates attempted, correct, incorrect and accuracy', () => {
  const sampleQuestions = [
    { id: 'Q1', correct_option_id: 'B' },
    { id: 'Q2', correct_option_id: 'A' },
    { id: 'Q3', correct_option_id: 'D' },
    { id: 'Q4', correct_option_id: 'C' },
  ];

  const responses = {
    Q1: { chosen_option_id: 'B', time_spent: 30 }, // Correct
    Q2: { chosen_option_id: 'C', time_spent: 45 }, // Incorrect
    Q3: { chosen_option_id: 'D', time_spent: 25 }, // Correct
    // Q4 unanswered
  };

  const result = scoreQuiz(sampleQuestions, responses);

  assert.equal(result.total, 4);
  assert.equal(result.attempted, 3);
  assert.equal(result.correct, 2);
  assert.equal(result.incorrect, 1);
  assert.equal(result.unanswered, 1);
  // Accuracy = 2 / 3 = 67%
  assert.equal(result.accuracy, 67);
  // Avg time = (30 + 45 + 25) / 3 = 33s
  assert.equal(result.avgTimePerQuestion, 33);
});

test('Option shuffling preserves the true semantic correct answer across multiple shuffles', () => {
  const question = {
    id: 'INST_01',
    question: 'What is the output range of a standard industrial current loop transmitter?',
    options: [
      { id: 'A', text: '0 to 10 V' },
      { id: 'B', text: '4 to 20 mA' },
      { id: 'C', text: '1 to 5 V' },
      { id: 'D', text: '0 to 20 mA' },
    ],
    correct_option_id: 'B',
    correct_answer: '4 to 20 mA',
  };

  for (let i = 0; i < 20; i++) {
    const shuffled = shuffleOptionsSafely(question);
    assert.equal(shuffled.options.length, 4);
    const chosenOption = shuffled.options.find((o) => o.id === shuffled.correct_option_id);
    assert.equal(chosenOption.text, '4 to 20 mA', 'Correct option text must always match original correct answer');
  }
});
