import { useSetRole } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Stethoscope } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { LanguageSelect } from "@/components/LanguageSelect";
import { useT } from "@/lib/i18n";

export default function RoleSelect() {
  const [, setLocation] = useLocation();
  const setRole = useSetRole();
  const queryClient = useQueryClient();
  const { t } = useT();

  const handleSelectRole = (role: "patient" | "admin") => {
    setRole.mutate({ data: { role } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (role === "patient") {
          setLocation("/onboarding");
        } else {
          setLocation("/admin");
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-end mb-4">
          <LanguageSelect variant="compact" />
        </div>
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">{t("role.title")}</h1>
          <p className="text-sm text-muted-foreground italic mb-3">{t("app.tagline")}</p>
          <p className="text-lg text-muted-foreground">{t("role.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:border-primary transition-colors border-2" onClick={() => handleSelectRole("patient")}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-primary">
                <User className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-serif">{t("role.patient")}</CardTitle>
              <CardDescription>{t("role.patientDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-4">
              <Button variant="outline" className="w-full" disabled={setRole.isPending}>{t("common.continue")}</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors border-2" onClick={() => handleSelectRole("admin")}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-secondary">
                <Stethoscope className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-serif">{t("role.admin")}</CardTitle>
              <CardDescription>{t("role.adminDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-4">
              <Button variant="outline" className="w-full" disabled={setRole.isPending}>{t("common.continue")}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
