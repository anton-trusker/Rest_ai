import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-16 left-4 right-4 md:bottom-4 md:left-auto md:right-4 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You are offline. Changes saved locally.</span>
        </div>
    );
}
