export enum PipelineStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed'
}

export interface PipelineStep {
  id: number;
  text: string;
  status: PipelineStepStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  feedback?: 'up' | 'down' | null;
}

export interface QuizOption {
  answerText: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correctAnswer: string;
}

export interface PlayerQuizQuestion {
  id: number;
  image: string;
  options: string[];
  correctAnswer: string;
}

export type GameStatus = 'loading' | 'playing' | 'finished';
export type GameType = 'trivia' | 'player' | 'fastestFinger';

export interface LeaderboardEntry {
  name: string;
  score: number;
  topic: string;
  date: string;
  gameMode: GameType;
}