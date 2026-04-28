import { useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartPulse } from "lucide-react";

export function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole?: "patient" | "admin" }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: me, isLoading: isMeLoading } = useGetMe({
    query: { enabled: isAuthenticated }
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
      return;
    }

    if (isAuthenticated && !isMeLoading && me) {
      if (!me.role) {
        setLocation("/role-select");
      } else if (allowedRole && me.role !== allowedRole) {
        // Redirect to their respective home
        setLocation(me.role === "patient" ? "/dashboard" : "/admin");
      } else if (me.role === "patient" && !me.onboardingComplete && window.location.pathname !== "/onboarding") {
        setLocation("/onboarding");
      }
    }
  }, [isAuthenticated, isAuthLoading, me, isMeLoading, setLocation, allowedRole]);

  if (isAuthLoading || (isAuthenticated && isMeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <HeartPulse className="h-10 w-10 text-primary animate-pulse" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !me || (allowedRole && me.role !== allowedRole)) {
    return null;
  }

  return <>{children}</>;
}
