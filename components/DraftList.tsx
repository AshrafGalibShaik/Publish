"use client";

import { useEffect, useState } from "react";
import { Draft, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Edit2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";

// Fallback user ID for development (no auth)
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
    return <div className="text-center py-8 text-gray-500">Loading drafts...</div>;
  }

  if (drafts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 mb-4">No drafts yet</p>
        <Link href="/editor">
          <Button>Start writing</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft) => (
        <Card
          key={draft.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onSelectDraft?.(draft)}
            >
              <h3 className="font-semibold text-gray-900">
                {draft.title || "Untitled Draft"}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {draft.content_text || "No content"}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(draft.last_saved_at), {
                  addSuffix: true,
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/editor?draft=${draft.id}`}>
                <Button size="sm" variant="outline" className="gap-1">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(draft.id)}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
