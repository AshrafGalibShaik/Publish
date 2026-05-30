"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DraftList } from "@/components/DraftList";
import { ContentSearch } from "@/components/ContentSearch";
import { ExploreArticles } from "@/components/ExploreArticles";
import Link from "next/link";
import { Plus, Compass, FileText, LogOut, Loader2, User, Search, Cpu } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [refreshTrigger] = useState(0);
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Syncing workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
              <span className="font-serif text-xl text-foreground">Publish</span>
            </Link>
            {user && (
              <span className="text-xs text-muted-foreground hidden md:inline border-l border-border pl-4 font-mono">
                {user.user_metadata?.name || user.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link href="/profile">
              <Button size="sm" variant="ghost" className="text-sm gap-1.5 h-9 text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="sm" className="text-sm gap-1.5 h-9 btn-shimmer transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New article</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground h-9 gap-1.5 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-10">
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <Cpu className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-foreground tracking-tight">Dashboard</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Manage drafts and explore published database nodes.</p>
        </div>

        <Tabs defaultValue="drafts" className="space-y-8">
          <TabsList className="bg-secondary/50 border border-border p-0.5 rounded-lg w-full max-w-[380px] grid grid-cols-3 h-10">
            <TabsTrigger value="drafts" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <FileText className="h-3.5 w-3.5" /> <span>Drafts</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Search className="h-3.5 w-3.5" /> <span>Search</span>
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
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
          <span className="font-mono">Publish v1.0</span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
            All systems operational
          </span>
        </div>
      </footer>
    </div>
  );
}
