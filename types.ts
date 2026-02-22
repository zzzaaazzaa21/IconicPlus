export enum AppMode {
  LOGIN = 'LOGIN',
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  STUDIO = 'STUDIO',
  MCQ = 'MCQ'
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email' | 'google';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[];
  isThinking?: boolean;
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface Memory {
  id: string;
  content: string;
  type: 'user' | 'fact' | 'preference';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
  isGroupMode?: boolean; // Simulates a team of AI agents
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MCQExamState {
  questions: MCQQuestion[];
  currentQuestionIndex: number;
  userAnswers: (number | null)[];
  isFinished: boolean;
  isLoading: boolean;
}

export interface StudioState {
  mode: 'image-gen' | 'image-edit' | 'video-gen';
  prompt: string;
  resultUrl?: string;
  isLoading: boolean;
}

// Helper types for AI Studio global augmentation
declare global {
  // Augment the existing AIStudio interface
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio: AIStudio;
  }
}