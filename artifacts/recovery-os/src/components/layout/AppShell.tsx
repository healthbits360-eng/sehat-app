import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMe } from "@workspace/api-client-react";
import {
  Activity,
  BookOpen,
  HeartPulse,
  MessageCircle,
  Settings,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { t } = useT();

  const isPatient = me?.role === "patient";
  const isAdmin = me?.role === "admin";

  const patientNav = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/plan", label: t("nav.plan"), icon: HeartPulse },
    { href: "/tracking", label: t("nav.tracking"), icon: Activity },
    { href: "/chat", label: t("nav.assistant"), icon: MessageCircle },
    { href: "/learn", label: t("nav.learn"), icon: BookOpen },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const adminNav = [
    { href: "/admin", label: t("nav.overview"), icon: LayoutDashboard },
    { href: "/admin/patients", label: t("nav.patients"), icon: Users },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : isPatient ? patientNav : [];

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? "bg-primary text-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const UserMenu = () => (
    <div className="p-4 border-t flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={user?.profileImageUrl || ""} />
          <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium truncate">{user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "User"}</span>
          <span className="text-xs text-muted-foreground truncate">{me?.role || "Welcome"}</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={logout} title={t("common.signOut")} className="shrink-0 text-muted-foreground hover:text-foreground">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar shrink-0">
        <div className="h-16 flex items-center px-6 border-b shrink-0">
          <Link href="/" className="flex items-center gap-2 font-serif font-semibold text-xl text-primary">
            <HeartPulse className="h-6 w-6 text-primary" />
            {t("app.name")}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserMenu />
      </aside>

      {/* Mobile Top Nav */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b bg-background shrink-0 sticky top-0 z-10">
          <Link href="/" className="flex items-center gap-2 font-serif font-semibold text-lg text-primary">
            <HeartPulse className="h-5 w-5 text-primary" />
            {t("app.name")}
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar">
              <div className="h-16 flex items-center px-6 border-b shrink-0">
                <span className="flex items-center gap-2 font-serif font-semibold text-xl text-primary">
                  <HeartPulse className="h-6 w-6 text-primary" />
                  {t("app.name")}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks />
              </div>
              <UserMenu />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
