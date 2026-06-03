"use client";

import { useState, useEffect } from "react";
import { Content, supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertCircle, Sparkles, ArrowUpRight, Clock, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SearchResultContent extends Content {
  similarity?: number;
  author?: {
    id: string;
    name?: string;
    email: string;
  } | null;
}

export function ContentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultContent[]>([]);
  const [recommendations, setRecommendations] = useState<SearchResultContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [useVector, setUseVector] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
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
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (err) {
      console.error("Error loading search recommendations:", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { setResults([]); setSearched(false); return; }

    setLoading(true);
    setSearched(true);
    try {
      if (useVector) {
        const response = await fetch("/api/search/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) throw new Error("Search failed");
        const { results: vectorResults } = await response.json();
        setResults(vectorResults || []);
      } else {
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
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,content_text.ilike.%${query}%,topic.ilike.%${query}%`);
        
        if (error) throw error;
        setResults(data || []);
      }
    } catch (error) {
      console.error("[v0] Search error:", error);
      toast.error("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search published articles by topic, keywords, or meaning..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setSearched(false);
                  setResults([]);
                }
              }}
              className="pl-10 h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-10 px-5 text-sm shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <input type="radio" name="mode" checked={!useVector} onChange={() => setUseVector(false)} className="accent-foreground w-3 h-3" />
              Full-text search
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <input type="radio" name="mode" checked={useVector} onChange={() => setUseVector(true)} className="accent-foreground w-3 h-3" />
              <span className="flex items-center gap-1">Semantic search <Sparkles className="h-3 w-3" /></span>
            </label>
          </div>
          {searched && (
            <button
              type="button"
              onClick={() => { setQuery(""); setSearched(false); setResults([]); }}
              className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Clear Search
            </button>
          )}
        </div>
      </form>

      {/* Recommended Latest Articles (Shown when not searched) */}
      {!searched && recommendations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Recent Recommendations</span>
          </div>
          
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {recommendations.map((content) => (
              <Link key={content.id} href={`/content/${content.slug}`}>
                <div className="p-4 sm:p-5 hover:bg-secondary/30 transition-colors cursor-pointer flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {content.topic && (
                        <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono uppercase">
                          {content.topic}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                        LATEST NODE
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-foreground text-sm">{content.title}</h3>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {content.description || content.content_text?.substring(0, 180)}
                    </p>

                    <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground/80 pt-1">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {content.published_at ? formatDistanceToNow(new Date(content.published_at), { addSuffix: true }) : "recently"}
                      </div>
                      
                      {content.author && (
                        <div className="flex items-center gap-1 border-l border-border pl-4">
                          <User className="h-3 w-3" />
                          <span>by {content.author.name || content.author.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searched && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-foreground" /></div>
          ) : results.length === 0 ? (
            <div className="border border-border rounded-lg p-10 text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-foreground">No articles found</p>
              <p className="text-xs text-muted-foreground mt-1">Try different keywords or switch search modes</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-4">{results.length} result{results.length !== 1 ? "s" : ""} found</p>

              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {results.map((content) => (
                  <Link key={content.id} href={`/content/${content.slug}`}>
                    <div className="p-4 sm:p-5 hover:bg-secondary/30 transition-colors cursor-pointer flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {content.topic && (
                            <span className="text-[11px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                              {content.topic}
                            </span>
                          )}
                          {content.similarity !== undefined && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {(content.similarity * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-medium text-foreground text-sm">{content.title}</h3>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {content.description || content.content_text?.substring(0, 180)}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground/80 pt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {content.published_at ? formatDistanceToNow(new Date(content.published_at), { addSuffix: true }) : "recently"}
                          </div>
                          
                          {content.author && (
                            <div className="flex items-center gap-1 border-l border-border pl-4">
                              <User className="h-3 w-3" />
                              <span>by {content.author.name || content.author.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
