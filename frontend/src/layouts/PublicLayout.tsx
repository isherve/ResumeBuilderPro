import { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore, useThemeStore } from '@/store';

export function PublicLayout() {
  const { isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#templates', label: 'Templates' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 w-full glass border-b">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">ResumeBuilder Pro</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:inline-flex">Login</Button>
                <Button onClick={() => navigate('/register')}>Get Started</Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t bg-background/95 backdrop-blur-xl p-4 space-y-2"
          >
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
