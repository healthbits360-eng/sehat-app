import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HeartPulse, ArrowRight, ShieldCheck, Activity, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageSelect } from "@/components/LanguageSelect";
import { useT } from "@/lib/i18n";

export default function Landing() {
  const isLoading = false;
  const { data: me, isLoading: isMeLoading } = useGetMe({
    query: { enabled: isAuthenticated }
  });
  const [, setLocation] = useLocation();
  const { t } = useT();

  if (false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <HeartPulse className="h-10 w-10 text-primary animate-pulse" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <HeartPulse className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-serif font-semibold text-2xl text-primary">
            <HeartPulse className="h-8 w-8 text-primary" />
            {t("app.name")}
          </div>
          <span className="text-xs text-muted-foreground ml-10 -mt-1 hidden sm:inline">{t("app.tagline")}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelect variant="compact" />
          <Button onClick={() => setLocation("/dashboard")} className="rounded-full px-6">
            {t("common.signIn")}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6">
            {t("landing.heroLine1")} <br className="hidden md:block" />
            <span className="text-primary italic">{t("landing.heroLine2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("landing.subtitle")}
          </p>
          <Button size="lg" onClick={() => setLocation("/dashboard")} className="rounded-full px-8 h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all">
            {t("common.getStarted")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid md:grid-cols-3 gap-8 text-left w-full"
        >
          <div className="bg-card p-8 rounded-3xl border shadow-sm">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-serif">{t("landing.feature1.title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("landing.feature1.body")}</p>
          </div>

          <div className="bg-card p-8 rounded-3xl border shadow-sm">
            <div className="h-12 w-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-serif">{t("landing.feature2.title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("landing.feature2.body")}</p>
          </div>

          <div className="bg-card p-8 rounded-3xl border shadow-sm">
            <div className="h-12 w-12 bg-accent/50 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-serif">{t("landing.feature3.title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("landing.feature3.body")}</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
