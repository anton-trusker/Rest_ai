
import { Separator } from "@/core/ui/separator";

export default function SyrveSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Syrve Integration</h3>
                <p className="text-sm text-muted-foreground">
                    Connect to your Syrve POS instance.
                </p>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
                Integration configuration will be implemented in Phase 3.
            </div>
        </div>
    );
}
