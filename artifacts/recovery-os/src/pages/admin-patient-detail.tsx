import { useParams } from "wouter";
import { 
  useGetAdminPatient, 
  getGetAdminPatientQueryKey,
  useUpdateAdminPatientPlan,
  useListAdminPatientNotes,
  useCreateAdminPatientNote,
  getListAdminPatientNotesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Activity, User, FileText, Settings, HeartPulse } from "lucide-react";

export default function AdminPatientDetail() {
  const { patientId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useGetAdminPatient(patientId!, {
    query: { enabled: !!patientId, queryKey: getGetAdminPatientQueryKey(patientId!) }
  });

  const { data: notes } = useListAdminPatientNotes(patientId!, {
    query: { enabled: !!patientId, queryKey: getListAdminPatientNotesQueryKey(patientId!) }
  });

  const updatePlan = useUpdateAdminPatientPlan();
  const createNote = useCreateAdminPatientNote();

  const [newNote, setNewNote] = useState("");
  const [planSummary, setPlanSummary] = useState("");
  const [planJsonStr, setPlanJsonStr] = useState("");

  useEffect(() => {
    if (detail?.plan) {
      setPlanSummary(detail.plan.content.summary);
      setPlanJsonStr(JSON.stringify({
        exercises: detail.plan.content.exercises,
        lifestyleTips: detail.plan.content.lifestyleTips,
        precautions: detail.plan.content.precautions,
        weeklyPlan: detail.plan.content.weeklyPlan
      }, null, 2));
    }
  }, [detail]);

  const handleSavePlan = async () => {
    if (!detail?.plan) return;
    try {
      const parsedContent = JSON.parse(planJsonStr);
      await updatePlan.mutateAsync({
        patientId: patientId!,
        data: {
          summary: planSummary,
          ...parsedContent
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetAdminPatientQueryKey(patientId!) });
      toast({ title: "Plan updated successfully" });
    } catch (e) {
      toast({ title: "Invalid JSON format in plan editor", variant: "destructive" });
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await createNote.mutateAsync({
        patientId: patientId!,
        data: { content: newNote.trim() }
      });
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: getListAdminPatientNotesQueryKey(patientId!) });
      toast({ title: "Note added" });
    } catch (e) {
      toast({ title: "Failed to add note", variant: "destructive" });
    }
  };

  if (isLoading || !detail) {
    return <div className="space-y-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[500px] w-full" /></div>;
  }

  const chartData = [...detail.recentTracking].reverse().map(e => ({
    ...e,
    dateStr: format(new Date(e.date), 'MMM d')
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-2xl border">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2">
            <AvatarImage src={detail.user.profileImageUrl || ""} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">{detail.user.firstName?.[0] || "P"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {detail.user.firstName} {detail.user.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{detail.profile.age}yo {detail.profile.gender}</span>
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs font-medium">
                {detail.profile.conditionLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Initial Pain Level</div>
          <div className="text-xl font-bold">{detail.profile.painLevel}/10</div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 space-x-6">
          <TabsTrigger value="profile" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            <User className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            <FileText className="h-4 w-4 mr-2" /> Recovery Plan
          </TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            <Activity className="h-4 w-4 mr-2" /> Tracking
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            <Settings className="h-4 w-4 mr-2" /> Clinical Notes
          </TabsTrigger>
        </TabsList>

        <div className="pt-6">
          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Symptoms</CardTitle></CardHeader>
                <CardContent><p className="whitespace-pre-wrap text-muted-foreground">{detail.profile.symptoms}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Medical History</CardTitle></CardHeader>
                <CardContent>
                  {detail.profile.medicalHistory ? (
                    <p className="whitespace-pre-wrap text-muted-foreground">{detail.profile.medicalHistory}</p>
                  ) : (
                    <p className="text-muted-foreground italic">None provided</p>
                  )}
                </CardContent>
              </Card>
              {detail.profile.reportFileName && (
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle>Attached Report</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-primary bg-primary/5 p-3 rounded-lg border border-primary/20 w-fit">
                      <FileText className="h-5 w-5" />
                      {detail.profile.reportFileName}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plan">
            {detail.plan ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Recovery Plan</CardTitle>
                  <CardDescription>Manually override the AI-generated plan for this patient.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plan Summary</label>
                    <Textarea 
                      value={planSummary} 
                      onChange={(e) => setPlanSummary(e.target.value)} 
                      className="min-h-[100px] bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex justify-between">
                      <span>Structured Content (JSON)</span>
                      <span className="text-muted-foreground text-xs font-normal">Edit exercises, tips, etc.</span>
                    </label>
                    <Textarea 
                      value={planJsonStr} 
                      onChange={(e) => setPlanJsonStr(e.target.value)} 
                      className="font-mono text-sm min-h-[400px] bg-muted/30"
                    />
                  </div>
                  <Button onClick={handleSavePlan} disabled={updatePlan.isPending}>
                    {updatePlan.isPending ? "Saving..." : "Save Plan Overrides"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border">
                <HeartPulse className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Patient has not generated a plan yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tracking Trends</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="dateStr" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} width={30} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line yAxisId="left" type="monotone" dataKey="painScore" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{r:4}} name="Pain Level" />
                      <Line yAxisId="right" type="monotone" dataKey="adherencePercent" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r:4}} name="Adherence %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No tracking data available.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b shrink-0">
                <CardTitle>Internal Clinical Notes</CardTitle>
                <CardDescription>These notes are not visible to the patient.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {notes?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">No clinical notes yet.</div>
                ) : (
                  notes?.map((note) => (
                    <div key={note.id} className="bg-muted/30 p-4 rounded-xl border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{note.authorName}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
              <div className="p-4 border-t bg-card shrink-0">
                <form onSubmit={handleSendNote} className="flex gap-2">
                  <Input 
                    placeholder="Add a clinical note..." 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="bg-background"
                  />
                  <Button type="submit" disabled={!newNote.trim() || createNote.isPending}>
                    <Send className="h-4 w-4 mr-2" /> Add
                  </Button>
                </form>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
