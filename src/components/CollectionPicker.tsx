import { useEffect, useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { TMDBMovie } from "@/lib/tmdb";

interface Collection {
  id: string;
  name: string;
  emoji: string | null;
}

interface Props {
  item: TMDBMovie;
  mediaType: "movie" | "tv";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function CollectionPicker({ item, mediaType, open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("collections")
      .select("id, name, emoji")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCollections(data ?? []);
        setLoading(false);
      });
  }, [open, user]);

  async function addToCollection(collectionId: string) {
    if (!user) return;
    const { error } = await supabase.from("collection_items").insert({
      collection_id: collectionId,
      user_id: user.id,
      tmdb_id: item.id,
      media_type: mediaType,
      title: item.title || item.name || "Untitled",
      poster_path: item.poster_path,
    });
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Added to vault" });
    onSaved?.();
    onOpenChange(false);
  }

  async function createAndAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name: newName.trim().slice(0, 60) })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast({ title: "Could not create folder", variant: "destructive" });
      return;
    }
    setNewName("");
    await addToCollection(data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to a vault</DialogTitle>
        </DialogHeader>

        {!user ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sign in to build your collections.
          </p>
        ) : (
          <>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {loading ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Loading…</p>
              ) : collections.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No folders yet — create one below.</p>
              ) : (
                collections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addToCollection(c.id)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="text-lg">{c.emoji || "📁"}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>

            <form onSubmit={createAndAdd} className="flex gap-2 border-t border-border pt-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New folder name"
                maxLength={60}
              />
              <Button type="submit" disabled={creating || !newName.trim()} size="sm">
                <FolderPlus className="mr-1 h-4 w-4" />
                Create
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
