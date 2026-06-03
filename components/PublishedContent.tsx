"use client";

import { useEffect, useState } from "react";
import { Content, supabase, getPostVotes, castPostVote, getPostComments, addPostComment, Comment } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Share2, Cpu, Terminal, User, Clock, Sparkles, MessageSquare, ArrowUp, ArrowDown, Send, Loader2 } from "lucide-react";
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
  
  // Reddit-like interactive states
  const [voteInfo, setVoteInfo] = useState<{ score: number; userVote: 1 | -1 | null }>({ score: 0, userVote: null });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [askAi, setAskAi] = useState(false);
  const [generatingPerspective, setGeneratingPerspective] = useState(false);

  // Thread reply states
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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

      // Load comments & votes
      if (data) {
        const votes = await getPostVotes(data.id);
        setVoteInfo(votes);
        const comms = await getPostComments(data.id);
        setComments(comms);
      }
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Content not found");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 1 | -1) => {
    if (!content) return;
    const nextVoteType = voteInfo.userVote === type ? null : type;

    // Optimistic Update
    setVoteInfo(prev => {
      let diff = 0;
      if (prev.userVote === type) {
        diff = -type;
      } else {
        if (prev.userVote !== null) diff -= prev.userVote;
        diff += type;
      }
      return { score: prev.score + diff, userVote: nextVoteType };
    });

    try {
      const result = await castPostVote(content.id, nextVoteType);
      setVoteInfo(result);
    } catch (err) {
      toast.error("Failed to register vote");
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

  const loadComments = async () => {
    if (!content) return;
    const comms = await getPostComments(content.id);
    setComments(comms);
  };

  const callPuterAiReply = async (promptText: string, contextText: string): Promise<string> => {
    try {
      const { puter } = await import("@heyputer/puter.js");
      const systemInstruction =
        "You are an active, intelligent, and slightly witty community member on an AI-native forum. Analyze the provided post or comment context and write a thoughtful, conversational response. Keep it relatively brief, use clean line breaks for paragraph separation, and do NOT use any HTML tags. Offer real value or a unique angle.";
      
      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Post/Comment Context:\n${contextText}\n\nUser Question/Input:\n"${promptText}"\n\nGenerate your community response:` }
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

      return suggestion;
    } catch (e) {
      console.error("Error generating Puter AI reply:", e);
      throw e;
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !newCommentText.trim()) return;

    setIsSubmittingComment(true);
    const commentText = newCommentText;
    setNewCommentText("");

    try {
      // 1. Insert user comment
      const userComm = await addPostComment(content.id, commentText, null);
      await loadComments();

      // 2. Trigger AI response if checked or @ai is mentioned
      if (askAi || commentText.toLowerCase().includes("@ai")) {
        const threadContext = `Post title: ${content.title}\nPost context: ${content.content_text}\nUser comment: ${commentText}`;
        const suggestion = await callPuterAiReply(commentText, threadContext);
        if (suggestion) {
          await addPostComment(content.id, suggestion, userComm.id, true, "Puter GPT-4o-Mini");
          await loadComments();
        }
      }
      toast.success("Comment posted");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentId: string, text: string, shouldAskAi: boolean) => {
    if (!content) return;
    setIsSubmittingReply(true);

    try {
      const replyComm = await addPostComment(content.id, text, parentId);
      await loadComments();

      if (shouldAskAi || text.toLowerCase().includes("@ai")) {
        const threadContext = `Post title: ${content.title}\nPost context: ${content.content_text}\nParent comment: ${text}`;
        const suggestion = await callPuterAiReply(text, threadContext);
        if (suggestion) {
          await addPostComment(content.id, suggestion, replyComm.id, true, "Puter GPT-4o-Mini");
          await loadComments();
        }
      }
    } catch (err) {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleGenerateAiPerspective = async (promptType: "support" | "debate" | "summary") => {
    if (!content) return;
    setGeneratingPerspective(true);

    let prompt = "";
    if (promptType === "support") {
      prompt = "Generate a supportive comment adding a constructive insight or secondary point to this post.";
    } else if (promptType === "debate") {
      prompt = "Generate a critical but polite debate counter-argument to the ideas in this post.";
    } else {
      prompt = "Provide a concise summary outlining the main claims of this post and invite other members to discuss.";
    }

    try {
      const threadContext = `Post title: ${content.title}\nPost content: ${content.content_text}`;
      const suggestion = await callPuterAiReply(prompt, threadContext);
      if (suggestion) {
        await addPostComment(content.id, suggestion, null, true, "Puter GPT-4o-Mini");
        await loadComments();
        toast.success("AI comment generated");
      }
    } catch (err) {
      toast.error("Failed to generate AI perspective");
    } finally {
      setGeneratingPerspective(false);
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

  // Extract first image to use as banner if it's there
  let bannerImgUrl: string | null = null;
  let displayHtml = content.content_html;

  const imgMatch = content.content_html?.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) {
    bannerImgUrl = imgMatch[1];
    // Remove the first image from content so it's not duplicated
    displayHtml = content.content_html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/i, "");
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 relative z-10 space-y-6">
      
      {/* Back to dashboard */}
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase border-b border-border pb-3">
        <Link href="/dashboard">
          <Button variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground px-2 gap-1.5 transition-colors uppercase cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            Reddit Feed
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
          <span>PUBLICATION SECURE</span>
        </div>
      </div>

      {/* Main Post Container with Side Voting (Reddit Detail Layout) */}
      <div className="flex gap-4">
        {/* Detail Upvote Box */}
        <div className="flex flex-col items-center bg-secondary/20 p-2 rounded-xl border border-border/50 self-start select-none gap-1 sm:gap-1.5 w-11 shrink-0">
          <button
            onClick={() => handleVote(1)}
            className={`p-1.5 rounded hover:bg-secondary transition-all ${voteInfo.userVote === 1 ? 'text-emerald-600 scale-110 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <span className={`text-xs font-mono font-bold ${voteInfo.userVote === 1 ? 'text-emerald-600' : voteInfo.userVote === -1 ? 'text-rose-600' : 'text-foreground'}`}>
            {voteInfo.score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={`p-1.5 rounded hover:bg-secondary transition-all ${voteInfo.userVote === -1 ? 'text-rose-600 scale-110 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        </div>

        {/* Post Content */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-muted-foreground">
            <span className="font-bold text-foreground">
              r/{content.topic || "general"}
            </span>
            <span>•</span>
            <span>
              Posted by u/{content.author?.name || content.author?.email?.split("@")[0] || "System"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif tracking-tight text-foreground font-medium leading-tight">
            {content.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] text-muted-foreground border-b border-border/60 pb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-foreground" />
              <span>PUBLISHED {content.published_at ? formatDistanceToNow(new Date(content.published_at), { addSuffix: true }) : "recently"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-foreground" />
              <span>{readingTime} MIN READ</span>
            </div>
          </div>

          {content.description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-mono border-l-2 border-border pl-4 py-1 italic">
              {content.description}
            </p>
          )}

          {bannerImgUrl && (
            <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-border shadow-sm mb-4 relative group">
              <img
                src={bannerImgUrl}
                alt={content.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>
          )}

          <Card className="p-5 sm:p-7 bg-white border border-border rounded-xl shadow-sm">
            <div
              className="prose max-w-none text-foreground leading-relaxed text-sm sm:text-base font-sans"
              dangerouslySetInnerHTML={{ __html: displayHtml }}
            />
          </Card>

          <div className="flex items-center gap-4 pt-1">
            <Button
              onClick={handleShare}
              variant="outline"
              className="h-8 text-[10px] uppercase font-mono border border-border bg-white hover:bg-secondary text-foreground tracking-wider flex items-center gap-1.5 transition-all duration-200"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Link
            </Button>
          </div>
        </div>
      </div>

      {/* ── AI Co-pilot Debate / Prompting Section ── */}
      <div className="border-t border-b border-border/60 py-5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-foreground font-mono uppercase tracking-wider">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
          <span>AI Co-pilot Community Assistant</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Instantly generate AI responses, structured reviews, or critical debate points to seed the forum:
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={generatingPerspective}
            onClick={() => handleGenerateAiPerspective("summary")}
            className="text-[10px] font-mono h-7 px-3 gap-1 hover:bg-secondary"
          >
            {generatingPerspective ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
            Generate Summary Thread
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={generatingPerspective}
            onClick={() => handleGenerateAiPerspective("support")}
            className="text-[10px] font-mono h-7 px-3 gap-1 hover:bg-secondary"
          >
            {generatingPerspective ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-emerald-600" />}
            Supportive Analysis
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={generatingPerspective}
            onClick={() => handleGenerateAiPerspective("debate")}
            className="text-[10px] font-mono h-7 px-3 gap-1 hover:bg-secondary text-rose-600 hover:text-rose-700"
          >
            {generatingPerspective ? <Loader2 className="h-3 w-3 animate-spin" /> : <Cpu className="h-3 w-3" />}
            Critical Counter-Argument
          </Button>
        </div>
      </div>

      {/* ── Threaded Comments Section ── */}
      <div className="space-y-6 pt-4">
        <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5" /> Discussions
        </h3>

        {/* Comment submission form */}
        <form onSubmit={handleSubmitComment} className="space-y-3 bg-secondary/10 p-4 border border-border rounded-xl">
          <textarea
            placeholder="What are your thoughts on this topic? (Include @ai or check trigger to query bot)"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
            className="w-full p-3 text-xs sm:text-sm bg-white border border-border rounded-lg focus:border-foreground/30 outline-none resize-none text-foreground placeholder:text-muted-foreground/45"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground">
              <input
                type="checkbox"
                checked={askAi}
                onChange={(e) => setAskAi(e.target.checked)}
                className="accent-primary w-3.5 h-3.5 rounded"
              />
              <span className="flex items-center gap-1">Trigger AI Response <Sparkles className="h-3 w-3 text-primary animate-pulse" /></span>
            </label>
            <Button
              type="submit"
              disabled={isSubmittingComment || !newCommentText.trim()}
              className="text-xs h-9 font-mono uppercase tracking-wider btn-shimmer px-4"
            >
              {isSubmittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Post Comment
            </Button>
          </div>
        </form>

        {/* Comments Feed */}
        {comments.length === 0 ? (
          <div className="text-center py-8 border border-border border-dashed rounded-xl">
            <MessageSquare className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No discussions yet. Seed the first one above!</p>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-border/40">
            {comments.map((comm) => (
              <CommentNode
                key={comm.id}
                comment={comm}
                onReplySubmit={handleReplySubmit}
                replyingId={replyingId}
                setReplyingId={setReplyingId}
                isSubmittingReply={isSubmittingReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* Verification Details Footer */}
      <div className="p-4 bg-secondary/15 border border-border rounded-xl font-mono text-[9px] sm:text-[10px] text-muted-foreground space-y-1.5 mt-8">
        <div className="text-foreground font-semibold flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Cpu className="h-3.5 w-3.5" /> Ledger Verification Metadata
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
          <div><span className="text-foreground/75">Node ID:</span> {content.id}</div>
          <div><span className="text-foreground/75">Topic Domain:</span> r/{content.topic || "general"}</div>
          <div><span className="text-foreground/75">Signature:</span> verified_sha256_{content.id.substring(0, 12)}</div>
          <div><span className="text-foreground/75">Sync Status:</span> Network Ledger Decoupled</div>
        </div>
      </div>
    </div>
  );
}

// ── Recursive Comment Node Component ──

interface CommentNodeProps {
  comment: Comment;
  onReplySubmit: (parentId: string, text: string, askAi: boolean) => void;
  replyingId: string | null;
  setReplyingId: (id: string | null) => void;
  isSubmittingReply: boolean;
}

function CommentNode({ comment, onReplySubmit, replyingId, setReplyingId, isSubmittingReply }: CommentNodeProps) {
  const [replyText, setReplyText] = useState("");
  const [replyAskAi, setReplyAskAi] = useState(false);
  const isReplying = replyingId === comment.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReplySubmit(comment.id, replyText, replyAskAi);
    setReplyText("");
    setReplyAskAi(false);
    setReplyingId(null);
  };

  return (
    <div className="pl-4 border-l border-border/80 space-y-3 mt-3">
      <div className={`p-4 rounded-xl border transition-all duration-200 ${comment.is_ai ? 'bg-secondary/40 border-primary/20 shadow-sm' : 'bg-white border-border'}`}>
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1.5 font-sans font-bold text-foreground">
            {comment.is_ai ? (
              <>
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-primary font-mono text-[9px] uppercase bg-secondary border border-primary/20 px-1.5 py-0.5 rounded">
                  {comment.ai_model || "AI"} Bot
                </span>
              </>
            ) : (
              comment.author_name
            )}
          </span>
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.comment_text}</p>
        
        <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-border/30 text-[10px] font-mono text-muted-foreground">
          <button 
            onClick={() => setReplyingId(isReplying ? null : comment.id)} 
            className="hover:text-foreground transition-colors uppercase cursor-pointer"
          >
            Reply
          </button>
        </div>
      </div>

      {isReplying && (
        <form onSubmit={handleSubmit} className="pl-4 space-y-3 border-l border-border/80">
          <textarea
            placeholder={`Reply to ${comment.author_name}... (Include @ai or check box to trigger bot reply)`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="w-full p-2.5 text-xs bg-white border border-border rounded-lg focus:border-foreground/30 outline-none resize-none text-foreground placeholder:text-muted-foreground/45"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground cursor-pointer hover:text-foreground">
              <input 
                type="checkbox" 
                checked={replyAskAi} 
                onChange={(e) => setReplyAskAi(e.target.checked)} 
                className="accent-primary w-3 h-3 rounded" 
              />
              <span>Trigger AI response</span>
            </label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setReplyingId(null)}
                className="h-7 text-[10px] uppercase font-mono"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmittingReply}
                className="h-7 text-[10px] uppercase font-mono btn-shimmer"
              >
                Submit
              </Button>
            </div>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.map((reply) => (
        <CommentNode 
          key={reply.id} 
          comment={reply} 
          onReplySubmit={onReplySubmit} 
          replyingId={replyingId}
          setReplyingId={setReplyingId}
          isSubmittingReply={isSubmittingReply}
        />
      ))}
    </div>
  );
}
