"use client";

import { useEffect, useState } from "react";
import { Draft, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Clock, Loader2, FileText, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

interface DraftListProps {
  onSelectDraft?: (draft: Draft) => void;
  refreshTrigger?: number;
}

export function DraftList({ onSelectDraft, refreshTrigger }: DraftListProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { loadDrafts(); }, [refreshTrigger, user]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const activeUserId = user?.id || DEV_USER_ID;
      const { data, error } = await supabase.from("drafts").select("*").eq("user_id", activeUserId).order("updated_at", { ascending: false });
      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("[v0] Error loading drafts:", error);
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      const { error } = await supabase.from("drafts").delete().eq("id", draftId);
      if (error) throw error;
      setDrafts(drafts.filter((d) => d.id !== draftId));
      toast.success("Draft deleted");
    } catch (error) {
      console.error("[v0] Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-foreground" /></div>;
  }

  if (drafts.length === 0) {
    return (
      <div className="border border-border rounded-xl p-12 sm:p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-5">
          <FileText className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-foreground mb-1.5 font-medium">No drafts yet</p>
        <p className="text-xs text-muted-foreground mb-7">Start writing your first article</p>
        <Link href="/editor">
          <Button size="sm" className="text-sm gap-1.5 h-9 btn-shimmer"><Plus className="h-3.5 w-3.5" /> New article</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-4 font-mono">{drafts.length} draft{drafts.length !== 1 ? "s" : ""}</p>

      <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
        {drafts.map((draft) => (
          <div key={draft.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 row-hover-lift">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectDraft?.(draft)}>
              <h3 className="font-medium text-foreground text-sm truncate">
                {draft.title || "Untitled draft"}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">
                {draft.content_text || "No content"}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2 font-mono">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link href={`/editor?draft=${draft.id}`}>
                <Button size="sm" variant="ghost" className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit3 className="h-3 w-3" /> Edit
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(draft.id)} className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
