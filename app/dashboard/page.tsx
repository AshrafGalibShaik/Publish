"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DraftList } from "@/components/DraftList";
import { ContentSearch } from "@/components/ContentSearch";
import Link from "next/link";
import { Plus, BookOpen, FileText, LogOut, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Content Publishing
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.email ? `Welcome, ${user.user_metadata?.name || user.email}` : "Manage your articles and drafts"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/editor">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Article
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="drafts">
          <TabsList className="mb-6">
            <TabsTrigger value="drafts" className="gap-2">
              <FileText className="h-4 w-4" />
              My Drafts
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Search Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts">
            <DraftList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="search">
            <ContentSearch />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
