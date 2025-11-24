export type Difficulty = 'easy' | 'medium' | 'hard';
export type Status = 'unanswered' | 'mastered' | 'confused' | 'failed';

export interface Question {
  id: string;
  year: number;
  number: number; // 题号
  imageUrl?: string; // Optional for now
  status: Status;
  tags: string[]; // 知识点
  difficulty?: Difficulty;
}
