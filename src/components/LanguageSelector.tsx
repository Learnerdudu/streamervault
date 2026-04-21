import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGS, RTL_LANGS } from "@/lib/i18n";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const current = SUPPORTED_LANGS.find((l) => l.code === i18n.language.split("-")[0]) ?? SUPPORTED_LANGS[0];

  function change(code: string) {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = RTL_LANGS.includes(code) ? "rtl" : "ltr";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("lang.label")}
          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/70 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/60"
        >
          <Globe className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">{current.flag}</span>
          <span className="text-xs uppercase tracking-wider">{current.code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t("lang.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => change(l.code)}
            className={l.code === current.code ? "bg-accent" : ""}
          >
            <span className="mr-2 text-lg leading-none">{l.flag}</span>
            <span className="flex-1">{l.label}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{l.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
