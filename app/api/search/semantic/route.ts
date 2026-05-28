import { generateEmbedding } from "@/lib/embeddings";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabase();

    // Search for similar content using vector similarity
    // We'll use a raw SQL query for vector search
    const { data, error } = await supabaseAdmin.rpc("search_content_embeddings", {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.7,
      match_count: 10,
    });

    if (error) {
      console.error("[v0] RPC error:", error);
      // Fallback to full-text search if RPC not available
      const { data: fallbackData } = await supabaseAdmin
        .from("content")
        .select("*")
        .eq("status", "published")
        .or(
          `title.ilike.%${query}%,description.ilike.%${query}%,content_text.ilike.%${query}%,topic.ilike.%${query}%`
        )
        .limit(10);

      return NextResponse.json({ results: fallbackData || [] });
    }

    return NextResponse.json({ results: data || [] });
  } catch (error) {
    console.error("[v0] Semantic search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
