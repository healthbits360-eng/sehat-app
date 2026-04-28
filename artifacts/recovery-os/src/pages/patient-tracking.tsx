import { useListMyTrackingEntries } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, ClipboardList } from "lucide-react";

export default function PatientTracking() {
  const { data: entries, isLoading } = useListMyTrackingEntries({ query: { limit: 30 } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-20">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">No tracking data yet</h2>
        <p className="text-muted-foreground">Log your daily check-in on the dashboard to see trends.</p>
      </div>
    );
  }

  const chartData = [...entries].reverse().map(e => ({
    ...e,
    dateStr: format(new Date(e.date), 'MMM d')
  }));

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Progress Tracking</h1>
        <p className="text-muted-foreground mt-1">Review your pain and adherence over time.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pain & Adherence Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="dateStr" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} width={30} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="painScore" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{r:4}} name="Pain Level" />
              <Line yAxisId="right" type="monotone" dataKey="adherencePercent" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r:4}} name="Adherence %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Check-in History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl border bg-muted/20 gap-4">
                <div className="flex-1">
                  <div className="font-medium">{format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}</div>
                  {entry.notes && <p className="text-sm text-muted-foreground mt-1 italic">"{entry.notes}"</p>}
                </div>
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pain</div>
                    <div className={`font-bold ${entry.painScore > 6 ? 'text-destructive' : entry.painScore > 3 ? 'text-orange-500' : 'text-primary'}`}>
                      {entry.painScore}/10
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adherence</div>
                    <div className="font-bold">{entry.adherencePercent}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
