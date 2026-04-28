import { useGetMyDashboard, useUpsertMyTrackingEntry, getGetMyDashboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Activity, Calendar, CheckCircle2, Flame, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetMyDashboard();
  const upsertTracking = useUpsertMyTrackingEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [painScore, setPainScore] = useState(5);
  const [completedExercises, setCompletedExercises] = useState(0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = dashboard?.weeklyTrend?.find(e => e.date === todayStr);

  useEffect(() => {
    if (todayEntry) {
      setPainScore(todayEntry.painScore);
      setCompletedExercises(todayEntry.completedExercises);
    }
  }, [todayEntry]);

  const handleSaveCheckin = () => {
    const totalExercises = dashboard?.todaysActivities?.length || 0;
    upsertTracking.mutate({
      data: {
        painScore,
        completedExercises,
        totalExercises,
        notes: ""
      }
    }, {
      onSuccess: () => {
        toast({ title: "Check-in saved", description: "Keep up the good work!" });
        queryClient.invalidateQueries({ queryKey: getGetMyDashboardQueryKey() });
      }
    });
  };

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Good morning, {user?.firstName || "there"}</h1>
        <p className="text-muted-foreground mt-1">Here is your recovery summary for today.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard.streakDays} <span className="text-xl text-muted-foreground font-normal">days</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Latest Pain Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard.latestPainScore ?? "-"} <span className="text-xl text-muted-foreground font-normal">/10</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Avg Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard.averageAdherence ?? 0}<span className="text-xl text-muted-foreground font-normal">%</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Check-in */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Check-in</CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM d')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Pain Level: {painScore}/10</label>
              </div>
              <Slider 
                min={0} max={10} step={1} 
                value={[painScore]} 
                onValueChange={(v) => setPainScore(v[0])} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No Pain</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Exercises Completed</label>
                <span className="text-sm font-bold text-primary">{completedExercises} / {dashboard.todaysActivities?.length || 0}</span>
              </div>
              <Slider 
                min={0} max={dashboard.todaysActivities?.length || 0} step={1} 
                value={[completedExercises]} 
                onValueChange={(v) => setCompletedExercises(v[0])} 
              />
            </div>

            <Button onClick={handleSaveCheckin} className="w-full" disabled={upsertTracking.isPending}>
              {todayEntry ? "Update Check-in" : "Save Check-in"}
            </Button>
          </CardContent>
        </Card>

        {/* Today's Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
            <CardDescription>Your recommended exercises</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.todaysActivities?.length > 0 ? (
              <div className="space-y-4">
                {dashboard.todaysActivities.map((ex, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-muted/50 border">
                    <div className="bg-background rounded-lg p-2 border shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{ex.name}</h4>
                      <p className="text-xs text-muted-foreground">{ex.sets} sets × {ex.reps} reps • {ex.durationMinutes} min</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href="/plan">View Full Plan</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Rest day today! No scheduled activities.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {dashboard.weeklyTrend?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard.weeklyTrend.map(e => ({ ...e, dateStr: format(new Date(e.date), 'EEE') }))}>
                <XAxis dataKey="dateStr" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} width={30} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}%`} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="painScore" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{r:4}} name="Pain" />
                <Line yAxisId="right" type="monotone" dataKey="adherencePercent" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r:4}} name="Adherence %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
