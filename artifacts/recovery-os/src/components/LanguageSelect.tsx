import { Languages } from "lucide-react";
import { LANGUAGE_OPTIONS, useT, type Language } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LanguageSelectProps {
  variant?: "default" | "compact";
  className?: string;
}

export function LanguageSelect({ variant = "default", className }: LanguageSelectProps) {
  const { language, setLanguage } = useT();

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
        <SelectTrigger className={variant === "compact" ? "h-9 w-[150px]" : "h-10 w-[180px]"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
