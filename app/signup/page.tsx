"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });

    if (error) { toast.error(error.message); setLoading(false); return; }

    toast.success("Account created! Check your email to confirm, or sign in now.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Link href="/" className="font-serif text-xl text-foreground">Publish</Link>
        </div>

        <h1 className="font-serif text-3xl text-foreground mb-1">Create an account</h1>
        <p className="text-sm text-muted-foreground mb-8">Start publishing your content</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-70">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
