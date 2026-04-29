import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HeartPulse, ArrowRight, ShieldCheck, Activity, Users } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-serif font-semibold text-2xl text-primary">
          <HeartPulse className="h-8 w-8 text-primary" />
          Sehat
        </div>

        <Button onClick={() => setLocation("/dashboard")} className="rounded-full px-6">
          Sign in
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl font-bold mb-6">
          Calm, focused recovery
        </h1>

        <Button
          size="lg"
          onClick={() => setLocation("/dashboard")}
          className="rounded-full px-8 h-14"
        >
          Get Started
        </Button>
      </main>
    </div>
  );
}
