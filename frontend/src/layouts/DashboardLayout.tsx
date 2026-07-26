import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Layout, Sparkles, User, Settings,
  LogOut, ChevronLeft, Shield, Moon, Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore, useThemeStore } from '@/store';
import { authService } from '@/services/auth.service';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/resumes', label: 'My Resumes', icon: FileText },
  { path: '/templates', label: 'Templates', icon: Layout },
  { path: '/ai-tools', label: 'AI Tools', icon: Sparkles },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    logout();
    navigate('/login');
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card/50 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold gradient-text">ResumeBuilder</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'gradient-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                location.pathname.startsWith('/admin')
                  ? 'gradient-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex h-14 items-center gap-4 border-b px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold flex-1 truncate">
            {navItems.find((n) => location.pathname.startsWith(n.path))?.label || 'ResumeBuilder'}
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
