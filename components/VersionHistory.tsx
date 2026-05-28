"use client";

import { useEffect, useState } from "react";
import { ContentVersion, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2, Clock, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface VersionHistoryProps {
  contentId: string;
  onRestore?: (version: ContentVersion) => void;
}

export function VersionHistory({ contentId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => { loadVersions(); }, [contentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("content_versions").select("*").eq("content_id", contentId).order("version_number", { ascending: false });
      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("[v0] Error loading versions:", error);
      toast.error("Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: ContentVersion) => {
    if (!confirm("Restore this version? A new version will be created.")) return;
    setRestoring(version.id);
    try {
      const nextVersion = Math.max(...versions.map(v => v.version_number)) + 1;
      const { error } = await supabase.from("content_versions").insert([{
        content_id: contentId, version_number: nextVersion, title: version.title,
        content_html: version.content_html, content_text: version.content_text,
        change_summary: `Restored from v${version.version_number}`,
      }]);
      if (error) throw error;
      await supabase.from("content").update({ title: version.title, content_html: version.content_html, content_text: version.content_text }).eq("id", contentId);
      toast.success("Version restored");
      loadVersions();
      onRestore?.(version);
    } catch (error) {
      console.error("[v0] Error restoring:", error);
      toast.error("Failed to restore");
    } finally {
      setRestoring(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-foreground" /></div>;

  if (versions.length === 0) {
    return (
      <div className="border border-border rounded-lg p-10 text-center">
        <GitBranch className="h-6 w-6 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-foreground">No version history</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-4">{versions.length} version{versions.length !== 1 ? "s" : ""}</p>

      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {versions.map((version, index) => (
          <div key={version.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-secondary/30 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">v{version.version_number}</span>
                {index === 0 && (
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">{version.title}</p>
              <p className="text-xs text-muted-foreground">{version.change_summary || "—"}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
              </div>
            </div>

            {index !== 0 && (
              <Button size="sm" variant="outline" onClick={() => handleRestore(version)} disabled={restoring === version.id}
                className="text-xs h-7 gap-1 shrink-0 text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" />
                {restoring === version.id ? "Restoring..." : "Restore"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
