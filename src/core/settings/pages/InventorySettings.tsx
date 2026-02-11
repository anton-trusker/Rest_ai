
import { Separator } from "@/core/ui/separator";

export default function InventorySettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Inventory Rules</h3>
                <p className="text-sm text-muted-foreground">
                    Configure approval workflows and counting rules.
                </p>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
                Coming soon. This section will allow you to configure session approval workflows.
            </div>
        </div>
    );
}
