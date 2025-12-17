export interface Option {
  id: string;
  text: string;
  value: number; // For scoring if needed, or just identifier
}

export interface QuestionFeedback {
  range: number[]; // [1, 2] or [3] or [4, 5]
  diagnosis: string;
  recommendation: string;
}

export interface Question {
  id: number;
  text: string;
  example?: string;
  options: Option[];
  feedback: QuestionFeedback[]; // Added feedback logic per question
}

export interface Result {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  imageKeyword?: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, string>; // questionId -> optionId
  isFinished: boolean;
}

export interface ConsultationForm {
  name: string;
  whatsapp: string;
  website: string;
  problems: string;
}