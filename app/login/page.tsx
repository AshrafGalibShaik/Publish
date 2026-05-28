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
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Link href="/" className="font-serif text-xl text-foreground">Publish</Link>
        </div>

        <h1 className="font-serif text-3xl text-foreground mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-8">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-10 text-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4 hover:opacity-70">Sign up</Link>
        </p>
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
