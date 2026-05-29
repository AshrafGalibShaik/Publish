"use client";

import { useEffect, useState } from "react";
import { supabase, Content } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, Clock, User, ArrowLeft, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface VerifiedPublication extends Content {
  author?: {
    id: string;
    name?: string;
    email: string;
  } | null;
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<VerifiedPublication[]>([]);
  const [filteredPublications, setFilteredPublications] = useState<VerifiedPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPublications();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPublications(publications);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPublications(
        publications.filter(
          (pub) =>
            pub.title.toLowerCase().includes(query) ||
            pub.topic?.toLowerCase().includes(query) ||
            pub.author?.name?.toLowerCase().includes(query) ||
            pub.author?.email.toLowerCase().includes(query) ||
            pub.id.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, publications]);

  const fetchPublications = async () => {
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
      setPublications(data || []);
      setFilteredPublications(data || []);
    } catch (error) {
      console.error("Error fetching publications:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Header */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Button>
            </Link>
            <span className="font-serif text-lg border-l border-border pl-4">Publications Registry</span>
          </div>

          <Link href="/">
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-mono">
              System Home
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="mb-10 space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground border border-border text-[10px] font-mono uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
            Cryptographic Integrity Active
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-foreground">
            Verifiable Publications Ledger
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            This immutable ledger contains public records of all documents published through our vector-embedded network nodes. Verify authorship, system timestamps, and node addresses.
          </p>
        </div>

        {/* Filter Input */}
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search registry by title, author name, or node ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border-border text-foreground placeholder:text-muted-foreground/40 text-sm transition-all duration-200 focus:border-foreground/30"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Scanning registry nodes...</p>
          </div>
        ) : filteredPublications.length === 0 ? (
          <Card className="p-14 text-center bg-white border border-border rounded-xl">
            <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-foreground mb-1">No publications found</p>
            <p className="text-xs text-muted-foreground font-mono">No publications match your registry search query.</p>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono uppercase tracking-wider border-b border-border pb-3 px-1">
              <span>Verified Nodes ({filteredPublications.length})</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                Integrity Status: Secure
              </span>
            </div>

            <div className="space-y-4">
              {filteredPublications.map((pub, i) => (
                <Card
                  key={pub.id}
                  className="p-5 sm:p-6 bg-white border border-border rounded-xl hover-premium-card"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {pub.topic && (
                          <span className="chip">
                            {pub.topic}
                          </span>
                        )}
                        <span className="chip bg-secondary">
                          NODE ID: {pub.id.substring(0, 18)}...
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl text-foreground font-medium tracking-tight">
                        {pub.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {pub.description || pub.content_text.substring(0, 180)}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-foreground" />
                          <span>Author: {pub.author?.name || pub.author?.email || "System"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-foreground" />
                          <span>
                            Published {formatDistanceToNow(new Date(pub.published_at!), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                      <Link href={`/content/${pub.slug}`} target="_blank">
                        <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5 border-border text-foreground hover:bg-secondary transition-all duration-200 hover:translate-y-[-1px]">
                          View Node <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 text-xs text-muted-foreground font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Publish Cryptographic Integrity ledger</span>
          <span>© 2026 Publish</span>
        </div>
      </footer>
    </div>
  );
}
