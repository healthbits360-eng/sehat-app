import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { getArticles } from "@/services/contentService";

export default function Learn() {
  const { t } = useT();
  const articles = getArticles();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{t("learn.title")}</h1>
            <p className="text-muted-foreground text-sm md:text-base">{t("learn.subtitle")}</p>
          </div>
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          {t("learn.empty")}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Card key={a.id} className="flex flex-col rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="space-y-3">
                <Badge variant="secondary" className="w-fit">{a.topic}</Badge>
                <CardTitle className="font-serif text-xl leading-tight">{a.title}</CardTitle>
                <CardDescription className="leading-relaxed">{a.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    {t("common.readMore")}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
