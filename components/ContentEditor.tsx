"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Draft, Content, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { generateContentEmbedding } from "@/lib/embeddings";
import { 
  AlertCircle, 
  Save, 
  Send, 
  Sparkles, 
  Loader2, 
  FileText, 
  ListPlus, 
  Check, 
  Copy,
  Terminal,
  Activity,
  Cpu,
  Database,
  ArrowUpRight
} from "lucide-react";

// Fallback user ID for development (no auth)
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

interface ContentEditorProps {
  draft?: Draft;
  content?: Content;
  onSave?: (draft: Draft) => void;
  onPublish?: (content: Content) => void;
}

export function ContentEditor({
  draft,
  content,
  onSave,
  onPublish,
}: ContentEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(draft?.title || content?.title || "");
  const [description, setDescription] = useState(content?.description || "");
  const [topic, setTopic] = useState(draft?.topic || content?.topic || "");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // AI Assistant Panel States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiCopied, setAiCopied] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: draft?.content_html || content?.content_html || "",
  });

  // Auto-save draft
  const saveDraft = useCallback(
    async (isDraft: boolean = true) => {
      if (!title) return;

      setSaving(true);
      try {
        const contentHtml = editor?.getHTML() || "";
        const contentText = editor?.getText() || "";

        if (draft?.id) {
          // Update existing draft
          const { error } = await supabase
            .from("drafts")
            .update({
              title,
              content_html: contentHtml,
              content_text: contentText,
              topic,
              last_saved_at: new Date().toISOString(),
            })
            .eq("id", draft.id);

          if (error) throw error;

          toast.success("Draft saved successfully");
          onSave?.({
            ...draft,
            title,
            content_html: contentHtml,
            content_text: contentText,
            topic,
            last_saved_at: new Date().toISOString(),
          });
        } else {
          // Create new draft
          const activeUserId = user?.id || DEV_USER_ID;
          const { data: newDraft, error } = await supabase
            .from("drafts")
            .insert([
              {
                user_id: activeUserId,
                title,
                content_html: contentHtml,
                content_text: contentText,
                topic,
                content_id: content?.id,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          toast.success("Draft created successfully");
          onSave?.(newDraft);
        }
      } catch (error: any) {
        console.error("[v0] Error saving draft:", error);
        toast.error(`Failed to save draft: ${error.message || JSON.stringify(error)}`);
      } finally {
        setSaving(false);
      }
    },
    [editor, title, topic, draft, content?.id, onSave, user]
  );

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (title) {
        saveDraft(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [saveDraft, title]);

  const handlePublish = async () => {
    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    const contentHtml = editor?.getHTML() || "";
    const contentText = editor?.getText() || "";

    if (!contentText.trim()) {
      toast.error("Please add some content before publishing");
      return;
    }

    setPublishing(true);
    try {
      const activeUserId = user?.id || DEV_USER_ID;
      const publishData = {
        user_id: activeUserId,
        title,
        slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
        description,
        content_html: contentHtml,
        content_text: contentText,
        topic,
        status: "published",
        published_at: new Date().toISOString(),
      };

      if (content?.id) {
        // Update existing content
        const { error } = await supabase
          .from("content")
          .update(publishData)
          .eq("id", content.id);

        if (error) throw error;

        // Create version entry
        const { data: versions } = await supabase
          .from("content_versions")
          .select("version_number")
          .eq("content_id", content.id)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = ((versions?.[0]?.version_number || 0) + 1) as number;

        await supabase.from("content_versions").insert([
          {
            content_id: content.id,
            version_number: nextVersion,
            title,
            content_html: contentHtml,
            content_text: contentText,
            changed_by: activeUserId,
            change_summary: "Updated version",
          },
        ]);

        // Generate vector embedding in background/parallel to keep publish flow fast
        generateContentEmbedding(content.id, `${title} ${description || ""} ${contentText}`);

        toast.success("Content published successfully");
      } else {
        // Create new content
        const { data: newContent, error } = await supabase
          .from("content")
          .insert([publishData])
          .select()
          .single();

        if (error) throw error;

        // Create initial version
        await supabase.from("content_versions").insert([
          {
            content_id: newContent.id,
            version_number: 1,
            title,
            content_html: contentHtml,
            content_text: contentText,
            changed_by: activeUserId,
            change_summary: "Initial version",
          },
        ]);

        // Generate vector embedding in background/parallel
        generateContentEmbedding(newContent.id, `${title} ${description || ""} ${contentText}`);

        // Delete associated draft
        if (draft?.id) {
          await supabase.from("drafts").delete().eq("id", draft.id);
        }

        toast.success("Content published successfully");
        onPublish?.(newContent);
      }
    } catch (error: any) {
      console.error("[v0] Error publishing content:", error);
      toast.error(`Failed to publish content: ${error.message || JSON.stringify(error)}`);
    } finally {
      setPublishing(false);
    }
  };

  // call Groq AI suggestion API
  const callGroqAI = async (type: "description" | "outline" | "enhance" | "tags", customPrompt?: string) => {
    const editorText = editor?.getText() || "";
    const promptToSend = customPrompt || editorText;

    if (!promptToSend.trim() && type !== "outline") {
      toast.error("Please add some text in the editor first so the AI has context.");
      return;
    }

    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("AI Request failed. Please check your Groq API key.");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const result = data.suggestion || "";
      setAiResult(result);

      if (type === "description") {
        setDescription(result);
        toast.success("AI description generated and applied!");
      } else if (type === "tags") {
        setTopic(result);
        toast.success("AI topics/tags generated and applied!");
      } else {
        toast.success("AI suggestion generated!");
      }
    } catch (error: any) {
      console.error("[Groq UI Error]:", error);
      toast.error(error?.message || "Failed to contact Groq API");
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResult);
    setAiCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setAiCopied(false), 2000);
  };

  const insertIntoEditor = () => {
    if (editor && aiResult) {
      editor.commands.insertContent(aiResult.replace(/\n/g, "<br />"));
      toast.success("Inserted into editor!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
      {/* Editor & Input Fields */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6 bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-[0.01]" />
          
          <div className="space-y-5">
            <div>
              <label className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                DOCUMENT TITLE
              </label>
              <Input
                placeholder="Initialize document title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 bg-background border-border text-white placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20 h-10 uppercase tracking-wide"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                  DOCUMENT SUMMARY / DESCRIPTION
                </label>
                <button
                  type="button"
                  onClick={() => callGroqAI("description")}
                  className="text-[10px] font-mono text-primary hover:text-primary-foreground border border-primary/30 hover:border-primary rounded px-2 py-0.5 bg-primary/5 flex items-center gap-1.5 transition-all duration-300"
                >
                  <Sparkles className="h-3 w-3" /> COGNITIVE COMPASS
                </button>
              </div>
              <Textarea
                placeholder="Outline a brief summary or trigger auto-generator..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-2 bg-background border-border text-white placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20 text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                  TOPICS & CATEGORIZATION KEYWORDS
                </label>
                <button
                  type="button"
                  onClick={() => callGroqAI("tags")}
                  className="text-[10px] font-mono text-primary hover:text-primary-foreground border border-primary/30 hover:border-primary rounded px-2 py-0.5 bg-primary/5 flex items-center gap-1.5 transition-all duration-300"
                >
                  <Sparkles className="h-3 w-3" /> CATEGORIZE AI
                </button>
              </div>
              <Input
                placeholder="e.g. Technology, Vector Databases, Cloud-Native Systems"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 bg-background border-border text-white placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20 h-10"
              />
            </div>
          </div>
        </Card>

        {/* Rich-Text Workspace Pane */}
        <Card className="p-6 bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden flex flex-col gap-4">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-[0.01]" />
          
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>/dev/workspace/tiptap-node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AUTOSAVE ACTIVE (10S POLLING)</span>
            </div>
          </div>

          <div className="border border-border rounded bg-background p-4 min-h-[380px] focus-within:border-primary/30 transition-colors duration-300">
            <EditorContent editor={editor} className="text-white placeholder:text-muted-foreground prose prose-invert max-w-none" />
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex gap-4 font-mono">
          <Button
            onClick={() => saveDraft(true)}
            disabled={saving || !title}
            variant="outline"
            className="h-10 text-xs border-border bg-white/5 hover:bg-white/10 text-white font-mono uppercase tracking-wider flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                CACHING...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                CACHE DRAFT
              </>
            )}
          </Button>

          <Button
            onClick={handlePublish}
            disabled={publishing || !title}
            className="h-10 text-xs bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase tracking-wider flex-1 glow-hover shadow-[0_0_15px_oklch(0.65_0.22_255/0.15)]"
          >
            {publishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                PUBLISHING...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                PUBLISH NODE
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Groq AI Assistant Sidebar */}
      <div className="lg:col-span-1">
        <Card className="p-6 bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden sticky top-24">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-[0.02]" />

          <div className="flex items-center gap-3 pb-4 border-b border-border/40 mb-5">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded text-primary shadow-[0_0_10px_oklch(0.65_0.22_255/0.1)]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-white font-mono uppercase tracking-wider text-sm">AI Copilot</h2>
              <p className="text-[9px] text-muted-foreground font-mono uppercase">Model: Qwen 2.5 32B (Groq)</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">
                COGNITIVE PROMPT INTERFACE
              </label>
              <Textarea
                placeholder='e.g., "Outline key concepts regarding distributed microservices" or paste text here to enhance it.'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="bg-background border-border text-white placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <Button
                variant="outline"
                size="sm"
                onClick={() => callGroqAI("outline", aiPrompt)}
                disabled={aiLoading || !aiPrompt.trim()}
                className="h-8 text-[10px] border-border bg-white/5 hover:bg-white/10 text-white uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <ListPlus className="h-3 w-3" /> Outline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => callGroqAI("enhance", aiPrompt)}
                disabled={aiLoading || !aiPrompt.trim()}
                className="h-8 text-[10px] border-border bg-white/5 hover:bg-white/10 text-white uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> Enhance
              </Button>
            </div>

            {aiLoading && (
              <div className="py-8 text-center border border-dashed rounded border-border/80 bg-white/[0.01] flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Awaiting response from core AI...</p>
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">
                  AI SUGGESTION REPORT
                </label>
                <div className="p-3 border border-border rounded bg-background max-h-60 overflow-y-auto text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {aiResult}
                </div>
                <div className="flex gap-2 font-mono">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1 h-8 text-[10px] border-border bg-white/5 hover:bg-white/10 text-white uppercase tracking-wider"
                  >
                    {aiCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={insertIntoEditor}
                    className="flex-1 h-8 text-[10px] bg-primary hover:bg-primary/95 text-primary-foreground uppercase tracking-wider glow-hover"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" /> Insert
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
