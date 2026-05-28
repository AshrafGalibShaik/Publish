"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Draft, Content, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { generateContentEmbedding } from "@/lib/embeddings";
import {
  Save,
  Send,
  Sparkles,
  Loader2,
  FileText,
  ListPlus,
  Check,
  Copy,
} from "lucide-react";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

interface ContentEditorProps {
  draft?: Draft;
  content?: Content;
  onSave?: (draft: Draft) => void;
  onPublish?: (content: Content) => void;
}

export function ContentEditor({ draft, content, onSave, onPublish }: ContentEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(draft?.title || content?.title || "");
  const [description, setDescription] = useState(content?.description || "");
  const [topic, setTopic] = useState(draft?.topic || content?.topic || "");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiCopied, setAiCopied] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: draft?.content_html || content?.content_html || "",
  });

  const saveDraft = useCallback(
    async (isDraft: boolean = true) => {
      if (!title) return;
      setSaving(true);
      try {
        const contentHtml = editor?.getHTML() || "";
        const contentText = editor?.getText() || "";

        if (draft?.id) {
          const { error } = await supabase
            .from("drafts")
            .update({ title, content_html: contentHtml, content_text: contentText, topic, last_saved_at: new Date().toISOString() })
            .eq("id", draft.id);
          if (error) throw error;
          toast.success("Draft saved");
          onSave?.({ ...draft, title, content_html: contentHtml, content_text: contentText, topic, last_saved_at: new Date().toISOString() });
        } else {
          const activeUserId = user?.id || DEV_USER_ID;
          const { data: newDraft, error } = await supabase
            .from("drafts")
            .insert([{ user_id: activeUserId, title, content_html: contentHtml, content_text: contentText, topic, content_id: content?.id }])
            .select().single();
          if (error) throw error;
          toast.success("Draft created");
          onSave?.(newDraft);
        }
      } catch (error: any) {
        console.error("[v0] Error saving draft:", error);
        toast.error(`Failed to save: ${error.message || JSON.stringify(error)}`);
      } finally {
        setSaving(false);
      }
    },
    [editor, title, topic, draft, content?.id, onSave, user]
  );

  useEffect(() => {
    const interval = setInterval(() => { if (title) saveDraft(true); }, 10000);
    return () => clearInterval(interval);
  }, [saveDraft, title]);

  const handlePublish = async () => {
    if (!title) { toast.error("Please enter a title"); return; }
    const contentHtml = editor?.getHTML() || "";
    const contentText = editor?.getText() || "";
    if (!contentText.trim()) { toast.error("Please add some content"); return; }

    setPublishing(true);
    try {
      const activeUserId = user?.id || DEV_USER_ID;
      const publishData = {
        user_id: activeUserId, title,
        slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
        description, content_html: contentHtml, content_text: contentText, topic,
        status: "published", published_at: new Date().toISOString(),
      };

      if (content?.id) {
        const { error } = await supabase.from("content").update(publishData).eq("id", content.id);
        if (error) throw error;
        const { data: versions } = await supabase.from("content_versions").select("version_number").eq("content_id", content.id).order("version_number", { ascending: false }).limit(1);
        const nextVersion = ((versions?.[0]?.version_number || 0) + 1) as number;
        await supabase.from("content_versions").insert([{ content_id: content.id, version_number: nextVersion, title, content_html: contentHtml, content_text: contentText, changed_by: activeUserId, change_summary: "Updated version" }]);
        generateContentEmbedding(content.id, `${title} ${description || ""} ${contentText}`);
        toast.success("Published successfully");
      } else {
        const { data: newContent, error } = await supabase.from("content").insert([publishData]).select().single();
        if (error) throw error;
        await supabase.from("content_versions").insert([{ content_id: newContent.id, version_number: 1, title, content_html: contentHtml, content_text: contentText, changed_by: activeUserId, change_summary: "Initial version" }]);
        generateContentEmbedding(newContent.id, `${title} ${description || ""} ${contentText}`);
        if (draft?.id) await supabase.from("drafts").delete().eq("id", draft.id);
        toast.success("Published successfully");
        onPublish?.(newContent);
      }
    } catch (error: any) {
      console.error("[v0] Error publishing:", error);
      toast.error(`Failed to publish: ${error.message || JSON.stringify(error)}`);
    } finally {
      setPublishing(false);
    }
  };

  const callGroqAI = async (type: "description" | "outline" | "enhance" | "tags", customPrompt?: string) => {
    const editorText = editor?.getText() || "";
    const promptToSend = customPrompt || editorText;
    if (!promptToSend.trim() && type !== "outline") { toast.error("Add some text first."); return; }

    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend, type }),
      });
      if (!response.ok) throw new Error("AI request failed.");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const result = data.suggestion || "";
      setAiResult(result);
      if (type === "description") { setDescription(result); toast.success("Description generated"); }
      else if (type === "tags") { setTopic(result); toast.success("Tags generated"); }
      else toast.success("Suggestion generated");
    } catch (error: any) {
      toast.error(error?.message || "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResult);
    setAiCopied(true);
    toast.success("Copied!");
    setTimeout(() => setAiCopied(false), 2000);
  };

  const insertIntoEditor = () => {
    if (editor && aiResult) {
      editor.commands.insertContent(aiResult.replace(/\n/g, "<br />"));
      toast.success("Inserted into editor");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Editor ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Fields */}
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Title</label>
            <Input placeholder="Article title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground">Description</label>
              <button type="button" onClick={() => callGroqAI("description")}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Sparkles className="h-3 w-3" /> Auto-generate
              </button>
            </div>
            <Textarea placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="bg-white border-border text-foreground placeholder:text-muted-foreground/50 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground">Topics</label>
              <button type="button" onClick={() => callGroqAI("tags")}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Sparkles className="h-3 w-3" /> Auto-generate
              </button>
            </div>
            <Input placeholder="e.g. Technology, AI" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50" />
          </div>
        </div>

        {/* Editor */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Editor</span>
            <span className="text-[11px] text-muted-foreground">Auto-save every 10s</span>
          </div>
          <div className="p-5 sm:p-6 min-h-[380px]">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => saveDraft(true)} disabled={saving || !title} variant="outline" className="text-sm gap-1.5 h-9">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Button onClick={handlePublish} disabled={publishing || !title} className="text-sm gap-1.5 h-9">
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* ── AI Sidebar ── */}
      <div className="lg:col-span-1">
        <div className="border border-border rounded-lg p-5 sm:p-6 sticky top-20 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <Sparkles className="h-4 w-4 text-foreground" />
            <div>
              <h2 className="font-medium text-foreground text-sm">AI Assistant</h2>
              <p className="text-[11px] text-muted-foreground">Groq · Qwen 2.5 32B</p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-foreground block mb-1.5">Prompt</label>
            <Textarea
              placeholder="Ask AI to outline, enhance, or generate..."
              value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={3}
              className="bg-white border-border text-foreground placeholder:text-muted-foreground/50 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => callGroqAI("outline", aiPrompt)} disabled={aiLoading || !aiPrompt.trim()}
              className="text-xs h-7 gap-1">
              <ListPlus className="h-3 w-3" /> Outline
            </Button>
            <Button variant="outline" size="sm" onClick={() => callGroqAI("enhance", aiPrompt)} disabled={aiLoading || !aiPrompt.trim()}
              className="text-xs h-7 gap-1">
              <Sparkles className="h-3 w-3" /> Enhance
            </Button>
          </div>

          {aiLoading && (
            <div className="py-8 text-center border border-dashed border-border rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-foreground mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground">Generating...</p>
            </div>
          )}

          {aiResult && !aiLoading && (
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-foreground block">Result</label>
              <div className="p-3 border border-border rounded-lg bg-secondary/30 max-h-56 overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {aiResult}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1 text-xs h-7 gap-1">
                  {aiCopied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </Button>
                <Button size="sm" onClick={insertIntoEditor} className="flex-1 text-xs h-7 gap-1">
                  <FileText className="h-3 w-3" /> Insert
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
