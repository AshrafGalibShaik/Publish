"use client";

import { useEffect, useState } from "react";
import { Content, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Share2, Cpu, Terminal, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface PublishedContentProps {
  slug: string;
}

export function PublishedContent({ slug }: PublishedContentProps) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error("[v0] Error loading content:", error);
      toast.error("Content not found");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest gap-2">
        <Cpu className="h-5 w-5 animate-spin text-foreground" />
        <span>Syncing Content Snapshot...</span>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 relative z-10">
        <Card className="p-8 text-center bg-white border-border rounded relative overflow-hidden">
          <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-4">
            Snapshot record not found in system logs
          </p>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="h-8 text-xs border-border bg-white hover:bg-secondary text-foreground font-mono uppercase tracking-wider">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> RETURN TO WORKSPACE
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 relative z-10 space-y-6">
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase border-b border-border pb-3">
        <Link href="/dashboard">
          <Button variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground px-2 gap-1.5 transition-colors uppercase">
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspace
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>PUBLICATION SECURE</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-secondary uppercase">
            DOC_ID: {content.id.slice(0, 8)}
          </span>
          {content.topic && (
            <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-secondary uppercase tracking-wider">
              {content.topic}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3.5xl font-serif tracking-tight text-foreground font-medium leading-tight">
          {content.title}
        </h1>

        <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-foreground" />
          <span className="uppercase">
            PUBLISHED {formatDistanceToNow(new Date(content.published_at!), { addSuffix: true })}
          </span>
        </div>

        {content.description && (
          <p className="text-sm text-muted-foreground leading-relaxed font-mono border-l-2 border-border pl-4 py-1 italic">
            {content.description}
          </p>
        )}
      </div>

      {/* Responsive White Card Container with Crisp Black Text */}
      <Card className="p-5 sm:p-8 bg-white border border-border rounded-lg relative overflow-hidden">
        <div
          className="prose max-w-none text-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap font-sans"
          dangerouslySetInnerHTML={{ __html: content.content_html }}
        />
      </Card>

      <div className="flex gap-4 font-mono">
        <Button
          onClick={handleShare}
          variant="outline"
          className="h-9 text-xs border border-border bg-white hover:bg-secondary text-foreground uppercase tracking-wider flex items-center gap-1.5"
        >
          <Share2 className="h-4 w-4" />
          Share Coordinates
        </Button>
      </div>
    </div>
  );
}
