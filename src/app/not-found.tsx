import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    404
                </h1>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Page not found
                </h2>
                <p className="text-muted-foreground max-w-[500px]">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                </p>
                <div className="pt-4">
                    <Link href="/">
                        <Button size="lg">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
