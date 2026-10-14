export type GradeLevel = 'Lớp 1' | 'Lớp 2' | 'Lớp 3' | 'Lớp 4' | 'Lớp 5';

export type Subject = 
  | 'Toán' 
  | 'Tiếng Việt' 
  | 'Khoa học' 
  | 'Lịch sử và Địa lí' 
  | 'Đạo đức' 
  | 'Tin học' 
  | 'Tiếng Anh';

export type QuestionDifficulty = 
  | 'Tổng hợp 4 mức độ'
  | 'Mức 1 (Nhận biết)'
  | 'Mức 2 (Thông hiểu)'
  | 'Mức 3 (Vận dụng)'
  | 'Mức 4 (Vận dụng cao)';

export type QuestionType = 
  | 'all'
  | 'multiple_choice' 
  | 'matching' 
  | 'fill_blank' 
  | 'true_false';

export interface MultipleChoiceOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface TrueFalseStatement {
  id: string;
  statement: string;
  isTrue: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'matching' | 'fill_blank' | 'true_false';
  level: string; // e.g. "Mức 1", "Mức 2", "Mức 3", "Mức 4"
  question: string;
  points?: number;
  
  // Multiple Choice
  options?: MultipleChoiceOption[];
  correctAnswer?: string;

  // Matching
  matchingPairs?: MatchingPair[];

  // Fill in blanks
  blankText?: string;
  acceptableAnswers?: string[];

  // True/False
  tfStatements?: TrueFalseStatement[];

  hint?: string;
  explanation: string;
}

export interface QuizData {
  id: string;
  quizCode?: string;
  title: string;
  grade: GradeLevel;
  subject: Subject;
  totalQuestions: number;
  durationMinutes: number;
  summary?: string;
  questions: QuizQuestion[];
  createdAt: string;
  isCustom?: boolean;
  authorName?: string;
  authorEmail?: string;
}

export type UserRole = 'teacher' | 'student';

export interface TeacherUser {
  id: string;
  fullName: string;
  schoolName: string;
  email: string;
  createdAt: string;
}

export interface Classroom {
  id: string;
  schoolName: string;
  className: string;
  grade: GradeLevel;
  teacherName?: string;
  teacherEmail?: string;
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  quizId: string;
  quizCode: string;
  quizTitle: string;
  studentName: string;
  schoolName: string;
  className: string;
  grade: GradeLevel;
  subject: Subject;
  score: number; // 0 - 10
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  teacherEmail?: string;
  teacherFeedback?: string;
  answers?: UserAnswers;
}

export interface UserAnswers {
  // questionId -> answer
  // For multiple_choice: 'A' | 'B' | 'C' | 'D'
  // For matching: Record<string, string> (leftId or leftText -> rightId or rightText)
  // For fill_blank: string
  // For true_false: Record<string, boolean> (statementId -> true | false)
  [questionId: string]: any;
}

export interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  questionResults: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: any;
    correctAnswer: any;
    explanation: string;
  }[];
}
