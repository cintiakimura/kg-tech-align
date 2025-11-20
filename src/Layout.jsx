import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { LanguageProvider, useLanguage } from './components/LanguageContext';

function LayoutContent({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const { language, changeLanguage, t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    // Check user preference or default to dark
    const isDark = localStorage.getItem('theme') === 'light' ? false : true;
    setIsDarkMode(isDark);
    applyTheme(isDark);
    
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error("User not logged in");
      }
    }
    loadUser();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    applyTheme(newMode);
  };

  const applyTheme = (dark) => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#212121] text-white' : 'bg-gray-50 text-[#212121]'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-lg border-b ${isDarkMode ? 'bg-[#212121]/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691ced529360bd8b67161013/ed2352d66_LOGOKG.png" 
                alt="KG Logo" 
                className="h-10 w-auto object-contain"
              />
              <span className="font-semibold text-xl tracking-tight hidden sm:block" style={{ fontFamily: 'Inter, sans-serif' }}>
                KG Solutions
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`gap-2 ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}>
                    <Globe className="h-4 w-4" />
                    <span className="uppercase">{language}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('es')}>Español</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('de')}>Deutsch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                className={`rounded-full ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              {user ? (
                 <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#00C600] text-black' : 'bg-[#00C600] text-white'} font-bold`}>
                        {user.email[0].toUpperCase()}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => base44.auth.logout()}
                        className="text-sm"
                    >
                        Logout
                    </Button>
                 </div>
              ) : (
                 <Button 
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-[#00C600] hover:bg-[#00b300] text-white"
                 >
                    Login
                 </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* CSS Variables for Theme Colors */}
      <style>{`
        :root {
          --primary-green: #00C600;
          --bg-dark: #212121;
        }
        .text-primary-green { color: var(--primary-green); }
        .bg-primary-green { background-color: var(--primary-green); }
        .border-primary-green { border-color: var(--primary-green); }
        
        /* Custom scrollbar for dark mode */
        .dark ::-webkit-scrollbar {
          width: 8px;
        }
        .dark ::-webkit-scrollbar-track {
          background: #212121; 
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #444; 
          border-radius: 4px;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #00C600; 
        }
      `}</style>
    </div>
  );
}

export default function Layout(props) {
  return (
    <LanguageProvider>
      <LayoutContent {...props} />
    </LanguageProvider>
  );
}