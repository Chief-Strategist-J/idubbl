import fetch from 'node-fetch';

function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '--');
}

export class QuizService {
  async fetchQuestions(amount = 5, gameType = 'word_duel') {
    if (gameType === 'math_duel') {
      return this.getMathQuestions(amount);
    } else if (gameType === 'reaction_race') {
      return this.getReactionQuestions(amount);
    } else if (gameType !== 'word_duel') {
      return this.getDummyQuestions(amount, gameType);
    }

    try {
      const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);
      const data = await response.json();
      
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((q) => {
          const decodedQuestion = decodeHtmlEntities(q.question);
          const decodedCorrect = decodeHtmlEntities(q.correct_answer);
          const decodedIncorrect = q.incorrect_answers.map(decodeHtmlEntities);
          
          // Combine and shuffle options
          const options = [decodedCorrect, ...decodedIncorrect];
          // Fisher-Yates Shuffle
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
          
          const correctIndex = options.indexOf(decodedCorrect);
          
          return {
            category: q.category,
            difficulty: q.difficulty,
            question: decodedQuestion,
            options,
            correctIndex,
            correct: correctIndex
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch from OpenTDB API, using fallback questions:', error);
    }
    
    // Fallback static questions if the external API is offline or rate-limited
    return this.getFallbackQuestions(amount);
  }

  getFallbackQuestions(amount) {
    const fallbacks = [
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of EPHEMERAL?",
        options: ["Lasting forever", "Lasting for a very short time", "Related to water", "A type of plant"],
        correctIndex: 1,
        correct: 1
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of RESILIENT?",
        options: ["Easily broken", "Able to recover quickly from difficulties", "Very slow", "A musical term"],
        correctIndex: 1,
        correct: 1
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of TENACIOUS?",
        options: ["Holding firmly to a purpose", "Moving slowly", "Very quiet", "Relating to time"],
        correctIndex: 0,
        correct: 0
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of LUCID?",
        options: ["Dark and unclear", "Very bright", "Expressed clearly and easy to understand", "A type of dream"],
        correctIndex: 2,
        correct: 2
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of VERBOSE?",
        options: ["Speaking briefly", "Using more words than needed", "Silent", "Very fast"],
        correctIndex: 1,
        correct: 1
      }
    ];
    return fallbacks.slice(0, amount);
  }

  getMathQuestions(amount) {
    const mathQuestions = [
      { expression: '7 × 8', options: ['54', '56', '64', '58'], correctIndex: 1, correct: 1 },
      { expression: '144 ÷ 12', options: ['10', '14', '12', '11'], correctIndex: 2, correct: 2 },
      { expression: '23 + 49', options: ['62', '72', '68', '71'], correctIndex: 1, correct: 1 },
      { expression: '91 − 37', options: ['54', '48', '64', '44'], correctIndex: 0, correct: 0 },
      { expression: '9 × 9', options: ['72', '81', '83', '79'], correctIndex: 1, correct: 1 },
      { expression: '256 ÷ 8', options: ['28', '34', '32', '30'], correctIndex: 2, correct: 2 },
      { expression: '63 + 28', options: ['81', '91', '93', '89'], correctIndex: 1, correct: 1 },
      { expression: '15 × 7', options: ['95', '105', '100', '115'], correctIndex: 1, correct: 1 },
      { expression: '169 ÷ 13', options: ['11', '14', '13', '12'], correctIndex: 2, correct: 2 },
      { expression: '47 + 58', options: ['95', '105', '97', '101'], correctIndex: 1, correct: 1 }
    ];
    const shuffled = [...mathQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount);
  }

  getReactionQuestions(amount) {
    return Array.from({ length: amount }, (_, i) => {
      const activeIdx = Math.floor(Math.random() * 9);
      return {
        category: 'REACTION RACE',
        question: 'TAP THE GLOWING TARGET AS FAST AS YOU CAN!',
        options: Array.from({ length: 9 }, (_, j) => `Cell ${j + 1}`),
        correctIndex: activeIdx,
        correct: activeIdx
      };
    });
  }

  getDummyQuestions(amount, gameType) {
    const name = gameType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return Array.from({ length: amount }, (_, i) => ({
      category: name,
      question: `Round ${i + 1} - Complete your game turn to submit score!`,
      options: ['Option A', 'Option B'],
      correctIndex: 1,
      correct: 1
    }));
  }
}

export const quizService = new QuizService();
