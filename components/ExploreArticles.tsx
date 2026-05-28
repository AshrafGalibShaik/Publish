"use client";

import { useEffect, useState } from "react";
import { supabase, Content } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Clock, User, ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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

  useEffect(() => {
    fetchArticles();
  }, []);

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
      {/* Topics Filtering */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button
            size="sm"
            variant={selectedTopic === null ? "default" : "outline"}
            onClick={() => setSelectedTopic(null)}
            className="text-xs h-7 px-3 uppercase tracking-wider font-mono rounded"
          >
            All Topics
          </Button>
          {topics.map((topic) => (
            <Button
              key={topic}
              size="sm"
              variant={selectedTopic === topic ? "default" : "outline"}
              onClick={() => setSelectedTopic(topic)}
              className="text-xs h-7 px-3 uppercase tracking-wider font-mono rounded"
            >
              {topic}
            </Button>
          ))}
        </div>
      )}

      {/* Articles High Density List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono uppercase tracking-wider pb-2 border-b border-border">
          <span>Active Registry Ledger ({filteredArticles.length} Node{filteredArticles.length !== 1 ? "s" : ""})</span>
          <span>Status: Verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="p-5 bg-white border border-border rounded-lg hover:border-foreground/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {article.topic && (
                    <span className="text-[10px] font-mono uppercase text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                      {article.topic}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    NODE: {article.id.substring(0, 8)}
                  </span>
                </div>

                <h3 className="font-serif text-base text-foreground font-medium tracking-tight">
                  {article.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {article.description || article.content_text.substring(0, 140)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60 mt-4 text-[11px] font-mono text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-foreground" />
                    <span className="truncate max-w-[120px] font-sans">
                      {article.author?.name || article.author?.email || "System"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-foreground" />
                    <span>{formatDistanceToNow(new Date(article.published_at!), { addSuffix: true })}</span>
                  </div>
                </div>

                <Link href={`/content/${article.slug}`}>
                  <Button size="sm" className="text-xs h-7 gap-1 px-3">
                    Read Node <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
