"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DraftList } from "@/components/DraftList";
import { ContentSearch } from "@/components/ContentSearch";
import { ExploreArticles } from "@/components/ExploreArticles";
import Link from "next/link";
import { Plus, Compass, FileText, LogOut, Loader2, User, Search, Cpu, BookOpen, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, loading, signOut } = useAuth();
  const [stats, setStats] = useState({ drafts: 0, published: 0, global: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const { count: draftsCount } = await supabase
          .from("drafts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: publishedCount } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "published");

        const { count: globalCount } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("status", "published");

        setStats({
          drafts: draftsCount || 0,
          published: publishedCount || 0,
          global: globalCount || 0,
        });
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Syncing workspace...</span>
      </div>
    );
  }

  const handleDraftRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col page-dots">
      {/* ── Header ── */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/Screenshot 2026-05-29 092754.png"
                alt="Publish Logo"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-serif text-xl text-foreground font-medium">Publish</span>
            </Link>
            {user && (
              <span className="text-[11px] text-muted-foreground hidden md:inline border-l border-border pl-4 font-mono uppercase tracking-wider">
                NODE: {user.user_metadata?.name || user.email?.split("@")[0]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link href="/profile">
              <Button size="sm" variant="ghost" className="text-xs gap-1.5 h-9 text-muted-foreground hover:text-foreground transition-colors px-3">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="sm" className="text-xs gap-1.5 h-9 btn-shimmer transition-all duration-200 hover:shadow-md active:scale-[0.98] px-3">
                <Plus className="h-3.5 w-3.5" />
                <span>New article</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground h-9 gap-1.5 transition-colors px-3">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-10 relative z-10">
        <div className="mb-10 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                <Cpu className="h-4 w-4 text-foreground" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight font-medium">Dashboard</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage your draft posts, explore community threads, and vote on AI-native publications.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="chip flex items-center gap-1.5 bg-secondary border-border py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              SYSTEM SECURE
            </span>
            <span className="chip font-mono text-[10px]">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up stagger-1">
          <Card className="p-4 sm:p-5 bg-white border border-border rounded-xl hover-premium-card">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Publications</span>
              <BookOpen className="h-4 w-4 text-muted-foreground/60" />
            </div>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-1">
                <span className="text-2xl font-mono font-semibold tracking-tight text-foreground">{stats.published}</span>
                <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-wider">Authored nodes</span>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5 bg-white border border-border rounded-xl hover-premium-card">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Drafts</span>
              <FileText className="h-4 w-4 text-muted-foreground/60" />
            </div>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-1">
                <span className="text-2xl font-mono font-semibold tracking-tight text-foreground">{stats.drafts}</span>
                <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-wider">Work in progress</span>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5 bg-white border border-border rounded-xl hover-premium-card">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Ledger Nodes</span>
              <Globe className="h-4 w-4 text-muted-foreground/60" />
            </div>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-1">
                <span className="text-2xl font-mono font-semibold tracking-tight text-foreground">{stats.global}</span>
                <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-wider">Global network</span>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5 bg-white border border-border rounded-xl hover-premium-card">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Vector DB</span>
              <Cpu className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-mono font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                Active
              </span>
              <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-wider">Semantic queries ready</span>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="drafts" className="space-y-8 animate-fade-in-up stagger-2">
          <TabsList className="bg-secondary/50 border border-border p-0.5 rounded-lg w-full max-w-[380px] grid grid-cols-3 h-10">
            <TabsTrigger value="drafts" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all cursor-pointer">
              <FileText className="h-3.5 w-3.5" /> <span>Drafts</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all cursor-pointer">
              <Search className="h-3.5 w-3.5" /> <span>Search</span>
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all cursor-pointer">
              <Compass className="h-3.5 w-3.5" /> <span>Explore</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="outline-none animate-fade-in">
            <DraftList refreshTrigger={refreshTrigger} />
          </TabsContent>
          <TabsContent value="search" className="outline-none animate-fade-in">
            <ContentSearch />
          </TabsContent>
          <TabsContent value="explore" className="outline-none animate-fade-in">
            <ExploreArticles />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">Publish v1.0.0</span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
            All network nodes online
          </span>
        </div>
      </footer>
    </div>
  );
}

