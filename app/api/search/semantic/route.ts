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
        .select(`
          *,
          author:users (
            id,
            name,
            email
          )
        `)
        .eq("status", "published")
        .or(
          `title.ilike.%${query}%,description.ilike.%${query}%,content_text.ilike.%${query}%,topic.ilike.%${query}%`
        )
        .limit(10);

      return NextResponse.json({ results: fallbackData || [] });
    }

    // Enrich semantic results with author profiles
    if (data && data.length > 0) {
      const userIds = Array.from(new Set(data.map((item: any) => item.user_id)));
      const { data: usersData } = await supabaseAdmin
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      const usersMap = (usersData || []).reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});

      const resultsWithAuthor = data.map((item: any) => ({
        ...item,
        author: usersMap[item.user_id] || null
      }));

      return NextResponse.json({ results: resultsWithAuthor });
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
