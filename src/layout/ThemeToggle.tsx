import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/core/settings/themeStore";
import { Button } from "@/core/ui/button";

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`rounded-full hover:bg-accent hover:text-accent-foreground ${className}`}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Moon className="h-5 w-5 transition-all text-blue-300" />
            ) : (
                <Sun className="h-5 w-5 transition-all text-amber-500" />
            )}
        </Button>
    );
}
