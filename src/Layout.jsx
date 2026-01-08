import React, { useState, useEffect } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom'; // Removing router deps to avoid context errors
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
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  // const location = useLocation();
  // const navigate = useNavigate();

  useEffect(() => {
    // Check user preference or default to dark
    const isDark = localStorage.getItem('theme') === 'light' ? false : true;
    setIsDarkMode(isDark);
    applyTheme(isDark);
    
    checkAuth();
  }, [window.location.pathname]); // Re-run on path change (if re-rendered)

  async function checkAuth() {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check for role or pending invitation
      if (!currentUser.user_type && currentUser.role !== 'admin') {
          // Check if there is an invitation for this email
          try {
              const invites = await base44.entities.Invitation.list({ email: currentUser.email, status: 'pending' });
              if (invites && invites.length > 0) {
                  const invite = invites[0];
                  // Apply the invited role
                  await base44.auth.updateMe({ user_type: invite.target_user_type });
                  await base44.entities.Invitation.update(invite.id, { status: 'accepted' });

                  // Update local user state
                  const updated = await base44.auth.me();
                  setUser(updated);

                  // Redirect based on new role
                  if (invite.target_user_type === 'manager') window.location.href = '/ManagerDashboard';
                  else if (invite.target_user_type === 'supplier') window.location.href = '/SupplierDashboard';
                  else window.location.href = '/Onboarding'; // client
                  return;
              }
          } catch (e) {
              console.error("Error checking invitations", e);
          }

          // No invitation found? Show selector (but restricted)
          setShowRoleSelector(true);
      } else {
          // Handle Redirects on Root or Dashboard access
          if (window.location.pathname === '/') {
              if (currentUser.role === 'admin' || currentUser.user_type === 'manager') window.location.href = '/ManagerDashboard';
              else if (currentUser.user_type === 'supplier') window.location.href = '/SupplierDashboard';
              else if (currentUser.user_type === 'client') window.location.href = '/Onboarding';
          }
      }
    } catch (e) {
      console.error("Auth check failed", e);
      base44.auth.redirectToLogin();
    }
  }

  const handleRoleSelect = async (type) => {
      try {
          await base44.auth.updateMe({ user_type: type });
          setShowRoleSelector(false);
          // Force reload user to get update
          const updatedUser = await base44.auth.me();
          setUser(updatedUser);
          if (type === 'supplier') window.location.href = '/SupplierDashboard';
          else window.location.href = '/Onboarding';
      } catch (e) {
          console.error("Failed to set role", e);
      }
  };

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
            <a href="/ManagerDashboard" className="flex-shrink-0 flex items-center gap-4 cursor-pointer">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691ced529360bd8b67161013/ed2352d66_LOGOKG.png" 
                alt="KG Logo" 
                className="h-10 w-auto object-contain"
              />
              <span className="font-semibold text-xl tracking-tight hidden sm:block">
                KG Hub
              </span>
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                  <a href="/Catalogue">
                       <Button variant="ghost">Catalogue</Button>
                  </a>
              )}
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
                  <DropdownMenuItem onClick={() => changeLanguage('fr')}>Français</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('pt-br')}>Português (BR)</DropdownMenuItem>
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
              {user && (
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <button className={`h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#00C600] text-black' : 'bg-[#00C600] text-white'} font-bold cursor-pointer hover:opacity-80 transition-opacity`}>
                         {user.email[0].toUpperCase()}
                     </button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     {(user.role === 'admin' || user.user_type === 'manager' || user.email === 'georg@kgprotech.com') && (
                               <DropdownMenuItem asChild>
                                   <a href="/ManagerDashboard" className="w-full cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                                   Manager Dashboard
                                   </a>
                               </DropdownMenuItem>
                           )}
                           {(user.role === 'admin' || user.email === 'georg@kgprotech.com') && (
                               <>
                                   <DropdownMenuItem asChild>
                                       <a href="/admin/import-catalogue" className="w-full cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                                       Import Catalogue
                                       </a>
                                   </DropdownMenuItem>
                                   <DropdownMenuItem asChild>
                                       <a href="/AdminAuditReport" className="w-full cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                                       Audit Report
                                       </a>
                                   </DropdownMenuItem>
                               </>
                           )}
                      {(user.user_type === 'supplier') && (
                          <DropdownMenuItem asChild>
                              <a href="/SupplierDashboard" className="w-full cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                                 Supplier Dashboard
                              </a>
                          </DropdownMenuItem>
                      )}
                     <DropdownMenuItem onClick={() => base44.auth.logout()}>
                       {t('logout')}
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Role Selection Modal - NOW RESTRICTED TO CLIENT ONLY FOR SELF-SIGNUP */}
      {showRoleSelector && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#2a2a2a] p-8 rounded-xl max-w-md w-full shadow-2xl space-y-6 text-center">
                <h2 className="text-2xl font-bold">Welcome!</h2>
                <p className="text-muted-foreground">Complete your account setup to continue.</p>
                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={() => handleRoleSelect('client')} 
                        className="h-32 flex flex-col gap-2 hover:bg-[#00C600]/10 border-2 border-transparent hover:border-[#00C600] transition-all w-full"
                        variant="outline"
                    >
                        <span className="text-4xl">🏢</span>
                        <span className="font-bold">Enter as Client</span>
                        <span className="text-xs text-muted-foreground">I want to order parts</span>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        Are you a Supplier or Manager? <br/>
                        Please contact the administrator for an invitation.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Print Header */}
      <div className="hidden print:block print:mb-8 text-center border-b border-black pb-4 pt-4">
          <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691ced529360bd8b67161013/ed2352d66_LOGOKG.png" 
                alt="KG Protech Logo" 
                className="h-16 w-auto object-contain"
              />
              <div className="text-left">
                  <h1 className="text-2xl font-bold text-black">KG PROTECH SAS</h1>
              </div>
          </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:py-0 print:px-0">
        {!showRoleSelector && children}
      </main>

      {/* CSS Variables for Theme Colors */}
      <style>{`
        :root {
          --primary-green: #00C600;
          --bg-dark: #212121;
        }

        @font-face {
          font-family: 'Akkurat';
          src: url('https://db.onlinewebfonts.com/t/50f9015c7b3917dc9894e43f49293a77.woff2') format('woff2'); 
          font-weight: normal;
          font-style: normal;
        }

        body, h1, h2, h3, h4, h5, h6, button, input, select, textarea, span, div, p, a {
          font-family: 'Akkurat', sans-serif !important;
        }

        /* Force normal font weight for titles and bold classes as requested */
        h1, h2, h3, h4, h5, h6, .font-bold, .font-semibold {
          font-weight: normal !important;
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

                @media print {
                  /* Force light mode variables */
                  :root {
                      --bg-dark: #ffffff !important;
                  }
                  body, .min-h-screen {
                      background-color: #ffffff !important;
                      color: #000000 !important;
                  }
                  .dark {
                      color-scheme: light !important;
                  }
                  /* Hide navbar and other non-print elements */
                  nav, button, .no-print {
                      display: none !important;
                  }
                  /* Ensure content is visible */
                  main {
                      padding: 0 !important;
                      margin: 0 !important;
                  }
                  /* Borders */
                  .border, .border-b, .border-t, .border-l, .border-r {
                      border-color: #000000 !important;
                  }
                  /* Cards */
                  .card, .bg-white, .dark\:bg-\[\#2a2a2a\], .dark\:bg-\[\#212121\] {
                      background-color: #ffffff !important;
                      box-shadow: none !important;
                      border: 1px solid #ddd !important;
                  }
                  /* Text colors */
                  .text-white, .dark\:text-white, .text-gray-400, .text-muted-foreground {
                      color: #000000 !important;
                  }
                  /* Badges */
                  .badge {
                      border: 1px solid #000 !important;
                      color: #000 !important;
                  }
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