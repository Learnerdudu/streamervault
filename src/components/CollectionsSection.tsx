import { useEffect, useState } from "react";
import { FolderPlus, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/externalSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/tmdb";
import { toast } from "@/hooks/use-toast";

interface CollectionWithPreview {
  id: string;
  name: string;
  emoji: string | null;
  count: number;
  posters: (string | null)[];
}

/**
 * "My Collections" section — stacked-card folder previews.
 * Empty state shows a stylish "Build Your First Vault" prompt.
 */
export function CollectionsSection() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<CollectionWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFolders() {
    if (!user) {
      setFolders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: cols } = await supabase
      .from("collections")
      .select("id, name, emoji")
      .order("created_at", { ascending: false });

    if (!cols) {
      setFolders([]);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      cols.map(async (c) => {
        const { data: items, count } = await supabase
          .from("collection_items")
          .select("poster_path", { count: "exact" })
          .eq("collection_id", c.id)
          .order("added_at", { ascending: false })
          .limit(3);
        return {
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          count: count ?? 0,
          posters: (items ?? []).map((i) => i.poster_path),
        };
      }),
    );
    setFolders(enriched);
    setLoading(false);
  }

  useEffect(() => {
    loadFolders();
  }, [user]);

  async function createFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("collections").insert({
      user_id: user.id,
      name: newName.trim().slice(0, 60),
    });
    setBusy(false);
    if (error) {
      toast({ title: "Could not create", description: error.message, variant: "destructive" });
      return;
    }
    setNewName("");
    setCreateOpen(false);
    loadFolders();
  }

  if (!user) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-wide text-foreground sm:text-xl">
          📚 My Collections
        </h2>
        <Button size="sm" variant="ghost" onClick={() => setCreateOpen(true)}>
          <FolderPlus className="mr-1 h-4 w-4" /> New folder
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {folders.map((f) => (
            <FolderCard key={f.id} folder={f} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create a vault</DialogTitle>
          </DialogHeader>
          <form onSubmit={createFolder} className="space-y-3">
            <Input
              autoFocus
              placeholder="e.g. Must Watch, Marathon, Sad Vibes"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
            />
            <Button type="submit" disabled={busy || !newName.trim()} className="w-full">
              {busy ? "Creating…" : "Create vault"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FolderCard({ folder }: { folder: CollectionWithPreview }) {
  const posters = folder.posters.slice(0, 3);
  while (posters.length < 3) posters.push(null);

  return (
    <div className="group relative cursor-pointer">
      {/* Stacked posters */}
      <div className="relative aspect-[3/4]">
        {posters.map((p, i) => {
          const url = p ? getImageUrl(p, "w342") : null;
          const offset = i * 6;
          const rotate = (i - 1) * 4;
          return (
            <div
              key={i}
              className="absolute inset-0 origin-bottom overflow-hidden rounded-lg border border-white/10 bg-muted shadow-xl transition-all duration-300 group-hover:rotate-0"
              style={{
                transform: `translate(${offset}px, ${-offset}px) rotate(${rotate}deg)`,
                zIndex: 3 - i,
              }}
            >
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/30" />
              )}
            </div>
          );
        })}
      </div>

      {/* Label */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-base">{folder.emoji || "📁"}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{folder.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {folder.count} {folder.count === 1 ? "title" : "titles"}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/30 px-6 py-12 text-center">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Sparkles className="h-8 w-8" />
      </div>
      <h3 className="relative mt-4 font-display text-2xl text-foreground">Build Your First Vault</h3>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Group titles into folders like <span className="text-foreground/80">Must Watch</span>,{" "}
        <span className="text-foreground/80">Marathon</span>, or{" "}
        <span className="text-foreground/80">Sad Vibes</span>. Tap the <strong>+</strong> on any
        poster to start collecting.
      </p>
      <Button onClick={onCreate} className="relative mt-5">
        <FolderPlus className="mr-2 h-4 w-4" /> Create your first vault
      </Button>
    </div>
  );
}
