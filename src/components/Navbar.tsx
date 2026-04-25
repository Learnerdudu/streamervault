import { Link, useLocation } from "react-router-dom";
import { Search, Film, LogOut, User as UserIcon, Newspaper, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { LanguageSelector } from "@/components/LanguageSelector";
import { GlassSearchOverlay } from "@/components/GlassSearchOverlay";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Module 2: Center-aligned YouTube-style search bar.
 * - Wide, prominent in the middle
 * - No ⌘K shortcut indicator
 * - Cmd+K still works as a hidden hotkey
 */
export function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initial = (user?.user_metadata?.display_name || user?.email || "?").charAt(0).toUpperCase();

  const navLink = (to: string, label: string, icon: React.ReactNode) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        className={`hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors md:inline-flex ${
          active ? "text-primary" : "text-foreground/80 hover:text-foreground"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-gradient-to-b from-background/90 to-transparent"
        }`}
      >
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
          {/* Logo + nav links */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <Film className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
              <span className="font-display text-2xl tracking-wide text-foreground">
                STREAM<span className="text-primary">VAULT</span>
              </span>
            </Link>
            <div className="ml-4 flex">
              {navLink("/anime", "Anime", <Sparkles className="h-4 w-4" />)}
              {navLink("/news", "News", <Newspaper className="h-4 w-4" />)}
            </div>
          </div>

          {/* Centered YouTube-style search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="mx-auto flex h-10 w-full max-w-xl items-center gap-3 rounded-full border border-border/60 bg-secondary/70 px-5 text-sm text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">{t("nav.search")}</span>
          </button>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105">
                    {initial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <UserIcon className="mr-2 h-4 w-4" /> {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen(true)} className="font-semibold">
                {t("nav.signIn")}
              </Button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <GlassSearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
