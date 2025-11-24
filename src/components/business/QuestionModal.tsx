import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Question, Status } from "@/lib/types";
import { getBilibiliEmbed } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, X, HelpCircle, PlayCircle, BookOpen, Eye, FileText } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    onUpdateStatus: (id: string, status: Status) => void;
}

export function QuestionModal({ isOpen, onClose, question, onUpdateStatus }: Props) {
    if (!question) return null;

    const videoEmbedUrl = question.videoUrl ? getBilibiliEmbed(question.videoUrl) : null;
    const questionImg = question.contentImg || question.imageUrl; // 向后兼容

    const handleStatusUpdate = (status: Status) => {
        onUpdateStatus(question.id, status);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* max-w-4xl 宽度加大，方便看视频和宽图 */}
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">

                {/* 1. 头部信息 */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-base px-3 py-1 bg-white font-mono">
                            第 {question.number} 题
                        </Badge>
                        {/* Tag 显示 */}
                        {question.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs text-slate-500">
                                {tag}
                            </Badge>
                        ))}
                        {question.tags && question.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs text-slate-400">
                                +{question.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* 2. 核心内容区 (Tabs) */}
                <div className="flex-1 overflow-hidden bg-slate-50/30">
                    <Tabs defaultValue="question" className="h-full flex flex-col">

                        {/* Tabs 导航栏 */}
                        <div className="px-6 border-b bg-white">
                            <TabsList className="h-12">
                                <TabsTrigger value="question" className="text-sm gap-2">
                                    <BookOpen className="w-4 h-4" /> 题目
                                </TabsTrigger>
                                <TabsTrigger value="answer" className="text-sm gap-2">
                                    <Eye className="w-4 h-4" /> 答案
                                </TabsTrigger>
                                <TabsTrigger value="analysis" className="text-sm gap-2">
                                    <FileText className="w-4 h-4" /> 解析
                                </TabsTrigger>
                                {videoEmbedUrl && (
                                    <TabsTrigger value="video" className="text-sm gap-2">
                                        <PlayCircle className="w-4 h-4" /> 视频讲解
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 overflow-y-auto bg-white">

                            {/* Tab: 题目 */}
                            <TabsContent value="question" className="mt-0 h-full flex items-center justify-center min-h-[400px] p-6">
                                <div className="w-full max-w-2xl">
                                    {questionImg ? (
                                        <img
                                            src={questionImg}
                                            alt="题目"
                                            className="w-full h-auto rounded-lg border shadow-sm"
                                        />
                                    ) : (
                                        <div className="h-64 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                            题目图片占位符
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Tab: 答案 (纯结果) */}
                            <TabsContent value="answer" className="mt-0 h-full flex items-center justify-center p-6">
                                {question.answerImg ? (
                                    <img
                                        src={question.answerImg}
                                        alt="答案"
                                        className="max-w-full max-h-full object-contain rounded-lg border shadow-sm"
                                    />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <div className="text-slate-400 text-lg">暂无答案图片</div>
                                        <p className="text-xs text-slate-400">可以在 questions.json 中添加 answerImg 字段</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab: 解析 (详细过程) */}
                            <TabsContent value="analysis" className="mt-0 h-full flex items-center justify-center p-6">
                                {question.analysisImg ? (
                                    <img
                                        src={question.analysisImg}
                                        alt="解析"
                                        className="max-w-full max-h-full object-contain rounded-lg border shadow-sm"
                                    />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <div className="text-slate-400 text-lg">暂无解析图片</div>
                                        <p className="text-xs text-slate-400">可以在 questions.json 中添加 analysisImg 字段</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab: 视频 */}
                            {videoEmbedUrl && (
                                <TabsContent value="video" className="mt-0 h-full bg-black p-0">
                                    <iframe
                                        src={videoEmbedUrl}
                                        className="w-full h-full"
                                        scrolling="no"
                                        frameBorder="0"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media"
                                        title="视频讲解"
                                    />
                                </TabsContent>
                            )}

                        </div>
                    </Tabs>
                </div>

                {/* 3. 底部操作栏 (状态标记) */}
                <div className="p-4 border-t bg-white flex justify-center gap-4 shadow-sm z-10">
                    <Button
                        onClick={() => handleStatusUpdate('mastered')}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2 w-32"
                    >
                        <Check className="w-4 h-4" /> 斩
                    </Button>

                    <Button
                        onClick={() => handleStatusUpdate('confused')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2 w-32"
                    >
                        <HelpCircle className="w-4 h-4" /> 懵
                    </Button>

                    <Button
                        onClick={() => handleStatusUpdate('failed')}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2 w-32"
                    >
                        <X className="w-4 h-4" /> 崩
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
