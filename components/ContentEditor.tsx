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
import ImageExtension from "@tiptap/extension-image";
import {
  Save,
  Send,
  Sparkles,
  Loader2,
  FileText,
  ListPlus,
  Check,
  Copy,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Terminal,
  Image as ImageIcon,
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

  // Puter AI Image Generation States
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState("black-forest-labs/flux-schnell");
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Please enter a prompt for the image");
      return;
    }
    if (typeof window === "undefined") return;

    setImageLoading(true);
    try {
      const { puter } = await import("@heyputer/puter.js");
      const imgElement = await puter.ai.txt2img(imagePrompt, {
        model: selectedImageModel
      });

      if (imgElement && imgElement.src) {
        setGeneratedImageUrl(imgElement.src);
        toast.success("Image generated successfully!");
      } else {
        toast.error("Failed to generate image.");
      }
    } catch (err: any) {
      console.error("Puter Image Gen Error:", err);
      toast.error(err?.message || "Failed to generate image.");
    } finally {
      setImageLoading(false);
    }
  };

  const insertImageIntoEditor = () => {
    if (editor && generatedImageUrl) {
      // @ts-ignore
      editor.chain().focus().setImage({ src: generatedImageUrl }).run();
      toast.success("Image embedded into post");
    }
  };

  const [imagePromptLoading, setImagePromptLoading] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  const autoGenerateBanner = async () => {
    if (!title.trim()) {
      toast.error("Please enter an article title first");
      return;
    }
    setGeneratingBanner(true);
    try {
      const { puter } = await import("@heyputer/puter.js");
      
      // 1. Generate visual banner prompt
      const systemInstruction =
        "You are an expert visual prompt engineer for AI image generation models. Given article title, generate a single vivid, descriptive prompt (1-2 sentences max) that would create a beautiful, relevant cover image for the article. Focus on aesthetic qualities, lighting, composition, and mood. Do NOT include any explanation — just the prompt itself, as plain text.";
      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Generate an cover banner image prompt for: "${title}". Context: Write a high-end, clean, aesthetic cover banner illustration prompt.` }
      ];

      const response = await puter.ai.chat(messages, { model: "gpt-4o-mini" }) as any;
      
      let promptText = "";
      if (typeof response === "string") {
        promptText = response;
      } else if (response && response.message) {
        if (Array.isArray(response.message.content)) {
          promptText = response.message.content[0]?.text || "";
        } else {
          promptText = response.message.content || "";
        }
      }

      promptText = promptText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (promptText.includes("```")) {
        promptText = promptText.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
      }
      
      if (!promptText) {
        promptText = `A beautiful, minimalist, high-end abstract banner illustration for: ${title}`;
      }

      // 2. Call Puter client
      const imgElement = await puter.ai.txt2img(promptText, {
        model: "black-forest-labs/flux-schnell"
      });

      if (imgElement && imgElement.src) {
        if (editor) {
          // Prepend to editor content
          const currentContent = editor.getHTML();
          // Insert banner at the top
          const bannerHtml = `<img src="${imgElement.src}" alt="Auto-generated Banner: ${title}" class="rounded-xl border border-border shadow-sm max-w-full w-full h-64 sm:h-80 object-cover my-4 mx-auto block" data-banner="true" />`;
          editor.commands.setContent(bannerHtml + currentContent);
          toast.success("Article banner auto-generated and inserted at the top!");
        }
      } else {
        toast.error("Failed to generate banner image.");
      }
    } catch (err: any) {
      console.error("Banner Generation Error:", err);
      toast.error(err?.message || "Failed to auto-generate banner.");
    } finally {
      setGeneratingBanner(false);
    }
  };

  const autoGenerateImagePrompt = async () => {
    const editorText = editor?.getText() || "";
    if (!editorText.trim() && !title.trim()) {
      toast.error("Add some article content or title first");
      return;
    }
    setImagePromptLoading(true);
    try {
      const { puter } = await import("@heyputer/puter.js");
      const systemInstruction =
        "You are an expert visual prompt engineer for AI image generation models. Given article content, generate a single vivid, descriptive prompt (1-2 sentences max) that would create a beautiful, relevant cover image for the article. Focus on aesthetic qualities, lighting, composition, and mood. Do NOT include any explanation — just the prompt itself, as plain text.";
      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Generate an image generation prompt for this article:\n\nTitle: ${title}\nContent: ${editorText.substring(0, 500)}` }
      ];

      const response = await puter.ai.chat(messages, { model: "gpt-4o-mini" }) as any;
      
      let suggestion = "";
      if (typeof response === "string") {
        suggestion = response;
      } else if (response && response.message) {
        if (Array.isArray(response.message.content)) {
          suggestion = response.message.content[0]?.text || "";
        } else {
          suggestion = response.message.content || "";
        }
      }

      suggestion = suggestion.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (suggestion.includes("```")) {
        suggestion = suggestion.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
      }

      if (suggestion) {
        setImagePrompt(suggestion.replace(/^["']|["']$/g, '').trim());
        toast.success("Image prompt generated from article!");
      } else {
        toast.error("Failed to generate image prompt");
      }
    } catch (err) {
      toast.error("AI prompt generation failed");
    } finally {
      setImagePromptLoading(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      ImageExtension.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-xl border border-border shadow-sm max-w-full my-4 mx-auto block",
        },
      }),
    ],
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
      let systemInstruction = "You are a professional AI content writing assistant.";
      let userPrompt = promptToSend;

      if (type === "description") {
        systemInstruction =
          "You are an expert SEO and content editor. Write a concise, engaging 1-2 sentence description summarizing the provided article content. Keep it under 160 characters. Do NOT use any HTML or markdown formatting, just plain text.";
        userPrompt = `Generate a description for this article content:\n\n${promptToSend}`;
      } else if (type === "outline") {
        systemInstruction =
          "You are a professional content architect. Create a structured outline with key sections and bullet points for the provided topic. Return the outline ONLY as valid, semantic HTML elements (e.g. <h2> for headings, <p> for paragraphs, <ul> and <li> for list items). Do NOT wrap it in a markdown block, do NOT use triple backticks, and do NOT use raw markdown formatting like asterisks or hashtags. Wrap all content in clean, semantic HTML tags.";
        userPrompt = `Create a detailed outline for an article about: "${promptToSend}"`;
      } else if (type === "enhance") {
        systemInstruction =
          "You are a master editor. Enhance and improve the grammar, style, clarity, and flow of the provided text while keeping its core meaning intact. Return the enhanced content as valid HTML tags (like <p>, <strong>, etc.) so that it can be directly loaded into a rich text editor. Do NOT use markdown code fences, do NOT include triple backticks, and do NOT use markdown formatting characters.";
        userPrompt = `Enhance the following text:\n\n${promptToSend}`;
      } else if (type === "tags") {
        systemInstruction =
          "You are a content tagger. Generate 3-5 relevant, single-word topics or keywords (comma-separated, no bullet points) for the provided text. Do NOT use any markdown or HTML.";
        userPrompt = `Generate 3-5 keywords for this content:\n\n${promptToSend}`;
      }

      const { puter } = await import("@heyputer/puter.js");
      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ];

      const response = await puter.ai.chat(messages, { model: "gpt-4o-mini" }) as any;
      
      let result = "";
      if (typeof response === "string") {
        result = response;
      } else if (response && response.message) {
        if (Array.isArray(response.message.content)) {
          result = response.message.content[0]?.text || "";
        } else {
          result = response.message.content || "";
        }
      }

      result = result.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (result.includes("```")) {
        result = result.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
      }

      setAiResult(result);
      if (type === "description") { setDescription(result); toast.success("Description generated"); }
      else if (type === "tags") { setTopic(result); toast.success("Tags generated"); }
      else toast.success("Suggestion generated");
    } catch (error: any) {
      console.error(error);
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
      let contentToInsert = aiResult;
      
      // Clean thinking blocks or markdown fences if they bypassed API cleaning
      contentToInsert = contentToInsert.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (contentToInsert.includes("```")) {
        contentToInsert = contentToInsert.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
      }

      // Check if it looks like HTML. If it is plain text, replace newlines with br tags
      const isHtml = /<[a-z][\s\S]*>/i.test(contentToInsert);
      if (!isHtml) {
        contentToInsert = contentToInsert.replace(/\n/g, "<br />");
      }
      
      editor.commands.insertContent(contentToInsert);
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground block font-mono uppercase tracking-wider text-[10px]">Title</label>
              <button
                type="button"
                onClick={autoGenerateBanner}
                disabled={generatingBanner || !title.trim()}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer font-mono"
              >
                {generatingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Auto-generate Banner
              </button>
            </div>
            <Input placeholder="Article title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus-visible:ring-0 text-sm font-sans" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground font-mono uppercase tracking-wider text-[10px]">Description</label>
              <button type="button" onClick={() => callGroqAI("description")}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer font-mono">
                <Sparkles className="h-3 w-3" /> Auto-generate
              </button>
            </div>
            <Textarea placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="bg-white border-border text-foreground placeholder:text-muted-foreground/50 text-xs sm:text-sm focus:border-foreground/30 focus-visible:ring-0 leading-relaxed font-sans" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground font-mono uppercase tracking-wider text-[10px]">Topics</label>
              <button type="button" onClick={() => callGroqAI("tags")}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer font-mono">
                <Sparkles className="h-3 w-3" /> Auto-generate
              </button>
            </div>
            <Input placeholder="e.g. Technology, AI" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus-visible:ring-0 text-xs sm:text-sm font-mono" />
          </div>
        </div>

        {/* Editor */}
        <div className="border border-border rounded-lg overflow-hidden bg-white shadow-sm hover-premium-card">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Editor snapshot node</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Auto-save every 10s</span>
          </div>

          {/* Formatting Toolbar */}
          {editor && (
            <div className="flex flex-wrap items-center gap-1 p-2 bg-secondary/15 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("bold") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("italic") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("strike") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Strikethrough"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("code") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Inline Code"
              >
                <Code className="h-3.5 w-3.5" />
              </Button>
              
              <div className="h-4 w-px bg-border mx-1.5" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`h-7 px-1.5 cursor-pointer text-xs font-mono font-bold transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Heading 1"
              >
                H1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`h-7 px-1.5 cursor-pointer text-xs font-mono font-bold transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Heading 2"
              >
                H2
              </Button>
              
              <div className="h-4 w-px bg-border mx-1.5" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("bulletList") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Bullet List"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("orderedList") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Numbered List"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("blockquote") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Blockquote"
              >
                <Quote className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`h-7 w-7 p-0 cursor-pointer transition-colors ${editor.isActive("codeBlock") ? "bg-white border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                title="Code Block"
              >
                <Terminal className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = prompt("Enter image URL:");
                  if (url) {
                    // @ts-ignore
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                }}
                className="h-7 w-7 p-0 cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                type="button"
                title="Insert Image URL"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="p-5 sm:p-6 min-h-[380px]">
            <EditorContent editor={editor} className="outline-none" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => saveDraft(true)} disabled={saving || !title} variant="outline" className="text-xs gap-1.5 h-9 cursor-pointer transition-all duration-200 hover:translate-y-[-1px]">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Button onClick={handlePublish} disabled={publishing || !title} className="text-xs gap-1.5 h-9 btn-shimmer cursor-pointer transition-all duration-200 hover:translate-y-[-1px]">
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* ── AI Sidebar ── */}
      <div className="lg:col-span-1">
        <div className="border border-border rounded-lg p-5 sm:p-6 lg:sticky lg:top-20 space-y-5">
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

          {/* AI Photo Generator section using Puter API */}
          <div className="border-t border-border/80 my-4" />

          <div className="flex items-center gap-2.5 pb-2">
            <ImageIcon className="h-4.5 w-4.5 text-foreground" />
            <div>
              <h2 className="font-medium text-foreground text-sm">AI Image Generator</h2>
              <p className="text-[11px] text-muted-foreground">Puter API · Free Unlimited</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-foreground">Image Prompt</label>
              <button
                type="button"
                onClick={autoGenerateImagePrompt}
                disabled={imagePromptLoading}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer font-mono"
              >
                {imagePromptLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Auto from article
              </button>
            </div>
            <Textarea
              placeholder="E.g., A peaceful mountain landscape at sunset, cinematic lighting, 4k..."
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows={2}
              className="bg-white border-border text-foreground placeholder:text-muted-foreground/50 text-xs font-sans"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-foreground block mb-1.5">AI Image Model</label>
            <select
              value={selectedImageModel}
              onChange={(e) => setSelectedImageModel(e.target.value)}
              className="w-full bg-white border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-foreground/30 font-sans"
            >
              <option value="black-forest-labs/flux-schnell">Flux.1 Schnell (Fast & Crisp)</option>
              <option value="black-forest-labs/flux-1.1-pro">Flux 1.1 Pro (Ultra Quality)</option>
              <option value="stabilityai/stable-diffusion-xl-base-1.0">Stable Diffusion XL</option>
              <option value="stabilityai/stable-diffusion-3-medium">Stable Diffusion 3</option>
              <option value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash Image Preview</option>
              <option value="gpt-image-2">GPT Image 2</option>
            </select>
          </div>

          <Button
            size="sm"
            onClick={handleGenerateImage}
            disabled={imageLoading || !imagePrompt.trim()}
            className="w-full text-xs h-8 gap-1.5 btn-shimmer"
            type="button"
          >
            {imageLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {imageLoading ? "Generating..." : "Generate AI Image"}
          </Button>

          {generatedImageUrl && (
            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-medium text-foreground block">Generated Preview</label>
              <div className="border border-border rounded-lg overflow-hidden bg-secondary/10 p-1 flex justify-center">
                <img
                  src={generatedImageUrl}
                  alt="Generated Preview"
                  className="max-h-48 max-w-full rounded-md object-contain"
                />
              </div>
              <Button
                size="sm"
                onClick={insertImageIntoEditor}
                className="w-full text-xs h-8 gap-1.5"
                type="button"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Insert Image into Editor
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
