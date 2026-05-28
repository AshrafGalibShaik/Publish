"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DraftList } from "@/components/DraftList";
import { ContentSearch } from "@/components/ContentSearch";
import { ExploreArticles } from "@/components/ExploreArticles";
import Link from "next/link";
import { Plus, Compass, FileText, LogOut, Loader2, User, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [refreshTrigger] = useState(0);
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="font-serif text-xl text-foreground">
              Publish
            </Link>
            {user && (
              <span className="text-xs text-muted-foreground hidden md:inline border-l border-border pl-4">
                {user.user_metadata?.name || user.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button size="sm" variant="ghost" className="text-sm gap-1.5 h-8 text-muted-foreground hover:text-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="sm" className="text-sm gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New article</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground h-8 gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-10">
        <div className="mb-10">
          <h1 className="font-serif text-3xl text-foreground mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage drafts and explore published database nodes.</p>
        </div>

        <Tabs defaultValue="drafts" className="space-y-8">
          <TabsList className="bg-secondary/50 border border-border p-0.5 rounded-md w-full max-w-[360px] grid grid-cols-3 h-9">
            <TabsTrigger value="drafts" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded">
              <FileText className="h-3.5 w-3.5" /> Drafts
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded">
              <Search className="h-3.5 w-3.5" /> Search
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded">
              <Compass className="h-3.5 w-3.5" /> Explore
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="outline-none">
            <DraftList refreshTrigger={refreshTrigger} />
          </TabsContent>
          <TabsContent value="search" className="outline-none">
            <ContentSearch />
          </TabsContent>
          <TabsContent value="explore" className="outline-none">
            <ExploreArticles />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 text-xs text-muted-foreground">
          Publish v1.0
        </div>
      </footer>
    </div>
  );
}
