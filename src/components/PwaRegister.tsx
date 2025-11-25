"use client";
import { useEffect } from "react";

export function PwaRegister() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV !== "development"
        ) {
            navigator.serviceWorker
                .register("/serwist/sw.js")
                .then((reg) => console.log("SW registered:", reg))
                .catch((err) => console.error("SW registration failed:", err));
        }
    }, []);

    return null;
}
