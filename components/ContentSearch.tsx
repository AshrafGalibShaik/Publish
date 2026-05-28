"use client";

import { useState } from "react";
import { Content, supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, AlertCircle, Sparkles, Terminal, Activity, FileText, ArrowUpRight, Cpu } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SearchResultContent extends Content {
  similarity?: number;
}

export function ContentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [useVector, setUseVector] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      if (useVector) {
        // Vector search via API
        const response = await fetch("/api/search/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) throw new Error("Search failed");

        const { results: vectorResults } = await response.json();
        setResults(vectorResults || []);
      } else {
        // Full-text search
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("status", "published")
          .or(
            `title.ilike.%${query}%,description.ilike.%${query}%,content_text.ilike.%${query}%,topic.ilike.%${query}%`
          );

        if (error) throw error;
        setResults(data || []);
      }
    } catch (error) {
      console.error("[v0] Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-[0.02]" />
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder='Query database (e.g. "cloud computing", "AI integration")...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11 bg-background border-border text-white placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20 h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-11 px-6 bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase tracking-wider text-xs glow-hover">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  QUERYING...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-2" />
                  SEARCH
                </>
              )}
            </Button>
          </div>

          {/* Precision Search Mode Toggle Buttons */}
          <div className="flex items-center gap-6 pt-2 font-mono text-xs border-t border-border/40">
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">QUERY SEARCH MODE:</span>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group text-muted-foreground hover:text-white transition-colors">
                <input
                  type="radio"
                  name="search_mode"
                  checked={!useVector}
                  onChange={() => setUseVector(false)}
                  className="accent-primary w-3.5 h-3.5 bg-background border-border"
                />
                <span className="uppercase tracking-wider">Lexical Index (FTS)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group text-muted-foreground hover:text-white transition-colors">
                <input
                  type="radio"
                  name="search_mode"
                  checked={useVector}
                  onChange={() => setUseVector(true)}
                  className="accent-primary w-3.5 h-3.5 bg-background border-border"
                />
                <span className="uppercase tracking-wider flex items-center gap-1.5">
                  Cognitive Semantic (AI)
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                </span>
              </label>
            </div>
          </div>
        </form>
      </Card>

      {searched && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground font-mono text-xs uppercase tracking-widest gap-2">
              <Cpu className="h-5 w-5 animate-spin text-primary" />
              <span>Scanning High-Dimensional Embeddings...</span>
            </div>
          ) : results.length === 0 ? (
            <Card className="p-12 text-center bg-white/[0.01] border-border rounded Palantir-shadow relative overflow-hidden">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                No matching records in document catalog
              </p>
              <p className="text-[11px] text-muted-foreground/60 font-mono uppercase mt-1">
                Try alternative queries or switch search parameters
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest px-1">
                <span>QUERY REPORT: SEARCH MATRIX COMPLETE</span>
                <span>MATCHES FOUND: {results.length}</span>
              </div>

              <div className="space-y-4">
                {results.map((content) => (
                  <Card 
                    key={content.id} 
                    className="p-5 bg-white/[0.01] hover:bg-white/[0.02] border-border hover:border-primary/20 transition-all duration-300 Palantir-shadow group glow-hover rounded overflow-hidden"
                  >
                    <Link href={`/content/${content.slug}`}>
                      <div className="cursor-pointer space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-[9px] font-mono text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5 uppercase">
                              DOC_ID: {content.id.slice(0, 8)}
                            </span>
                            {content.topic && (
                              <span className="text-[9px] font-mono text-white/60 border border-border px-1.5 py-0.5 rounded bg-secondary uppercase tracking-wider">
                                {content.topic}
                              </span>
                            )}
                          </div>

                          {/* Render Similarity percentage score if available */}
                          {content.similarity !== undefined && (
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-[9px] text-muted-foreground uppercase">AI SIMILARITY:</span>
                              <span className="text-xs text-primary font-bold">{(content.similarity * 100).toFixed(1)}%</span>
                              <div className="w-16 h-1.5 rounded bg-border overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${content.similarity * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-white group-hover:text-primary transition-colors tracking-wide text-base uppercase font-sans flex items-center justify-between">
                            {content.title}
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {content.description || content.content_text?.substring(0, 180)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-muted-foreground">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          <span className="uppercase">
                            PUBLISHED {formatDistanceToNow(new Date(content.published_at!), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
