export interface Subject {
  id: string
  name: string
  name_en: string
  icon?: string
  color?: string
  sort_order: number
}

export interface Topic {
  id: string
  subject_id: string
  name: string
  parent_id?: string
  grade_range?: string
  sort_order: number
}

export enum QuestionType {
  Choice = 'choice',
  MultipleChoice = 'multiple_choice',
  Fill = 'fill',
  Answer = 'answer',
  Image = 'image',
  Matching = 'matching',
  Sorting = 'sorting',
  Math = 'math',
  Listening = 'listening',
  Drawing = 'drawing'
}

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Exam = 'exam'
}

export interface Question {
  id?: string
  school_id?: string
  subject_id?: string
  topic_id?: string
  knowledge_point_id?: string
  title?: string
  content: any // JSONB content
  question_type: QuestionType
  difficulty: Difficulty
  score: number
  is_ai_generated?: boolean
  ai_prompt?: string
  source_question_id?: string
  answer?: any
  explanation?: string
  tags?: string[]
  is_public?: boolean
  status?: 'active' | 'pending' | 'pending_review' | 'inactive'
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface QuestionOption {
  id: string
  text: string
  image?: string
  isCorrect?: boolean
}

export interface Topic {
  id: string
  subject_id: string
  name: string
  parent_id?: string
  grade_range?: string
}
