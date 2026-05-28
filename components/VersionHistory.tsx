"use client";

import { useEffect, useState } from "react";
import { ContentVersion, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RotateCcw, GitBranch, Cpu, Terminal, Clock } from "lucide-react";
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

  useEffect(() => {
    loadVersions();
  }, [contentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_versions")
        .select("*")
        .eq("content_id", contentId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("[v0] Error loading versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: ContentVersion) => {
    if (!confirm("Restore this version? This will create a new version with the restored content.")) return;

    setRestoring(version.id);
    try {
      // Create a new version with the restored content
      const nextVersion = Math.max(...versions.map(v => v.version_number)) + 1;

      const { error } = await supabase
        .from("content_versions")
        .insert([
          {
            content_id: contentId,
            version_number: nextVersion,
            title: version.title,
            content_html: version.content_html,
            content_text: version.content_text,
            change_summary: `Restored from version ${version.version_number}`,
          },
        ]);

      if (error) throw error;

      // Update the main content
      await supabase
        .from("content")
        .update({
          title: version.title,
          content_html: version.content_html,
          content_text: version.content_text,
        })
        .eq("id", contentId);

      toast.success("Version restored successfully");
      loadVersions();
      onRestore?.(version);
    } catch (error) {
      console.error("[v0] Error restoring version:", error);
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground font-mono text-xs uppercase tracking-widest gap-2">
        <Cpu className="h-5 w-5 animate-spin text-primary" />
        <span>Scanning Registry Nodes...</span>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden">
        <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          No revision nodes logged
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Information Header Block */}
      <Card className="p-4 bg-primary/5 border border-primary/20 rounded relative overflow-hidden flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
        <div className="space-y-1 font-mono text-xs">
          <p className="text-white font-bold uppercase tracking-wider">VERSION CONTROL PROTOCOL ACTIVE</p>
          <p className="text-muted-foreground leading-relaxed">
            Every publish event spawns a static snapshot node. Selecting restore will instantiate a new sequential snapshot branch based on selected coordinates.
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest px-1">
        <span>SNAPSHOT LOG NODES</span>
        <span>SNAPSHOTS DETECTED: {versions.length}</span>
      </div>

      {versions.map((version, index) => (
        <Card 
          key={version.id} 
          className="p-5 bg-white/[0.01] hover:bg-white/[0.02] border-border hover:border-primary/20 transition-all duration-300 Palantir-shadow group glow-hover rounded overflow-hidden"
        >
          <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-mono text-white font-bold uppercase tracking-wider">
                  SNAPSHOT v{version.version_number}
                </span>
                {index === 0 ? (
                  <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-500/5 uppercase tracking-widest">
                    ACTIVE HEAD
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-secondary uppercase tracking-widest">
                    ARCHIVED
                  </span>
                )}
              </div>
              
              <div>
                <p className="text-sm font-semibold text-white tracking-wide">{version.title}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-mono bg-background/40 border border-border/40 px-2 py-1 rounded inline-block">
                  Log: {version.change_summary || "Manual snapshot update"}
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="uppercase">
                  RECORDED {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {index !== 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(version)}
                disabled={restoring === version.id}
                className="h-8 text-xs border-border bg-white/5 hover:bg-white/10 text-white font-mono uppercase tracking-wider self-end sm:self-start"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {restoring === version.id ? "Restoring..." : "Restore Snapshot"}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
