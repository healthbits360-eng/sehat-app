import { useGetMySubscription, useUpdateMySubscription, getGetMySubscriptionQueryKey, useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { LogOut, User as UserIcon, Sparkles, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: me } = useGetMe();
  const { data: sub, isLoading } = useGetMySubscription();
  const updateSub = useUpdateMySubscription();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isPaid = sub?.tier === 'paid';

  const handleToggleTier = async () => {
    const newTier = isPaid ? 'free' : 'paid';
    try {
      await updateSub.mutateAsync({ data: { tier: newTier } });
      queryClient.invalidateQueries({ queryKey: getGetMySubscriptionQueryKey() });
      toast({ title: `Successfully switched to ${newTier} plan` });
    } catch (e) {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="font-medium">{user?.email || "Not provided"}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Role</label>
              <div className="font-medium capitalize">{me?.role || "Unknown"}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t mt-4 px-6 py-4">
          <Button variant="destructive" onClick={logout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>

      {me?.role === 'patient' && (
        <Card className={isPaid ? "border-primary/50 shadow-md ring-1 ring-primary/20" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className={`h-5 w-5 ${isPaid ? 'text-primary' : 'text-muted-foreground'}`} />
                  Subscription Plan
                </CardTitle>
                <CardDescription className="mt-1">
                  {isPaid ? "You are on the RecoveryOS Premium plan." : "Upgrade to unlock unlimited AI plan regenerations and chat."}
                </CardDescription>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12 rounded-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{isPaid ? "Premium" : "Free"}</span>
                  <Switch checked={isPaid} onCheckedChange={handleToggleTier} disabled={updateSub.isPending} />
                </div>
              )}
            </div>
          </CardHeader>
          {sub && (
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4 p-4 rounded-xl bg-muted/30 border">
                  <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Usage</div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Plan Regenerations</span>
                      <span className="font-medium">{sub.planRegenerationsRemaining} left</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Chat Messages</span>
                      <span className="font-medium">{sub.chatMessagesRemaining} left</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Features</div>
                  {sub.features.map((f, i) => (
                    <div key={i} className="flex gap-2 text-sm items-center">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
