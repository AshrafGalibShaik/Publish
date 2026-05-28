"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { 
  FileText, 
  Lock, 
  Zap, 
  BookOpen, 
  BarChart3, 
  Share2, 
  ArrowRight, 
  Binary, 
  Cpu, 
  Database,
  Search,
  Sparkles,
  GitBranch
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-40" />

      {/* Decorative Radial Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Futuristic Command Header */}
      <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded bg-primary/10 border border-primary/30 shadow-[0_0_10px_oklch(0.65_0.22_255/0.1)]">
              <Binary className="h-5 w-5 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-lg font-bold tracking-wider text-white font-mono uppercase">
              PUBLISH<span className="text-primary font-sans font-normal text-xs ml-1 border border-primary/30 px-1 rounded bg-primary/5 uppercase">Foundry v1</span>
            </span>
          </div>

          <div className="flex gap-4 items-center font-mono">
            <Link href="/login">
              <span className="text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded hover:bg-white/5 uppercase">
                Sign In
              </span>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase tracking-wider glow-hover">
                Sign Up
              </Button>
            </Link>
            <div className="h-4 w-[1px] bg-border" />
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="h-8 text-xs border-border bg-white/5 hover:bg-white/10 text-white font-mono uppercase tracking-wider">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Cyber Hero Console */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center space-y-8 mb-20">
          {/* Palantir Command Status Bar */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-border/80 backdrop-blur-sm text-xs text-muted-foreground font-mono">
            <Cpu className="h-3.5 w-3.5 text-primary animate-spin duration-[4000ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>NODE STATUS: ONLINE</span>
            <span className="text-border">|</span>
            <span>AI ENGINE: READY</span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white text-balance uppercase">
              Create, Analyze & Publish
              <br />
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_oklch(0.65_0.22_255/0.1)]">
                Content with Intelligence
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-mono text-balance">
              A high-density content operations control center integrated with real-time version logs, auto-saving drafts, and semantic AI queries.
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-6 bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase tracking-wider text-sm glow-hover shadow-[0_4px_20px_oklch(0.65_0.22_255/0.15)]">
                ENTER CONTROL HUB <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="h-12 px-6 border-border hover:bg-white/5 text-white font-mono uppercase tracking-wider text-sm">
                INITIALIZE DRAFT
              </Button>
            </Link>
          </div>
        </div>

        {/* Dense Analytics Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 relative">
          <Card className="relative p-6 bg-white/[0.01] hover:bg-white/[0.02] border-border hover:border-primary/30 transition-all duration-300 Palantir-shadow group glow-hover rounded overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="text-[10px] font-mono text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5">OP.DRF-98</span>
            </div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide mb-2">
              DRAFT MANAGEMENT
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Auto-saving workspace caches drafts securely. Switch between actively monitored drafts with zero-latency recovery interfaces.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>LATENCY: 0.04ms</span>
              <span>CACHE: SYNCED</span>
            </div>
          </Card>

          <Card className="relative p-6 bg-white/[0.01] hover:bg-white/[0.02] border-border hover:border-primary/30 transition-all duration-300 Palantir-shadow group glow-hover rounded overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <GitBranch className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="text-[10px] font-mono text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5">SYS.LOG-2</span>
            </div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide mb-2">
              VERSIONING ENGINE
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Granular revision logs trace every single paragraph transition. Inspect full diff tracking, comparison analytics, and restore points instantly.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>COMPRESSION: GZ</span>
              <span>LOGS: SECURE</span>
            </div>
          </Card>

          <Card className="relative p-6 bg-white/[0.01] hover:bg-white/[0.02] border-border hover:border-primary/30 transition-all duration-300 Palantir-shadow group glow-hover rounded overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <Zap className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="text-[10px] font-mono text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5">VEC.SRCH-7</span>
            </div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide mb-2">
              SEMANTIC DISCOVERY
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vector index mapping powers advanced cognitive semantic searches. Find published concepts based on contextual similarity rather than matching keywords.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>VECTOR MODEL: MiniLM-L6</span>
              <span>DIMENSIONS: 1536</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Command Stats Summary Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-y border-border/80 bg-white/[0.01] relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white tracking-wider">100%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Database Sync Integrity</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary tracking-wider">99.98%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Content Generation</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white tracking-wider">0.05ms</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Query Response Latency</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary tracking-wider">AES-256</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Row-Level Security Enc</p>
          </div>
        </div>
      </section>

      {/* Control Console Visual Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <Card className="relative p-12 bg-white/[0.01] border-border text-center overflow-hidden rounded Palantir-shadow border shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex p-3 rounded bg-primary/5 border border-primary/30">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-wide">
              Secure Operations Sandbox
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono leading-relaxed">
              Every content creation step, revision node, and AI request is mapped, recorded, and encrypted directly on your secure Postgres instance. Enter the control dashboard to view live operation tables.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="mt-4 px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase tracking-wider text-xs glow-hover">
                LAUNCH OPERATIONS PANEL
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Technical Footer */}
      <footer className="border-t border-border bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>OPERATING ON SECURE CLOUD GATEWAY</span>
          </div>
          <p className="mt-4 md:mt-0">
            FOUNDRY OPERATIONS © 2026 | ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
