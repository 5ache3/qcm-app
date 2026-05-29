export type UserRole = "student" | "admin" | "tutor"

export interface Lesson {
  id: string
  subject_id: string
  name: string
  description: string | null
  position: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  description: string | null
  icon: string | null
  due_date: string | null
  class_id: string | null
  created_at: string
}

export interface Class {
  id: string
  name: string
  description: string | null
  tutor_id: string
  invite_code: string
  created_at: string
}

export interface ClassMembership {
  id: string
  class_id: string
  student_id: string
  status: "pending" | "approved"
  joined_at: string
}

export interface Question {
  id: string
  subject_id: string
  lesson_id: string | null
  question_text: string
  explanation: string | null
  difficulty: string | null
  created_at: string
  updated_at: string
}

export interface AnswerOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  position: number
}

export interface PracticeAnswer {
  id: string
  user_id: string
  subject_id: string
  question_id: string
  selected_option_ids: string[]
  score: number
  status: "correct" | "partial" | "wrong"
  answered_at: string
}

export type TestStatus = "in_progress" | "completed" | "expired"

export interface Test {
  id: string
  user_id: string
  subject_id: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  score: number | null
  percentage: number | null
  status: TestStatus
}

export interface TestQuestion {
  id: string
  test_id: string
  question_id: string
  position: number
  score: number | null
}

export interface TestAnswer {
  id: string
  test_id: string
  question_id: string
  selected_option_ids: string[]
  score: number | null
  status: "correct" | "partial" | "wrong" | "unanswered"
  answered_at: string | null
}

export interface QuestionWithOptions extends Question {
  answer_options: AnswerOption[]
}

export interface SubjectWithProgress extends Subject {
  total_questions: number
  answered_questions: number
  correct_questions: number
}
