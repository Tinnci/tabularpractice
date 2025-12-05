import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { DICT } from "@/lib/i18n";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelpModal({ open, onOpenChange }: Props) {
    const shortcuts = [
        {
            category: DICT.shortcuts.global, items: [
                { keys: ["⌘", "K"], desc: DICT.shortcuts.search },
                { keys: ["?"], desc: DICT.shortcuts.help },
                { keys: ["[", "]"], desc: DICT.shortcuts.toggleYear },
            ]
        },
        {
            category: DICT.shortcuts.questionDetail, items: [
                { keys: ["←", "→"], desc: DICT.shortcuts.prevNext },
                { keys: ["1"], desc: DICT.shortcuts.markMastered },
                { keys: ["2"], desc: DICT.shortcuts.markConfused },
                { keys: ["3"], desc: DICT.shortcuts.markFailed },
                { keys: ["Esc"], desc: DICT.shortcuts.close },
            ]
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        {DICT.shortcuts.title}
                    </DialogTitle>
                    <DialogDescription>
                        {DICT.shortcuts.desc}
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
