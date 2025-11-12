"use client";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ closeDropdown }) {
  const { isDark, toggleTheme } = useTheme();

  const handleClick = () => {
    toggleTheme();
    if (closeDropdown) closeDropdown();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        "transition-colors select-none"
      )}
    >
      <div className="flex items-center gap-2 mr-2">
        {isDark ? (
          <Moon className="mr-2 h-4 w-4 text-blue-500" />
        ) : (
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
        )}
        <span>Dark Mode</span>
      </div>
      <Switch size="sm" checked={isDark} aria-label="Toggle dark mode" />
    </div>
  );
}
