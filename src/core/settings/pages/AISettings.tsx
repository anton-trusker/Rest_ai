
import { Separator } from "@/core/ui/separator";

export default function AISettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">AI Configuration</h3>
                <p className="text-sm text-muted-foreground">
                    Manage API keys for AI services.
                </p>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
                AI settings will be implemented in Phase 6.
            </div>
        </div>
    );
}
