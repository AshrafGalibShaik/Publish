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
  Copy 
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
      toast.error("Please enter a title before publishing");
      return;
    }

    setPublishing(true);
    try {
      const contentHtml = editor?.getHTML() || "";
      const contentText = editor?.getText() || "";
      const slug = title.toLowerCase().replace(/\s+/g, "-");

      const activeUserId = user?.id || DEV_USER_ID;
      const publishData = {
        user_id: activeUserId,
        title,
        slug: `${slug}-${Date.now()}`,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Editor & Input Fields */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter article title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Description</label>
                <button
                  type="button"
                  onClick={() => callGroqAI("description")}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3" /> Auto-generate
                </button>
              </div>
              <Textarea
                placeholder="Brief description of your content (or click auto-generate)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Topic / Keywords</label>
                <button
                  type="button"
                  onClick={() => callGroqAI("tags")}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3" /> Auto-generate
                </button>
              </div>
              <Input
                placeholder="e.g., Technology, AI, Cloud Computing"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <p className="text-sm text-gray-600">Auto-saving every 10 seconds</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none border rounded-lg border-gray-200 min-h-96 p-4 bg-white">
            <EditorContent editor={editor} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => saveDraft(true)}
            disabled={saving || !title}
            variant="outline"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>

          <Button
            onClick={handlePublish}
            disabled={publishing || !title}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Groq AI Assistant Sidebar */}
      <div className="lg:col-span-1">
        <Card className="p-6 border-blue-100 bg-gradient-to-b from-blue-50/50 via-white to-white sticky top-24 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Groq Assistant</h2>
              <p className="text-xs text-gray-500">Powered by Qwen 2.5 32B</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ask AI / Custom Prompt
              </label>
              <Textarea
                placeholder='e.g., "Write an outline for an article about remote work" or paste text here to enhance it.'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => callGroqAI("outline", aiPrompt)}
                disabled={aiLoading || !aiPrompt.trim()}
                className="gap-1 text-xs"
              >
                <ListPlus className="h-3 w-3" /> Outline Topic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => callGroqAI("enhance", aiPrompt)}
                disabled={aiLoading || !aiPrompt.trim()}
                className="gap-1 text-xs"
              >
                <Sparkles className="h-3 w-3" /> Enhance Text
              </Button>
            </div>

            {aiLoading && (
              <div className="p-8 text-center border border-dashed rounded-lg border-gray-200 bg-white">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs text-gray-500">Groq is thinking...</p>
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                  AI Result
                </label>
                <div className="p-3 border rounded-lg bg-gray-50 max-h-60 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {aiResult}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1 gap-1 text-xs"
                  >
                    {aiCopied ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={insertIntoEditor}
                    className="flex-1 gap-1 text-xs"
                  >
                    <FileText className="h-3 w-3" /> Insert
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
