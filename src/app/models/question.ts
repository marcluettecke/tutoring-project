interface Answer {
  id: string,
  text: string
}

export interface Question {
  id: string,
  questionText: string,
  answers: Answer[],
  correctAnswer: string,
  explanation: string
}

export interface Questions {
  questions: Question[]
}
