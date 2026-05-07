import { useEffect, useState } from "react";
import { FolderPlus, Sparkles, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/externalSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/tmdb";
import { toast } from "sonner";

interface CollectionWithPreview {
  id: string;
  name: string;
  emoji: string | null;
  count: number;
  posters: (string | null)[];
}

const EMOJI_CHOICES = ["📁", "⭐", "🔥", "💖", "🎬", "👻", "🌙", "🍿", "🎯", "🧠", "😭", "🚀"];

export function CollectionsSection() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<CollectionWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  // Edit / delete state
  const [editTarget, setEditTarget] = useState<CollectionWithPreview | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("📁");
  const [deleteTarget, setDeleteTarget] = useState<CollectionWithPreview | null>(null);

  async function loadFolders() {
    if (!user) {
      setFolders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: cols, error: colsErr } = await supabase
      .from("collections")
      .select("id, user_id, name, emoji, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (colsErr) {
      console.error("[Collections] fetch failed:", colsErr.message, colsErr);
      toast.error("Could not load vaults", { description: colsErr.message });
      setFolders([]);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      (cols ?? []).map(async (c) => {
        const { data: items, count, error: itemsErr } = await supabase
          .from("collection_items")
          .select("poster_path", { count: "exact" })
          .eq("user_id", user.id)
          .eq("collection_id", c.id)
          .order("added_at", { ascending: false })
          .limit(3);
        if (itemsErr) console.error("[Collections] items fetch failed:", itemsErr.message);
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
    if (!user) {
      toast.error("Not signed in", { description: "Please sign in to create a vault." });
      return;
    }
    if (!newName.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name: newName.trim().slice(0, 60) })
      .select()
      .single();
    setBusy(false);
    if (error) {
      console.error("[Collections] insert failed", error);
      toast.error("Could not create vault", { description: error.message });
      return;
    }
    toast.success("Vault created", { description: `"${data?.name ?? newName}" is ready.` });
    setNewName("");
    setCreateOpen(false);
    await loadFolders();
  }

  function openEdit(folder: CollectionWithPreview) {
    setEditTarget(folder);
    setEditName(folder.name);
    setEditEmoji(folder.emoji || "📁");
  }

  async function saveEdit() {
    if (!user || !editTarget) return;
    if (!editName.trim()) {
      toast.error("Name required");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("collections")
      .update({ name: editName.trim().slice(0, 60), emoji: editEmoji })
      .eq("id", editTarget.id)
      .eq("user_id", user.id);
    setBusy(false);
    if (error) {
      console.error("[Collections] update failed", error);
      toast.error("Could not update vault", { description: error.message });
      return;
    }
    toast.success("Vault updated");
    setEditTarget(null);
    await loadFolders();
  }

  async function confirmDelete() {
    if (!user || !deleteTarget) return;
    setBusy(true);
    // Remove items first (no FK cascade assumed)
    await supabase
      .from("collection_items")
      .delete()
      .eq("user_id", user.id)
      .eq("collection_id", deleteTarget.id);
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", user.id);
    setBusy(false);
    if (error) {
      console.error("[Collections] delete failed", error);
      toast.error("Could not delete vault", { description: error.message });
      return;
    }
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
    await loadFolders();
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
            <FolderCard
              key={f.id}
              folder={f}
              onEdit={() => openEdit(f)}
              onDelete={() => setDeleteTarget(f)}
            />
          ))}
        </div>
      )}

      {/* Create */}
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

      {/* Edit */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit vault</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_CHOICES.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEditEmoji(em)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-all ${
                      editEmoji === em
                        ? "border-primary bg-primary/15 scale-110"
                        : "border-white/10 bg-muted/30 hover:border-primary/40"
                    }`}
                  >
                    {em}
                  </button>
                ))}
                <Input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value.slice(0, 4))}
                  className="h-9 w-16 text-center text-lg"
                  placeholder="🎉"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={busy || !editName.trim()}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vault?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.name}" and all{" "}
              {deleteTarget?.count ?? 0} saved titles inside it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Delete vault"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function FolderCard({
  folder,
  onEdit,
  onDelete,
}: {
  folder: CollectionWithPreview;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const posters = folder.posters.slice(0, 3);
  while (posters.length < 3) posters.push(null);

  return (
    <div className="group relative">
      {/* Action menu */}
      <div className="absolute right-1 top-1 z-20 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md hover:bg-primary hover:text-primary-foreground"
              aria-label="Vault options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative aspect-[3/4] cursor-pointer">
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
