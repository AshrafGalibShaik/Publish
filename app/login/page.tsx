"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password"); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) { toast.error(error.message); setLoading(false); return; }

    toast.success("Signed in successfully!");
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex grain-overlay">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-foreground relative overflow-hidden items-end p-12">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-10 space-y-6">
          <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden">
            <img
              src="/Screenshot 2026-05-29 092754.png"
              alt="Publish Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h2 className="font-serif text-3xl text-primary-foreground font-light leading-tight">
            Corporate knowledge,<br />
            <span className="italic">secured.</span>
          </h2>
          <p className="text-sm text-primary-foreground/50 leading-relaxed max-w-sm">
            Draft, publish, and search institutional intelligence with enterprise-grade vector pipelines.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-primary-foreground/30 uppercase tracking-widest pt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            SYSTEM OPERATIONAL
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 bg-white relative z-10">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-10">
            <Link href="/" className="font-serif text-xl text-foreground flex items-center gap-2 group">
              <img
                src="/Screenshot 2026-05-29 092754.png"
                alt="Publish Logo"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              Publish
            </Link>
          </div>

          <h1 className="font-serif text-3xl text-foreground mb-1.5 tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white border-border text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 focus:border-foreground/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white border-border text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 focus:border-foreground/30"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-sm btn-shimmer transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <div className="divider-fade my-8" />

          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-5 w-5 animate-spin text-foreground" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
