import { Button } from "@/core/ui/button";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InstallPrompt() {
    const { isInstallable, install } = usePWAInstall();

    if (!isInstallable) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={install}
            className="gap-2 hidden md:flex"
        >
            <Download className="h-4 w-4" />
            Install App
        </Button>
    );
}
