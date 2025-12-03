import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Question, Status } from "@/lib/types";
import { useProgressStore } from "@/lib/store";
import { getImageUrl } from "@/lib/utils";
import { Eye, CheckCircle, XCircle, HelpCircle, FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Props {
    question: Question;
    onNext?: () => void;
}

export function MistakeReviewCard({ question, onNext }: Props) {
    const [isRevealed, setIsRevealed] = useState(false);
    const updateStatus = useProgressStore(state => state.updateStatus);
    const repoBaseUrl = useProgressStore(state => state.repoBaseUrl);
    const repoSources = useProgressStore(state => state.repoSources);
    const notes = useProgressStore(state => state.notes[question.id]);

    const handleStatusChange = (status: Status) => {
        updateStatus(question.id, status);
        if (onNext) {
            onNext();
        }
    };

    const contentUrl = getImageUrl(question.contentImg, question, repoBaseUrl, repoSources);
    const analysisUrl = getImageUrl(question.analysisImg, question, repoBaseUrl, repoSources);
    const answerUrl = getImageUrl(question.answerImg, question, repoBaseUrl, repoSources);

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Question Content Area */}
            <Card className="flex-1 overflow-y-auto shadow-sm border-2 border-muted">
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-bold text-lg text-primary">Question {question.number}</h3>
                        <div className="flex gap-2">
                            {question.tags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Question Body */}
                    <div className="prose dark:prose-invert max-w-none">
                        {question.contentMd && <ReactMarkdown>{question.contentMd}</ReactMarkdown>}
                        {contentUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={contentUrl}
                                alt="Question Content"
                                className="rounded-lg border shadow-sm max-w-full"
                            />
                        )}
                    </div>

                    {/* Revealed Content: Answer & Analysis */}
                    {isRevealed && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pt-6 border-t-2 border-dashed">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <FileText className="w-4 h-4" />
                                    Analysis & Answer
                                </h4>
                                {question.analysisMd && <ReactMarkdown>{question.analysisMd}</ReactMarkdown>}
                                {analysisUrl && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={analysisUrl}
                                        alt="Analysis"
                                        className="rounded-lg border shadow-sm max-w-full"
                                    />
                                )}
                                {answerUrl && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={answerUrl}
                                        alt="Answer"
                                        className="rounded-lg border shadow-sm max-w-full"
                                    />
                                )}
                            </div>

                            {/* User Notes */}
                            {notes && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">My Notes</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">{notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Interaction Area */}
            <Card className="shrink-0 p-4 border-t shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10">
                {!isRevealed ? (
                    <Button
                        size="lg"
                        className="w-full text-lg font-semibold h-14 shadow-md hover:shadow-lg transition-all"
                        onClick={() => setIsRevealed(true)}
                    >
                        <Eye className="mr-2 w-5 h-5" />
                        Show Answer & Analysis
                    </Button>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <Button
                            variant="destructive"
                            size="lg"
                            className="h-14 flex flex-col gap-1 hover:bg-red-600"
                            onClick={() => handleStatusChange('failed')}
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="text-xs font-normal">Still Failed</span>
                        </Button>

                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 flex flex-col gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100"
                            onClick={() => handleStatusChange('confused')}
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span className="text-xs font-normal">Confused</span>
                        </Button>

                        <Button
                            variant="default"
                            size="lg"
                            className="h-14 flex flex-col gap-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusChange('mastered')}
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-xs font-normal">Mastered</span>
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
