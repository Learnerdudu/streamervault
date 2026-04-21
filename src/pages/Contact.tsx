import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Contact = () => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !query.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "861d3292-a791-40de-903c-e5d6ea08bc61",
          subject: subject.trim(),
          message: query.trim(),
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setSubject("");
        setQuery("");
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-lg">
          <h1 className="mb-2 font-display text-4xl tracking-wide text-foreground">{t("contact.title")}</h1>
          <p className="mb-8 text-sm text-muted-foreground">{t("contact.intro")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("contact.subject")}
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("contact.subjectPlaceholder")}
                required
                maxLength={200}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label htmlFor="query" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("contact.message")}
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("contact.messagePlaceholder")}
                required
                maxLength={2000}
                rows={6}
                className="w-full resize-none rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-[hsl(var(--primary-hover))] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {status === "sending" ? t("contact.sending") : t("contact.send")}
            </button>
          </form>

          {status === "sent" && (
            <p className="mt-4 text-sm text-green-500">{t("contact.sent")}</p>
          )}
          {status === "error" && (
            <p className="mt-4 text-sm text-destructive">{t("contact.error")}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
