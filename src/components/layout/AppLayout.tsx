import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { LayoutDashboard, Users, LogOut, Menu, X, Shield, UsersRound, Mail, Info, FolderDown } from 'lucide-react';
import logo from '@/assets/accountability-circle-logo.png';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children
}: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Group View', href: '/group', icon: Users },
    { name: 'Information', href: '/information', icon: Info },
    { name: 'Resources', href: '/resources', icon: FolderDown },
    ...(isAdmin ? [
      { name: 'Applications', href: '/admin/applications', icon: Shield },
      { name: 'Groups', href: '/admin/groups', icon: UsersRound },
      { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
    ] : []),
  ];
  const isActive = (href: string) => location.pathname === href;
  return <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-1 flex-col bg-sidebar border-r border-sidebar-border">
          {/* Logo */}
          <div className="flex h-20 items-center px-6 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src={logo} alt="Accountability Circle" className="h-10 w-auto" />
              <span className="font-display text-lg font-semibold text-sidebar-foreground">
                Accountability Circle
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map(item => {
            const Icon = item.icon;
            return <Link key={item.name} to={item.href} className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}
                  `}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>;
          })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <button onClick={signOut} className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Accountability Circle" className="h-8 w-auto" />
            <span className="font-display text-lg font-semibold">Accountability Circle</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-foreground hover:bg-muted">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && <div className="absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg animate-fade-in">
            <nav className="p-4 space-y-1">
              {navigation.map(item => {
            const Icon = item.icon;
            return <Link key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)} className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      ${isActive(item.href) ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                    `}>
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>;
          })}
              <button onClick={() => {
            signOut();
            setMobileMenuOpen(false);
          }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </nav>
          </div>}
      </div>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>;
}