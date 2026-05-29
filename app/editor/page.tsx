"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContentEditor } from "@/components/ContentEditor";
import { VersionHistory } from "@/components/VersionHistory";
import { Draft, Content, getClientSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, PenLine, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function EditorComponent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const contentId = searchParams.get("content");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(!!draftId || !!contentId);

  useEffect(() => { loadData(); }, [draftId, contentId]);

  const loadData = async () => {
    if (!draftId && !contentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const sb = getClientSupabase();
      if (!sb) return;
      if (draftId) {
        const { data, error } = await sb.from("drafts").select("*").eq("id", draftId).single();
        if (error) throw error;
        setDraft(data);
      }
      if (contentId) {
        const { data, error } = await sb.from("content").select("*").eq("id", contentId).single();
        if (error) throw error;
        setContent(data);
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="header-glass sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <PenLine className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="font-serif text-lg text-foreground">
              {content ? "Edit article" : "New article"}
            </h1>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10 animate-fade-in">
        {content ? (
          <Tabs defaultValue="editor" className="space-y-8">
            <TabsList className="bg-secondary/50 border border-border p-0.5 rounded-lg w-full max-w-[260px] grid grid-cols-2 h-10">
              <TabsTrigger value="editor" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md gap-1.5 transition-all">
                <PenLine className="h-3.5 w-3.5" /> Editor
              </TabsTrigger>
              <TabsTrigger value="versions" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md gap-1.5 transition-all">
                <GitBranch className="h-3.5 w-3.5" /> Versions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="animate-fade-in">
              <ContentEditor content={content} onPublish={(c) => setContent(c)} />
            </TabsContent>
            <TabsContent value="versions" className="animate-fade-in">
              <VersionHistory contentId={content.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <ContentEditor
            draft={draft || undefined}
            onSave={(d) => setDraft(d)}
            onPublish={(c) => setContent(c)}
          />
        )}
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-5 w-5 animate-spin text-foreground" /></div>}>
      <EditorComponent />
    </Suspense>
  );
}
