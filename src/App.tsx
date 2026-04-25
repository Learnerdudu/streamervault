import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RTL_LANGS } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import { useVaultSequence } from "@/lib/easterEgg";
import { SnakeModal } from "@/components/SnakeModal";
import Index from "./pages/Index.tsx";
import Watch from "./pages/Watch.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";
import AnimeHub from "./pages/AnimeHub.tsx";
import NewsPage from "./pages/NewsPage.tsx";

function HtmlLangSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const code = i18n.language.split("-")[0];
    document.documentElement.lang = code;
    document.documentElement.dir = RTL_LANGS.includes(code) ? "rtl" : "ltr";
  }, [i18n.language]);
  return null;
}

function VaultEasterEgg() {
  const [open, setOpen] = useState(false);
  useVaultSequence(() => setOpen(true));
  return <SnakeModal open={open} onClose={() => setOpen(false)} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <HtmlLangSync />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <VaultEasterEgg />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/anime" element={<AnimeHub />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/watch/:type/:id" element={<Watch />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
