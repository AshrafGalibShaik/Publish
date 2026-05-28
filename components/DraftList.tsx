"use client";

import { useEffect, useState } from "react";
import { Draft, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Edit3, Clock, Terminal, Cpu, FileText } from "lucide-react";
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

  useEffect(() => {
    loadDrafts();
  }, [refreshTrigger, user]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const activeUserId = user?.id || DEV_USER_ID;
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("user_id", activeUserId)
        .order("updated_at", { ascending: false });

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
      const { error } = await supabase
        .from("drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;

      setDrafts(drafts.filter((d) => d.id !== draftId));
      toast.success("Draft deleted successfully");
    } catch (error) {
      console.error("[v0] Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground font-mono text-xs uppercase tracking-widest gap-2">
        <Cpu className="h-5 w-5 animate-spin text-primary" />
        <span>Polling Draft Registry...</span>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-[0.02]" />
        <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-4">
          No records located in draft cache
        </p>
        <Link href="/editor">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-wider text-xs glow-hover">
            <PlusIcon className="h-3 w-3 mr-1" /> START WRITING
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest px-1">
        <span>ACTIVE DRAFT REGISTRY</span>
        <span>RECORDS FOUND: {drafts.length}</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {drafts.map((draft) => (
          <Card
            key={draft.id}
            className="p-5 bg-white/[0.01] hover:bg-white/[0.02] border-border hover:border-primary/20 transition-all duration-300 Palantir-shadow group glow-hover rounded overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-[9px] font-mono text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5 uppercase">
                  DRAFT_ID: {draft.id.slice(0, 8)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-white tracking-wide text-base uppercase font-sans">
                  {draft.title || "Untitled Draft"}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed max-w-3xl">
                  {draft.content_text || "Empty working document..."}
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="uppercase">
                  UPDATED {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t md:border-t-0 border-border/40 pt-4 md:pt-0">
              <Link href={`/editor?draft=${draft.id}`}>
                <Button size="sm" variant="outline" className="h-8 text-xs border-border bg-white/5 hover:bg-white/10 text-white font-mono uppercase tracking-wider">
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(draft.id)}
                className="h-8 text-xs bg-destructive/10 border border-destructive/20 hover:bg-destructive text-white font-mono uppercase tracking-wider"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
