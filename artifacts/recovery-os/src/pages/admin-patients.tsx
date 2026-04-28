import { useState } from "react";
import { useListAdminPatients, useListConditions } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Search, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminPatients() {
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");

  const { data: conditions } = useListConditions();
  const { data: patients, isLoading } = useListAdminPatients({
    query: {
      queryKey: ["adminPatients", search, conditionFilter] // Custom key for refetching on state change
    },
    request: {
      url: `/api/admin/patients?${new URLSearchParams({
        ...(search ? { q: search } : {}),
        ...(conditionFilter !== "all" ? { condition: conditionFilter } : {})
      }).toString()}`
    } as any // Overriding the default request for Orval due to how it handles query params
  });

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Patient Directory</h1>
        <p className="text-muted-foreground mt-1">Search and filter your patient population.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-full sm:w-[250px] bg-card">
            <SelectValue placeholder="Filter by condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {conditions?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : patients?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border">
          <p className="text-muted-foreground text-lg">No patients found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients?.map((patient) => (
            <Link key={patient.patientId} href={`/admin/patients/${patient.patientId}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {patient.displayName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {patient.conditionLabel}
                      </span>
                      <span>{patient.email || "No email"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8 w-full sm:w-auto">
                    <div className="grid grid-cols-2 sm:flex sm:gap-8 w-full sm:w-auto text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider">Latest Pain</div>
                        <div className={`font-medium ${patient.latestPainScore && patient.latestPainScore > 6 ? 'text-destructive' : ''}`}>
                          {patient.latestPainScore !== null ? `${patient.latestPainScore}/10` : 'None'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider">Adherence</div>
                        <div className="font-medium">
                          {patient.latestAdherence !== null ? `${patient.latestAdherence}%` : 'None'}
                        </div>
                      </div>
                      <div className="space-y-1 hidden sm:block">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider">Last Check-in</div>
                        <div className="font-medium whitespace-nowrap">
                          {patient.lastCheckinAt ? formatDistanceToNow(new Date(patient.lastCheckinAt), { addSuffix: true }) : 'Never'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
