import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

type Theme = 'studio' | 'creator' | 'classic';

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<Theme>('creator');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-studio', 'theme-creator', 'theme-classic');
    
    // Add new theme class
    root.classList.add(`theme-${newTheme}`);
    
    // Apply theme-specific CSS variables
    switch (newTheme) {
      case 'studio':
        root.style.setProperty('--background', '222.2 84% 4.9%');
        root.style.setProperty('--foreground', '210 40% 98%');
        root.style.setProperty('--primary', '217.2 91.2% 59.8%');
        root.style.setProperty('--accent', '262.1 83.3% 57.8%');
        break;
      case 'creator':
        root.style.setProperty('--background', '240 10% 3.9%');
        root.style.setProperty('--foreground', '0 0% 98%');
        root.style.setProperty('--primary', '142.1 76.2% 36.3%');
        root.style.setProperty('--accent', '346.8 77.2% 49.8%');
        break;
      case 'classic':
        root.style.setProperty('--background', '0 0% 100%');
        root.style.setProperty('--foreground', '222.2 84% 4.9%');
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--accent', '210 40% 96.1%');
        break;
    }
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeTheme('studio')}>
          🎬 Studio Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme('creator')}>
          🎨 Creator Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme('classic')}>
          ☀️ Classic Mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
