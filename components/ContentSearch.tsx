"use client";

import { useEffect, useState } from "react";
import { Content, supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function ContentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Content[]>([]);
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
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder='Search articles (e.g., "cloud computing", "AI topics")'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!useVector}
              onChange={() => setUseVector(false)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">Full-text Search</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={useVector}
              onChange={() => setUseVector(true)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">Semantic Search (AI)</span>
          </label>
        </div>
      </form>

      {searched && (
        <div className="space-y-3">
          {loading ? (
            <Card className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Searching...</p>
            </Card>
          ) : results.length === 0 ? (
            <Card className="p-6 text-center">
              <AlertCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No articles found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try different keywords or check back later
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Found {results.length} article{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((content) => (
                <Card key={content.id} className="p-4 hover:shadow-md transition-shadow">
                  <Link href={`/content/${content.slug}`}>
                    <div className="cursor-pointer">
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                        {content.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {content.description || content.content_text?.substring(0, 150)}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        {content.topic && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            {content.topic}
                          </span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(content.published_at!), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
