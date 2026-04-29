import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListConditions, 
  useSubmitOnboarding, 
  useGenerateMyRecoveryPlan,
  getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, Loader2 } from "lucide-react";
import { LanguageSelect } from "@/components/LanguageSelect";
import { useT } from "@/lib/i18n";

const onboardingSchema = z.object({
  age: z.coerce.number().min(1).max(120),
  gender: z.enum(["female", "male", "nonbinary", "prefer_not_to_say"]),
  conditionId: z.string().min(1, "Please select a condition"),
  symptoms: z.string().min(10, "Please describe your symptoms in more detail").max(2000),
  painLevel: z.number().min(1).max(10),
  medicalHistory: z.string().max(4000).optional().default(""),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function PatientOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reportFileName, setReportFileName] = useState<string | null>(null);
  const { t } = useT();
  
  const { data: conditions, isLoading: conditionsLoading } = useListConditions();
  const submitOnboarding = useSubmitOnboarding();
  const generatePlan = useGenerateMyRecoveryPlan();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      age: 30,
      gender: "prefer_not_to_say",
      conditionId: "",
      symptoms: "",
      painLevel: 5,
      medicalHistory: "",
    },
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      await submitOnboarding.mutateAsync({
        data: {
          ...data,
          reportFileName,
        }
      });

      toast({
        title: t("onboarding.profileSaved"),
        description: t("onboarding.generatingDesc"),
      });

      await generatePlan.mutateAsync({});

      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: t("onboarding.error"),
        variant: "destructive",
      });
    }
  };

  const isSubmitting = submitOnboarding.isPending || generatePlan.isPending;

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex justify-center">
      <div className="max-w-2xl w-full">
        <div className="flex justify-end mb-4">
          <LanguageSelect variant="compact" />
        </div>
        <div className="text-center mb-10">
          <HeartPulse className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-foreground">{t("onboarding.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("onboarding.subtitle")}</p>
          <p className="text-xs text-muted-foreground italic mt-1">{t("app.tagline")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("onboarding.profileTitle")}</CardTitle>
            <CardDescription>{t("onboarding.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.age")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.gender")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("onboarding.gender.placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="female">{t("onboarding.gender.female")}</SelectItem>
                            <SelectItem value="male">{t("onboarding.gender.male")}</SelectItem>
                            <SelectItem value="nonbinary">{t("onboarding.gender.nonbinary")}</SelectItem>
                            <SelectItem value="prefer_not_to_say">{t("onboarding.gender.prefer")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="conditionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.condition")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={conditionsLoading}>
                            <SelectValue placeholder={t("onboarding.condition.placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {conditions?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.symptoms")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("onboarding.symptoms.placeholder")}
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="painLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.painLevel")}: {field.value}/10</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="flex justify-between">
                        <span>{t("onboarding.painLevel.mild")}</span>
                        <span>{t("onboarding.painLevel.severe")}</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.history")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("onboarding.history.placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="medical-report">{t("onboarding.report")}</Label>
                  <Input
                    id="medical-report"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setReportFileName(file.name);
                      } else {
                        setReportFileName(null);
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground">{t("onboarding.report.help")}</p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("onboarding.generating")}
                    </>
                  ) : (
                    t("onboarding.submit")
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
