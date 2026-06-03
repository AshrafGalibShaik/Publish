"use client";

import { useEffect, useState } from "react";
import { Content, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Share2, Cpu, Terminal, FileText, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface EnrichedContent extends Content {
  author?: {
    id: string;
    name?: string;
    email: string;
  } | null;
}

interface PublishedContentProps {
  slug: string;
}

export function PublishedContent({ slug }: PublishedContentProps) {
  const [content, setContent] = useState<EnrichedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select(`
          *,
          author:users (
            id,
            name,
            email
          )
        `)
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

  const wordCount = content.content_text ? content.content_text.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 225));

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 relative z-10 space-y-6">
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase border-b border-border pb-3">
        <Link href="/dashboard">
          <Button variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground px-2 gap-1.5 transition-colors uppercase cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
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

        <h1 className="text-3xl sm:text-5xl font-serif tracking-tight text-foreground font-medium leading-tight">
          {content.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] text-muted-foreground border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-foreground" />
            <span className="uppercase">
              AUTHOR: {content.author?.name || content.author?.email?.split("@")[0] || "System"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-foreground" />
            <span className="uppercase">
              PUBLISHED {formatDistanceToNow(new Date(content.published_at!), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground" />
            <span className="uppercase">
              {readingTime} MIN READ
            </span>
          </div>
        </div>

        {content.description && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-mono border-l-2 border-border pl-4 py-1 italic">
            {content.description}
          </p>
        )}
      </div>

      {/* Responsive White Card Container with Crisp Black Text */}
      <Card className="p-5 sm:p-8 bg-white border border-border rounded-xl relative overflow-hidden shadow-sm hover-premium-card">
        <div
          className="prose max-w-none text-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap font-sans"
          dangerouslySetInnerHTML={{ __html: content.content_html }}
        />
      </Card>

      <div className="flex gap-4 font-mono">
        <Button
          onClick={handleShare}
          variant="outline"
          className="h-9 text-xs border border-border bg-white hover:bg-secondary text-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:translate-y-[-1px]"
        >
          <Share2 className="h-4 w-4" />
          Share Coordinates
        </Button>
      </div>

      {/* Cryptographic Ledger Node Data */}
      <div className="p-4 bg-secondary/15 border border-border rounded-xl font-mono text-[9px] sm:text-[10px] text-muted-foreground space-y-1.5">
        <div className="text-foreground font-semibold flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Cpu className="h-3.5 w-3.5" /> Ledger Verification Metadata
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
          <div><span className="text-foreground/75">Node ID:</span> {content.id}</div>
          <div><span className="text-foreground/75">Topic Domain:</span> {content.topic || "N/A"}</div>
          <div><span className="text-foreground/75">Signature:</span> verified_sha256_{content.id.substring(0, 12)}</div>
          <div><span className="text-foreground/75">Sync Status:</span> Network Ledger Decoupled</div>
        </div>
      </div>
    </div>
  );
}
