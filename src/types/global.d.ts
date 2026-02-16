declare interface CpGaContext {
  post_slug?: string;
}

// Quiz types used by components and layouts
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  title?: string;
  mode?: "practice" | "exam";
  timeLimit?: number; // seconds
  questions: QuizQuestion[];
}

declare global {
  interface Window {
    __cpGaContext?: CpGaContext;
    cpTrack?: (...args: any[]) => void;
    PagefindUI?: any;
  }
}

export {};
