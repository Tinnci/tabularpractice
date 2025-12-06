"use client";

import { useEffect, useState, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * ClientOnly Component
 * 
 * Solves Hydration Mismatch for Local-First apps.
 * Renders 'fallback' (or nothing) on Server and during initial Hydration.
 * Renders 'children' only after the component has mounted on the client.
 */
export function ClientOnly({ children, fallback = null }: Props) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
