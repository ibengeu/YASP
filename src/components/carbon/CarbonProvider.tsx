import React, { createContext, useContext } from 'react';

/**
 * Carbon Design System Theme Provider
 * 
 * This component provides Carbon theming context and prepares
 * for Carbon component integration during the migration process.
 */

type CarbonTheme = 'white' | 'g10' | 'g90' | 'g100';

interface CarbonThemeContextType {
  theme: CarbonTheme;
  setTheme: (theme: CarbonTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const CarbonThemeContext = createContext<CarbonThemeContextType | undefined>(undefined);

interface CarbonProviderProps {
  children: React.ReactNode;
  initialTheme?: CarbonTheme;
}

export function CarbonProvider({ 
  children, 
  initialTheme = 'white' 
}: CarbonProviderProps) {
  const [theme, setTheme] = React.useState<CarbonTheme>(initialTheme);
  const isDark = theme === 'g90' || theme === 'g100';
  
  React.useEffect(() => {
    // Set Carbon theme class on document
    const validThemes = ['white', 'g10', 'g90', 'g100'];
    
    // Remove existing Carbon theme classes
    validThemes.forEach(t => {
      document.documentElement.classList.remove(`cds--theme--${t}`);
    });
    
    // Add current theme
    document.documentElement.classList.add(`cds--theme--${theme}`);
    
    // Also handle our custom dark mode
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return () => {
      validThemes.forEach(t => {
        document.documentElement.classList.remove(`cds--theme--${t}`);
      });
    };
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme(current => current === 'white' ? 'g90' : 'white');
  };

  const contextValue: CarbonThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark
  };

  return (
    <CarbonThemeContext.Provider value={contextValue}>
      <div 
        className="carbon-provider" 
        data-carbon-theme={theme}
      >
        {children}
      </div>
    </CarbonThemeContext.Provider>
  );
}

/**
 * Hook to access current Carbon theme
 */
export function useCarbonTheme() {
  const context = useContext(CarbonThemeContext);
  if (context === undefined) {
    throw new Error('useCarbonTheme must be used within a CarbonProvider');
  }
  return context;
}