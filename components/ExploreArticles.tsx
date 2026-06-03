"use client";

import { useEffect, useState } from "react";
import { supabase, Content, getPostVotes, castPostVote, getPostComments } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Clock, User, MessageSquare, Share2, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface EnrichedContent extends Content {
  author?: {
    id: string;
    name?: string;
    email: string;
  } | null;
}

export function ExploreArticles() {
  const [articles, setArticles] = useState<EnrichedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Interactive Reddit-like states
  const [votes, setVotes] = useState<Record<string, { score: number; userVote: 1 | -1 | null }>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  // Fetch votes and comment counts once articles are loaded
  useEffect(() => {
    if (articles.length === 0) return;
    
    articles.forEach(async (article) => {
      // Fetch votes
      const voteData = await getPostVotes(article.id);
      setVotes(prev => ({ ...prev, [article.id]: voteData }));

      // Fetch comment counts
      const comments = await getPostComments(article.id);
      // Flatten helper to count replies recursively
      const countTotal = (list: any[]): number => {
        return list.reduce((acc, c) => acc + 1 + countTotal(c.replies || []), 0);
      };
      setCommentCounts(prev => ({ ...prev, [article.id]: countTotal(comments) }));
    });
  }, [articles]);

  const fetchArticles = async () => {
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
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching explore articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e: React.MouseEvent, contentId: string, type: 1 | -1) => {
    e.preventDefault();
    e.stopPropagation();

    const currentVote = votes[contentId]?.userVote;
    const nextVoteType = currentVote === type ? null : type;

    // Optimistic update
    setVotes(prev => {
      const curr = prev[contentId] || { score: 0, userVote: null };
      let diff = 0;
      if (curr.userVote === type) {
        diff = -type; // Revert
      } else {
        if (curr.userVote !== null) diff -= curr.userVote; // Undo old vote
        diff += type; // Add new vote
      }
      return {
        ...prev,
        [contentId]: {
          score: curr.score + diff,
          userVote: nextVoteType
        }
      };
    });

    try {
      const result = await castPostVote(contentId, nextVoteType);
      setVotes(prev => ({ ...prev, [contentId]: result }));
    } catch (error) {
      toast.error("Failed to register vote");
    }
  };

  const handleAiSummary = async (e: React.MouseEvent, article: EnrichedContent) => {
    e.preventDefault();
    e.stopPropagation();

    if (aiSummaries[article.id]) {
      // Toggle off if already generated
      setAiSummaries(prev => {
        const next = { ...prev };
        delete next[article.id];
        return next;
      });
      return;
    }

    setLoadingSummaryId(article.id);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: article.content_text,
          type: "description"
        })
      });
      const data = await res.json();
      if (data.suggestion) {
        setAiSummaries(prev => ({ ...prev, [article.id]: data.suggestion }));
      } else {
        toast.error("Failed to generate AI summary");
      }
    } catch (err) {
      toast.error("AI service error");
    } finally {
      setLoadingSummaryId(null);
    }
  };

  const handleShare = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/content/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
  };

  const topics = Array.from(
    new Set(articles.map((a) => a.topic).filter(Boolean))
  ) as string[];

  const filteredArticles = selectedTopic
    ? articles.filter((a) => a.topic === selectedTopic)
    : articles;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Syncing article indexes...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="border border-border rounded-lg p-12 text-center bg-white space-y-4">
        <Globe className="h-8 w-8 text-muted-foreground/30 mx-auto" />
        <div>
          <p className="text-sm text-foreground">No public articles available</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to publish a document to the system ledger!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topics Filtering (Reddit Subreddit/Community Navigation) */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button
            size="sm"
            variant={selectedTopic === null ? "default" : "outline"}
            onClick={() => setSelectedTopic(null)}
            className="text-xs h-7 px-3 uppercase tracking-wider font-mono rounded-full"
          >
            All Communities
          </Button>
          {topics.map((topic) => (
            <Button
              key={topic}
              size="sm"
              variant={selectedTopic === topic ? "default" : "outline"}
              onClick={() => setSelectedTopic(topic)}
              className="text-xs h-7 px-3 uppercase tracking-wider font-mono rounded-full"
            >
              r/{topic}
            </Button>
          ))}
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono uppercase tracking-wider pb-2 border-b border-border">
          <span>AI-Native Reddit Feed ({filteredArticles.length} Post{filteredArticles.length !== 1 ? "s" : ""})</span>
          <span>Status: Verified</span>
        </div>

        {filteredArticles.map((article) => {
          const voteInfo = votes[article.id] || { score: 0, userVote: null };
          const commCount = commentCounts[article.id] || 0;
          const summary = aiSummaries[article.id];

          return (
            <Link key={article.id} href={`/content/${article.slug}`}>
              <Card className="flex bg-white border border-border rounded-xl hover:border-foreground/30 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer group">
                
                {/* Reddit Vote Column (Left) */}
                <div className="w-11 sm:w-12 bg-secondary/30 flex flex-col items-center pt-4 px-1 gap-1 border-r border-border/50 select-none">
                  <button
                    onClick={(e) => handleVote(e, article.id, 1)}
                    className={`p-1 rounded hover:bg-secondary transition-all duration-150 ${voteInfo.userVote === 1 ? 'text-emerald-600 scale-110 font-bold' : 'text-muted-foreground/60 hover:text-foreground'}`}
                  >
                    <ArrowUp className="h-4.5 w-4.5" />
                  </button>
                  <span className={`text-xs font-mono font-bold ${voteInfo.userVote === 1 ? 'text-emerald-600' : voteInfo.userVote === -1 ? 'text-rose-600' : 'text-foreground'}`}>
                    {voteInfo.score}
                  </span>
                  <button
                    onClick={(e) => handleVote(e, article.id, -1)}
                    className={`p-1 rounded hover:bg-secondary transition-all duration-150 ${voteInfo.userVote === -1 ? 'text-rose-600 scale-110 font-bold' : 'text-muted-foreground/60 hover:text-foreground'}`}
                  >
                    <ArrowDown className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Content Container (Right) */}
                <div className="flex-1 p-5 space-y-3 min-w-0">
                  {/* Meta details */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-muted-foreground">
                    <span className="font-bold text-foreground hover:underline">
                      r/{article.topic || "general"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Posted by u/{article.author?.name || article.author?.email?.split("@")[0] || "system"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : "recently"}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-lg text-foreground font-medium group-hover:text-primary transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.description || article.content_text.substring(0, 180)}
                    </p>
                  </div>

                  {/* Thumbnail: Extract first <img> from article HTML */}
                  {(() => {
                    const imgMatch = article.content_html?.match(/<img[^>]+src="([^"]+)"/);
                    const thumbnailUrl = imgMatch?.[1];
                    if (!thumbnailUrl) return null;
                    return (
                      <div className="rounded-lg overflow-hidden border border-border/50 bg-secondary/10 max-h-48">
                        <img
                          src={thumbnailUrl}
                          alt={`Thumbnail for ${article.title}`}
                          className="w-full h-full max-h-48 object-cover"
                        />
                      </div>
                    );
                  })()}

                  {/* AI Generated Summary Box */}
                  {summary && (
                    <div className="bg-secondary/40 border-l-2 border-primary/50 p-3 rounded-r-lg text-xs leading-relaxed text-foreground animate-fade-in flex gap-2.5 items-start">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">AI Context Summary</span>
                        {summary}
                      </div>
                    </div>
                  )}

                  {/* Reddit Action Bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] font-mono text-muted-foreground border-t border-border/40 mt-1">
                    <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-secondary transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{commCount} Comment{commCount !== 1 ? "s" : ""}</span>
                    </div>

                    <button
                      onClick={(e) => handleAiSummary(e, article)}
                      disabled={loadingSummaryId === article.id}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-200 ${summary ? 'bg-secondary text-primary font-bold' : 'hover:bg-secondary hover:text-foreground'}`}
                    >
                      {loadingSummaryId === article.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>{summary ? "Hide Summary" : "AI Summary"}</span>
                    </button>

                    <button
                      onClick={(e) => handleShare(e, article.slug)}
                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-secondary hover:text-foreground transition-colors ml-auto sm:ml-0"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
