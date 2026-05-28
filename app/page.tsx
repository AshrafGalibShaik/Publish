"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, GitBranch, Search, Sparkles, Shield, Zap, Globe, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white text-foreground animate-fade-in">
      {/* ── Header ── */}
      <header className="border-b border-border bg-white sticky top-0 z-50 transition-all duration-200">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-tight text-foreground flex items-center gap-2 group">
            <span className="font-bold">PUBLISH</span>
            <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground border-l border-border pl-2 font-sans font-medium transition-all group-hover:text-foreground">Enterprise</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/publications" className="nav-link-underline mx-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors py-1">Registry</span>
            </Link>

            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-3" />
            ) : user ? (
              <>
                <Link href="/dashboard" className="nav-link-underline mx-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors py-1">Dashboard</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link-underline mx-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors py-1">Sign In</span>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="text-xs uppercase tracking-wider h-8 transition-transform hover:scale-105 active:scale-95 duration-200">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold font-mono">
              SECURE DECENTRALIZED DATA FABRIC
            </p>
            <h1 className="font-serif text-[2.75rem] sm:text-[3.75rem] leading-[1.05] tracking-tight text-foreground font-light">
              Corporate publishing <br />
              <span className="italic">reimagined.</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
              Publish is the premier workspace built for corporate teams to draft, index, and securely search institutional intelligence using custom AI semantic vectors.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto h-11 px-7 text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:translate-y-[-1px]">
                  Open Console <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/publications">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-7 text-xs uppercase tracking-wider border-border text-foreground hover:bg-secondary transition-all duration-200 hover:translate-y-[-1px]">
                  Explore Ledger
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 animate-float">
            <div className="border border-border p-3 rounded-lg bg-secondary/10 hover-premium-card">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded border border-border bg-white">
                <Image
                  src="/corporate_hero.png"
                  alt="Publish secure network node interface illustration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase px-1">
                <span>SYSTEM SCHEMATIC 001</span>
                <span>INTEGRITY MATRIX ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Client / Trust Bar ── */}
      <section className="border-y border-border bg-secondary/20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <span>OPERATING PRINCIPLES</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span>IMMUTABLE HISTORY</span>
            <span>COSINE SIMILARITY</span>
            <span>DECISION INTELLIGENCE</span>
            <span>ENTERPRISE RLS</span>
          </div>
        </div>
      </section>

      {/* ── Corporate Details / Product Value ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6 order-last lg:order-first">
            <div className="border border-border p-3 rounded-lg bg-secondary/10 hover-premium-card">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded border border-border bg-white">
                <Image
                  src="/corporate_features.png"
                  alt="High-density network visualization graphic"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase px-1">
                <span>DECISION GRAPH 002</span>
                <span>STABILITY INDEX: 100%</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold font-mono">
              SYSTEM ARCHITECTURE
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-light">
              Built for institutional precision.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Engineered to support modern knowledge management workflows, Publish leverages decentralized vector pipelines to ensure your teams can retrieve relevant documents based on semantic context, intent, and relationships rather than simple keywords.
            </p>

            <div className="space-y-4 pt-2 font-mono text-xs">
              {[
                "10-Second Automatic Draft Persistence",
                "Full Cryptographic Version Snapshot Log",
                "Built-in RLS Security Policies via PostgreSQL",
                "Groq qwen-2.5-32b Intelligent Drafting Co-pilot"
              ].map((text) => (
                <div key={text} className="flex items-center gap-2 transition-transform hover:translate-x-1 duration-200">
                  <CheckCircle className="h-4 w-4 text-foreground" strokeWidth={2} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Matrix ── */}
      <section className="border-t border-border bg-secondary/10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold font-mono mb-2">
            INTEGRATED CAPABILITIES
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-light mb-12">
            The Knowledge Fabric Suite
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {[
              { icon: FileText, title: "Draft Persistence", desc: "Our active background loop stores work-in-progress content every 10 seconds securely." },
              { icon: GitBranch, title: "Immutable Snapshot Logs", desc: "Every publish instantiates a verifiable static branch. Restore previous edits at any coordinate." },
              { icon: Search, title: "Semantic Matrix Search", desc: "Find documents using high-dimensional cosine similarity vectors instead of archaic keywords." },
              { icon: Sparkles, title: "Cognitive Drafting Suite", desc: "Use advanced LLM co-piloting to auto-generate tag schemas, brief outlines, and abstracts." },
              { icon: Shield, title: "Row-Level RLS Boundaries", desc: "PostgreSQL row-level isolation policies guarantee absolute data boundaries for all tenant channels." },
              { icon: Zap, title: "High-Frequency Indexing", desc: "Published nodes are vectorized and immediately integrated into the global catalog in real-time." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 sm:p-8 space-y-3 hover-premium-card cursor-default">
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                  <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-foreground text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verification Banner ── */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-24 text-center space-y-6 animate-fade-in">
          <Globe className="h-8 w-8 text-foreground mx-auto" strokeWidth={1.5} />
          <h2 className="font-serif text-3xl text-foreground font-light">
            Verify any publication in real-time.
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Our public ledgers are publicly auditable. Search the entire decentralized corporate catalog with comprehensive authorship trace elements.
          </p>
          <Link href="/publications">
            <Button size="lg" className="h-11 px-8 text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:translate-y-[-1px]">
              Verify Publications Ledger
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-secondary/10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-muted-foreground uppercase">
          <span className="font-serif text-sm text-foreground lowercase">publish.corp</span>
          <span>© 2026 PUBLISH SYSTEM INC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
}
