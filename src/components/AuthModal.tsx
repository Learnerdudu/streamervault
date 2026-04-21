import { useState } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const emailSchema = z.string().trim().email({ message: "Invalid email" }).max(255);
const passwordSchema = z.string().min(8, { message: "At least 8 characters" }).max(72);

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!ev.success) return toast({ title: "Invalid email", variant: "destructive" });
    if (!pv.success) return toast({ title: pv.error.errors[0].message, variant: "destructive" });

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
    toast({ title: t("auth.welcome") });
    onOpenChange(false);
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const displayName = String(form.get("displayName") || "").trim().slice(0, 60);

    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!ev.success) return toast({ title: "Invalid email", variant: "destructive" });
    if (!pv.success) return toast({ title: pv.error.errors[0].message, variant: "destructive" });

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) return toast({ title: "Sign-up failed", description: error.message, variant: "destructive" });
    toast({ title: t("auth.checkInbox"), description: t("auth.verifyDesc") });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide">
            STREAM<span className="text-primary">VAULT</span>
          </DialogTitle>
          <DialogDescription>{t("auth.title")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
            <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">{t("auth.email")}</Label>
                <Input id="si-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="si-password">{t("auth.password")}</Label>
                <Input id="si-password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">{t("auth.displayName")}</Label>
                <Input id="su-name" name="displayName" type="text" autoComplete="nickname" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">{t("auth.email")}</Label>
                <Input id="su-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-password">{t("auth.passwordHint")}</Label>
                <Input id="su-password" name="password" type="password" autoComplete="new-password" required />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? t("auth.creating") : t("auth.createAccount")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t("auth.verifyHint")}</p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
