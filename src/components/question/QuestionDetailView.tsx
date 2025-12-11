"use client";

import { useMemo } from "react";
import { Question, ViewType } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    BookOpen, Eye, FileText, Copy, Check, Clock, ExternalLink, Loader2
} from "lucide-react";
import { MarkdownContent, RemoteImage, DraftPanel, NotePanel } from "@/components/question";
import { DICT } from "@/lib/i18n";
import { getBilibiliEmbed, getBilibiliTimestamp, formatTimestamp, getImageUrl, cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/store";
import { getTagLabel } from "@/data/subject-tags";
import { useState } from "react";

// --- SmartTagList (copied from QuestionModal for now, could be shared later) ---
const SmartTagList = ({
    tags = [],
    tagNames = [],
    limit = 2,
    className
}: {
    tags: string[],
    tagNames?: string[],
    limit?: number,
    className?: string
}) => {
    const displayTags = useMemo(() => {
        return tags.map((tagId, index) => tagNames?.[index] || getTagLabel(tagId));
    }, [tags, tagNames]);

    if (displayTags.length === 0) return null;

    const visibleTags = displayTags.slice(0, limit);
    const hiddenTags = displayTags.slice(limit);
    const hasHidden = hiddenTags.length > 0;

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            {visibleTags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs font-normal text-muted-foreground bg-muted/30 whitespace-nowrap h-6 px-2 hover:bg-muted/50 cursor-default border-muted-foreground/20">
                    {tag}
                </Badge>
            ))}
            {hasHidden && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs h-6 px-1.5 cursor-default hover:bg-secondary/80 transition-colors">
                                +{hiddenTags.length}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="max-w-[250px] p-3">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground">{DICT.practice.includedTags}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {hiddenTags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs font-normal bg-muted/50">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

// --- CopyButton ---
const CopyButton = ({ text, img, question }: { text?: string | null, img?: string | null, question: Question }) => {
    const [copied, setCopied] = useState(false);
    const { repoBaseUrl, repoSources } = useProgressStore();

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (text) {
                await navigator.clipboard.writeText(text);
            } else if (img) {
                const url = getImageUrl(img, question, repoBaseUrl, repoSources);
                if (!url) return;
                const response = await fetch(url);
                const blob = await response.blob();
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            if (!text && img) {
                const url = getImageUrl(img, question, repoBaseUrl, repoSources);
                if (url) {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }
        }
    };

    if (!text && !img) return null;

    return (
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background/50" onClick={handleCopy} title={text ? DICT.common.copyMarkdown : DICT.common.copyImage}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground" />}
        </Button>
    );
};

// --- Main Component ---
interface QuestionDetailViewProps {
    question: Question;
    visibleViews: Set<ViewType>;
    isLoading?: boolean;
    className?: string;
    maxWidth?: string; // e.g., "max-w-4xl" or "max-w-[1600px]"
}

export function QuestionDetailView({
    question,
    visibleViews,
    isLoading,
    className,
    maxWidth = "max-w-4xl"
}: QuestionDetailViewProps) {
    const { notes, updateNote } = useProgressStore();
    const videoEmbedUrl = question.videoUrl ? getBilibiliEmbed(question.videoUrl) : null;

    if (isLoading) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-50 bg-background/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">{DICT.common.loadingQuestion}</span>
            </div>
        );
    }

    return (
        <ScrollArea className={cn("h-full", className)}>
            <div key={question.id} className={cn(
                "p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 mx-auto pb-20 animate-in fade-in duration-300",
                maxWidth
            )}>
                {/* Mobile Tags */}
                <div className="sm:hidden mb-2">
                    <SmartTagList tags={question.tags || []} tagNames={question.tagNames} limit={5} className="gap-1.5" />
                </div>

                {/* Question Section */}
                {visibleViews.has('question') && (
                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                        <div className="bg-muted/50 border-b px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {DICT.exam.questionDesc}</div>
                            <CopyButton text={question.contentMd} img={question.contentImg} question={question} />
                        </div>
                        <div className="p-4 flex justify-center bg-card min-h-[150px] items-center">
                            {question.contentMd ? (
                                <div className="w-full p-2"><MarkdownContent content={question.contentMd} /></div>
                            ) : question.contentImg ? (
                                <RemoteImage src={question.contentImg} alt={DICT.exam.questionDesc} question={question} />
                            ) : (
                                <div className="text-muted-foreground text-sm">{DICT.exam.contentMissing}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Video Section */}
                {visibleViews.has('video') && videoEmbedUrl && (
                    <div className="flex flex-col gap-2">
                        <div className="bg-black rounded-xl border shadow-sm overflow-hidden aspect-video ring-2 ring-blue-100 relative group">
                            <iframe
                                src={videoEmbedUrl}
                                className="w-full h-full"
                                scrolling="no"
                                frameBorder="0"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                title={DICT.exam.video}
                            />
                            {(() => {
                                const timestamp = getBilibiliTimestamp(question.videoUrl || '');
                                if (timestamp !== null) {
                                    return (
                                        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg">
                                            <Clock className="w-4 h-4" />
                                            <span>{DICT.exam.videoStartAt.replace('{time}', formatTimestamp(timestamp))}</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        {question.videoUrl && (
                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="gap-2 text-xs h-8 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100" onClick={() => window.open(question.videoUrl, '_blank')}>
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="sm:hidden">{DICT.exam.openInBilibiliMobile}</span>
                                    <span className="hidden sm:inline">{DICT.exam.openInBilibiliWeb}</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Answer Section */}
                {visibleViews.has('answer') && (
                    <div className="bg-card rounded-xl border border-green-100 dark:border-green-900 shadow-sm overflow-hidden">
                        <div className="bg-green-50/50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                            <div className="flex items-center gap-2"><Eye className="w-4 h-4" /> {DICT.exam.referenceAnswer}</div>
                            <CopyButton text={question.answerMd || question.answer} img={question.answerImg} question={question} />
                        </div>
                        <div className="p-4 sm:p-6 flex justify-center">
                            {question.answerMd ? (
                                <div className="w-full text-left"><MarkdownContent content={question.answerMd} /></div>
                            ) : question.answerImg ? (
                                <RemoteImage src={question.answerImg} alt={DICT.exam.answer} question={question} />
                            ) : question.answer ? (
                                <div className="w-full text-left"><MarkdownContent content={question.answer} /></div>
                            ) : (
                                <span className="text-muted-foreground text-sm">{DICT.exam.noAnswer}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Analysis Section */}
                {visibleViews.has('analysis') && (
                    <div className="bg-card rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> {DICT.exam.detailedAnalysis}</div>
                            <CopyButton text={question.analysisMd} img={question.analysisImg} question={question} />
                        </div>
                        <div className="p-4 sm:p-6 flex justify-center">
                            {question.analysisMd ? (
                                <div className="w-full text-left"><MarkdownContent content={question.analysisMd} /></div>
                            ) : question.analysisImg ? (
                                <RemoteImage src={question.analysisImg} alt={DICT.exam.analysis} question={question} />
                            ) : (
                                <span className="text-muted-foreground text-sm">{DICT.exam.noAnalysis}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Draft Panel */}
                <DraftPanel key={`draft-${question.id}`} questionId={question.id} isVisible={visibleViews.has('draft')} />

                {/* Note Panel */}
                <NotePanel key={`note-${question.id}`} questionId={question.id} initialContent={notes[question.id]} onUpdateNote={updateNote} isVisible={visibleViews.has('note')} />
            </div>
        </ScrollArea>
    );
}
