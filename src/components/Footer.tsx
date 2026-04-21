import { Link } from "react-router-dom";
import { Mail, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="font-display text-2xl tracking-wide text-foreground">
              STREAM<span className="text-primary">VAULT</span>
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("footer.disclaimer")}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" /> {t("footer.copyright")}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("footer.copyrightText")}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" /> {t("footer.contact")}
            </h4>
            <p className="text-xs text-muted-foreground">{t("footer.contactText")}</p>
            <Link to="/contact" className="inline-block text-sm font-medium text-primary hover:underline">
              {t("footer.getInTouch")}
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            {t("footer.rights", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
