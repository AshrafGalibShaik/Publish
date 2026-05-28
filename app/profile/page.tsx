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
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Syncing Profile Node...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5 text-center">
        <User className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h2 className="font-serif text-2xl mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6">You must be signed in to view your profile console.</p>
        <Link href="/login">
          <Button size="sm">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Button>
            </Link>
            <span className="font-serif text-lg border-l border-border pl-4">User Settings</span>
          </div>

          <Link href="/">
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-mono">
              System Home
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Profile Meta Editor */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 border border-border bg-white rounded-lg space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center border border-border">
                  <User className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h2 className="font-medium text-foreground text-sm">Identity profile</h2>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">VERIFIED PROFILE NODE</p>
                </div>
              </div>

              {!editing ? (
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[10px] uppercase">Display Name</span>
                    <span className="text-sm font-sans font-medium block text-foreground">
                      {profile?.name || "Anonymous User"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[10px] uppercase">Email Address</span>
                    <span className="text-foreground block flex items-center gap-1.5 font-sans text-sm">
                      <Mail className="h-3.5 w-3.5" /> {profile?.email}
                    </span>
                  </div>
                  {profile?.created_at && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase">Node Registered</span>
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
                    className="w-full text-xs h-8 gap-1.5 mt-2"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Profile Details
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono text-muted-foreground block">Display Name</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9 bg-white border-border text-foreground text-sm"
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setEditing(false); setName(profile?.name || ""); }}
                      className="flex-1 text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 text-xs h-8 gap-1"
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>

          {/* Publications authored by this user */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-border rounded-lg bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h3 className="font-serif text-base text-foreground">Publications Authored</h3>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {publications.length} VERIFIED NODE{publications.length !== 1 ? "S" : ""}
                </span>
              </div>

              {publications.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-foreground">No published documents</p>
                  <p className="text-xs text-muted-foreground">Draft and publish your first article from the editor</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {publications.map((pub) => (
                    <div key={pub.id} className="p-5 hover:bg-secondary/20 transition-colors flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {pub.topic && (
                          <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded uppercase">
                            {pub.topic}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-muted-foreground">
                          NODE: {pub.id.substring(0, 8)}...
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground text-sm">{pub.title}</h4>
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
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-xs text-muted-foreground font-mono">
          Publish Profile Configuration Node · © 2026
        </div>
      </footer>
    </div>
  );
}
