"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Eye, FileText, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Question, ViewType } from "@/lib/types";
import { MarkdownContent, RemoteImage, DraftPanel, NotePanel } from "@/components/question";
import { CopyButton } from "./CopyButton";
import { SmartTagList } from "./SmartTagList";
import { DICT } from "@/lib/i18n";
import { getBilibiliTimestamp, formatTimestamp } from "@/lib/utils";

export interface QuestionContentProps {
    question: Question;
    isLoading?: boolean;
    isFullscreen: boolean;
    visibleViews: Set<ViewType>;
    videoEmbedUrl: string | null;
    notes: Record<string, string>;
    onUpdateNote: (questionId: string, content: string) => void;
}

export function QuestionContent({
    question,
    isLoading,
    isFullscreen,
    visibleViews,
    videoEmbedUrl,
    notes,
    onUpdateNote,
}: QuestionContentProps) {
    if (isLoading) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-50 bg-background/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">{DICT.common.loadingQuestion}</span>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            {/* key={question.id} 强制 React 在题目切换时重新渲染整个内容区域，
            解决"切换下一题但内容未刷新"的问题，并重置图片加载状态 */}
            <div key={question.id} className={cn(
                "p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 mx-auto pb-20 animate-in fade-in duration-300 transition-all ease-in-out",
                isFullscreen ? "max-w-[1600px]" : "max-w-4xl"
            )}>

                {/* 移动端标签显示 - 移动端可以多显示几个，或者全显示 */}
                <div className="sm:hidden mb-2">
                    <SmartTagList
                        tags={question.tags || []}
                        tagNames={question.tagNames}
                        limit={5} // 移动端允许换行，可以多显示一些
                        className="gap-1.5"
                    />
                </div>

                {/* 题目区域 */}
                {visibleViews.has('question') && (
                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                        <div className="bg-muted/50 border-b px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {DICT.exam.questionDesc}
                            </div>
                            <CopyButton
                                text={question.contentMd}
                                img={question.contentImg}
                                question={question}
                            />
                        </div>
                        <div className="p-4 flex justify-center bg-card min-h-[150px] items-center">
                            {question.contentMd ? (
                                <div className="w-full p-2">
                                    <MarkdownContent content={question.contentMd} />
                                </div>
                            ) : (question.contentImg) ? (
                                <RemoteImage
                                    src={question.contentImg || ''}
                                    alt={DICT.exam.questionDesc}
                                    question={question}
                                />
                            ) : (
                                <div className="text-muted-foreground text-sm">{DICT.exam.contentMissing}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* 视频区域 */}
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
                                // @ts-expect-error - playsInline is not in iframe type definition but is needed for iOS
                                playsInline
                            />

                            {/* 时间戳提示 - 仅在有时间戳时显示 */}
                            {(() => {
                                const timestamp = question?.videoUrl ? getBilibiliTimestamp(question.videoUrl) : null;
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

                        {/* 新增：iOS/移动端友好跳转按钮 */}
                        {question?.videoUrl && (
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-xs h-8 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100 hover:text-pink-700 dark:bg-pink-900/20 dark:border-pink-900 dark:text-pink-300"
                                    onClick={() => window.open(question.videoUrl, '_blank')}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    {/* 提示用户去 App 看，体验更好 */}
                                    <span className="sm:hidden">{DICT.exam.openInBilibiliMobile}</span>
                                    <span className="hidden sm:inline">{DICT.exam.openInBilibiliWeb}</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* 答案区域 */}
                {visibleViews.has('answer') && (
                    <div className="bg-card rounded-xl border border-green-100 dark:border-green-900 shadow-sm overflow-hidden">
                        <div className="bg-green-50/50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" /> {DICT.exam.referenceAnswer}
                            </div>
                            <CopyButton
                                text={question.answerMd || (question.answer ? DICT.exam.answerLabel.replace('{answer}', question.answer) : null)}
                                img={question.answerImg}
                                question={question}
                            />
                        </div>
                        <div className="p-4 sm:p-6 flex justify-center">
                            {question.answerMd ? (
                                <div className="w-full text-left">
                                    <MarkdownContent content={question.answerMd} />
                                </div>
                            ) : question.answerImg ? (
                                <RemoteImage
                                    src={question.answerImg}
                                    alt={DICT.exam.answer}
                                    question={question}
                                />
                            ) : question.answer ? (
                                <div className="w-full text-left">
                                    <MarkdownContent content={question.answer} />
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-sm">{DICT.exam.noAnswer}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* 解析区域 */}
                {visibleViews.has('analysis') && (
                    <div className="bg-card rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {DICT.exam.detailedAnalysis}
                            </div>
                            <CopyButton
                                text={question.analysisMd}
                                img={question.analysisImg}
                                question={question}
                            />
                        </div>
                        <div className="p-4 sm:p-6 flex justify-center">
                            {question.analysisMd ? (
                                <div className="w-full text-left">
                                    <MarkdownContent content={question.analysisMd} />
                                </div>
                            ) : question.analysisImg ? (
                                <RemoteImage
                                    src={question.analysisImg}
                                    alt={DICT.exam.analysis}
                                    question={question}
                                />
                            ) : (
                                <span className="text-muted-foreground text-sm">{DICT.exam.noAnalysis}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* 草稿区域 */}
                <DraftPanel
                    key={`draft-${question.id}`}
                    questionId={question.id}
                    isVisible={visibleViews.has('draft')}
                />

                {/* 笔记区域 */}
                <NotePanel
                    key={`note-${question.id}`}
                    questionId={question.id}
                    initialContent={notes[question.id]}
                    onUpdateNote={onUpdateNote}
                    isVisible={visibleViews.has('note')}
                />

            </div>
        </ScrollArea>
    );
}
