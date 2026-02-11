
import { Separator } from "@/core/ui/separator";
import ThemeToggle from "@/layout/ThemeToggle";

export default function BrandingSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Branding & Appearance</h3>
                <p className="text-sm text-muted-foreground">
                    Customize the look and feel of the application.
                </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <label className="text-base font-medium">Theme</label>
                    <p className="text-sm text-muted-foreground">
                        Select your preferred theme.
                    </p>
                </div>
                <ThemeToggle />
            </div>
        </div>
    );
}
