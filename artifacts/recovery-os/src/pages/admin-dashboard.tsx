import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, CheckCircle2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Clinical Overview</h1>
        <p className="text-muted-foreground mt-1">High-level metrics across all your active patients.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard.totalPatients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard.activePatientsLast7Days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Pain Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard.averagePainScore ?? "-"} <span className="text-xl text-muted-foreground font-normal">/10</span></div>
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
        <Card>
          <CardHeader>
            <CardTitle>Conditions Breakdown</CardTitle>
            <CardDescription>Distribution of primary conditions</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.conditionBreakdown} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="conditionLabel" width={120} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Latest patient logs</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentCheckins.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentCheckins.map((checkin, i) => (
                  <Link key={i} href={`/admin/patients/${checkin.patientId}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border cursor-pointer group">
                      <div>
                        <div className="font-medium group-hover:text-primary transition-colors">{checkin.displayName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{checkin.conditionLabel}</span>
                          <span>{format(new Date(checkin.date), 'MMM d')}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Pain</div>
                          <div className={`font-bold text-sm ${checkin.painScore > 6 ? 'text-destructive' : ''}`}>{checkin.painScore}/10</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Adh.</div>
                          <div className="font-bold text-sm">{checkin.adherencePercent}%</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No recent check-ins found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
