export interface Question {
  id: number
  question: string
  options: (string | { text: string; image?: string })[]
  correct: number
  explanation?: string
  image?: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  icon: string
  color: string
  category: "General" | "Science" | "Mathematics" | "History" | "Geography" | "Language" | "Technology" | "Sports" | "Entertainment" | "Business"
  questions: Question[]
}

export const quizzes: Quiz[] = []

export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find((quiz) => quiz.id === id)
}

export function getRandomQuestions(quiz: Quiz, count: number): Question[] {
  const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
