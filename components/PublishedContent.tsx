"use client";

import { useEffect, useState } from "react";
import { Content, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface PublishedContentProps {
  slug: string;
}

export function PublishedContent({ slug }: PublishedContentProps) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;

      setContent(data);
    } catch (error) {
      console.error("[v0] Error loading content:", error);
      toast.error("Content not found");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">Content not found</p>
          <Link href="/blog">
            <Button variant="outline">Back to articles</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Button>
        </Link>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">{content.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {content.topic && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {content.topic}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(content.published_at!), {
                addSuffix: true,
              })}
            </div>
          </div>

          {content.description && (
            <p className="text-lg text-gray-600">{content.description}</p>
          )}
        </div>
      </div>

      <Card className="p-8 mb-8">
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content.content_html }}
        />
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleShare}
          variant="outline"
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
