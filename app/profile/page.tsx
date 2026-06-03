"use client";

import { useEffect, useState } from "react";
import { supabase, Content } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, User, Mail, Calendar, FileText, Check, Edit2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<{ id: string; name: string; email: string; created_at?: string } | null>(null);
  const [publications, setPublications] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileAndPublications();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfileAndPublications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch public profile from 'users' table
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // Fallback to auth metadata if user record doesn't exist in public.users yet
        setProfile({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous User",
          email: user.email || "",
        });
        setName(user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous User");
      } else {
        setProfile(profileData);
        setName(profileData.name || "");
      }

      // 2. Fetch publications by this user
      const { data: pubData, error: pubError } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (pubError) throw pubError;
      setPublications(pubData || []);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // Update public.users table
      const { error: publicError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          email: user.email!,
          name: name,
          updated_at: new Date().toISOString(),
        });

      if (publicError) throw publicError;

      // Update Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name },
      });

      if (authError) throw authError;

      setProfile((prev) => prev ? { ...prev, name } : null);
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Syncing Profile Node...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6">
          <User className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h2 className="font-serif text-2xl mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6">You must be signed in to view your profile console.</p>
        <Link href="/login">
          <Button size="sm" className="btn-shimmer">Sign In</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-foreground page-dots">
      {/* Header */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard" className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Button>
            </Link>
            <span className="font-serif text-sm sm:text-lg border-l border-border pl-3 sm:pl-4 truncate font-medium">
              User Settings
            </span>
          </div>

          <Link href="/" className="flex-shrink-0">
            <span className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-mono">
              Home
            </span>
          </Link>
        </div>
      </header>

      {/* Profile Header Banner */}
      <div className="h-36 w-full bg-gradient-to-r from-secondary via-muted to-secondary/80 border-b border-border relative overflow-hidden flex items-end px-5 sm:px-8 pb-4">
        <div className="absolute inset-0 pattern-crosshatch opacity-30 pointer-events-none" />
        <div className="max-w-6xl w-full mx-auto relative z-10 flex justify-between items-end">
          <div className="flex items-center gap-3.5 translate-y-8 sm:translate-y-10">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center p-1.5">
              <div className="w-full h-full rounded-xl bg-foreground flex items-center justify-center text-xl sm:text-2xl font-serif text-primary-foreground font-semibold">
                {(profile?.name || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="chip bg-white/80 border-border text-[9px] font-mono tracking-widest">
              LEDGER STATUS: ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Profile Meta Editor */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in-up">
            <Card className="p-6 border border-border bg-white rounded-xl space-y-6 hover-premium-card pt-8">
              <div className="pb-4 border-b border-border">
                <h2 className="font-serif text-lg text-foreground font-medium">Identity Node</h2>
                <p className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                  VERIFIED PROFILE INSTANCE
                </p>
              </div>

              {!editing ? (
                <div className="space-y-5 text-xs font-mono">
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Display Name</span>
                    <span className="text-sm font-sans font-medium block text-foreground">
                      {profile?.name || "Anonymous User"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Email Address</span>
                    <span className="text-foreground block flex items-center gap-1.5 font-sans text-sm">
                      <Mail className="h-3.5 w-3.5" /> {profile?.email}
                    </span>
                  </div>
                  {profile?.created_at && (
                    <div className="space-y-1.5">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Node Registered</span>
                      <span className="text-foreground block flex items-center gap-1.5 font-sans text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="w-full text-xs h-9 gap-1.5 mt-2 transition-all duration-200 hover:translate-y-[-1px] cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Profile Details
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono text-muted-foreground block tracking-wider">Display Name</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 bg-white border-border text-foreground text-sm transition-all duration-200 focus:border-foreground/30"
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setEditing(false); setName(profile?.name || ""); }}
                      className="flex-1 text-xs h-9 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 text-xs h-9 gap-1 btn-shimmer cursor-pointer"
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* Additional Info Box */}
            <Card className="p-5 border border-border bg-white rounded-xl space-y-3 font-mono text-[11px] text-muted-foreground">
              <div className="text-foreground font-serif text-sm font-medium border-b border-border pb-2">System Metrics</div>
              <div className="flex justify-between">
                <span>Verification Authority</span>
                <span className="text-foreground">Publish Protocol</span>
              </div>
              <div className="flex justify-between">
                <span>Account Role</span>
                <span className="text-foreground uppercase">Author Node</span>
              </div>
              <div className="flex justify-between">
                <span>Node ID</span>
                <span className="text-foreground truncate max-w-[120px]">{profile?.id}</span>
              </div>
            </Card>
          </div>

          {/* Publications authored by this user */}
          <div className="lg:col-span-8 space-y-6 animate-fade-in-up stagger-2">
            <div className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h3 className="font-serif text-base text-foreground font-medium">Publications Authored</h3>
                <span className="chip bg-white border-border">
                  {publications.length} VERIFIED NODE{publications.length !== 1 ? "S" : ""}
                </span>
              </div>

              {publications.length === 0 ? (
                <div className="p-14 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-foreground">No published documents</p>
                  <p className="text-xs text-muted-foreground">Draft and publish your first article from the editor</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {publications.map((pub) => (
                    <div key={pub.id} className="p-5 row-hover-lift flex flex-col gap-2.5 cursor-pointer">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {pub.topic && (
                            <span className="chip bg-white border-border">
                              {pub.topic}
                            </span>
                          )}
                          <span className="chip bg-secondary">
                            NODE: {pub.id.substring(0, 8)}...
                          </span>
                        </div>
                        <Link href={`/content/${pub.slug}`}>
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 font-mono text-muted-foreground hover:text-foreground px-2">
                            View Snapshot &rarr;
                          </Button>
                        </Link>
                      </div>
                      <h4 className="font-medium text-foreground text-sm font-sans">{pub.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {pub.description || pub.content_text.substring(0, 150)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Published {formatDistanceToNow(new Date(pub.published_at!), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 text-xs text-muted-foreground font-mono">
          Publish Profile Configuration Node · © 2026
        </div>
      </footer>
    </div>
  );
}
