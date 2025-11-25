import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelpModal({ open, onOpenChange }: Props) {
    const shortcuts = [
        {
            category: "全局", items: [
                { keys: ["⌘", "K"], desc: "搜索题目" },
                { keys: ["?"], desc: "显示快捷键帮助" },
                { keys: ["[", "]"], desc: "切换年份 (上一年/下一年)" },
            ]
        },
        {
            category: "题目详情页", items: [
                { keys: ["←", "→"], desc: "上一题 / 下一题" },
                { keys: ["1"], desc: "标记为：斩 (熟练)" },
                { keys: ["2"], desc: "标记为：懵 (不熟)" },
                { keys: ["3"], desc: "标记为：崩 (不会)" },
                { keys: ["Esc"], desc: "关闭详情页" },
            ]
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        快捷键指南
                    </DialogTitle>
                    <DialogDescription>
                        使用键盘快捷键来提高刷题效率。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {shortcuts.map((group) => (
                        <div key={group.category} className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">{group.category}</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {group.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-foreground/80">{item.desc}</span>
                                        <div className="flex gap-1">
                                            {item.keys.map(k => (
                                                <kbd key={k} className="pointer-events-none inline-flex h-5 min-w-[20px] justify-center select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
