"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DraftList } from "@/components/DraftList";
import { ContentSearch } from "@/components/ContentSearch";
import Link from "next/link";
import { 
  Plus, 
  BookOpen, 
  FileText, 
  LogOut, 
  Loader2, 
  Binary,
  Cpu,
  Database,
  UserCheck,
  Terminal,
  Activity
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
        <div className="flex flex-col items-center gap-4 z-10 font-mono text-xs text-muted-foreground uppercase tracking-widest">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Syncing Secure Session Node...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-40 z-0" />

      {/* Header */}
      <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-8 h-8 rounded bg-primary/10 border border-primary/30 group-hover:border-primary transition-all duration-300 shadow-[0_0_10px_oklch(0.65_0.22_255/0.1)]">
                <Binary className="h-4.5 w-4.5 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-base font-bold tracking-wider text-white font-mono uppercase">
                PUBLISH<span className="text-primary font-sans font-normal text-xs ml-1 uppercase">Foundry</span>
              </span>
            </Link>

            {/* Dashboard Telemetry */}
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-muted-foreground border-l border-border pl-6">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary animate-pulse" />
                <span>DB: CONNECTED</span>
              </div>
              <span className="text-border/60">|</span>
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3 w-3 text-emerald-400" />
                <span className="uppercase text-white/90">
                  {user?.user_metadata?.name || user?.email?.split("@")[0] || "OPERATOR"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/editor">
              <Button size="sm" className="h-8.5 px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase tracking-wider text-xs glow-hover">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Article
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={signOut} className="h-8.5 px-4 border-border bg-white/5 hover:bg-white/10 text-white font-mono uppercase tracking-wider text-xs">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-secondary border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>Secure Shell: /dev/foundry/user</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-sans">
              WORKSPACE OPERATIONS
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1">
              Create drafts, view system revisions, and discover content using vector semantic query parameters.
            </p>
          </div>

          {/* Quick telemetry indicators */}
          <div className="flex gap-4 font-mono">
            <Card className="px-4 py-2 bg-white/[0.01] border-border/80 flex flex-col justify-center rounded">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">SYSTEM REGION</span>
              <span className="text-[11px] font-bold text-white uppercase">ap-south-1 (AWS)</span>
            </Card>
            <Card className="px-4 py-2 bg-white/[0.01] border-border/80 flex flex-col justify-center rounded">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">SECURITY ENGINE</span>
              <span className="text-[11px] font-bold text-primary uppercase">RLS ENFORCED</span>
            </Card>
          </div>
        </div>

        {/* Dense Tabs Interface */}
        <Tabs defaultValue="drafts" className="space-y-6">
          <TabsList className="bg-secondary/60 border border-border p-1 rounded max-w-md w-full grid grid-cols-2">
            <TabsTrigger 
              value="drafts" 
              className="gap-2 font-mono uppercase tracking-wider text-[11px] h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded"
            >
              <FileText className="h-3.5 w-3.5" />
              My Drafts
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="gap-2 font-mono uppercase tracking-wider text-[11px] h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Search Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="outline-none focus-visible:outline-none">
            <DraftList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="search" className="outline-none focus-visible:outline-none">
            <ContentSearch />
          </TabsContent>
        </Tabs>
      </main>

      {/* Technical Footer */}
      <footer className="border-t border-border bg-background/40 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>SESSION VALIDATED</span>
          </div>
          <span>v1.0.0-PROD</span>
        </div>
      </footer>
    </div>
  );
}
