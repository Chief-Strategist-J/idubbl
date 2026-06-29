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
  async fetchQuestions(amount = 5) {
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
            correctIndex
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
        correctIndex: 1
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of RESILIENT?",
        options: ["Easily broken", "Able to recover quickly from difficulties", "Very slow", "A musical term"],
        correctIndex: 1
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of TENACIOUS?",
        options: ["Holding firmly to a purpose", "Moving slowly", "Very quiet", "Relating to time"],
        correctIndex: 0
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of LUCID?",
        options: ["Dark and unclear", "Very bright", "Expressed clearly and easy to understand", "A type of dream"],
        correctIndex: 2
      },
      {
        category: "General Knowledge",
        question: "Which of the following is the correct definition of VERBOSE?",
        options: ["Speaking briefly", "Using more words than needed", "Silent", "Very fast"],
        correctIndex: 1
      }
    ];
    return fallbacks.slice(0, amount);
  }
}

export const quizService = new QuizService();
