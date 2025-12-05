import { useEffect } from 'react';

interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean; // Command on Mac
    shiftKey?: boolean;
    altKey?: boolean;
    action: (e: KeyboardEvent) => void;
    enabled?: boolean; // Optional: conditionally enable shortcut
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if inside input/textarea or contentEditable
            if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement ||
                (document.activeElement as HTMLElement).isContentEditable
            ) {
                return;
            }

            shortcuts.forEach(shortcut => {
                if (shortcut.enabled === false) return;

                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = !!shortcut.ctrlKey === e.ctrlKey;
                const metaMatch = !!shortcut.metaKey === e.metaKey;
                const shiftMatch = !!shortcut.shiftKey === e.shiftKey;
                const altMatch = !!shortcut.altKey === e.altKey;

                if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
                    e.preventDefault();
                    shortcut.action(e);
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}
