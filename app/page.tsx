"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, GitBranch, Search, Sparkles, Shield, Zap, Globe, CheckCircle, Loader2, ArrowUpRight, Cpu } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  // Intersection observer for scroll-triggered reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal-section").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ── Header ── */}
      <header className="header-glass sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-tight text-foreground flex items-center gap-2.5 group">
            <img
              src="/Screenshot 2026-05-29 092754.png"
              alt="Publish Logo"
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-bold">PUBLISH</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground border-l border-border pl-2.5 font-sans font-medium transition-all group-hover:text-foreground hidden sm:inline">Enterprise</span>
          </Link>
          <nav className="flex items-center gap-1">
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
                  <Button size="sm" className="text-xs uppercase tracking-wider h-9 px-5 btn-shimmer transition-all duration-300 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.2)] hover:translate-y-[-1px] active:scale-[0.98]">
                    Get Started <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section className="grain-overlay relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.09 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.09 0 0) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-32 pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-7">
              <div className="animate-fade-in-up stagger-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground pulse-dot" />
                  SECURE DECENTRALIZED DATA FABRIC
                </div>
              </div>
              <h1 className="font-serif text-[2.75rem] sm:text-[4rem] leading-[1.02] tracking-[-0.02em] text-foreground font-light animate-fade-in-up stagger-2">
                Corporate publishing <br />
                <span className="italic">reimagined.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg animate-fade-in-up stagger-3">
                Publish is the premier workspace built for corporate teams to draft, index, and securely search institutional intelligence using custom AI semantic vectors.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1 animate-fade-in-up stagger-4">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-xs uppercase tracking-wider btn-shimmer transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] active:scale-[0.98]">
                    Open Console <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/publications">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-xs uppercase tracking-wider border-border text-foreground hover:bg-secondary transition-all duration-300 hover:translate-y-[-2px] group">
                    Explore Ledger <ArrowUpRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero image — box removed */}
            <div className="lg:col-span-6 animate-fade-in-scale stagger-3">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/Screenshot 2026-05-29 100145.png"
                  alt="Publish secure network node interface illustration"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics / Trust Bar ── */}
      <section className="border-y border-border bg-white reveal-section">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-8 sm:gap-y-10 md:gap-y-0 divide-x-0 md:divide-x divide-border">
            {[
              { value: "10s", label: "Auto-Save Cycle", desc: "Real-time background persistence loop" },
              { value: "100%", label: "RLS Coverage", desc: "PostgreSQL Row-Level security boundaries" },
              { value: "<50ms", label: "Vector Search", desc: "High-dimensional cosine semantic retrieval" },
              { value: "∞", label: "Version History", desc: "Verifiable cryptographic ledger log" },
            ].map(({ value, label, desc }) => (
              <div key={label} className="flex flex-col px-4 sm:px-6 md:px-8 text-left group transition-all duration-300">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="metric-value text-3xl sm:text-4xl font-light tracking-tight text-foreground transition-transform duration-300 group-hover:translate-x-1">
                    {value}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground pulse-dot opacity-60" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-foreground uppercase mb-1">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed font-sans font-light">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics / Trust Bar ── */}
      <section className="border-y border-border bg-white reveal-section">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-8 sm:gap-y-10 md:gap-y-0 divide-x-0 md:divide-x divide-border">
            {[
              { value: "10s", label: "Auto-Save Cycle", desc: "Real-time background persistence loop" },
              { value: "100%", label: "RLS Coverage", desc: "PostgreSQL Row-Level security boundaries" },
              { value: "<50ms", label: "Vector Search", desc: "High-dimensional cosine semantic retrieval" },
              { value: "∞", label: "Version History", desc: "Verifiable cryptographic ledger log" },
            ].map(({ value, label, desc }, idx) => (
              <div key={label} className={`flex flex-col px-4 sm:px-6 md:px-8 text-left group transition-all duration-300`}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="metric-value text-3xl sm:text-4xl font-light tracking-tight text-foreground transition-transform duration-300 group-hover:translate-x-1">
                    {value}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground pulse-dot opacity-60" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-foreground uppercase mb-1">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed font-sans font-light">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Operating Principles Bar ── */}
      <section className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <span className="text-foreground font-semibold">OPERATING PRINCIPLES</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {["IMMUTABLE HISTORY", "COSINE SIMILARITY", "DECISION INTELLIGENCE", "ENTERPRISE RLS"].map((text) => (
              <span key={text} className="flex items-center gap-1.5 transition-colors hover:text-foreground cursor-default">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Corporate Details / Product Value ── */}
      <section className="reveal-section">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-6 order-last lg:order-first">
              <div className="gradient-border-card border border-border p-3 bg-secondary/10 hover-premium-card">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded border border-border bg-white">
                  <Image
                    src="/corporate_features.png"
                    alt="High-density network visualization graphic"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase px-1">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-3 w-3" />
                    DECISION GRAPH 002
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                    STABILITY INDEX: 100%
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono font-bold">
                <Sparkles className="h-3 w-3" />
                SYSTEM ARCHITECTURE
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-light tracking-tight">
                Built for institutional precision.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Engineered to support modern knowledge management workflows, Publish leverages decentralized vector pipelines to ensure your teams can retrieve relevant documents based on semantic context, intent, and relationships rather than simple keywords.
              </p>

              <div className="space-y-4 pt-3">
                {[
                  "10-Second Automatic Draft Persistence",
                  "Full Cryptographic Version Snapshot Log",
                  "Built-in RLS Security Policies via PostgreSQL",
                  "Groq qwen-2.5-32b Intelligent Drafting Co-pilot"
                ].map((text, i) => (
                  <div key={text} className="flex items-center gap-3 group cursor-default transition-all duration-300 hover:translate-x-1">
                    <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                      <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2} />
                    </div>
                    <span className="text-sm text-foreground font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Matrix ── */}
      <section className="border-t border-border bg-secondary/10 grain-overlay reveal-section">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono font-bold mx-auto">
              <Zap className="h-3 w-3" />
              INTEGRATED CAPABILITIES
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-light tracking-tight">
              The Knowledge Fabric Suite
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Every tool your organization needs to draft, publish, version, and retrieve institutional knowledge with enterprise-grade security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              { icon: FileText, title: "Draft Persistence", desc: "Our active background loop stores work-in-progress content every 10 seconds securely.", tag: "AUTO-SAVE" },
              { icon: GitBranch, title: "Immutable Snapshot Logs", desc: "Every publish instantiates a verifiable static branch. Restore previous edits at any coordinate.", tag: "VERSIONING" },
              { icon: Search, title: "Semantic Matrix Search", desc: "Find documents using high-dimensional cosine similarity vectors instead of archaic keywords.", tag: "AI-POWERED" },
              { icon: Sparkles, title: "Cognitive Drafting Suite", desc: "Use advanced LLM co-piloting to auto-generate tag schemas, brief outlines, and abstracts.", tag: "LLM" },
              { icon: Shield, title: "Row-Level RLS Boundaries", desc: "PostgreSQL row-level isolation policies guarantee absolute data boundaries for all tenant channels.", tag: "SECURITY" },
              { icon: Zap, title: "High-Frequency Indexing", desc: "Published nodes are vectorized and immediately integrated into the global catalog in real-time.", tag: "REAL-TIME" },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="bg-white p-7 sm:p-9 space-y-4 hover-premium-card cursor-default group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center icon-ring transition-all duration-300 group-hover:bg-foreground">
                    <Icon className="h-4.5 w-4.5 text-foreground transition-colors duration-300 group-hover:text-primary-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="chip">{tag}</span>
                </div>
                <h3 className="font-medium text-foreground text-[15px] tracking-tight">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
       {/* ── Full-bleed image break ── */}
      <section className="reveal-section relative overflow-hidden" style={{ height: "420px" }}>
        <img
          src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&auto=format&fit=crop&q=80"
          alt="Modern city skyline at night representing global enterprise reach"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "grayscale(100%) contrast(1.1) brightness(0.55)" }}
        />
          
        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center z-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/60">TRUSTED BY ENTERPRISES WORLDWIDE</p>
          <h2 className="font-serif text-3xl sm:text-5xl text-white font-light tracking-tight max-w-2xl leading-tight">
            Institutional knowledge, <br /><span className="italic">secured for the long term.</span>
          </h2>
          <div className="divider-fade w-48 opacity-30 mt-2" style={{ background: "linear-gradient(90deg, transparent 0%, white 40%, white 60%, transparent 100%)" }} />
          <p className="text-white/50 text-xs font-mono uppercase tracking-widest">ENCRYPTED · IMMUTABLE · DECENTRALIZED</p>
        </div>
      </section>

      {/* ── Verification Banner ── */}
      <section className="border-t border-border relative overflow-hidden reveal-section">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.96_0_0)_0%,transparent_70%)]" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center space-y-7 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto transition-transform duration-500 hover:rotate-12">
            <Globe className="h-7 w-7 text-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-light tracking-tight max-w-lg mx-auto">
            Verify any publication in real-time.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Our public ledgers are publicly auditable. Search the entire decentralized corporate catalog with comprehensive authorship trace elements.
          </p>
          <Link href="/publications">
            <Button size="lg" className="h-12 px-10 text-xs uppercase tracking-wider btn-shimmer transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] active:scale-[0.98]">
              Verify Publications Ledger <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-secondary/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-primary-foreground">P</span>
              </div>
              <span className="font-serif text-sm text-foreground">publish.corp</span>
            </div>
            <div className="flex items-center gap-8 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <Link href="/publications" className="hover:text-foreground transition-colors">Registry</Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Console</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Access</Link>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">© 2026 PUBLISH SYSTEM INC.</span>
          </div>
          <div className="divider-fade mt-8 mb-4" />
          <p className="text-center text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
            ENCRYPTED · IMMUTABLE · DECENTRALIZED
          </p>
        </div>
      </footer>
    </div>
  );
}
