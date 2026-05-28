"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { FileText, Lock, Zap, BookOpen, BarChart3, Share2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">Publish</div>
            <div className="flex gap-3 items-center">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 text-balance">
              Create, Edit & Publish
              <br />
              <span className="text-blue-600">Content with Confidence</span>
            </h1>
            <p className="text-xl text-gray-600 text-balance max-w-2xl mx-auto">
              A modern content publishing platform with draft management, version control, and AI-powered semantic search
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="gap-2">
                Start Writing
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 py-16">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <FileText className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Draft Management
            </h3>
            <p className="text-gray-600">
              Auto-saving drafts with full editing capabilities. Switch between drafts seamlessly.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <BarChart3 className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Version Control
            </h3>
            <p className="text-gray-600">
              Track all changes with detailed version history. Restore any previous version instantly.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Zap className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Search
            </h3>
            <p className="text-gray-600">
              Semantic search powered by AI. Find content by topic and context, not just keywords.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Lock className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secure & Private
            </h3>
            <p className="text-gray-600">
              Your content is your own. Row-level security ensures only you can access your work.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <BookOpen className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rich Editor
            </h3>
            <p className="text-gray-600">
              Beautiful, intuitive editor with markdown support and formatting tools.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Share2 className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Publishing
            </h3>
            <p className="text-gray-600">
              One-click publishing. Share your content with links or embed it anywhere.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start publishing?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join our community of writers and content creators
          </p>
          <Link href="/editor">
            <Button size="lg" variant="secondary">
              Start Writing Now
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            Content Publishing Platform © 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
