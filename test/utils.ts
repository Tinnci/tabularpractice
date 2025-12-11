import { Question } from '@/lib/types';

export const mockQuestion = (
    id: string,
    tags: string[] = [],
    type: 'choice' | 'fill' | 'answer' = 'choice'
): Question => ({
    id,
    type,
    paperId: 'paper1',
    number: 1,
    contentMd: 'content',
    answerMd: 'answer',
    analysisMd: 'analysis',
    tags,
    sourceUrl: 'url'
});
