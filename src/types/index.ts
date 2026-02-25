export interface BasePageData {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  canonicalURL?: string;
  noIndex?: boolean;
  metaTitle?: string;
  published?: boolean;
  publishDate?: string | Date;
}

export interface Chapter {
  name: string;
  price: number;
  description?: string;
}

export interface ExamPageData extends BasePageData {
  examDate?: string;
  chapters?: string[];
}

export interface SubjectPageData extends BasePageData {
  chapters?: Chapter[];
}

export interface ContentEntry<T extends Record<string, any> = BasePageData> {
  slug: string;
  data: T;
  render(): Promise<{ Content: any; frontmatter: T }>;
}

// Re-export quiz types from global.d.ts if needed, or define here
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

/** Sanity document types */
export interface Page {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  noIndex?: boolean;
  body?: any;
}

export interface Subject {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  keyTopics?: string[];
  chapters?: Chapter[];
  class?: string;
  body?: any;
}

export interface Exam {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  examDate?: string;
  eligibility?: string;
  chapters?: Chapter[];
  body?: any;
}
