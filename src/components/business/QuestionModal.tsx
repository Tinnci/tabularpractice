import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Question, Status } from "@/lib/types"
import { useState } from "react"
import { Check, HelpCircle, X } from "lucide-react"

interface Props {
    question: Question | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: Status) => void;
}

export function QuestionModal({ question, isOpen, onClose, onUpdateStatus }: Props) {
    const [showAnalysis, setShowAnalysis] = useState(false);

    if (!question) return null;

    const handleStatusUpdate = (status: Status) => {
        onUpdateStatus(question.id, status);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span>第{question.number}题</span>
                        {question.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs font-normal">
                                {tag}
                            </Badge>
                        ))}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 题目区域 */}
                    <div className="min-h-[200px] bg-slate-50 border rounded-lg flex items-center justify-center p-4">
                        {question.imageUrl ? (
                            <img src={question.imageUrl} alt="Question" className="max-w-full h-auto" />
                        ) : (
                            <div className="text-slate-400 text-sm">题目图片占位符</div>
                        )}
                    </div>

                    {/* 操作区域 */}
                    <div className="flex justify-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowAnalysis(!showAnalysis)}
                        >
                            {showAnalysis ? "隐藏解析" : "查看解析"}
                        </Button>
                    </div>

                    {/* 解析区域 */}
                    {showAnalysis && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <h4 className="font-semibold mb-2 text-sm text-slate-700">文字解析</h4>
                                <div className="h-32 bg-white rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
                                    解析图片占位符
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <h4 className="font-semibold mb-2 text-sm text-slate-700">视频讲解</h4>
                                <div className="aspect-video bg-black rounded flex items-center justify-center text-white/50 text-sm">
                                    B站视频 iframe 占位符
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-center gap-2 sm:gap-6 pt-4 border-t">
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white w-24"
                        onClick={() => handleStatusUpdate('mastered')}
                    >
                        <Check className="w-4 h-4 mr-1" /> 斩
                    </Button>
                    <Button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white w-24"
                        onClick={() => handleStatusUpdate('confused')}
                    >
                        <HelpCircle className="w-4 h-4 mr-1" /> 懵
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white w-24"
                        onClick={() => handleStatusUpdate('failed')}
                    >
                        <X className="w-4 h-4 mr-1" /> 崩
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
