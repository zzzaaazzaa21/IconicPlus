export enum AppMode {
  LOGIN = 'LOGIN',
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  STUDIO = 'STUDIO',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[];
  isThinking?: boolean;
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface StudioState {
  mode: 'image-gen' | 'image-edit' | 'video-gen';
  prompt: string;
  resultUrl?: string;
  isLoading: boolean;
}

// Helper types for AI Studio global augmentation
declare global {
  interface Window {
    // aistudio is managed by the environment
    webkitAudioContext: typeof AudioContext;
  }
}
