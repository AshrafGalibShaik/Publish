"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContentEditor } from "@/components/ContentEditor";
import { VersionHistory } from "@/components/VersionHistory";
import { Draft, Content, getClientSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function EditorComponent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const contentId = searchParams.get("content");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(!!draftId || !!contentId);

  useEffect(() => {
    loadData();
  }, [draftId, contentId]);

  const loadData = async () => {
    if (!draftId && !contentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabaseClient = getClientSupabase();
      if (!supabaseClient) return;

      if (draftId) {
        const { data, error } = await supabaseClient
          .from("drafts")
          .select("*")
          .eq("id", draftId)
          .single();

        if (error) throw error;
        setDraft(data);
      }

      if (contentId) {
        const { data, error } = await supabaseClient
          .from("content")
          .select("*")
          .eq("id", contentId)
          .single();

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {content ? "Edit Article" : "Write Article"}
            </h1>
            <div className="w-40" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content ? (
          <Tabs defaultValue="editor" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="versions">Version History</TabsTrigger>
            </TabsList>

            <TabsContent value="editor">
              <ContentEditor
                content={content}
                onPublish={(updatedContent) => setContent(updatedContent)}
              />
            </TabsContent>

            <TabsContent value="versions">
              <VersionHistory contentId={content.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <ContentEditor
              draft={draft || undefined}
              onSave={(savedDraft) => setDraft(savedDraft)}
              onPublish={(publishedContent) => setContent(publishedContent)}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <EditorComponent />
    </Suspense>
  );
}
