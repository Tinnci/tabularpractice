"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from "lucide-react"
import { DICT } from "@/lib/i18n"
import { DataManagement } from "./DataManagement"
import { GithubConfig } from "./GithubConfig"
import { RepoSources } from "./RepoSources"
import { AppearanceFilter } from "./AppearanceFilter"
import { AiSettings } from "./AiSettings"

export function SettingsModal() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4 mr-2" />
                    {DICT.settings.title}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>{DICT.settings.title}</DialogTitle>
                    <DialogDescription>
                        {DICT.settings.desc}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
                    {/* Left Column: Data & Source Config */}
                    <div className="space-y-6">
                        <DataManagement />
                        <GithubConfig />
                        <RepoSources />
                    </div>

                    {/* Right Column: AI & Appearance */}
                    <div className="space-y-6">
                        <AiSettings />
                        <AppearanceFilter />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
