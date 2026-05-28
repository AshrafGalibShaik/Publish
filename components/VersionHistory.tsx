"use client";

import { useEffect, useState } from "react";
import { ContentVersion, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RotateCcw } from "lucide-react";
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
    return <div className="text-center py-8 text-gray-500">Loading versions...</div>;
  }

  if (versions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">No version history yet</div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <p className="text-sm text-blue-600">
          Version history allows you to restore previous versions of your content
        </p>
      </div>

      {versions.map((version, index) => (
        <Card key={version.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">
                  Version {version.version_number}
                </h4>
                {index === 0 && (
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{version.title}</p>
              <p className="text-xs text-gray-500 mt-2">
                {version.change_summary}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(version.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {index !== 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(version)}
                disabled={restoring === version.id}
                className="gap-1 whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                {restoring === version.id ? "Restoring..." : "Restore"}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
